//! Pi Coding Agent adapter (pi.dev, earendil-works/pi) — installs skills into
//! Pi's dedicated skill directory via symlinks.
//!
//! Mirrors the Node CLI's `cli/adapters/pi.js`:
//!
//! - **Skills**: `<scope>/skills/<id>` → `skills/<id>` — one symlink per skill.
//!   Project scope targets `.pi/skills/`, global targets `~/.pi/agent/skills/`.
//!   Pi discovers skills as folders containing a `SKILL.md`, which is exactly
//!   the almanac skill layout, so a plain symlink needs no transformation.
//! - **Agents / Teams / Guides**: not supported — Pi has no agent-definition
//!   directory; project instructions live in `AGENTS.md` (the codex adapter's
//!   territory), not per-agent files.
//!
//! Symlink targets are absolute in every scope. The symlink helpers are copied
//! from `claude_code.rs` / `hermes.rs` — three copies now; dedup into a shared
//! `adapters` module is tracked as a follow-up on #255.

use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use super::base::{
    Action, AuditEntry, ContentType, FrameworkAdapter, InstallCtx, InstallResult, Item, Scope,
    Strategy,
};
use crate::error::{Error, Result};

pub struct Pi;

// ── platform-portable symlink helpers ────────────────────────────────────────

#[cfg(unix)]
fn symlink_dir(src: &Path, dst: &Path) -> io::Result<()> {
    std::os::unix::fs::symlink(src, dst)
}
#[cfg(windows)]
fn symlink_dir(src: &Path, dst: &Path) -> io::Result<()> {
    std::os::windows::fs::symlink_dir(src, dst)
}

#[cfg(unix)]
fn remove_link(path: &Path) -> io::Result<()> {
    fs::remove_file(path)
}
#[cfg(windows)]
fn remove_link(path: &Path) -> io::Result<()> {
    fs::remove_file(path).or_else(|_| fs::remove_dir(path))
}

/// Whether `path` is itself a symlink — true even when the link is broken.
fn is_symlink(path: &Path) -> bool {
    fs::symlink_metadata(path)
        .map(|m| m.file_type().is_symlink())
        .unwrap_or(false)
}

impl Pi {
    fn skills_base(&self, project_dir: &Path, scope: Scope) -> Result<PathBuf> {
        Ok(self.target_path(project_dir, scope)?.join("skills"))
    }

    fn install_skill(&self, item: &Item, ctx: &InstallCtx<'_>) -> Result<InstallResult> {
        let skills_dir = self.skills_base(ctx.project_dir, ctx.scope)?;
        let target = skills_dir.join(&item.id);

        if ctx.options.dry_run {
            return Ok(InstallResult {
                action: Action::Created,
                path: target,
                details: Some("dry-run".to_string()),
            });
        }
        if target.exists() && !ctx.options.force {
            return Ok(InstallResult {
                action: Action::Skipped,
                path: target,
                details: Some("already exists".to_string()),
            });
        }
        fs::create_dir_all(&skills_dir)?;
        if is_symlink(&target) || target.exists() {
            remove_link(&target)?;
        }
        symlink_dir(&item.source_dir, &target)?;
        Ok(InstallResult {
            action: Action::Created,
            path: target,
            details: None,
        })
    }

    fn unsupported(&self, ctx: &InstallCtx<'_>, kind: ContentType) -> Result<InstallResult> {
        Ok(InstallResult {
            action: Action::Skipped,
            path: self.target_path(ctx.project_dir, ctx.scope)?,
            details: Some(format!("pi supports skills only, not {kind:?}s")),
        })
    }
}

impl FrameworkAdapter for Pi {
    fn id(&self) -> &'static str {
        "pi"
    }

    fn display_name(&self) -> &'static str {
        "Pi Coding Agent"
    }

    fn strategy(&self) -> Strategy {
        Strategy::Symlink
    }

    fn content_types(&self) -> &'static [ContentType] {
        &[ContentType::Skill]
    }

    fn detect(&self, project_dir: &Path) -> Result<bool> {
        Ok(project_dir.join(".pi").exists())
    }

    fn target_path(&self, project_dir: &Path, scope: Scope) -> Result<PathBuf> {
        Ok(match scope {
            Scope::Global => dirs::home_dir()
                .ok_or(Error::Todo("no home dir"))?
                .join(".pi/agent"),
            _ => project_dir.join(".pi"),
        })
    }

    fn install(&self, item: &Item, ctx: &InstallCtx<'_>) -> Result<InstallResult> {
        match item.kind {
            ContentType::Skill => self.install_skill(item, ctx),
            other => self.unsupported(ctx, other),
        }
    }

    fn uninstall(&self, item: &Item, ctx: &InstallCtx<'_>) -> Result<InstallResult> {
        if item.kind != ContentType::Skill {
            return self.unsupported(ctx, item.kind);
        }
        let target = self
            .skills_base(ctx.project_dir, ctx.scope)?
            .join(&item.id);
        if ctx.options.dry_run {
            return Ok(InstallResult {
                action: Action::Removed,
                path: target,
                details: Some("dry-run".to_string()),
            });
        }
        if !target.exists() && !is_symlink(&target) {
            return Ok(InstallResult {
                action: Action::Skipped,
                path: target,
                details: Some("not installed".to_string()),
            });
        }
        remove_link(&target)?;
        Ok(InstallResult {
            action: Action::Removed,
            path: target,
            details: None,
        })
    }

    fn list_installed(&self, project_dir: &Path, scope: Scope) -> Result<Vec<Item>> {
        let mut items = Vec::new();
        let skills_dir = self.skills_base(project_dir, scope)?;
        if skills_dir.is_dir() {
            for entry in fs::read_dir(&skills_dir)? {
                let entry = entry?;
                let path = entry.path();
                if is_symlink(&path) {
                    items.push(Item {
                        kind: ContentType::Skill,
                        id: entry.file_name().to_string_lossy().into_owned(),
                        source_dir: fs::read_link(&path).unwrap_or_default(),
                        domain: None,
                    });
                }
            }
        }
        items.sort_by(|a, b| a.id.cmp(&b.id));
        Ok(items)
    }

    fn audit(&self, project_dir: &Path, scope: Scope) -> Result<AuditEntry> {
        let skills_dir = self.skills_base(project_dir, scope)?;
        let installed = self.list_installed(project_dir, scope)?;
        let mut entry = AuditEntry {
            framework: self.display_name().to_string(),
            ..Default::default()
        };

        let (mut valid, mut broken) = (0usize, 0usize);
        for item in &installed {
            // A broken symlink fails `exists()` (which follows the link).
            if skills_dir.join(&item.id).exists() {
                valid += 1;
            } else {
                broken += 1;
            }
        }
        if valid > 0 {
            entry.ok.push(format!("{valid} skills installed"));
        }
        if broken > 0 {
            entry.errors.push(format!("{broken} broken skill symlinks"));
        }
        if installed.is_empty() {
            entry.warnings.push("No Pi content installed".to_string());
        }
        Ok(entry)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detect_keys_on_dot_pi() {
        let dir = tempfile::tempdir().unwrap();
        assert!(!Pi.detect(dir.path()).unwrap());
        fs::create_dir(dir.path().join(".pi")).unwrap();
        assert!(Pi.detect(dir.path()).unwrap());
    }

    #[test]
    fn content_types_are_skill_only() {
        assert!(Pi.supports(ContentType::Skill));
        assert!(!Pi.supports(ContentType::Agent));
        assert!(!Pi.supports(ContentType::Team));
    }
}

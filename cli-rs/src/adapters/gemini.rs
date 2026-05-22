//! Gemini CLI adapter — installs skills into `.gemini/skills/` via symlinks.
//!
//! Mirrors the Node CLI's `cli/adapters/gemini.js`:
//!
//! - **Skills**: `<scope>/skills/<id>` → `skills/<id>` — one symlink per skill.
//!   Project scope targets `.gemini/skills/`, global `~/.gemini/skills/`.
//!   Gemini discovers a skill as a folder containing a `SKILL.md`, which is the
//!   almanac skill layout exactly, so a plain symlink needs no transformation.
//! - **Agents / Teams / Guides**: not supported — Gemini is skills-only.
//!
//! Symlink style follows `claude_code.rs`: a *relative* link for
//! project/workspace scope (survives a repo move), an *absolute* one for
//! global. The Node adapter always emits a relative link and has no global
//! scope; the global branch here is a unilateral parity extension, harmless
//! because Node never exercises that path.

use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use super::base::{
    Action, AuditEntry, ContentType, FrameworkAdapter, InstallCtx, InstallResult, Item, Scope,
    Strategy,
};
use crate::error::{Error, Result};

pub struct Gemini;

// ── platform-portable symlink helpers ────────────────────────────────────────

/// Create a directory symlink `dst -> src`.
#[cfg(unix)]
fn symlink_dir(src: &Path, dst: &Path) -> io::Result<()> {
    std::os::unix::fs::symlink(src, dst)
}
#[cfg(windows)]
fn symlink_dir(src: &Path, dst: &Path) -> io::Result<()> {
    std::os::windows::fs::symlink_dir(src, dst)
}

/// Remove a symlink. On Unix every symlink unlinks as a file; on Windows a
/// directory symlink needs `remove_dir`, so fall back to it.
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

/// Express absolute `target` relative to the absolute directory `base`, so
/// that `base/<result>` resolves back to `target`. Both paths must be
/// canonicalized by the caller.
fn relative_to(base: &Path, target: &Path) -> PathBuf {
    let base: Vec<_> = base.components().collect();
    let target: Vec<_> = target.components().collect();
    let shared = base
        .iter()
        .zip(target.iter())
        .take_while(|(a, b)| a == b)
        .count();
    let mut rel = PathBuf::new();
    for _ in shared..base.len() {
        rel.push("..");
    }
    for comp in &target[shared..] {
        rel.push(comp.as_os_str());
    }
    if rel.as_os_str().is_empty() {
        rel.push(".");
    }
    rel
}

/// The symlink target to write for `source` under the given scope: absolute
/// for global installs, relative (from `link_dir`) for project/workspace.
fn link_target(source: &Path, link_dir: &Path, scope: Scope) -> Result<PathBuf> {
    match scope {
        Scope::Global => Ok(source.to_path_buf()),
        Scope::Project | Scope::Workspace => {
            let canon_dir = link_dir.canonicalize()?;
            let canon_src = source.canonicalize()?;
            Ok(relative_to(&canon_dir, &canon_src))
        }
    }
}

impl Gemini {
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
        // Create the dir before `link_target` — it canonicalizes `skills_dir`.
        fs::create_dir_all(&skills_dir)?;
        if is_symlink(&target) || target.exists() {
            remove_link(&target)?;
        }
        let link = link_target(&item.source_dir, &skills_dir, ctx.scope)?;
        symlink_dir(&link, &target)?;
        Ok(InstallResult {
            action: Action::Created,
            path: target,
            details: None,
        })
    }
}

impl FrameworkAdapter for Gemini {
    fn id(&self) -> &'static str {
        "gemini"
    }

    fn display_name(&self) -> &'static str {
        "Gemini CLI"
    }

    fn strategy(&self) -> Strategy {
        Strategy::Symlink
    }

    fn content_types(&self) -> &'static [ContentType] {
        &[ContentType::Skill]
    }

    fn detect(&self, project_dir: &Path) -> Result<bool> {
        Ok(project_dir.join(".gemini").exists())
    }

    fn target_path(&self, project_dir: &Path, scope: Scope) -> Result<PathBuf> {
        Ok(match scope {
            Scope::Global => dirs::home_dir()
                .ok_or(Error::Todo("no home dir"))?
                .join(".gemini"),
            _ => project_dir.join(".gemini"),
        })
    }

    fn install(&self, item: &Item, ctx: &InstallCtx<'_>) -> Result<InstallResult> {
        match item.kind {
            ContentType::Skill => self.install_skill(item, ctx),
            ContentType::Agent | ContentType::Team | ContentType::Guide => Ok(InstallResult {
                action: Action::Skipped,
                path: self.target_path(ctx.project_dir, ctx.scope)?,
                details: Some("gemini supports skills only".to_string()),
            }),
        }
    }

    fn uninstall(&self, item: &Item, ctx: &InstallCtx<'_>) -> Result<InstallResult> {
        if item.kind != ContentType::Skill {
            return Ok(InstallResult {
                action: Action::Skipped,
                path: self.target_path(ctx.project_dir, ctx.scope)?,
                details: Some("gemini supports skills only".to_string()),
            });
        }
        let target = self.skills_base(ctx.project_dir, ctx.scope)?.join(&item.id);
        if ctx.options.dry_run {
            return Ok(InstallResult {
                action: Action::Removed,
                path: target,
                details: Some("dry-run".to_string()),
            });
        }
        // `exists()` is false for a broken symlink, so check the link itself too.
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
            entry
                .warnings
                .push("No Gemini skills installed".to_string());
        }
        Ok(entry)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detect_keys_on_dot_gemini() {
        let dir = tempfile::tempdir().unwrap();
        assert!(!Gemini.detect(dir.path()).unwrap());
        fs::create_dir(dir.path().join(".gemini")).unwrap();
        assert!(Gemini.detect(dir.path()).unwrap());
    }

    #[test]
    fn content_types_are_skills_only() {
        assert!(Gemini.supports(ContentType::Skill));
        assert!(!Gemini.supports(ContentType::Agent));
        assert!(!Gemini.supports(ContentType::Team));
        assert!(!Gemini.supports(ContentType::Guide));
    }

    #[test]
    fn relative_to_climbs_then_descends() {
        let base = Path::new("/tmp/proj/.gemini/skills");
        let target = Path::new("/tmp/almanac/skills/demo");
        assert_eq!(
            relative_to(base, target),
            Path::new("../../../almanac/skills/demo")
        );
    }
}

pub mod adapters;
pub mod app;
pub mod cli;
pub mod content;
pub mod error;
pub mod event;
pub mod fire;
pub mod pixels;
pub mod screens;
pub mod search;
pub mod state;
pub mod theme;

use std::path::{Path, PathBuf};

use adapters::base::{ContentType, InstallCtx, InstallOptions, Item, Scope};
use cli::{Args, Command, Kind};
use error::{Error, Result};

pub fn run(args: Args) -> Result<()> {
    match args.command {
        None | Some(Command::Tui) => app::run_tui(args.root.as_deref(), args.animate),
        Some(Command::List { kind }) => command_list(kind, args.root.as_deref()),
        Some(Command::Detect) => command_detect(args.root.as_deref()),
        Some(Command::Install {
            kind,
            id,
            global,
            force,
            dry_run,
            pi_extensions,
        }) => command_install(
            kind,
            &id,
            global,
            force,
            dry_run,
            pi_extensions,
            args.root.as_deref(),
        ),
        Some(Command::Uninstall {
            kind,
            id,
            global,
            dry_run,
        }) => command_uninstall(kind, &id, global, dry_run),
        Some(Command::Audit { global }) => command_audit(global),
        Some(Command::Bundle {
            framework,
            max_tokens,
        }) => command_bundle(&framework, max_tokens),
        Some(Command::Version) => {
            println!("{}", env!("CARGO_PKG_VERSION"));
            Ok(())
        }
    }
}

fn command_list(kind: cli::Kind, root: Option<&std::path::Path>) -> Result<()> {
    let registries = content::registry::load(root)?;
    let total = match kind {
        cli::Kind::Skills => registries.skills.total(),
        cli::Kind::Agents => registries.agents.total(),
        cli::Kind::Teams => registries.teams.total(),
        cli::Kind::Guides => registries.guides.total(),
    };
    println!("{kind:?}: {total}");
    Ok(())
}

fn command_detect(_root: Option<&Path>) -> Result<()> {
    let cwd = std::env::current_dir()?;
    let detected = adapters::detect_all(&cwd)?;
    if detected.is_empty() {
        println!("No frameworks detected in {}", cwd.display());
    } else {
        for id in detected {
            println!("{id}");
        }
    }
    Ok(())
}

/// Resolve a CLI `kind`/`id` pair to an installable [`Item`], verifying the id
/// against the registry and locating its on-disk source directory.
fn resolve_item(almanac_root: &Path, kind: Kind, id: &str) -> Result<Item> {
    let ctype = kind.content_type();
    let registries = content::registry::load(Some(almanac_root))?;
    let mut domain = None;
    let source_dir = match ctype {
        ContentType::Skill => {
            let skill = registries
                .skills
                .flat()
                .into_iter()
                .find(|s| s.id == id)
                .ok_or_else(|| Error::UnknownItem(format!("skill: {id}")))?;
            domain = Some(skill.domain);
            almanac_root.join("skills").join(id)
        }
        ContentType::Agent => {
            if !registries.agents.flat().iter().any(|a| a.id == id) {
                return Err(Error::UnknownItem(format!("agent: {id}")));
            }
            // claude-code installs the whole agents/ directory as one symlink.
            almanac_root.join("agents")
        }
        ContentType::Team => {
            if !registries.teams.flat().iter().any(|t| t.id == id) {
                return Err(Error::UnknownItem(format!("team: {id}")));
            }
            almanac_root.join("teams")
        }
        ContentType::Guide => almanac_root.join("teams"),
    };
    Ok(Item {
        kind: ctype,
        id: id.to_string(),
        source_dir,
        domain,
    })
}

fn scope_of(global: bool) -> Scope {
    if global {
        Scope::Global
    } else {
        Scope::Project
    }
}

/// Print one adapter result line, e.g. `claude-code: Created .claude/skills/x`.
fn report(adapter_id: &str, action: adapters::base::Action, path: &Path, details: Option<String>) {
    let suffix = details.map(|d| format!(" ({d})")).unwrap_or_default();
    println!("{adapter_id}: {action:?} {}{suffix}", path.display());
}

#[allow(clippy::too_many_arguments)]
fn command_install(
    kind: Kind,
    id: &str,
    global: bool,
    force: bool,
    dry_run: bool,
    pi_extensions: bool,
    root: Option<&Path>,
) -> Result<()> {
    let root = root.ok_or(Error::RootNotFound)?;
    let almanac_root = root
        .canonicalize()
        .map_err(|_| Error::RegistryNotFound(root.display().to_string()))?;
    let ctype = kind.content_type();
    let item = resolve_item(&almanac_root, kind, id)?;
    let project_dir = std::env::current_dir()?;

    // Install only into frameworks actually present — mirrors the Node CLI's
    // `getAdaptersForDetections`. Without this gate every adapter would write
    // its tree unconditionally (e.g. a stray `.hermes/` in any directory).
    let detected = adapters::detect_all(&project_dir)?;
    if detected.is_empty() {
        println!(
            "no frameworks detected in {}; nothing installed",
            project_dir.display()
        );
        return Ok(());
    }

    let ctx = InstallCtx {
        project_dir: &project_dir,
        almanac_root: &almanac_root,
        scope: scope_of(global),
        options: InstallOptions {
            dry_run,
            force,
            pi_extensions,
        },
    };

    let mut handled = false;
    for adapter in adapters::all() {
        if !detected.iter().any(|d| *d == adapter.id()) {
            continue;
        }
        if !adapter.supports(ctype) {
            println!("{}: does not support {kind:?}", adapter.id());
            continue;
        }
        let r = adapter.install(&item, &ctx)?;
        report(adapter.id(), r.action, &r.path, r.details);
        handled = true;
    }
    if !handled {
        println!("no detected framework handles {kind:?}");
    }
    Ok(())
}

fn command_uninstall(kind: Kind, id: &str, global: bool, dry_run: bool) -> Result<()> {
    let ctype = kind.content_type();
    let project_dir = std::env::current_dir()?;
    // Uninstall only needs the id; `source_dir` is unused on this path and
    // `domain` is unknown (no registry without `--root`). Adapters that need
    // the domain — Hermes — scan their install tree to recover it.
    let item = Item {
        kind: ctype,
        id: id.to_string(),
        source_dir: PathBuf::new(),
        domain: None,
    };
    let ctx = InstallCtx {
        project_dir: &project_dir,
        almanac_root: &project_dir,
        scope: scope_of(global),
        options: InstallOptions {
            dry_run,
            force: false,
            pi_extensions: false,
        },
    };
    let detected = adapters::detect_all(&project_dir)?;
    if detected.is_empty() {
        println!(
            "no frameworks detected in {}; nothing to uninstall",
            project_dir.display()
        );
        return Ok(());
    }
    for adapter in adapters::all() {
        if !detected.iter().any(|d| *d == adapter.id()) {
            continue;
        }
        if !adapter.supports(ctype) {
            continue;
        }
        let r = adapter.uninstall(&item, &ctx)?;
        report(adapter.id(), r.action, &r.path, r.details);
    }
    Ok(())
}

fn command_audit(global: bool) -> Result<()> {
    let project_dir = std::env::current_dir()?;
    let scope = scope_of(global);
    let detected = adapters::detect_all(&project_dir)?;
    if detected.is_empty() {
        println!(
            "no frameworks detected in {}",
            project_dir.display()
        );
        return Ok(());
    }
    for adapter in adapters::all() {
        if !detected.iter().any(|d| *d == adapter.id()) {
            continue;
        }
        let entry = adapter.audit(&project_dir, scope)?;
        println!("{}", entry.framework);
        for s in &entry.ok {
            println!("  ok: {s}");
        }
        for s in &entry.warnings {
            println!("  warn: {s}");
        }
        for s in &entry.errors {
            println!("  error: {s}");
        }
        if entry.ok.is_empty() && entry.warnings.is_empty() && entry.errors.is_empty() {
            println!("  (nothing installed)");
        }
    }
    Ok(())
}

fn command_bundle(framework: &str, max_tokens: usize) -> Result<()> {
    let project_dir = std::env::current_dir()?;
    match framework {
        "ai-edge" => {
            let (path, count) = adapters::ai_edge::AiEdge.bundle(&project_dir, max_tokens)?;
            println!("Bundle written to {}", path.display());
            println!("  {count} skill(s) included (budget: {max_tokens} tokens)");
            Ok(())
        }
        other => Err(Error::BundleUnsupported(other.to_string())),
    }
}

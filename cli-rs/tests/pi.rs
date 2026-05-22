//! Integration tests for the Pi adapter.
//!
//! Pi installs skills as folder symlinks under `.pi/skills/` (project) or
//! `~/.pi/agent/skills/` (global). Tests use project scope and `tempfile`.

use std::fs;
use std::path::Path;

use agent_almanac_rs::adapters::base::{
    Action, ContentType, FrameworkAdapter, InstallCtx, InstallOptions, Item, Scope,
};
use agent_almanac_rs::adapters::pi::Pi;

fn fake_almanac(root: &Path) {
    fs::create_dir_all(root.join("skills/demo-skill")).unwrap();
    fs::write(root.join("skills/demo-skill/SKILL.md"), "# demo skill").unwrap();
}

fn skill_item(almanac: &Path) -> Item {
    Item {
        kind: ContentType::Skill,
        id: "demo-skill".to_string(),
        source_dir: almanac.join("skills/demo-skill"),
        domain: None,
    }
}

fn ctx<'a>(project: &'a Path, almanac: &'a Path, options: InstallOptions) -> InstallCtx<'a> {
    InstallCtx {
        project_dir: project,
        almanac_root: almanac,
        scope: Scope::Project,
        options,
    }
}

fn is_symlink(p: &Path) -> bool {
    fs::symlink_metadata(p)
        .map(|m| m.file_type().is_symlink())
        .unwrap_or(false)
}

#[test]
fn install_skill_creates_a_resolving_symlink() {
    let almanac = tempfile::tempdir().unwrap();
    let project = tempfile::tempdir().unwrap();
    fake_almanac(almanac.path());

    let r = Pi
        .install(
            &skill_item(almanac.path()),
            &ctx(project.path(), almanac.path(), InstallOptions::default()),
        )
        .unwrap();

    assert_eq!(r.action, Action::Created);
    let link = project.path().join(".pi/skills/demo-skill");
    assert!(is_symlink(&link), "a symlink should exist at {link:?}");
    assert!(
        link.join("SKILL.md").exists(),
        "the symlink should resolve to the skill directory"
    );
}

#[test]
fn install_is_idempotent_and_force_overwrites() {
    let almanac = tempfile::tempdir().unwrap();
    let project = tempfile::tempdir().unwrap();
    fake_almanac(almanac.path());
    let item = skill_item(almanac.path());

    let first = Pi
        .install(&item, &ctx(project.path(), almanac.path(), InstallOptions::default()))
        .unwrap();
    assert_eq!(first.action, Action::Created);

    let second = Pi
        .install(&item, &ctx(project.path(), almanac.path(), InstallOptions::default()))
        .unwrap();
    assert_eq!(second.action, Action::Skipped);

    let forced = Pi
        .install(
            &item,
            &ctx(
                project.path(),
                almanac.path(),
                InstallOptions { dry_run: false, force: true },
            ),
        )
        .unwrap();
    assert_eq!(forced.action, Action::Created);
}

#[test]
fn dry_run_touches_nothing() {
    let almanac = tempfile::tempdir().unwrap();
    let project = tempfile::tempdir().unwrap();
    fake_almanac(almanac.path());

    let r = Pi
        .install(
            &skill_item(almanac.path()),
            &ctx(
                project.path(),
                almanac.path(),
                InstallOptions { dry_run: true, force: false },
            ),
        )
        .unwrap();
    assert_eq!(r.action, Action::Created);
    assert!(
        !project.path().join(".pi").exists(),
        "dry-run must not create .pi"
    );
}

#[test]
fn uninstall_removes_then_reports_not_installed() {
    let almanac = tempfile::tempdir().unwrap();
    let project = tempfile::tempdir().unwrap();
    fake_almanac(almanac.path());
    let item = skill_item(almanac.path());
    let opts = InstallOptions::default();

    Pi.install(&item, &ctx(project.path(), almanac.path(), opts))
        .unwrap();

    let removed = Pi
        .uninstall(&item, &ctx(project.path(), almanac.path(), opts))
        .unwrap();
    assert_eq!(removed.action, Action::Removed);
    assert!(!is_symlink(&project.path().join(".pi/skills/demo-skill")));

    let again = Pi
        .uninstall(&item, &ctx(project.path(), almanac.path(), opts))
        .unwrap();
    assert_eq!(again.action, Action::Skipped);
}

#[test]
fn agent_install_is_skipped() {
    let almanac = tempfile::tempdir().unwrap();
    let project = tempfile::tempdir().unwrap();

    let agent = Item {
        kind: ContentType::Agent,
        id: "demo-agent".to_string(),
        source_dir: almanac.path().join("agents"),
        domain: None,
    };
    let r = Pi
        .install(&agent, &ctx(project.path(), almanac.path(), InstallOptions::default()))
        .unwrap();
    assert_eq!(r.action, Action::Skipped);
    assert!(!project.path().join(".pi").exists());
}

#[test]
fn list_installed_reports_the_skill() {
    let almanac = tempfile::tempdir().unwrap();
    let project = tempfile::tempdir().unwrap();
    fake_almanac(almanac.path());

    Pi.install(
        &skill_item(almanac.path()),
        &ctx(project.path(), almanac.path(), InstallOptions::default()),
    )
    .unwrap();

    let installed = Pi.list_installed(project.path(), Scope::Project).unwrap();
    assert!(installed
        .iter()
        .any(|i| i.kind == ContentType::Skill && i.id == "demo-skill"));
}

#[test]
fn audit_warns_when_empty_then_flags_a_broken_symlink() {
    let almanac = tempfile::tempdir().unwrap();
    let project = tempfile::tempdir().unwrap();
    fake_almanac(almanac.path());

    let empty = Pi.audit(project.path(), Scope::Project).unwrap();
    assert!(empty.warnings.iter().any(|s| s == "No Pi content installed"));

    Pi.install(
        &skill_item(almanac.path()),
        &ctx(project.path(), almanac.path(), InstallOptions::default()),
    )
    .unwrap();

    let clean = Pi.audit(project.path(), Scope::Project).unwrap();
    assert!(clean.ok.iter().any(|s| s.contains("1 skills installed")));
    assert!(clean.errors.is_empty());

    // Break the link by deleting the skill source.
    fs::remove_dir_all(almanac.path().join("skills/demo-skill")).unwrap();
    let broken = Pi.audit(project.path(), Scope::Project).unwrap();
    assert!(
        broken.errors.iter().any(|s| s.contains("broken")),
        "audit should flag the broken symlink: {:?}",
        broken.errors
    );
}

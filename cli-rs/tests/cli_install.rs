//! CLI-level integration tests for `install` — exercises the compiled binary
//! to verify the detect-gating in `command_install`: installs land only in
//! frameworks actually present in the working directory.

use std::path::{Path, PathBuf};
use std::process::Command;

/// The almanac repository root (the parent of `cli-rs/`).
fn almanac_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .expect("cli-rs has a parent")
        .to_path_buf()
}

/// Run the compiled binary in `cwd`; return (stdout, success).
fn run_install(cwd: &Path) -> (String, bool) {
    let out = Command::new(env!("CARGO_BIN_EXE_agent-almanac-rs"))
        .args(["install", "skills", "commit-changes", "--root"])
        .arg(almanac_root())
        .current_dir(cwd)
        .output()
        .expect("binary runs");
    (String::from_utf8_lossy(&out.stdout).into_owned(), out.status.success())
}

#[test]
fn install_in_an_empty_dir_detects_nothing() {
    let project = tempfile::tempdir().unwrap();
    let (stdout, ok) = run_install(project.path());

    assert!(ok, "command should exit cleanly");
    assert!(
        stdout.contains("no frameworks detected"),
        "expected a no-detection message, got: {stdout}"
    );
    // Neither adapter's tree should have been written.
    assert!(!project.path().join(".claude").exists());
    assert!(!project.path().join(".hermes").exists());
}

#[test]
fn install_targets_only_the_detected_framework() {
    let project = tempfile::tempdir().unwrap();
    // Mark the directory as a Claude Code project — but not a Hermes one.
    std::fs::create_dir(project.path().join(".claude")).unwrap();

    let (stdout, ok) = run_install(project.path());

    assert!(ok, "command should exit cleanly");
    assert!(
        stdout.contains("claude-code:"),
        "claude-code should have installed, got: {stdout}"
    );
    assert!(
        project.path().join(".claude/skills/commit-changes").exists(),
        "the skill symlink should resolve under .claude"
    );
    // Hermes was not detected — it must not have written its tree.
    assert!(
        !project.path().join(".hermes").exists(),
        "hermes was undetected; .hermes must not be created"
    );
    assert!(
        !stdout.contains("hermes:"),
        "hermes should not appear in the report, got: {stdout}"
    );
}

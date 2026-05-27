pub mod aider;
pub mod base;
pub mod claude_code;
pub mod codex;
pub mod copilot;
pub mod gemini;
pub mod hermes;
pub mod opencode;
pub mod pi;
pub mod symlink;
pub mod transformer;
pub mod universal;

use std::path::Path;

use base::FrameworkAdapter;

use crate::error::Result;

pub fn all() -> Vec<Box<dyn FrameworkAdapter>> {
    vec![
        Box::new(claude_code::ClaudeCode),
        Box::new(hermes::Hermes),
        Box::new(codex::Codex),
        Box::new(pi::Pi),
        Box::new(gemini::Gemini),
        Box::new(opencode::OpenCode),
        Box::new(copilot::Copilot),
        Box::new(aider::Aider),
        Box::new(universal::Universal),
    ]
}

pub fn detect_all(project_dir: &Path) -> Result<Vec<&'static str>> {
    let mut found = Vec::new();
    for adapter in all() {
        if adapter.detect(project_dir)? {
            found.push(adapter.id());
        }
    }
    Ok(found)
}

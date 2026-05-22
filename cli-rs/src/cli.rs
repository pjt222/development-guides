use std::path::PathBuf;

use clap::{Parser, Subcommand, ValueEnum};

#[derive(Debug, Parser)]
#[command(
    name = "agent-almanac-rs",
    version,
    about = "Interactive almanac of agentic skills, agents, teams, and guides",
    long_about = None,
)]
pub struct Args {
    /// Override the almanac content root (defaults to embedded registries; required for spellbook content during alpha).
    #[arg(long, global = true, env = "AGENT_ALMANAC_ROOT")]
    pub root: Option<PathBuf>,

    /// Let the reading fire breathe while idle (default: it only flares on input).
    #[arg(long, global = true, env = "AGENT_ALMANAC_ANIMATE")]
    pub animate: bool,

    #[command(subcommand)]
    pub command: Option<Command>,
}

#[derive(Debug, Subcommand)]
pub enum Command {
    /// Launch the interactive TUI (default when no subcommand is given).
    Tui,
    /// List counts for a content kind.
    List {
        #[arg(value_enum)]
        kind: Kind,
    },
    /// Detect installed frameworks in the current directory.
    Detect,
    /// Install a skill or agent into the detected framework(s).
    Install {
        /// Content kind (`skills` or `agents`; teams/guides are not installed).
        #[arg(value_enum)]
        kind: Kind,
        /// Content id — a skill name, or an agent name.
        id: String,
        /// Install into the global `~/.claude` instead of `./.claude`.
        #[arg(long)]
        global: bool,
        /// Overwrite an existing install instead of skipping it.
        #[arg(long)]
        force: bool,
        /// Report what would change without touching the filesystem.
        #[arg(long)]
        dry_run: bool,
    },
    /// Remove a previously installed skill or agent.
    Uninstall {
        /// Content kind (`skills` or `agents`).
        #[arg(value_enum)]
        kind: Kind,
        /// Content id to remove.
        id: String,
        /// Operate on the global `~/.claude` instead of `./.claude`.
        #[arg(long)]
        global: bool,
        /// Report what would change without touching the filesystem.
        #[arg(long)]
        dry_run: bool,
    },
    /// Audit installed content for broken or stale symlinks.
    Audit {
        /// Audit the global `~/.claude` instead of `./.claude`.
        #[arg(long)]
        global: bool,
    },
    /// Print version and exit.
    Version,
}

#[derive(Debug, Clone, Copy, ValueEnum)]
pub enum Kind {
    Skills,
    Agents,
    Teams,
    Guides,
}

impl Kind {
    /// The adapter-level content type this CLI kind maps to.
    pub fn content_type(self) -> crate::adapters::base::ContentType {
        use crate::adapters::base::ContentType;
        match self {
            Kind::Skills => ContentType::Skill,
            Kind::Agents => ContentType::Agent,
            Kind::Teams => ContentType::Team,
            Kind::Guides => ContentType::Guide,
        }
    }
}

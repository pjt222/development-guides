# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A documentation-only repository containing 6 long-form markdown guides, a skills library of 135 agentic skills, and 21 agent definitions following the [Agent Skills open standard](https://agentskills.io). There is no build system, no tests, and no compiled code — all content is markdown and YAML.

The primary audience is developers working in WSL-Windows hybrid environments, particularly for R package development, MCP server integration, and AI-assisted workflows.

## Architecture

### Three Content Types

1. **Guides** (`guides/` directory): Human-readable reference documentation covering WSL setup, R package development, MCP troubleshooting, etc.

2. **Skills** (`skills/` directory): Machine-consumable structured procedures that agentic systems execute. Each skill lives at `skills/<domain>/<skill-name>/SKILL.md` with YAML frontmatter (`name`, `description`, `allowed-tools`, `metadata`) and standardized sections (When to Use, Inputs, Procedure, Validation, Common Pitfalls, Related Skills).

3. **Agents** (`agents/` directory): Persona definitions for Claude Code subagents. Each agent is a markdown file with YAML frontmatter (`name`, `description`, `tools`, `model`, `priority`) defining *who* handles a task. Currently 21 agents across development, compliance, review, project management, DevOps, MLOps, workflow visualization, swarm/morphic, and specialty domains.

Agents and skills complement each other: agents define *who* (persona, tools, style), skills define *how* (procedure, validation, recovery). An agent can reference skills to execute specific tasks.

### Registries

- `skills/_registry.yml` is the machine-readable catalog of all 135 skills across 21 domains: r-packages (10), compliance (17), devops (13), observability (13), mlops (12), git (6), project-management (6), workflow-visualization (6), general (5), esoteric (6), review (5), swarm (5), morphic (5), containerization (4), reporting (4), mcp-integration (3), web-dev (3), bushcraft (3), defensive (3), design (4), data-serialization (2).
- `agents/_registry.yml` is the machine-readable catalog of all 21 agents.

When adding or removing skills or agents, the corresponding registry must be updated to stay in sync.

### Cross-References

Guides, skills, and agents are cross-referenced. The parent project `CLAUDE.md` at `/mnt/d/dev/p/CLAUDE.md` references several guides via `@development-guides/guides/` paths. Skills reference related skills by relative path. The project `.claude/agents/` symlinks to `agents/` for Claude Code discovery.

## Editing Conventions

- SKILL.md files must retain the YAML frontmatter delimited by `---` and all standardized sections
- Each Procedure step uses the pattern: numbered step with sub-steps, then `**Expected:**` and `**On failure:**` blocks
- The `_registry.yml` must match the actual skills on disk (total count, paths, metadata)
- Guides use GitHub-flavored markdown with code blocks for all commands
- All R examples use `::` for package-qualified calls (e.g., `devtools::check()`) rather than `library()` calls

## Adding a New Skill

1. Create `skills/<domain>/<skill-name>/SKILL.md` following the format of existing skills
2. Add the entry to `skills/_registry.yml` under the appropriate domain
3. Update `total_skills` count in `_registry.yml`
4. Reference related skills in the new skill's "Related Skills" section
5. The meta-skill at `skills/general/skill-creation/SKILL.md` documents this process in detail

## Adding a New Agent

1. Copy `agents/_template.md` to `agents/<agent-name>.md`
2. Fill in YAML frontmatter (required: `name`, `description`, `tools`, `model`, `version`, `author`)
3. Write Purpose, Capabilities, Usage Scenarios, Examples, and Limitations sections
4. Add the entry to `agents/_registry.yml`
5. Update the table in `agents/README.md`
6. See `agents/best-practices.md` for detailed guidance

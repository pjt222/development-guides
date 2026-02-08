# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A documentation-only repository containing 8 long-form markdown guides and a skills library of 34 agentic skills following the [Agent Skills open standard](https://agentskills.io). There is no build system, no tests, and no compiled code — all content is markdown and YAML.

The primary audience is developers working in WSL-Windows hybrid environments, particularly for R package development, MCP server integration, and AI-assisted workflows.

## Architecture

### Two Content Types

1. **Guides** (root `*.md` files): Human-readable reference documentation covering WSL setup, R package development, MCP troubleshooting, etc.

2. **Skills** (`skills/` directory): Machine-consumable structured procedures that agentic systems execute. Each skill lives at `skills/<domain>/<skill-name>/SKILL.md` with YAML frontmatter (`name`, `description`, `allowed-tools`, `metadata`) and standardized sections (When to Use, Inputs, Procedure, Validation, Common Pitfalls, Related Skills).

Skills complement agents (in `.claude/agents/`): agents define *who* (persona), skills define *how* (procedure).

### Skills Registry

`skills/_registry.yml` is the machine-readable catalog of all 34 skills across 7 domains: r-packages (10), containerization (4), reporting (4), compliance (4), mcp-integration (3), web-dev (3), general (6). When adding or removing skills, this file must be updated to stay in sync.

### Cross-References

Guides and skills are cross-referenced. The parent project `CLAUDE.md` at `/mnt/d/dev/p/CLAUDE.md` references several guides via `@development-guides/` paths. Skills reference related skills by relative path.

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

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

<!-- AUTO:START:overview -->
A documentation-only repository containing 11 guides, a skills library of 267 agentic skills, 53 agent definitions, and 8 team compositions following the [Agent Skills open standard](https://agentskills.io). There is no build system, no tests, and no compiled code — all content is markdown and YAML.

The guides serve as the human entry point to the agentic system: practical workflows explaining when, why, and how to interact with agents, teams, and skills through Claude Code.
<!-- AUTO:END:overview -->

## Architecture

### Four Content Types

1. **Guides** (`guides/` directory): Human-readable documentation organized into four categories (workflow, infrastructure, reference, design). Each guide has YAML frontmatter (`title`, `description`, `category`, `agents`, `teams`, `skills`) and follows a standard template (`guides/_template.md`). Guides serve as the human entry point to the agentic system.

2. **Skills** (`skills/` directory): Machine-consumable structured procedures that agentic systems execute. Each skill lives at `skills/<skill-name>/SKILL.md` with YAML frontmatter (`name`, `description`, `allowed-tools`, `metadata`) and standardized sections (When to Use, Inputs, Procedure, Validation, Common Pitfalls, Related Skills). Skills are organized into 48 logical domains via metadata tags, but the directory structure is flat.

3. **Agents** (`agents/` directory): Persona definitions for Claude Code subagents. Each agent is a markdown file with YAML frontmatter (`name`, `description`, `tools`, `model`, `priority`) defining *who* handles a task. Agents span development, compliance, review, project management, DevOps, MLOps, workflow visualization, esoteric, and specialty domains.

4. **Teams** (`teams/` directory): Predefined multi-agent compositions for complex workflows. Each team is a markdown file with YAML frontmatter (`name`, `description`, `lead`, `members[]`, `coordination`) and an embedded machine-readable configuration block. Teams define *who works together* — coordinated groups of agents with assigned roles and a defined coordination pattern.

These four types complement each other: skills define *how* (procedure, validation, recovery), agents define *who* (persona, tools, style), teams define *who works together* (composition, roles, coordination), and guides provide the background knowledge all draw from.

### Registries

<!-- AUTO:START:registries -->
- `skills/_registry.yml` is the machine-readable catalog of all 267 skills across 48 domains: r-packages (10), jigsawr (5), containerization (10), reporting (4), compliance (17), mcp-integration (5), web-dev (3), git (6), general (8), citations (3), data-serialization (2), review (9), bushcraft (4), esoteric (24), design (5), defensive (6), project-management (6), devops (13), observability (13), mlops (12), workflow-visualization (6), swarm (8), morphic (6), alchemy (3), tcg (3), intellectual-property (2), gardening (5), shiny (7), animal-training (2), mycology (2), prospecting (2), crafting (1), library-science (3), travel (6), relocation (3), a2a-protocol (3), geometry (3), number-theory (3), stochastic-processes (3), theoretical-science (3), diffusion (3), hildegard (5), maintenance (4), blender (3), visualization (2), 3d-printing (3), lapidary (4), versioning (4).
- `agents/_registry.yml` is the machine-readable catalog of all 53 agents.
- `teams/_registry.yml` is the machine-readable catalog of all 8 teams.
- `guides/_registry.yml` is the machine-readable catalog of all 11 guides across 4 categories.

When adding or removing skills, agents, teams, or guides, the corresponding registry must be updated to stay in sync.
<!-- AUTO:END:registries -->

### Cross-References

Guides, skills, agents, and teams are cross-referenced. The parent project `CLAUDE.md` at `/mnt/d/dev/p/CLAUDE.md` references several guides via `@development-guides/guides/` paths. Skills reference related skills by relative path. Teams reference their member agents. The project `.claude/agents/` symlinks to `agents/` for Claude Code discovery.

## Editing Conventions

- SKILL.md files must retain the YAML frontmatter delimited by `---` and all standardized sections
- Each Procedure step uses the pattern: numbered step with sub-steps, then `**Expected:**` and `**On failure:**` blocks
- The `_registry.yml` must match the actual skills on disk (total count, paths, metadata)
- Guides use GitHub-flavored markdown with code blocks for all commands
- All R examples use `::` for package-qualified calls (e.g., `devtools::check()`) rather than `library()` calls

## Skill Validation

- SKILL.md files must stay under 500 lines; extract extended examples to `references/EXAMPLES.md` using the progressive disclosure pattern
- The `references/` subdirectory pattern follows [agentskills.io progressive disclosure](https://agentskills.io/specification) — large code blocks (>15 lines), full configs, and multi-variant examples go in `references/EXAMPLES.md` with cross-references from the main SKILL.md
- CI enforces validation on all PRs touching `skills/` (`.github/workflows/validate-skills.yml`): frontmatter fields, required sections, line counts, and registry sync
- To validate locally before committing:
  ```bash
  # Check a single skill
  lines=$(wc -l < skills/<skill-name>/SKILL.md)
  [ "$lines" -le 500 ] && echo "OK ($lines lines)" || echo "FAIL ($lines lines > 500)"

  # Check all skills
  for f in skills/*/SKILL.md; do
    lines=$(wc -l < "$f")
    [ "$lines" -gt 500 ] && echo "OVER: $f ($lines lines)"
  done
  ```

## Adding a New Skill

1. Create `skills/<skill-name>/SKILL.md` following the format of existing skills
2. Add the entry to `skills/_registry.yml` under the appropriate domain
3. Update `total_skills` count in `_registry.yml`
4. Symlink into `.claude/skills/`: `ln -s ../../skills/<skill-name> .claude/skills/<skill-name>`
5. Reference related skills in the new skill's "Related Skills" section
6. Run `npm run update-readmes` (or let CI auto-commit on push to main)
7. The meta-skill at `skills/skill-creation/SKILL.md` documents this process in detail

## Adding a New Agent

1. Copy `agents/_template.md` to `agents/<agent-name>.md`
2. Fill in YAML frontmatter (required: `name`, `description`, `tools`, `model`, `version`, `author`)
3. Write Purpose, Capabilities, Available Skills, Usage Scenarios, Best Practices, Examples, Limitations, and See Also sections
4. Add the entry to `agents/_registry.yml`
5. Run `npm run update-readmes` (or let CI auto-commit on push to main)
6. See `agents/best-practices.md` for detailed guidance

## Adding a New Team

1. Copy `teams/_template.md` to `teams/<team-name>.md`
2. Fill in YAML frontmatter (required: `name`, `description`, `lead`, `members[]`, `coordination`, `version`, `author`)
3. Write Purpose, Team Composition, Coordination Pattern, Task Decomposition, Configuration, Usage Scenarios, and Limitations sections
4. Include a `<!-- CONFIG:START -->` / `<!-- CONFIG:END -->` block with machine-readable YAML for tooling
5. Add the entry to `teams/_registry.yml` and update `total_teams` count
6. Run `npm run update-readmes` (or let CI auto-commit on push to main)

## Adding a New Guide

1. Copy `guides/_template.md` to `guides/<guide-name>.md`
2. Fill in YAML frontmatter (required: `title`, `description`, `category`, `agents`, `teams`, `skills`)
3. Write sections following the template: When to Use, Prerequisites, Workflow Overview, core sections, Troubleshooting, Related Resources
4. Add the entry to `guides/_registry.yml` and update `total_guides` count
5. Run `npm run update-readmes` (or let CI auto-commit on push to main)

## README Automation

Dynamic sections in README files are auto-generated from the registries. Sections between `<!-- AUTO:START:name -->` and `<!-- AUTO:END:name -->` markers are replaced by `scripts/generate-readmes.js`. Three files (`guides/README.md`, `viz/README.md`, `teams/README.md`) are fully generated.

```bash
# Update all READMEs from registries
npm run update-readmes

# Check if READMEs are up to date (exits 1 if stale)
npm run check-readmes
```

CI auto-commits README updates when registry files change on `main` (`.github/workflows/update-readmes.yml`). Manual table updates in step 5 above are no longer needed — the script handles it.

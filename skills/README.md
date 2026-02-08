# Skills Library for Agentic Systems

A collection of 33 task-level skills following the [Agent Skills open standard](https://agentskills.io) (`SKILL.md` format). These skills provide structured, executable procedures that agentic systems (Claude Code, Codex, Cursor, Gemini CLI, etc.) can consume to perform specific development tasks.

## How Skills Differ from Guides and Agents

| Concept | Purpose | Example |
|---------|---------|---------|
| **Guides** (parent directory) | Human-readable reference docs | "R Package Development Best Practices" |
| **Agents** (`.claude/agents/`) | Personas with broad capabilities | "R Developer" agent |
| **Skills** (this directory) | Executable procedures for specific tasks | "Submit to CRAN" step-by-step |

Skills complement agents. An agent defines *who* (persona, tools, style); a skill defines *how* (procedure, validation, recovery).

## Quick Start

Browse by domain:

| Domain | Skills | Description |
|--------|--------|-------------|
| [r-packages/](r-packages/) | 10 | R package development lifecycle |
| [containerization/](containerization/) | 4 | Docker & container workflows |
| [reporting/](reporting/) | 4 | Quarto, Rmd, publication-ready reports |
| [compliance/](compliance/) | 4 | GxP & regulatory validation |
| [mcp-integration/](mcp-integration/) | 3 | MCP server setup & troubleshooting |
| [web-dev/](web-dev/) | 3 | Next.js, Tailwind, Vercel |
| [general/](general/) | 5 | Cross-cutting dev environment skills |

## SKILL.md Format

Each skill lives in its own directory with a `SKILL.md` file:

```
skills/domain/skill-name/
├── SKILL.md          # Required: skill definition
├── references/       # Optional: reference materials
├── scripts/          # Optional: automation scripts
└── assets/           # Optional: templates, configs
```

Every `SKILL.md` includes YAML frontmatter with metadata (`name`, `description`, `allowed-tools`, `complexity`, etc.) followed by structured sections: When to Use, Inputs, Procedure, Validation, Common Pitfalls, and Related Skills.

## Consuming Skills from Different Systems

### Claude Code

Reference skills directly in your `CLAUDE.md`:

```markdown
## Skills
@development-guides/skills/r-packages/submit-to-cran/SKILL.md
```

Or symlink the entire skills directory:

```bash
ln -s /path/to/development-guides/skills ~/.claude/skills
```

### Codex (OpenAI)

Symlink into the agents directory:

```bash
ln -s /path/to/development-guides/skills .agents/skills
```

Reference in your `AGENTS.md`:

```markdown
## Available Skills
See `.agents/skills/_registry.yml` for the full skill catalog.
```

### Cursor

Map skills to rule files. In `.cursor/rules/`:

```bash
# Symlink specific skills as .mdc files
ln -s /path/to/skills/r-packages/submit-to-cran/SKILL.md .cursor/rules/submit-to-cran.mdc
```

Or reference the skills directory in your `.cursorrules`:

```
When performing R package tasks, consult skills in development-guides/skills/r-packages/
```

### Other Tools (Gemini CLI, Aider, etc.)

Clone the repo and point your tool's context to the relevant `SKILL.md` file. The standard format is designed for universal consumption — any tool that reads markdown can use these skills.

### Programmatic Discovery

Use `_registry.yml` for machine-readable skill lookup:

```python
import yaml
with open("skills/_registry.yml") as f:
    registry = yaml.safe_load(f)
    for domain, info in registry["domains"].items():
        for skill in info["skills"]:
            print(f"{domain}/{skill['id']} [{skill['complexity']}]")
```

## Agent Integration

Existing agents in `.claude/agents/` can reference skills:

```markdown
# In r-developer.md agent definition
## Available Skills
When performing package development tasks, follow procedures from:
- `skills/r-packages/create-r-package/SKILL.md` for new packages
- `skills/r-packages/submit-to-cran/SKILL.md` for CRAN submission
- `skills/r-packages/write-testthat-tests/SKILL.md` for testing patterns
```

## Contributing a New Skill

1. Create a directory: `skills/<domain>/<skill-name>/`
2. Write `SKILL.md` following the template (see any existing skill)
3. Add the skill to `_registry.yml`
4. Ensure frontmatter includes required fields: `name`, `description`, `allowed-tools`
5. Include at minimum: When to Use, Procedure, and Validation sections

## License

MIT License. See parent project for details.

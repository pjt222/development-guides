# Agents Library for Claude Code

A collection of 7 specialized agent definitions for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Each agent defines a persona with specific capabilities, tools, and domain expertise that Claude Code uses when spawned as a subagent.

## How Agents Differ from Skills and Guides

| Concept | Purpose | Example |
|---------|---------|---------|
| **Guides** (parent directory) | Human-readable reference docs | "R Package Development Best Practices" |
| **Agents** (this directory) | Personas with broad capabilities | "R Developer" agent |
| **Skills** (`skills/` directory) | Executable procedures for specific tasks | "Submit to CRAN" step-by-step |

Agents define *who* (persona, tools, style); skills define *how* (procedure, validation, recovery). They complement each other — an agent can reference skills to execute specific tasks.

## Available Agents

| Agent | Priority | Description |
|-------|----------|-------------|
| [r-developer](r-developer.md) | high | R package development, data analysis, statistical computing with MCP integration |
| [code-reviewer](code-reviewer.md) | high | Code quality, security review, and best practices enforcement |
| [security-analyst](security-analyst.md) | critical | Security auditing, vulnerability assessment, defensive security |
| [web-developer](web-developer.md) | normal | Full-stack Next.js, TypeScript, Tailwind CSS, Vercel deployment, and environment setup |
| [survivalist](survivalist.md) | normal | Wilderness survival: fire craft, water purification, plant foraging |
| [mystic](mystic.md) | normal | Esoteric practices: energy healing, meditation, coordinate remote viewing |
| [martial-artist](martial-artist.md) | normal | Defensive martial arts: tai chi, aikido, situational awareness and de-escalation |

Each agent lists the skills it can execute in its `skills` frontmatter field and `## Available Skills` section. The r-developer agent covers the most ground (29 skills across 7 domains), while code-reviewer and security-analyst each reference 6 skills aligned to their focus areas. Together, the 7 agents cover 46 of the 48 skills in the library. Only the two meta-skills (`skill-creation` and `skill-evolution`) remain standalone, as they are used to create and maintain skills themselves rather than belonging to a specific domain agent.

## Using Agents in Claude Code

### Automatic Discovery

Place agent files in `.claude/agents/` (project-level) or `~/.claude/agents/` (global). Claude Code discovers them automatically and makes them available as subagent types via the `Task` tool.

This repository's `.claude/agents/` symlinks to this directory, so agents are available when working in the development-guides project.

### Manual Reference

Reference agents in your `CLAUDE.md`:

```markdown
## Agents
@development-guides/agents/r-developer.md
@development-guides/agents/code-reviewer.md
@development-guides/agents/security-analyst.md
```

### Spawning an Agent

In Claude Code, agents are invoked via the Task tool with `subagent_type`:

```
Task(subagent_type="r-developer", prompt="Create a new R package for time series analysis")
Task(subagent_type="code-reviewer", prompt="Review this pull request for security issues")
Task(subagent_type="security-analyst", prompt="Audit this codebase for OWASP Top 10 vulnerabilities")
Task(subagent_type="web-developer", prompt="Scaffold a Next.js app with Tailwind and deploy to Vercel")
Task(subagent_type="survivalist", prompt="Teach me how to purify water from a stream")
Task(subagent_type="mystic", prompt="Guide me through a 15-minute meditation session")
Task(subagent_type="martial-artist", prompt="Teach me the opening movements of Yang 24 tai chi")
```

## Agent File Format

Each agent is a markdown file with YAML frontmatter:

```yaml
---
name: agent-name           # kebab-case identifier
description: Brief purpose  # 1-2 sentences
tools: [Read, Write, ...]  # Required Claude Code tools
model: claude-3-5-sonnet-20241022
version: "1.0"
author: Author Name
tags: [domain, capability]
priority: normal            # low | normal | high | critical
skills: [skill-id, ...]    # Skills from skills/ this agent can execute
---
```

See [configuration-schema.md](configuration-schema.md) for the full schema and [_template.md](_template.md) for a starter template.

## Creating a New Agent

1. Copy `_template.md` to `<agent-name>.md`
2. Fill in the YAML frontmatter (all required fields)
3. Write the Purpose, Capabilities, Usage Scenarios, and Examples sections
4. Add the agent to `_registry.yml`
5. Update the table in this README

See [best-practices.md](best-practices.md) for detailed guidance on writing effective agents.

## Registry

`_registry.yml` provides machine-readable metadata for all agents. Keep it in sync when adding or removing agents.

## License

MIT License. See parent project for details.

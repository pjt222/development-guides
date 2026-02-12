# Agents Library for Claude Code

A collection of 27 specialized agent definitions for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Each agent defines a persona with specific capabilities, tools, and domain expertise that Claude Code uses when spawned as a subagent.

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
| [web-developer](web-developer.md) | normal | Full-stack Next.js, TypeScript, Tailwind CSS, Vercel deployment |
| [gxp-validator](gxp-validator.md) | high | CSV and compliance lifecycle: architecture, validation, change control, data integrity |
| [auditor](auditor.md) | high | GxP audit, CAPA investigation, inspection readiness, vendor qualification |
| [senior-researcher](senior-researcher.md) | high | Peer review of research methodology, statistics, reproducibility |
| [senior-data-scientist](senior-data-scientist.md) | high | Statistical analysis, ML pipeline, data quality, and model validation review |
| [senior-software-developer](senior-software-developer.md) | high | Architecture review: SOLID, API design, scalability, technical debt |
| [senior-web-designer](senior-web-designer.md) | high | Visual design review: layout, typography, colour, responsive, branding |
| [senior-ux-ui-specialist](senior-ux-ui-specialist.md) | high | Usability and accessibility: heuristics, WCAG, keyboard/screen reader audit |
| [survivalist](survivalist.md) | normal | Wilderness survival: fire craft, water purification, plant foraging |
| [mystic](mystic.md) | normal | Esoteric practices: energy healing, meditation, coordinate remote viewing |
| [martial-artist](martial-artist.md) | normal | Defensive martial arts: tai chi, aikido, situational awareness |
| [designer](designer.md) | normal | Ornamental design: historical style analysis, Z-Image generation, Speltz taxonomy |
| [project-manager](project-manager.md) | normal | Agile & classic PM: charters, WBS, sprints, backlogs, status reports |
| [devops-engineer](devops-engineer.md) | high | CI/CD, Kubernetes, GitOps, service mesh, observability, chaos engineering |
| [mlops-engineer](mlops-engineer.md) | high | Experiment tracking, model registry, feature stores, ML pipelines, AIOps |
| [putior-integrator](putior-integrator.md) | normal | Workflow visualization: putior integration, annotation, Mermaid diagrams |
| [swarm-strategist](swarm-strategist.md) | normal | Collective intelligence: distributed coordination, foraging, consensus, defense, scaling |
| [shapeshifter](shapeshifter.md) | normal | Metamorphic transformation: form assessment, architectural adaptation, regenerative repair |
| [alchemist](alchemist.md) | normal | Code/data transmutation: four-stage alchemical process with meditate/heal checkpoints |
| [polymath](polymath.md) | high | Cross-disciplinary synthesis: spawns domain agents, synthesizes findings |
| [tcg-specialist](tcg-specialist.md) | normal | Trading card games: grading (PSA/BGS/CGC), deck building, collection management |
| [ip-analyst](ip-analyst.md) | high | Intellectual property: patent landscape, prior art search, FTO analysis |
| [gardener](gardener.md) | normal | Plant cultivation: bonsai, soil, biodynamic calendar, garden observation, hand tools |

Each agent lists the skills it can execute in its `skills` frontmatter field and `## Available Skills` section. The devops-engineer agent covers the most ground (35 skills across 5 domains). Together, the 27 agents cover 155 of the 171 skills in the library. The sixteen uncovered skills are the two meta-skills (`skill-creation` and `skill-evolution`), the two visualization utilities (`create-skill-glyph`, `glyph-enhance`), the eleven human-guidance skills (`heal-guidance`, `meditate-guidance`, `remote-viewing-guidance`, `learn-guidance`, `teach-guidance`, `listen-guidance`, `observe-guidance`), and the memory utility (`manage-memory`).

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
Task(subagent_type="gxp-validator", prompt="Perform a CSV assessment for our new LIMS system")
Task(subagent_type="auditor", prompt="Conduct an internal audit of our validated R environment")
Task(subagent_type="senior-researcher", prompt="Review this manuscript's methodology and statistical analysis")
Task(subagent_type="senior-data-scientist", prompt="Review our ML pipeline for data leakage")
Task(subagent_type="senior-software-developer", prompt="Review the architecture of this microservices system")
Task(subagent_type="senior-web-designer", prompt="Review the typography and colour consistency of our site")
Task(subagent_type="senior-ux-ui-specialist", prompt="Audit this app for WCAG 2.1 AA compliance")
Task(subagent_type="survivalist", prompt="Teach me how to purify water from a stream")
Task(subagent_type="mystic", prompt="Guide me through a 15-minute meditation session")
Task(subagent_type="martial-artist", prompt="Teach me the opening movements of Yang 24 tai chi")
Task(subagent_type="designer", prompt="Create an Islamic geometric star pattern in turquoise and gold")
Task(subagent_type="project-manager", prompt="Set up agile PM for our new API service project")
Task(subagent_type="devops-engineer", prompt="Deploy our API to Kubernetes with CI/CD and monitoring")
Task(subagent_type="mlops-engineer", prompt="Set up MLflow tracking and model registry for our ML project")
Task(subagent_type="swarm-strategist", prompt="Design stigmergic coordination for our microservices fleet")
Task(subagent_type="shapeshifter", prompt="Assess our monolith for strangler fig migration readiness")
Task(subagent_type="alchemist", prompt="Transform this legacy PHP module into clean TypeScript")
Task(subagent_type="polymath", prompt="Assess feasibility of an AI medical imaging tool across engineering, compliance, IP, and UX")
Task(subagent_type="tcg-specialist", prompt="Grade this 1st Edition Charizard and advise on PSA submission")
Task(subagent_type="ip-analyst", prompt="Map the patent landscape for federated learning before we start R&D")
Task(subagent_type="gardener", prompt="Help me plan spring planting using the lunar calendar")
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

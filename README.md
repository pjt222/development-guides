# Development Guides

An agentic development platform providing structured skills, specialized agents, and reference guides for AI-assisted software engineering. Built on the [Agent Skills open standard](https://agentskills.io), the platform gives agentic systems (Claude Code, Codex, Cursor, Gemini CLI) executable procedures for tasks spanning R package development, DevOps, compliance, MLOps, observability, and more.

## At a Glance

- **125 skills** across 19 domains — structured, executable procedures
- **19 agents** — specialized Claude Code personas covering development, review, compliance, and more
- **6 guides** — human-readable reference documentation
- **Interactive visualization** — force-graph explorer with 125 R-generated skill icons and 6 color themes

## Three Pillars

| Pillar | Location | Purpose | Example |
|--------|----------|---------|---------|
| **Guides** | `guides/` | Human-readable reference docs | "R Package Development Best Practices" |
| **Skills** | `skills/<domain>/<skill>/` | Executable procedures for specific tasks | "Submit to CRAN" step-by-step |
| **Agents** | `agents/<name>.md` | Personas with broad capabilities | "R Developer" agent |

Skills define *how* (procedure, validation, recovery). Agents define *who* (persona, tools, style). Guides provide the background knowledge both draw from. An agent can reference skills to execute specific tasks — see [agents/README.md](agents/README.md) for the full mapping.

## Skills Library

The **[Skills Library](skills/)** provides 125 task-level skills following the [Agent Skills open standard](https://agentskills.io). Each skill is a `SKILL.md` with YAML frontmatter and standardized sections: When to Use, Inputs, Procedure (with expected outcomes and failure recovery), Validation, Common Pitfalls, and Related Skills.

| Domain | Skills | Description |
|--------|--------|-------------|
| [R Packages](skills/r-packages/) | 10 | Full lifecycle: create, test, document, submit to CRAN |
| [Compliance](skills/compliance/) | 17 | GxP validation, CSV, audits, change control, data integrity, SOPs, training, inspections |
| [DevOps](skills/devops/) | 13 | CI/CD, Kubernetes, GitOps, service mesh, infrastructure automation |
| [Observability](skills/observability/) | 13 | Prometheus, Grafana, logging, tracing, alerting, SLOs, chaos engineering |
| [MLOps](skills/mlops/) | 12 | Experiment tracking, model serving, feature stores, pipelines, AIOps |
| [Git](skills/git/) | 6 | Version control, branching, PRs, releases |
| [Project Management](skills/project-management/) | 6 | Charters, WBS, sprints, backlogs, status reports, retrospectives |
| [Workflow Visualization](skills/workflow-visualization/) | 6 | Putior integration, Mermaid diagrams, annotation, CI/CD |
| [General](skills/general/) | 5 | WSL setup, CLAUDE.md, security audits, skill creation & evolution |
| [Review](skills/review/) | 5 | Research, data analysis, architecture, web design, UX/UI review |
| [Containerization](skills/containerization/) | 4 | Dockerfiles, Compose, MCP server containers |
| [Reporting](skills/reporting/) | 4 | Quarto, APA formatting, statistical tables |
| [Design](skills/design/) | 4 | Ornamental patterns, modern styles, R-based skill glyph creation |
| [MCP Integration](skills/mcp-integration/) | 3 | Server setup, custom servers, troubleshooting |
| [Web Development](skills/web-dev/) | 3 | Next.js, Tailwind, Vercel deployment |
| [Bushcraft](skills/bushcraft/) | 3 | Fire-making, water purification, plant foraging |
| [Esoteric](skills/esoteric/) | 6 | Meditation, healing, remote viewing — self-practice and guided variants |
| [Defensive](skills/defensive/) | 3 | Tai chi, aikido, situational awareness |
| [Data Serialization](skills/data-serialization/) | 2 | Data formats, schemas, and evolution strategies |

See [skills/README.md](skills/README.md) for consumption instructions across different AI coding tools.

## Agents Library

The **[Agents Library](agents/)** provides 19 specialized agent definitions for Claude Code. Agents define *who* handles a task (persona, tools, domain expertise), complementing skills which define *how* (procedure, validation).

| Agent | Priority | Description |
|-------|----------|-------------|
| [r-developer](agents/r-developer.md) | high | R package development, data analysis, statistical computing |
| [code-reviewer](agents/code-reviewer.md) | high | Code quality, security review, best practices enforcement |
| [security-analyst](agents/security-analyst.md) | critical | Security auditing, vulnerability assessment, defensive security |
| [web-developer](agents/web-developer.md) | normal | Full-stack Next.js, TypeScript, Tailwind CSS, Vercel deployment |
| [gxp-validator](agents/gxp-validator.md) | high | CSV and compliance lifecycle: architecture, validation, change control, data integrity |
| [auditor](agents/auditor.md) | high | GxP audit, CAPA investigation, inspection readiness, vendor qualification |
| [devops-engineer](agents/devops-engineer.md) | high | CI/CD, Kubernetes, GitOps, service mesh, observability, chaos engineering |
| [mlops-engineer](agents/mlops-engineer.md) | high | Experiment tracking, model registry, feature stores, ML pipelines, AIOps |
| [project-manager](agents/project-manager.md) | normal | Agile & classic PM: charters, WBS, sprints, backlogs, status reports |
| [senior-researcher](agents/senior-researcher.md) | high | Peer review of research methodology, statistics, reproducibility |
| [senior-data-scientist](agents/senior-data-scientist.md) | high | Statistical analysis, ML pipeline, data quality, model validation review |
| [senior-software-developer](agents/senior-software-developer.md) | high | Architecture review: SOLID, API design, scalability, technical debt |
| [senior-web-designer](agents/senior-web-designer.md) | high | Visual design review: layout, typography, colour, responsive, branding |
| [senior-ux-ui-specialist](agents/senior-ux-ui-specialist.md) | high | Usability and accessibility: heuristics, WCAG, keyboard/screen reader audit |
| [survivalist](agents/survivalist.md) | normal | Wilderness survival: fire craft, water purification, plant foraging |
| [mystic](agents/mystic.md) | normal | Esoteric practices: energy healing, meditation, coordinate remote viewing |
| [martial-artist](agents/martial-artist.md) | normal | Defensive martial arts: tai chi, aikido, situational awareness |
| [designer](agents/designer.md) | normal | Ornamental design: historical style analysis, Z-Image generation, Speltz taxonomy |
| [putior-integrator](agents/putior-integrator.md) | normal | Workflow visualization: putior integration, annotation, Mermaid diagrams |

See [agents/README.md](agents/README.md) for usage instructions, the creation template, and best practices.

## Interactive Visualization

The `viz/` directory contains an interactive force-graph explorer for the entire skills library.

- **Force-graph** (`viz/js/graph.js`): 2D canvas rendering with zoom, pan, and click-to-inspect using the [force-graph](https://github.com/vasturiano/force-graph) library
- **R icon pipeline** (`viz/R/`): ggplot2 + ggfx neon glow pictograms rendered per-skill as transparent WebP icons
- **125 skill icons** (`viz/icons/<domain>/`): one glyph per skill, domain-colored
- **6 color themes**: cyberpunk, viridis, inferno, magma, plasma, cividis
- **Data pipeline**: `node build-data.js` reads `skills/_registry.yml` and generates `viz/data/skills.json`

To run locally:

```bash
cd viz && python3 -m http.server 8080
# Open http://localhost:8080
```

## Guides

### [WSL-RStudio-Claude Code Integration](guides/wsl-rstudio-claude-integration.md)
Claude Code + R + MCP server setup: mcptools configuration, Claude Desktop and Claude Code as independent MCP clients, Hugging Face MCP server, environment variables, path management.

### [General Development Setup](guides/general-development-setup.md)
WSL2 configuration, shell environment, Git and SSH, essential tools (tmux, fzf), directory structure, language-specific setups (Node.js, Python, R).

### [R Package Development Best Practices](guides/r-package-development-best-practices.md)
Package structure, documentation standards (roxygen2, vignettes), testing with testthat, CRAN submission workflow, CI/CD with GitHub Actions.

### [pkgdown GitHub Pages Deployment](guides/pkgdown-github-pages-deployment.md)
Branch-based vs GitHub Actions deployment, `_pkgdown.yml` configuration, troubleshooting 404 errors, migration between methods.

### [renv Setup Troubleshooting](guides/renv-setup-troubleshooting.md)
Common renv initialization and restore issues, platform-specific dependency resolution, reproducible environments.

### [Quick Reference](guides/quick-reference.md)
WSL-Windows path conversions, R package development commands, Git operations, shell commands, keyboard shortcuts.

## Getting Started

1. **New to this setup?** Start with [General Development Setup](guides/general-development-setup.md)
2. **Working with R + Claude?** Follow [WSL-RStudio-Claude Code Integration](guides/wsl-rstudio-claude-integration.md)
3. **Building R packages?** Use [R Package Development Best Practices](guides/r-package-development-best-practices.md)
4. **Want agentic skills?** Browse the [Skills Library](skills/) or the [registry](skills/_registry.yml)
5. **Need quick commands?** Keep [Quick Reference](guides/quick-reference.md) handy

## Directory Structure

```
development-guides/
├── README.md                              # This file
├── CLAUDE.md                              # AI assistant instructions
├── guides/                                # Human-readable reference guides (6)
│   ├── wsl-rstudio-claude-integration.md
│   ├── general-development-setup.md
│   ├── r-package-development-best-practices.md
│   ├── pkgdown-github-pages-deployment.md
│   ├── renv-setup-troubleshooting.md
│   └── quick-reference.md
├── agents/                                # Agent definitions for Claude Code (19 agents)
│   ├── README.md                          # Agent index and usage guide
│   ├── _registry.yml                      # Machine-readable agent registry
│   ├── _template.md                       # Agent creation template
│   ├── best-practices.md                  # Agent development guide
│   ├── configuration-schema.md            # YAML frontmatter schema docs
│   └── *.md                               # 19 agent persona files
├── skills/                                # Agentic skills library (125 skills, 19 domains)
│   ├── README.md                          # Skills index and usage guide
│   ├── _registry.yml                      # Machine-readable skill registry
│   ├── r-packages/                        # 10 R package lifecycle skills
│   ├── compliance/                        # 17 GxP/regulatory/compliance lifecycle skills
│   ├── devops/                            # 13 CI/CD, Kubernetes, GitOps skills
│   ├── observability/                     # 13 monitoring, logging, tracing, alerting skills
│   ├── mlops/                             # 12 ML experiment, serving, pipeline, AIOps skills
│   ├── git/                               # 6 version control & GitHub skills
│   ├── project-management/                # 6 agile & classic PM skills
│   ├── workflow-visualization/            # 6 putior, Mermaid, annotation, CI/CD skills
│   ├── general/                           # 5 cross-cutting skills
│   ├── review/                            # 5 senior-level review skills
│   ├── containerization/                  # 4 Docker/container skills
│   ├── reporting/                         # 4 Quarto/reporting skills
│   ├── design/                            # 4 ornamental design & glyph creation skills
│   ├── mcp-integration/                   # 3 MCP server skills
│   ├── web-dev/                           # 3 web development skills
│   ├── bushcraft/                         # 3 wilderness survival skills
│   ├── esoteric/                          # 6 esoteric practice skills
│   ├── defensive/                         # 3 martial arts & awareness skills
│   └── data-serialization/                # 2 data format & schema skills
└── viz/                                   # Interactive skills visualization
    ├── index.html                         # Force-graph explorer
    ├── build-data.js                      # Registry → skills.json pipeline
    ├── build-icons.R                      # R icon rendering orchestrator
    ├── js/                                # Graph, filters, panel, color themes
    ├── css/                               # Styles
    ├── R/                                 # Glyph primitives, render, utilities
    ├── data/                              # skills.json, icon-manifest.json
    └── icons/                             # 125 WebP skill icons by domain
```

## Consuming Skills Across Tools

### Claude Code
Reference skills in `CLAUDE.md` or symlink into `.claude/skills/`:
```bash
# Per-skill symlinks (flattens domain nesting for Claude Code discovery)
ln -s ../../skills/r-packages/submit-to-cran .claude/skills/submit-to-cran
```

### Codex (OpenAI)
```bash
ln -s /path/to/development-guides/skills .agents/skills
```

### Cursor
```bash
ln -s /path/to/skills/r-packages/submit-to-cran/SKILL.md .cursor/rules/submit-to-cran.mdc
```

### Programmatic Discovery
```python
import yaml
with open("skills/_registry.yml") as f:
    registry = yaml.safe_load(f)
    for domain, info in registry["domains"].items():
        for skill in info["skills"]:
            print(f"{domain}/{skill['id']} [{skill['complexity']}]")
```

## Contributing

Contributions are welcome! See the relevant README for each content type:

- **Skills**: [skills/README.md](skills/README.md) — format, consumption, and contribution guide
- **Agents**: [agents/README.md](agents/README.md) — creation template, best practices, registry
- **Guides**: Follow the existing structure and GitHub-flavored markdown style

When contributing, please maintain the existing structure, update registries (`_registry.yml`), and test instructions in a fresh environment.

## License

MIT License. See [LICENSE](LICENSE) for details.

# Development Guides

An agentic development platform providing structured skills, specialized agents, and reference guides for AI-assisted software engineering. Built on the [Agent Skills open standard](https://agentskills.io), the platform gives agentic systems (Claude Code, Codex, Cursor, Gemini CLI) executable procedures for tasks spanning R package development, DevOps, compliance, MLOps, observability, and more.

## At a Glance

<!-- AUTO:START:stats -->
- **185 skills** across 27 domains — structured, executable procedures
- **29 agents** — specialized Claude Code personas covering development, review, compliance, and more
- **6 guides** — human-readable reference documentation
- **Interactive visualization** — force-graph explorer with 185 R-generated skill icons and 6 color themes
<!-- AUTO:END:stats -->

## Three Pillars

| Pillar | Location | Purpose | Example |
|--------|----------|---------|---------|
| **Guides** | `guides/` | Human-readable reference docs | "R Package Development Best Practices" |
| **Skills** | `skills/<domain>/<skill>/` | Executable procedures for specific tasks | "Submit to CRAN" step-by-step |
| **Agents** | `agents/<name>.md` | Personas with broad capabilities | "R Developer" agent |

Skills define *how* (procedure, validation, recovery). Agents define *who* (persona, tools, style). Guides provide the background knowledge both draw from. An agent can reference skills to execute specific tasks — see [agents/README.md](agents/README.md) for the full mapping.

## Skills Library

<!-- AUTO:START:skills-intro -->
The **[Skills Library](skills/)** provides 185 task-level skills following the [Agent Skills open standard](https://agentskills.io). Each skill is a `SKILL.md` with YAML frontmatter and standardized sections: When to Use, Inputs, Procedure (with expected outcomes and failure recovery), Validation, Common Pitfalls, and Related Skills.
<!-- AUTO:END:skills-intro -->

<!-- AUTO:START:skills-table -->
| Domain | Skills | Description |
|--------|--------|-------------|
| [R Packages](skills/r-packages/) | 10 | R package development lifecycle skills |
| [Jigsawr](skills/jigsawr/) | 5 | jigsawR puzzle package development skills |
| [Containerization](skills/containerization/) | 10 | Docker and container workflow skills |
| [Reporting](skills/reporting/) | 4 | Quarto, R Markdown, and publication-ready report skills |
| [Compliance](skills/compliance/) | 17 | GxP regulatory and validation skills |
| [Mcp Integration](skills/mcp-integration/) | 3 | MCP server setup and troubleshooting skills |
| [Web Dev](skills/web-dev/) | 3 | Web development skills for Next.js and modern frontend |
| [Git](skills/git/) | 6 | Git version control and GitHub workflow skills |
| [General](skills/general/) | 6 | Cross-cutting development environment and workflow skills |
| [Data Serialization](skills/data-serialization/) | 2 | Data serialization formats, schemas, and evolution strategies |
| [Review](skills/review/) | 6 | Senior-level review skills for research, data, architecture, and design |
| [Bushcraft](skills/bushcraft/) | 3 | Wilderness survival and primitive skills |
| [Esoteric](skills/esoteric/) | 15 | Esoteric practices — AI self-directed variants and human-guidance variants |
| [Design](skills/design/) | 5 | Ornamental design and AI-assisted image generation skills |
| [Defensive](skills/defensive/) | 6 | Martial arts and applied defensive awareness skills |
| [Project Management](skills/project-management/) | 6 | Agile and classic project management skills |
| [Devops](skills/devops/) | 13 | CI/CD, Kubernetes, GitOps, and infrastructure automation skills |
| [Observability](skills/observability/) | 13 | Monitoring, logging, tracing, alerting, and reliability engineering skills |
| [Mlops](skills/mlops/) | 12 | ML experiment tracking, model serving, feature stores, pipelines, and AIOps skills |
| [Workflow Visualization](skills/workflow-visualization/) | 6 | Workflow annotation and Mermaid diagram generation with putior |
| [Swarm](skills/swarm/) | 8 | Collective intelligence, emergent coordination, and distributed decision-making strategies |
| [Morphic](skills/morphic/) | 6 | Adaptive transformation, structural metamorphosis, and reconfiguration strategies |
| [Alchemy](skills/alchemy/) | 3 | Code and data transmutation through systematic decomposition, purification, and synthesis |
| [Tcg](skills/tcg/) | 3 | Trading card game grading, deck building, and collection management |
| [Intellectual Property](skills/intellectual-property/) | 2 | Patent landscape analysis, prior art search, and IP strategy |
| [Gardening](skills/gardening/) | 5 | Plant cultivation, soil preparation, garden observation, and hand tool care |
| [Shiny](skills/shiny/) | 7 | Shiny web application development, modules, testing, and deployment |
<!-- AUTO:END:skills-table -->

See [skills/README.md](skills/README.md) for consumption instructions across different AI coding tools.

## Agents Library

<!-- AUTO:START:agents-intro -->
The **[Agents Library](agents/)** provides 29 specialized agent definitions for Claude Code. Agents define *who* handles a task (persona, tools, domain expertise), complementing skills which define *how* (procedure, validation).
<!-- AUTO:END:agents-intro -->

<!-- AUTO:START:agents-table -->
| Agent | Priority | Description |
|-------|----------|-------------|
| [security-analyst](agents/security-analyst.md) | critical | Specialized agent for security auditing, vulnerability assessment, and defensive security practices |
| [auditor](agents/auditor.md) | high | GxP audit and investigation specialist for audit planning, execution, finding classification, CAPA root cause analysis, inspection readiness, data integrity monitoring, and vendor qualification |
| [code-reviewer](agents/code-reviewer.md) | high | Reviews code changes, pull requests, and provides detailed feedback on code quality, security, and best practices |
| [devops-engineer](agents/devops-engineer.md) | high | Infrastructure and platform engineering agent for CI/CD, Kubernetes, GitOps, service mesh, observability, and chaos engineering |
| [gxp-validator](agents/gxp-validator.md) | high | Computer Systems Validation and compliance lifecycle specialist covering 21 CFR Part 11, EU Annex 11, GAMP 5, compliance architecture, change control, electronic signatures, SOPs, data integrity monitoring, training programmes, and system decommissioning |
| [ip-analyst](agents/ip-analyst.md) | high | Patent landscape mapping, prior art search, trademark screening, FTO analysis |
| [jigsawr-developer](agents/jigsawr-developer.md) | high | Specialized agent for jigsawR package development covering puzzle generation, pipeline integration, PILES notation, ggpuzzle layers, Quarto docs, and Shiny app |
| [mlops-engineer](agents/mlops-engineer.md) | high | ML operations agent for experiment tracking, model registry, feature stores, ML pipelines, model serving, drift monitoring, and AIOps |
| [polymath](agents/polymath.md) | high | Cross-disciplinary synthesis; spawns domain-specific subagents, synthesizes findings across domains, and produces integrated insights |
| [r-developer](agents/r-developer.md) | high | Specialized agent for R package development, data analysis, and statistical computing with MCP integration |
| [senior-data-scientist](agents/senior-data-scientist.md) | high | Reviews statistical analyses, ML pipelines, data quality, model validation, and data serialization practices |
| [senior-researcher](agents/senior-researcher.md) | high | Expert peer reviewer of research methodology, experimental design, statistical analysis, and scientific writing |
| [senior-software-developer](agents/senior-software-developer.md) | high | Architecture reviewer evaluating system design, SOLID principles, scalability, API design, and technical debt |
| [senior-ux-ui-specialist](agents/senior-ux-ui-specialist.md) | high | Usability and accessibility reviewer applying Nielsen heuristics, WCAG 2.1, keyboard/screen reader audits, and user flow analysis |
| [senior-web-designer](agents/senior-web-designer.md) | high | Visual design reviewer evaluating layout, typography, colour, spacing, responsive behaviour, and brand consistency |
| [shiny-developer](agents/shiny-developer.md) | high | Shiny application specialist for reactive web apps in R, covering scaffolding (golem/rhino/vanilla), modules, bslib theming, testing with shinytest2, performance optimization, and deployment |
| [alchemist](agents/alchemist.md) | normal | Code/data transmutation via four-stage alchemical process (nigredo/albedo/citrinitas/rubedo) with meditate/heal checkpoints |
| [designer](agents/designer.md) | normal | Ornamental design specialist for historical style analysis and AI-assisted image generation using Z-Image, grounded in Alexander Speltz's classical ornament taxonomy |
| [gardener](agents/gardener.md) | normal | Plant cultivation guide for bonsai, soil preparation, biodynamic calendar planning, garden observation, and hand tool maintenance with contemplative checkpoints |
| [martial-artist](agents/martial-artist.md) | normal | Defensive martial arts instructor for tai chi, aikido, and situational awareness with de-escalation and grounding techniques |
| [mystic](agents/mystic.md) | normal | Esoteric practices guide for energy healing, meditation facilitation, and coordinate remote viewing with structured protocols |
| [project-manager](agents/project-manager.md) | normal | Project management agent for agile and classic methodologies covering charters, WBS, sprints, backlogs, status reports, and retrospectives |
| [putior-integrator](agents/putior-integrator.md) | normal | Workflow visualization specialist that integrates putior into arbitrary codebases for Mermaid diagram generation |
| [quarto-developer](agents/quarto-developer.md) | normal | Quarto CLI specialist for multilingual QMD files, technical documentation, books, websites, presentations, dashboards, and manuscript publishing |
| [shapeshifter](agents/shapeshifter.md) | normal | Metamorphic transformation guide for architectural adaptation, structural dissolution, regenerative repair, and adaptive surface control |
| [survivalist](agents/survivalist.md) | normal | Wilderness survival instructor agent for fire craft, water purification, and plant foraging with safety-first guidance |
| [swarm-strategist](agents/swarm-strategist.md) | normal | Collective intelligence advisor for distributed coordination, foraging optimization, consensus building, colony defense, and scaling strategies |
| [tcg-specialist](agents/tcg-specialist.md) | normal | Trading card game grading (PSA/BGS/CGC), deck building, collection management for Pokemon/MTG/FaB/Kayou |
| [web-developer](agents/web-developer.md) | normal | Full-stack web development agent for Next.js, TypeScript, and Tailwind CSS projects with deployment and environment setup |
<!-- AUTO:END:agents-table -->

See [agents/README.md](agents/README.md) for usage instructions, the creation template, and best practices.

## Interactive Visualization

The `viz/` directory contains an interactive force-graph explorer for the entire skills library.

- **Force-graph** (`viz/js/graph.js`): 2D canvas rendering with zoom, pan, and click-to-inspect using the [force-graph](https://github.com/vasturiano/force-graph) library
- **R icon pipeline** (`viz/R/`): ggplot2 + ggfx neon glow pictograms rendered per-skill as transparent WebP icons
- **185 skill icons** (`viz/icons/<domain>/`): one glyph per skill, domain-colored
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
├── package.json                           # Root package (README automation)
├── scripts/
│   └── generate-readmes.js                # Auto-generate README sections from registries
├── guides/                                # Human-readable reference guides (6)
│   ├── wsl-rstudio-claude-integration.md
│   ├── general-development-setup.md
│   ├── r-package-development-best-practices.md
│   ├── pkgdown-github-pages-deployment.md
│   ├── renv-setup-troubleshooting.md
│   └── quick-reference.md
├── agents/                                # Agent definitions for Claude Code (29 agents)
│   ├── README.md                          # Agent index and usage guide
│   ├── _registry.yml                      # Machine-readable agent registry
│   ├── _template.md                       # Agent creation template
│   ├── best-practices.md                  # Agent development guide
│   ├── configuration-schema.md            # YAML frontmatter schema docs
│   └── *.md                               # 29 agent persona files
├── skills/                                # Agentic skills library (185 skills, 27 domains)
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
│   ├── general/                           # 6 cross-cutting skills
│   ├── review/                            # 6 senior-level review skills
│   ├── containerization/                  # 10 Docker/container skills
│   ├── reporting/                         # 4 Quarto/reporting skills
│   ├── design/                            # 5 ornamental design & glyph creation skills
│   ├── mcp-integration/                   # 3 MCP server skills
│   ├── web-dev/                           # 3 web development skills
│   ├── bushcraft/                         # 3 wilderness survival skills
│   ├── esoteric/                          # 15 esoteric practice skills
│   ├── defensive/                         # 6 martial arts & awareness skills
│   ├── data-serialization/                # 2 data format & schema skills
│   ├── jigsawr/                           # 5 jigsawR puzzle development skills
│   ├── swarm/                             # 8 collective intelligence skills
│   ├── morphic/                           # 6 adaptive transformation skills
│   ├── alchemy/                           # 3 code transmutation skills
│   ├── tcg/                               # 3 trading card game skills
│   ├── intellectual-property/             # 2 IP analysis skills
│   ├── gardening/                         # 5 plant cultivation skills
│   └── shiny/                             # 7 Shiny web app skills
└── viz/                                   # Interactive skills visualization
    ├── index.html                         # Force-graph explorer
    ├── build-data.js                      # Registry → skills.json pipeline
    ├── build-icons.R                      # R icon rendering orchestrator
    ├── js/                                # Graph, filters, panel, color themes
    ├── css/                               # Styles
    ├── R/                                 # Glyph primitives, render, utilities
    ├── data/                              # skills.json, icon-manifest.json
    └── icons/                             # 185 WebP skill icons by domain
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

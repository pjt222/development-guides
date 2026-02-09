# Development Guides

A comprehensive collection of guides for development work using WSL, Windows, and various development tools. These guides provide practical, tested solutions for common development environment setup and workflow challenges.


## Available Guides

### [WSL-RStudio-Claude Code Integration](guides/wsl-rstudio-claude-integration.md)
Complete setup guide for using Claude Code from WSL with RStudio on Windows:
- MCP server configuration with mcptools package
- Claude Desktop and Claude Code configuration (independent MCP clients)
- Hugging Face MCP server setup and troubleshooting
- Environment variable setup (.Renviron, .Rprofile)
- Path management between WSL and Windows
- Best practices for development workflow

### [General Development Setup](guides/general-development-setup.md)
Essential setup for development across multiple environments:
- WSL2 configuration and optimization
- Shell environment (bash/zsh) setup
- Git configuration and SSH keys
- Essential development tools (tmux, fzf, etc.)
- Directory structure organization
- Language-specific setups (Node.js, Python, R)

### [R Package Development Best Practices](guides/r-package-development-best-practices.md)
Comprehensive guide for developing high-quality R packages:
- Package structure and organization
- Documentation standards (roxygen2, vignettes)
- Testing strategies with testthat
- CRAN submission workflow
- CI/CD setup with GitHub Actions
- Common patterns and troubleshooting

### [pkgdown GitHub Pages Deployment](guides/pkgdown-github-pages-deployment.md)
Complete guide for deploying R package documentation to GitHub Pages:
- Branch-based vs GitHub Actions deployment methods
- Critical _pkgdown.yml configuration (development mode pitfall)
- Step-by-step deployment workflows
- Troubleshooting 404 errors and deployment issues
- Migration between deployment methods
- Best practices for reliable documentation hosting

### [renv Setup Troubleshooting](guides/renv-setup-troubleshooting.md)
Troubleshooting guide for R package dependency management:
- Common renv initialization and restore issues
- Platform-specific dependency resolution problems
- Integration with development workflows
- Best practices for reproducible environments

### [Quick Reference](guides/quick-reference.md)
Essential commands and shortcuts for daily development:
- WSL-Windows path conversions
- R package development commands
- Git operations
- Shell commands and file operations
- System monitoring and troubleshooting
- Keyboard shortcuts for various tools

## Skills Library

The **[Skills Library](skills/)** provides 77 task-level skills following the [Agent Skills open standard](https://agentskills.io). These are structured procedures that agentic systems (Claude Code, Codex, Cursor, Gemini CLI) can consume to execute specific tasks.

| Domain | Skills | Description |
|--------|--------|-------------|
| [R Packages](skills/r-packages/) | 10 | Full lifecycle: create, test, document, submit to CRAN |
| [Compliance](skills/compliance/) | 17 | GxP validation, CSV, audits, change control, data integrity, SOPs, training, inspections |
| [Git](skills/git/) | 6 | Version control, branching, PRs, releases |
| [Project Management](skills/project-management/) | 6 | Charters, WBS, sprints, backlogs, status reports, retrospectives |
| [General](skills/general/) | 5 | WSL setup, CLAUDE.md, security audits, skill creation & evolution |
| [Review](skills/review/) | 5 | Research, data analysis, architecture, web design, UX/UI review |
| [Containerization](skills/containerization/) | 4 | Dockerfiles, Compose, MCP server containers |
| [Reporting](skills/reporting/) | 4 | Quarto, APA formatting, statistical tables |
| [MCP Integration](skills/mcp-integration/) | 3 | Server setup, custom servers, troubleshooting |
| [Web Development](skills/web-dev/) | 3 | Next.js, Tailwind, Vercel deployment |
| [Bushcraft](skills/bushcraft/) | 3 | Fire-making, water purification, plant foraging |
| [Esoteric](skills/esoteric/) | 3 | Meditation, healing, remote viewing |
| [Defensive](skills/defensive/) | 3 | Tai chi, aikido, situational awareness |
| [Design](skills/design/) | 3 | Ornamental patterns: monochrome, polychromatic, modern styles |
| [Data Serialization](skills/data-serialization/) | 2 | Data formats, schemas, and evolution strategies |

See [skills/README.md](skills/README.md) for consumption instructions across different AI coding tools.

## Agents Library

The **[Agents Library](agents/)** provides 16 specialized agent definitions for Claude Code. Agents define *who* handles a task (persona, tools, domain expertise), complementing skills which define *how* (procedure, validation).

| Agent | Priority | Description |
|-------|----------|-------------|
| [r-developer](agents/r-developer.md) | high | R package development, data analysis, statistical computing |
| [code-reviewer](agents/code-reviewer.md) | high | Code quality, security review, best practices enforcement |
| [security-analyst](agents/security-analyst.md) | critical | Security auditing, vulnerability assessment, defensive security |
| [web-developer](agents/web-developer.md) | normal | Full-stack Next.js, TypeScript, Tailwind CSS, Vercel deployment |
| [gxp-validator](agents/gxp-validator.md) | high | CSV and compliance lifecycle: architecture, validation, change control, data integrity |
| [auditor](agents/auditor.md) | high | GxP audit, CAPA investigation, inspection readiness, vendor qualification |
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

See [agents/README.md](agents/README.md) for usage instructions, the creation template, and best practices.

## Getting Started

1. **New to this setup?** Start with [General Development Setup](guides/general-development-setup.md)
2. **Working with R + Claude?** Follow [WSL-RStudio-Claude Code Integration](guides/wsl-rstudio-claude-integration.md) (covers Claude Desktop and MCP troubleshooting)
3. **Building R packages?** Use [R Package Development Best Practices](guides/r-package-development-best-practices.md)
4. **Deploying package docs?** See [pkgdown GitHub Pages Deployment](guides/pkgdown-github-pages-deployment.md)
5. **Need quick commands?** Keep [Quick Reference](guides/quick-reference.md) handy

## Key Principles

These guides follow several key principles:

- **Reproducibility**: Instructions that work consistently across different setups
- **Best Practices**: Based on successful real-world projects
- **Future-Proof**: Designed to work with upcoming projects
- **WSL-Centric**: Optimized for WSL-Windows hybrid development
- **Tool Integration**: Seamless workflow between different development tools

## Contributing

Contributions are welcome! If you have improvements or additional tips:

1. Fork the repository and create a feature branch
2. Update the relevant guides with your discoveries
3. Test your instructions on a fresh environment
4. Submit a pull request with clear descriptions of changes
5. Share solutions to common problems you've encountered

Please maintain the existing structure and style when contributing.

## Directory Structure

```
development-guides/
├── README.md                              # This file
├── CLAUDE.md                              # AI assistant instructions
├── guides/                                # Human-readable reference guides (6)
│   ├── wsl-rstudio-claude-integration.md  # Claude Code + R + MCP setup
│   ├── general-development-setup.md       # Basic development environment
│   ├── r-package-development-best-practices.md # R package development
│   ├── pkgdown-github-pages-deployment.md # Documentation site deployment
│   ├── renv-setup-troubleshooting.md      # R dependency management
│   └── quick-reference.md                 # Command cheat sheet
├── agents/                                # Agent definitions for Claude Code (16 agents)
│   ├── README.md                          # Agent index and usage guide
│   ├── _registry.yml                      # Machine-readable agent registry
│   ├── _template.md                       # Agent creation template
│   ├── best-practices.md                  # Agent development guide
│   ├── configuration-schema.md            # YAML frontmatter schema docs
│   └── *.md                               # 16 agent persona files
└── skills/                                # Agentic skills library (77 skills, 15 domains)
    ├── README.md                          # Skills index and usage guide
    ├── _registry.yml                      # Machine-readable skill registry
    ├── r-packages/                        # 10 R package lifecycle skills
    ├── compliance/                        # 17 GxP/regulatory/compliance lifecycle skills
    ├── git/                               # 6 version control & GitHub skills
    ├── general/                           # 5 cross-cutting skills
    ├── review/                            # 5 senior-level review skills
    ├── containerization/                  # 4 Docker/container skills
    ├── reporting/                         # 4 Quarto/reporting skills
    ├── mcp-integration/                   # 3 MCP server skills
    ├── web-dev/                           # 3 web development skills
    ├── bushcraft/                         # 3 wilderness survival skills
    ├── esoteric/                          # 3 esoteric practice skills
    ├── defensive/                         # 3 martial arts & awareness skills
    ├── design/                            # 3 ornamental design skills
    ├── data-serialization/                # 2 data format & schema skills
    └── project-management/                # 6 agile & classic PM skills
```

## Proven Approaches

These guides are based on successful implementations including:

- **R package development**: Complete WSL-RStudio integration workflows
- **AI-assisted development**: Using Claude Code for enhanced productivity
- **Multi-platform testing**: CRAN submission and CI/CD workflows
- **Reproducible environments**: Clean, documented development setups
- **Cross-platform compatibility**: Seamless Windows-WSL workflows

## Future Enhancements

Consider adding:
- Python package development guide and skills
- Database integration guide
- Additional skills for Rust, data science, and CI/CD workflows

## License

These guides are provided under the MIT License. Feel free to use, modify, and distribute them as needed.

## Feedback and Support

If you encounter issues or have suggestions:

1. Check the troubleshooting sections in relevant guides
2. Search existing issues on the repository
3. Create a new issue with detailed information about your environment
4. Consider contributing a solution if you find one

---

*These guides are living documents. They evolve based on community feedback and new discoveries.*
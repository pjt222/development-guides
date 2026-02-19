# Development Guides

An agentic development platform providing structured skills, specialized agents, predefined teams, and reference guides for AI-assisted software engineering. Built on the [Agent Skills open standard](https://agentskills.io).

## At a Glance

<!-- AUTO:START:stats -->
- **267 skills** across 48 domains — structured, executable procedures
- **53 agents** — specialized Claude Code personas covering development, review, compliance, and more
- **8 teams** — predefined multi-agent compositions for complex workflows
- **6 guides** — human-readable reference documentation
- **Interactive visualization** — force-graph explorer with 267 R-generated skill icons and 9 color themes
<!-- AUTO:END:stats -->

## Four Pillars

| Pillar | Location | Purpose |
|--------|----------|---------|
| **[Skills](skills/)** | `skills/<domain>/<skill>/` | Executable procedures (*how*) |
| **[Agents](agents/)** | `agents/<name>.md` | Specialized personas (*who*) |
| **[Teams](teams/)** | `teams/<name>.md` | Multi-agent compositions (*who works together*) |
| **[Guides](guides/)** | `guides/*.md` | Human-readable reference docs |

Skills define procedures with validation and recovery. Agents define personas with tools and expertise. Teams compose agents for complex workflows. Guides provide the background knowledge all draw from.

## Quick Start

1. **Browse skills** — [Skills Library](skills/) with full domain table and consumption guide
2. **Browse agents** — [Agents Library](agents/) with usage instructions and creation template
3. **Browse teams** — [Teams Library](teams/) with coordination patterns and configuration
4. **Explore visually** — `cd viz && npx vite` then open `http://localhost:5173`
5. **Use with Claude Code** — symlink skills into `.claude/skills/` for slash-command discovery

```bash
# Example: make a skill available as /submit-to-cran
ln -s ../../skills/r-packages/submit-to-cran .claude/skills/submit-to-cran
```

## Interactive Visualization

The `viz/` directory contains a force-graph explorer with 2D, 3D (WebGL), and hive plot views — R-generated neon glyph icons, 9 color themes, domain/agent/team filtering, and click-to-inspect panels. See [viz/README.md](viz/README.md) for build and run instructions.

## Guides

- **[WSL-RStudio-Claude Code Integration](guides/wsl-rstudio-claude-integration.md)** — Claude Code + R + MCP server setup
- **[General Development Setup](guides/general-development-setup.md)** — WSL2, shell, Git, language-specific setups
- **[R Package Development Best Practices](guides/r-package-development-best-practices.md)** — Structure, testing, CRAN submission, CI/CD
- **[pkgdown GitHub Pages Deployment](guides/pkgdown-github-pages-deployment.md)** — Deployment and `_pkgdown.yml` configuration
- **[renv Setup Troubleshooting](guides/renv-setup-troubleshooting.md)** — Common renv initialization and restore issues
- **[Quick Reference](guides/quick-reference.md)** — Path conversions, commands, keyboard shortcuts

## Contributing

Contributions welcome! Each content type has its own guide:

- **Skills** — [skills/README.md](skills/README.md) for format and consumption
- **Agents** — [agents/README.md](agents/README.md) for template and best practices
- **Teams** — [teams/README.md](teams/README.md) for coordination patterns
- **Guides** — Follow existing structure and GitHub-flavored markdown

Update the relevant `_registry.yml` when adding content, then run `npm run update-readmes`.

## License

MIT License. See [LICENSE](LICENSE) for details.

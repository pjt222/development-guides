# Development Guides

An agentic development platform providing structured skills, specialized agents, predefined teams, and reference guides for AI-assisted software engineering. Built on the [Agent Skills open standard](https://agentskills.io).

## At a Glance

<!-- AUTO:START:stats -->
- **267 skills** across 48 domains — structured, executable procedures
- **53 agents** — specialized Claude Code personas covering development, review, compliance, and more
- **8 teams** — predefined multi-agent compositions for complex workflows
- **11 guides** — human-readable workflow, infrastructure, and reference documentation
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

<!-- AUTO:START:guides -->
- **[Understanding the System](guides/understanding-the-system.md)** — Entry point: what skills, agents, and teams are, how they compose, and how to invoke them
- **[Creating Skills](guides/creating-skills.md)** — Authoring, evolving, and reviewing skills following the agentskills.io standard
- **[Creating Agents and Teams](guides/creating-agents-and-teams.md)** — Designing agent personas, composing teams, and choosing coordination patterns
- **[Running a Code Review](guides/running-a-code-review.md)** — Multi-agent code review using review teams for R packages and web projects
- **[Managing a Scrum Sprint](guides/managing-a-scrum-sprint.md)** — Running Scrum sprints with the scrum-team: planning, dailies, review, and retro
- **[Visualizing Workflows with putior](guides/visualizing-workflows-with-putior.md)** — End-to-end putior workflow visualization from annotation to themed Mermaid diagrams
- **[Running AI Self-Care](guides/running-ai-self-care.md)** — AI meta-cognitive wellness sessions with the self-care team
- **[Setting Up Your Environment](guides/setting-up-your-environment.md)** — WSL2 setup, shell config, MCP server integration, and Claude Code configuration
- **[R Package Development](guides/r-package-development.md)** — Package structure, testing, CRAN submission, pkgdown deployment, and renv management
- **[Quick Reference](guides/quick-reference.md)** — Command cheat sheet for agents, skills, teams, Git, R, and shell operations
- **[Epigenetics-Inspired Activation Control](guides/epigenetics-activation-control.md)** — Runtime activation profiles controlling which agents, skills, and teams are expressed
<!-- AUTO:END:guides -->

## Contributing

Contributions welcome! Each content type has its own guide:

- **Skills** — [skills/README.md](skills/README.md) for format and consumption
- **Agents** — [agents/README.md](agents/README.md) for template and best practices
- **Teams** — [teams/README.md](teams/README.md) for coordination patterns
- **Guides** — Follow existing structure and GitHub-flavored markdown

Update the relevant `_registry.yml` when adding content, then run `npm run update-readmes`.

## License

MIT License. See [LICENSE](LICENSE) for details.

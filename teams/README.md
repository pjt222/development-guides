# Teams

Predefined multi-agent team compositions for coordinated workflows in [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

## Overview

<!-- AUTO:START:teams-intro -->
A collection of 1 predefined multi-agent team compositions for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Each team defines a coordinated group of agents with assigned roles, a lead, and a defined coordination pattern for complex workflows.
<!-- AUTO:END:teams-intro -->

Teams complement agents and skills:
- **Skills** define *how* (procedure, validation, recovery)
- **Agents** define *who* (persona, tools, domain expertise)
- **Teams** define *who works together* (composition, roles, coordination)

## Available Teams

<!-- AUTO:START:teams-table -->
| Team | Lead | Members | Coordination | Description |
|------|------|---------|--------------|-------------|
| [r-package-review](r-package-review.md) | r-developer | 4 | hub-and-spoke | Multi-agent team for comprehensive R package quality review |
<!-- AUTO:END:teams-table -->

## Creating a New Team

1. Copy `_template.md` to `<team-name>.md`
2. Fill in YAML frontmatter: `name`, `description`, `lead`, `members[]`, `coordination`
3. Write Purpose, Team Composition, Coordination Pattern, Task Decomposition, and Configuration sections
4. Include a `<!-- CONFIG:START -->` / `<!-- CONFIG:END -->` block with machine-readable YAML
5. Add the entry to `_registry.yml`
6. Run `npm run update-readmes` from the project root

## Coordination Patterns

| Pattern | Description | Best For |
|---------|-------------|----------|
| **Hub-and-spoke** | Lead distributes tasks and collects results | Review teams, audit teams |
| **Sequential** | Each member processes in order | Pipeline workflows |
| **Parallel** | Members work independently, lead merges | Independent subtasks |
| **Consensus** | Members deliberate and reach agreement | Decision-making teams |

## Machine-Readable Configuration

Each team definition includes an embedded configuration block between `<!-- CONFIG:START -->` and `<!-- CONFIG:END -->` markers. Tooling can extract this YAML to auto-create teams via Claude Code's TeamCreate/SendMessage infrastructure.

## Registry

The `_registry.yml` file provides programmatic discovery of all teams:

```python
import yaml
with open("teams/_registry.yml") as f:
    registry = yaml.safe_load(f)
    for team in registry["teams"]:
        print(f"{team['id']}: {team['lead']} + {len(team['members'])} members")
```

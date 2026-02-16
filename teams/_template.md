---
name: your-team-name
description: Brief description of what this team accomplishes (1-2 sentences)
lead: agent-name
version: "1.0.0"
author: Your Name
created: 2026-01-01
updated: 2026-01-01
tags: [development, general]
coordination: hub-and-spoke
members:
  - id: agent-name
    role: Lead
    responsibilities: Distributes tasks, synthesizes results, makes final decisions
  - id: another-agent
    role: Reviewer
    responsibilities: Reviews output from their domain expertise
---

# Your Team Name

A comprehensive description of what this team accomplishes and when to use it.

## Purpose

Explain the specific workflow or problem this team addresses that benefits from multiple agents working together.

## Team Composition

| Member | Agent | Role | Responsibilities |
|--------|-------|------|------------------|
| Lead | `agent-name` | Lead | Distributes tasks, synthesizes results |
| Reviewer | `another-agent` | Domain Expert | Reviews from their specialty |

## Coordination Pattern

Describe how the team members interact. Common patterns:

- **Hub-and-spoke**: Lead distributes tasks and collects results
- **Sequential**: Each member processes in order, passing to the next
- **Parallel**: Members work independently, lead merges results
- **Consensus**: Members deliberate and reach agreement

```
Lead (agent-name)
  ├── assigns → Member A
  ├── assigns → Member B
  └── synthesizes results
```

## Task Decomposition

Describe how a typical workflow is broken into tasks for each member.

1. **Lead** creates the task list and distributes work
2. **Member A** performs their specialty review/task
3. **Member B** performs their specialty review/task
4. **Lead** collects results and produces final output

## Configuration

Machine-readable configuration block for tooling that auto-creates teams.

<!-- CONFIG:START -->
```yaml
team:
  name: your-team-name
  lead: agent-name
  coordination: hub-and-spoke
  members:
    - agent: agent-name
      role: Lead
    - agent: another-agent
      role: Reviewer
  tasks:
    - name: example-task
      assignee: another-agent
      description: What this task involves
```
<!-- CONFIG:END -->

## Usage Scenarios

### Scenario 1: Primary Use Case
Brief description of the main scenario where this team excels.

```
Example command or interaction pattern
```

### Scenario 2: Alternative Use Case
Description of another common use case.

## Limitations

- Known limitation 1
- Known limitation 2
- Situations where a single agent might be more appropriate

## See Also

- Related agents that participate in this team
- Related teams for similar workflows
- Relevant documentation links

---

**Author**: Your Name
**Version**: 1.0.0
**Last Updated**: 2026-01-01

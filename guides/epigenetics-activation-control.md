---
title: "Epigenetics-Inspired Activation Control"
description: "Runtime activation profiles controlling which agents, skills, and teams are expressed"
category: design
agents: []
teams: []
skills: []
---

# Epigenetics-Inspired Activation Control

A runtime activation profile system that controls which agents, skills, and teams are "expressed" (available) in a given context, without modifying their definition files.

## Table of Contents
1. [Summary](#summary)
2. [Motivation](#motivation)
3. [Biological Metaphor](#biological-metaphor)
4. [Schema Specification](#schema-specification)
5. [Inheritance and Merge Rules](#inheritance-and-merge-rules)
6. [Default Activation Behavior](#default-activation-behavior)
7. [Discovery Integration](#discovery-integration)
8. [Example Profiles](#example-profiles)
9. [Performance Considerations](#performance-considerations)
10. [Implementation Plan](#implementation-plan)
11. [Future Extensions](#future-extensions)

## Summary

The activation control system introduces a declarative YAML configuration layer (`activation.yml`) that filters which agents, skills, and teams are available at runtime without altering the underlying registry files or definition documents. Like biological epigenetics, where chemical marks on DNA control which genes are expressed in a given cell type without changing the DNA sequence itself, activation profiles control which components are "expressed" in a given project context without changing the component definitions. Profiles cascade from global to project to team to session, with well-defined merge semantics and conflict resolution rules.

## Motivation

The development-guides repository currently contains 52 agents, 262 skills across 47 domains, and 8 teams. This breadth is a strength for a general-purpose library, but in any specific project context, most of these components are irrelevant noise:

- An R package developer has no use for the survivalist, shapeshifter, or tcg-specialist agents.
- A GxP compliance project does not need bushcraft, alchemy, or swarm skills.
- A full-stack web project has no need for the ai-self-care team or jigsawr-developer agent.

Today, the only option is "everything active, all the time." This creates several problems:

1. **Selection ambiguity**: When Claude Code must choose an agent, a pool of 52 candidates produces worse matches than a curated pool of 5-10 relevant agents.
2. **Cognitive overhead**: Users and AI alike must mentally filter irrelevant options during tool discovery and skill invocation.
3. **Priority dilution**: Agent priority fields (`high`, `normal`, `critical`) lose meaning when too many agents share the same priority level.
4. **No project customization**: There is no way to say "for this project, only these agents matter" without forking the entire registry.

The activation control system solves these problems by adding a thin filtering layer that sits between the registries and the runtime. Component definitions remain unchanged, centrally maintained, and version-controlled. Only the filter is project-specific.

## Biological Metaphor

The design borrows its conceptual model from epigenetics, the study of how gene expression is regulated without altering the underlying DNA sequence. The mapping is intentionally precise:

| Biology | System Concept | Details |
|---|---|---|
| Genome | Full registry set | All agents, skills, and teams defined in `_registry.yml` files |
| Gene | Individual component | A single agent, skill, or team definition file |
| Epigenetic mark | Activation rule | An `include`, `exclude`, or `amplify` directive in `activation.yml` |
| Tissue type | Project context | The combination of project path, environment, and user role |
| Gene expression | Runtime availability | Whether a component appears in Claude Code's active set |
| DNA methylation (silencing) | `exclude` rule | Suppresses a normally-active component without deleting it |
| Histone acetylation (activating) | `include` rule | Explicitly activates a component, even if the mode would otherwise exclude it |
| Enhancer element | `amplify` rule | Boosts a component's selection priority without changing its definition |
| Genomic imprinting | Default activation state | The inherited baseline from parent context (global defaults) |
| Chromatin remodeling | Mode switch | Changing between `allowlist` and `blocklist` restructures the entire activation landscape |
| Cell differentiation | Profile specialization | A project profile specializes the general library for a specific purpose |

The metaphor's value is not decorative. It provides a mental model for reasoning about the system:

- **Reversibility**: Epigenetic marks are reversible; activation rules can be added and removed without touching definitions.
- **Context-specificity**: The same genome produces liver cells and neurons; the same registry produces R-development and compliance contexts.
- **Inheritance**: Daughter cells inherit epigenetic state from parent cells; project profiles inherit from global profiles.
- **Independence**: Epigenetic marks do not alter the DNA sequence; activation rules do not alter definition files.

## Schema Specification

### 4.1 File Location and Discovery

Activation profiles are discovered in a fixed sequence. Each level can override the previous.

| Level | Location | Scope |
|---|---|---|
| Global | `~/.claude/activation.yml` | All projects for this user |
| Project | `.claude/activation.yml` (project root) | Single project |
| Team | Embedded in team definition or `teams/<name>/activation.yml` | Active team context |
| Session | Runtime override (CLI flag or environment variable) | Current session only |

**Discovery order**: Global -> Project -> Team -> Session. Each level is optional. If no `activation.yml` exists at any level, all components are active (backward compatible).

**File detection**: The resolver checks for file existence at each level. Missing files are treated as empty profiles (no rules). Malformed YAML produces a warning and is skipped, not a hard error.

### 4.2 Full Schema

```yaml
# .claude/activation.yml
# Activation profile controlling which agents, skills, and teams
# are expressed in this context.

version: "1.0"

# --- Context matching (optional) ---
# When present, this profile only applies if the context matches.
# When absent, the profile applies unconditionally.
context:
  projects:
    - path: "/mnt/d/dev/p/my-r-package"       # Exact path match
    - pattern: "*/r-packages/*"                 # Glob pattern match
  env:                                          # Environment variable conditions
    NODE_ENV: "production"
    CI: "true"
  tags:                                         # Match project tags (future)
    - r-package
    - cran-submission

# --- Agent activation rules ---
agents:
  mode: "blocklist"           # "blocklist" (default) or "allowlist"
  include:                    # Agents to activate
    - r-developer
    - code-reviewer
    - security-analyst
  exclude:                    # Agents to suppress
    - mystic
    - survivalist
    - shaman
    - shapeshifter
  amplify:                    # Agents to boost in selection priority
    - r-developer

# --- Skill activation rules ---
skills:
  mode: "blocklist"           # "blocklist" (default) or "allowlist"
  include:
    domains:                  # Activate entire domains
      - r-packages
      - git
      - review
    skills:                   # Activate individual skills by ID
      - meditate
      - heal
  exclude:
    domains:                  # Suppress entire domains
      - esoteric
      - bushcraft
      - morphic
      - swarm
    skills:                   # Suppress individual skills by ID
      - make-fire
      - purify-water
      - forage-plants

# --- Team activation rules ---
teams:
  mode: "blocklist"           # "blocklist" (default) or "allowlist"
  include:
    - r-package-review
  exclude:
    - ai-self-care
    - opaque-team

# --- Default skills override ---
default_skills:
  inherit: true               # Inherit from registry default_skills
  additional:                 # Add to the default set
    - commit-changes
    - manage-git-branches
  suppress:                   # Remove from the default set
    - heal                    # e.g., suppress heal in production contexts
```

### 4.3 Field Semantics

#### `version` (required)
Schema version string. Currently `"1.0"`. Parsers must reject files with unrecognized major versions and warn on unrecognized minor versions.

#### `context` (optional)
Conditions under which this profile applies. If omitted, the profile applies unconditionally. If present, **all** specified conditions must match (AND logic). Individual list items within a condition use OR logic (e.g., multiple `projects` entries: match if any path matches).

- `context.projects[].path`: Exact match against the resolved project root path.
- `context.projects[].pattern`: Glob pattern matched against the project root path. Uses standard glob syntax (`*`, `**`, `?`).
- `context.env`: Key-value pairs. Each key is an environment variable name. The profile applies only if every listed variable has the specified value.
- `context.tags`: Reserved for future use. List of string tags matched against project metadata.

#### `agents` (optional)
Controls agent availability.

- `agents.mode`: Either `"blocklist"` (default) or `"allowlist"`.
  - **blocklist**: All agents are active by default. Use `exclude` to suppress specific agents.
  - **allowlist**: No agents are active by default. Use `include` to activate specific agents.
- `agents.include`: List of agent IDs to activate. In blocklist mode, this is a no-op unless overriding a higher-level exclusion. In allowlist mode, this is the set of active agents.
- `agents.exclude`: List of agent IDs to suppress. In blocklist mode, these agents are deactivated. In allowlist mode, this is a no-op (already inactive).
- `agents.amplify`: List of agent IDs that receive a priority boost during agent selection. An amplified agent with `priority: normal` is treated as `priority: high`. An amplified agent with `priority: high` is treated as `priority: critical`. An agent already at `priority: critical` is unchanged.

**Edge case**: If an agent appears in both `include` and `exclude` at the same level, `include` wins (explicit activation overrides explicit suppression).

#### `skills` (optional)
Controls skill availability. Supports both domain-level and individual skill-level rules.

- `skills.mode`: Either `"blocklist"` (default) or `"allowlist"`.
- `skills.include.domains`: List of domain IDs. All skills in listed domains are activated.
- `skills.include.skills`: List of individual skill IDs. These skills are activated regardless of domain rules.
- `skills.exclude.domains`: List of domain IDs. All skills in listed domains are suppressed.
- `skills.exclude.skills`: List of individual skill IDs. These skills are suppressed regardless of domain rules.

**Precedence within skills**: Individual skill rules override domain rules. If domain `esoteric` is excluded but skill `meditate` is individually included, `meditate` is active. This mirrors epigenetic enhancers overriding regional silencing.

#### `teams` (optional)
Controls team availability. Identical semantics to `agents` but without `amplify` (teams are selected explicitly, not by priority matching).

- `teams.mode`: Either `"blocklist"` (default) or `"allowlist"`.
- `teams.include`: List of team IDs to activate.
- `teams.exclude`: List of team IDs to suppress.

#### `default_skills` (optional)
Controls the set of skills automatically inherited by all agents (currently `meditate` and `heal` as defined in `agents/_registry.yml`).

- `default_skills.inherit`: Boolean. When `true` (default), the agent inherits `default_skills` from the registry. When `false`, no default skills are inherited.
- `default_skills.additional`: List of skill IDs to add to every agent's default skill set.
- `default_skills.suppress`: List of skill IDs to remove from the default set. Only affects skills that would otherwise be inherited.

**Interaction with skill rules**: If a default skill is suppressed via `default_skills.suppress`, it is removed from agents' implicit skill sets but remains available as a standalone skill (unless also excluded via `skills.exclude`). These are independent mechanisms.

## Inheritance and Merge Rules

### 5.1 Cascade Order

```
Global (~/.claude/activation.yml)
  |
  v  merge
Project (.claude/activation.yml)
  |
  v  merge
Team (team-specific activation)
  |
  v  merge
Session (CLI override)
  |
  v
Resolved activation state
```

Each level is optional. The resolved state starts empty and accumulates rules level by level.

### 5.2 Merge Semantics by Mode

#### Blocklist mode (default)

In blocklist mode, the starting state is "everything active." Each level can only narrow the active set.

| Operation | Merge behavior |
|---|---|
| `exclude` | Union across levels. If global excludes `[A, B]` and project excludes `[C]`, result is `[A, B, C]` excluded. |
| `include` | Override. A project-level `include` for an item excluded at the global level **re-activates** that item. This is the "enhancer" mechanism. |
| `amplify` | Union across levels. Amplifications are additive. |
| `mode` switch | A project can switch from blocklist to allowlist. When this happens, the project's rules replace (not merge with) the global rules for that component type. |

#### Allowlist mode

In allowlist mode, the starting state is "nothing active." Each level can only expand the active set.

| Operation | Merge behavior |
|---|---|
| `include` | Union across levels. If global includes `[A, B]` and project includes `[C]`, result is `[A, B, C]` included. |
| `exclude` | Override. A project-level `exclude` for an item included at the global level **deactivates** that item. |
| `amplify` | Union across levels. |
| `mode` switch | If global is allowlist and project switches to blocklist, the project's rules replace the global rules for that component type. |

### 5.3 Conflict Resolution

1. **Same level, same item in include and exclude**: `include` wins. Rationale: explicit activation is an intentional decision that should override blanket exclusion.
2. **Different levels, same item**: More specific level wins. Project overrides global. Team overrides project. Session overrides team.
3. **Domain vs. individual skill**: Individual skill rules override domain rules at the same level.
4. **Mode mismatch across levels**: When a child level specifies a different `mode` than the parent, the child's rules **replace** (not merge with) the parent's rules for that component type. This is a complete mode switch, equivalent to chromatin remodeling.

### 5.4 Merge Algorithm (Pseudocode)

```
function resolve_activation(levels: [global, project, team, session]):
    state = {agents: ALL, skills: ALL, teams: ALL}  # start with everything

    for level in levels:
        if level is empty: continue

        for component_type in [agents, skills, teams]:
            rules = level[component_type]
            if rules is empty: continue

            if rules.mode != previous_mode[component_type]:
                # Mode switch: reset and apply fresh
                if rules.mode == "allowlist":
                    state[component_type] = NONE
                else:
                    state[component_type] = ALL
                previous_mode[component_type] = rules.mode

            # Apply exclusions
            state[component_type] -= rules.exclude

            # Apply inclusions (override exclusions from higher levels)
            state[component_type] += rules.include

            # Apply amplifications
            amplified[component_type] += rules.amplify

    return state, amplified
```

## Default Activation Behavior

### No activation.yml present

When no `activation.yml` exists at any level, the system behaves exactly as it does today:

- All 52 agents are available for selection.
- All 262 skills across 47 domains are invocable.
- All 8 teams can be spawned.
- Default skills (`meditate`, `heal`) are inherited by all agents.

This ensures full backward compatibility. Existing projects require zero changes.

### Activation.yml present with minimal content

```yaml
version: "1.0"
```

A file with only a version field and no rules is valid. It has no effect (equivalent to no file). This allows users to create the file as a placeholder before adding rules.

### Mode defaults

- If `mode` is omitted for any component type, it defaults to `"blocklist"`.
- If only `exclude` is specified (no `include`), the behavior is pure suppression.
- If only `amplify` is specified (no `include` or `exclude`), no filtering occurs but priority boosting is applied.

### Amplification semantics

Amplification adjusts the effective priority of an agent during selection without modifying the agent's definition file:

| Original priority | After amplify | Effect |
|---|---|---|
| `normal` | `high` | Selected over other `normal` agents |
| `high` | `critical` | Selected over other `high` agents |
| `critical` | `critical` | No change (ceiling) |

Amplification is a soft signal, not a hard requirement. It influences selection heuristics but does not guarantee selection. The resolver may still choose a non-amplified agent if it is a better match for the task.

## Discovery Integration

### 7.1 Interaction with `.claude/agents/` Symlink Discovery

Claude Code discovers agents via the `.claude/agents/` directory (symlinked to `agents/` in this project). The activation system operates **after** discovery:

```
Discovery phase:
  .claude/agents/*.md  -->  Set of all discovered agents

Activation phase:
  Discovered agents  +  activation.yml  -->  Set of active agents
```

The activation system does not interfere with file-system discovery. All agents are discovered as usual; the activation filter then removes suppressed agents from the active set.

### 7.2 Interaction with `_registry.yml` Files

Registry files remain the source of truth for what exists. Activation profiles are the source of truth for what is available. The resolver reads both:

1. Parse `skills/_registry.yml` to get the full skill catalog.
2. Parse `agents/_registry.yml` to get the full agent catalog.
3. Parse `teams/_registry.yml` to get the full team catalog.
4. Resolve the activation profile cascade (global -> project -> team -> session).
5. Apply activation rules to filter the catalogs.
6. Return the filtered catalogs as the active set.

Registry files are never modified by the activation system.

### 7.3 Interaction with `default_skills` in Agent Registry

The `default_skills` field in `agents/_registry.yml` defines skills inherited by all agents. The activation system adds a `default_skills` override section:

```
Registry default_skills: [meditate, heal]
  |
  v  apply activation.yml default_skills
Override: inherit=true, suppress=[heal], additional=[commit-changes]
  |
  v
Effective default_skills: [meditate, commit-changes]
```

The override is applied before agents receive their default skills. An agent's explicitly listed skills (in its frontmatter `skills:` field) are not affected by `default_skills` overrides.

### 7.4 Interaction with Agent Selection Logic

Claude Code's agent selection logic considers task requirements and agent capabilities to choose the best agent. The activation system modifies this process:

1. **Pre-filter**: Remove all agents not in the active set.
2. **Priority adjustment**: Apply `amplify` boosts to remaining agents.
3. **Selection**: Run the existing selection algorithm on the filtered, priority-adjusted set.

This means an excluded agent is never considered, even if it would be the best match. Users who find themselves frequently needing to override exclusions should adjust their activation profile.

## Example Profiles

### Example 1: R Package Development

For a project developing an R package for CRAN submission. Keeps R-focused agents and suppresses everything unrelated.

```yaml
# .claude/activation.yml
version: "1.0"

agents:
  exclude:
    - mystic
    - survivalist
    - shaman
    - alchemist
    - shapeshifter
    - swarm-strategist
    - martial-artist
    - designer
    - tcg-specialist
    - gardener
    - dog-trainer
    - mycologist
    - prospector
    - librarian
    - tour-planner
    - hiking-guide
    - relocation-expert
    - blender-artist
    - fabricator
    - geometrist
    - markovian
    - theoretical-researcher
    - diffusion-specialist
    - hildegard
    - kabalist
    - lapidary
    - number-theorist
  amplify:
    - r-developer

skills:
  exclude:
    domains:
      - esoteric
      - bushcraft
      - morphic
      - swarm
      - tcg
      - alchemy
      - gardening
      - animal-training
      - mycology
      - prospecting
      - crafting
      - travel
      - relocation
      - design
      - defensive
      - blender
      - 3d-printing
      - geometry
      - stochastic-processes
      - theoretical-science
      - diffusion
      - hildegard
      - lapidary
  include:
    skills:
      - meditate      # Keep from esoteric despite domain exclusion

teams:
  include:
    - r-package-review
  exclude:
    - ai-self-care
    - opaque-team
    - fullstack-web-dev
```

**Result**: Active agents are r-developer (amplified), code-reviewer, security-analyst, web-developer, quarto-developer, shiny-developer, gxp-validator, auditor, senior-researcher, senior-data-scientist, senior-software-developer, senior-web-designer, senior-ux-ui-specialist, project-manager, devops-engineer, mlops-engineer, putior-integrator, jigsawr-developer, janitor, polymath, ip-analyst, mcp-developer, acp-developer, skill-reviewer, version-manager. Active skill domains are r-packages, git, review, general, compliance, containerization, reporting, mcp-integration, web-dev, data-serialization, jigsawr, shiny, observability, devops, mlops, project-management, workflow-visualization, maintenance, a2a-protocol, number-theory, versioning, plus `meditate` from esoteric.

### Example 2: GxP Compliance Project

For a validated pharmaceutical computing environment. Compliance, security, and documentation agents are amplified. Exploratory and creative agents are suppressed.

```yaml
# .claude/activation.yml
version: "1.0"

agents:
  mode: "allowlist"
  include:
    - gxp-validator
    - auditor
    - security-analyst
    - senior-researcher
    - senior-software-developer
    - code-reviewer
    - r-developer
    - project-manager
  amplify:
    - gxp-validator
    - auditor

skills:
  mode: "allowlist"
  include:
    domains:
      - compliance
      - r-packages
      - review
      - git
      - general
      - reporting
      - project-management
    skills:
      - security-audit-codebase
      - serialize-data-formats
      - design-serialization-schema
      - meditate

teams:
  mode: "allowlist"
  include:
    - gxp-compliance-validation
    - r-package-review

default_skills:
  inherit: true
  additional:
    - commit-changes
    - manage-git-branches
```

**Result**: A tightly scoped environment with 8 agents, compliance-focused skill domains, and 2 approved teams. The allowlist mode ensures nothing unexpected is available in a regulated context.

### Example 3: Full-Stack Web Development

For a Next.js + Tailwind CSS project. Web-focused agents are amplified; R-specific and esoteric agents are suppressed.

```yaml
# .claude/activation.yml
version: "1.0"

agents:
  exclude:
    - r-developer
    - jigsawr-developer
    - gxp-validator
    - auditor
    - mystic
    - survivalist
    - shaman
    - alchemist
    - shapeshifter
    - gardener
    - dog-trainer
    - mycologist
    - prospector
    - tcg-specialist
    - martial-artist
    - hildegard
    - blender-artist
    - fabricator
    - tour-planner
    - hiking-guide
    - relocation-expert
    - geometrist
    - markovian
    - theoretical-researcher
    - diffusion-specialist
    - kabalist
    - lapidary
    - number-theorist
  amplify:
    - web-developer
    - senior-web-designer
    - senior-ux-ui-specialist

skills:
  exclude:
    domains:
      - r-packages
      - jigsawr
      - compliance
      - esoteric
      - bushcraft
      - morphic
      - swarm
      - tcg
      - alchemy
      - gardening
      - animal-training
      - mycology
      - prospecting
      - crafting
      - hildegard
      - blender
      - 3d-printing
      - geometry
      - stochastic-processes
      - theoretical-science
      - diffusion
      - lapidary
  include:
    skills:
      - meditate

teams:
  include:
    - fullstack-web-dev
  exclude:
    - r-package-review
    - gxp-compliance-validation
    - ai-self-care
    - opaque-team
```

### Example 4: Research and Exploration

For open-ended research projects where breadth of agents is valuable. Minimal exclusions, polymath amplified.

```yaml
# .claude/activation.yml
version: "1.0"

agents:
  amplify:
    - polymath
    - senior-researcher
    - senior-data-scientist
    - ip-analyst

skills:
  # No exclusions -- keep everything available for cross-domain synthesis
  exclude:
    domains: []

teams:
  # All teams available
  exclude: []
```

**Result**: Nearly identical to no activation.yml, but with priority boosting for research-oriented agents. The polymath can spawn any domain specialist as needed.

### Example 5: Global User Defaults

A global profile that suppresses agents the user never needs, applied to all projects.

```yaml
# ~/.claude/activation.yml
version: "1.0"

agents:
  exclude:
    - survivalist
    - mycologist
    - prospector
    - dog-trainer
    - tcg-specialist

skills:
  exclude:
    domains:
      - bushcraft
      - mycology
      - prospecting
      - animal-training
      - tcg

default_skills:
  inherit: true
```

Individual project profiles then layer on top. An R package project adds further exclusions; a research project overrides with `include` to re-activate agents the global profile excluded.

## Performance Considerations

### Activation resolution cost

The activation resolver runs once at session startup and caches the resolved state for the session's duration. The cost is:

1. **File I/O**: Read up to 4 small YAML files (global, project, team, session). These are typically under 100 lines each.
2. **YAML parsing**: Parse 4 files. Using a standard YAML parser, this completes in under 10ms.
3. **Set operations**: Apply include/exclude/amplify rules. With 52 agents and 262 skills, these are microsecond-level set operations.
4. **Total overhead**: Under 50ms at session start. No per-tool-call cost.

### Caching strategy

```
Session start
  |
  v
Parse activation files (once)
  |
  v
Resolve cascade (once)
  |
  v
Store resolved state in memory
  |
  v
All subsequent agent/skill/team lookups use cached state
```

The cache is invalidated only on session restart. Mid-session changes to `activation.yml` do not take effect until the next session. This is intentional: mid-session profile changes could produce confusing behavior where previously available agents disappear.

### Registry file size

The registry files are small YAML documents:
- `skills/_registry.yml`: ~600 lines
- `agents/_registry.yml`: ~500 lines
- `teams/_registry.yml`: ~75 lines

Parsing overhead is negligible. No optimization is needed for the current scale. If the registry grew to thousands of entries, an indexed lookup structure could replace linear scanning.

## Implementation Plan

### Files to create (user-created, not code changes)

| File | Purpose |
|---|---|
| `~/.claude/activation.yml` | Global user activation profile |
| `.claude/activation.yml` | Project-specific activation profile |

These files are created by users, not generated. Templates could be provided in the guides.

### Files to modify (code changes)

| File / Module | Change | Scope |
|---|---|---|
| Agent discovery logic | Add post-discovery filter step | Medium |
| Skill resolution logic | Add domain/skill filtering | Medium |
| Team spawning logic | Add team availability check | Small |
| Agent selection heuristic | Add amplify priority adjustment | Small |

### New module: Activation Resolver

A new module responsible for:

1. **File discovery**: Locate `activation.yml` at each cascade level.
2. **YAML parsing**: Parse and validate against the schema.
3. **Cascade merge**: Apply the merge algorithm (section 5.4).
4. **State caching**: Store resolved state for session duration.
5. **Query interface**: Expose `is_active(component_type, id) -> bool` and `effective_priority(agent_id) -> priority` functions.

### Estimated scope

| Component | Effort |
|---|---|
| Schema definition and validation | Small |
| YAML parser integration | Small |
| Cascade merge logic | Medium |
| Agent discovery integration | Medium |
| Skill resolution integration | Medium |
| Team availability integration | Small |
| Priority adjustment integration | Small |
| Template profiles and documentation | Small |

### Testing requirements

- **Unit tests**: Merge algorithm with various mode combinations, conflict resolution edge cases, individual-vs-domain skill override, amplification ceiling.
- **Integration tests**: Full cascade from global to session, agent selection with amplified priorities, skill invocation with domain exclusions.
- **Backward compatibility**: Verify no behavior change when no `activation.yml` exists.
- **Error handling**: Malformed YAML, missing version field, unknown fields (forward compatibility).

## Future Extensions

### Dynamic activation

Allow activation profiles to change mid-session in response to context switches. For example, when a polymath agent transitions from an engineering domain to a compliance domain, the active skill set could shift automatically. This requires careful cache invalidation and user notification when the active set changes.

### Activation analytics

Track which profiles are used, which agents are most frequently amplified, and which are most frequently excluded. This data could inform registry curation decisions (e.g., moving consistently-excluded agents to an "extended" tier).

### Profile templates

Provide ready-made activation profiles for common project types:

```
profiles/
  r-package.yml
  web-fullstack.yml
  gxp-compliance.yml
  research-exploration.yml
  data-science.yml
```

Users would copy a template into their project's `.claude/activation.yml` and customize as needed.

### IDE integration

A VS Code extension (or Claude Code CLI command) for editing activation profiles with:

- Autocomplete for agent, skill, and domain IDs sourced from the registries.
- Visual diff showing which components are active vs. suppressed.
- Profile switching UI for rapidly toggling between project contexts.

### Conditional activation

Extend `context` matching with richer conditions:

```yaml
context:
  git_branch: "release/*"      # Activate compliance agents on release branches
  file_exists: "DESCRIPTION"   # Auto-detect R package projects
  time_of_day: "09:00-17:00"   # Business-hours profile
```

### Profile composition

Allow profiles to reference other profiles:

```yaml
extends: "profiles/r-package.yml"
agents:
  amplify:
    - jigsawr-developer    # Project-specific addition
```

This would reduce duplication across projects that share a common base.

### Team-embedded activation

Allow team definitions to include activation rules that apply when the team is active:

```yaml
# In teams/r-package-review.md CONFIG block
activation:
  skills:
    amplify_domains: [r-packages, review, git]
    suppress_domains: [esoteric, bushcraft]
```

When the r-package-review team is spawned, its embedded activation rules would merge into the session's active profile, automatically scoping the skill set to what the team needs.

---

**Author**: Philipp Thoss
**Version**: 1.0.0
**Last Updated**: 2026-02-17
**Status**: Design Document (GitHub Issue #24)

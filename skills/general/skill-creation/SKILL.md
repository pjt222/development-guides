---
name: skill-creation
description: >
  Create a new SKILL.md file following the Agent Skills open standard
  (agentskills.io). Covers frontmatter schema, section structure,
  writing effective procedures with Expected/On failure pairs,
  validation checklists, cross-referencing, and registry integration.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: general
  complexity: intermediate
  language: multi
  tags: meta, skill, agentskills, standard, authoring
---

# Create a New Skill

Author a SKILL.md file that agentic systems can consume to execute a specific procedure.

## When to Use

- Codifying a repeatable procedure that agents should follow
- Adding a new capability to the skills library
- Converting a guide, runbook, or checklist into agent-consumable format
- Standardizing a workflow across projects or teams

## Inputs

- **Required**: Task the skill should accomplish
- **Required**: Domain classification (r-packages, containerization, reporting, compliance, mcp-integration, web-dev, git, general, bushcraft)
- **Required**: Complexity level (basic, intermediate, advanced)
- **Optional**: Source material (existing guide, runbook, or working example)
- **Optional**: Related skills to cross-reference

## Procedure

### Step 1: Create Directory

Each skill lives in its own directory:

```bash
mkdir -p skills/<domain>/<skill-name>/
```

Naming conventions:
- Use lowercase kebab-case: `submit-to-cran`, not `SubmitToCRAN`
- Start with a verb: `create-`, `setup-`, `write-`, `deploy-`, `configure-`
- Be specific: `create-r-dockerfile` not `create-dockerfile`

### Step 2: Write YAML Frontmatter

```yaml
---
name: skill-name-here
description: >
  One to three sentences. Must be clear enough for an agent to decide
  whether to activate this skill. Max 1024 characters. Start with a
  verb: "Create...", "Configure...", "Diagnose...".
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: general
  complexity: intermediate
  language: R | TypeScript | Python | Docker | Rust | multi
  tags: comma, separated, lowercase, tags
---
```

**Required fields**: `name`, `description`, `allowed-tools`

**Metadata conventions**:
- `complexity`: basic (< 5 steps, no edge cases), intermediate (5-10 steps, some judgment), advanced (10+ steps, significant domain knowledge)
- `language`: primary language; use `multi` for cross-language skills
- `tags`: 3-6 tags for discovery; include the domain name

### Step 3: Write the Title and Introduction

```markdown
# Skill Title (Imperative Verb Form)

One paragraph: what this skill accomplishes and the value it provides.
```

The title should match the `name` but in human-readable form. "Submit to CRAN" not "submit-to-cran".

### Step 4: Write "When to Use"

List 3-5 trigger conditions — concrete scenarios where an agent should activate this skill:

```markdown
## When to Use

- Starting a new R package from scratch
- Converting loose R scripts into a package
- Setting up a package skeleton for collaborative development
```

Write from the agent's perspective. These are the conditions the agent checks to decide activation.

### Step 5: Write "Inputs"

Separate required from optional. Be specific about types and defaults:

```markdown
## Inputs

- **Required**: Package name (lowercase, no special characters except `.`)
- **Required**: One-line description of the package purpose
- **Optional**: License type (default: MIT)
- **Optional**: Whether to initialize renv (default: yes)
```

### Step 6: Write "Procedure"

This is the core of the skill. Each step follows this pattern:

```markdown
### Step N: Action Title

Context sentence explaining what this step accomplishes.

\```language
concrete_code("that the agent can execute")
\```

**Expected**: What success looks like. Be specific — file created, output matches pattern, command exits 0.

**On failure**: Recovery steps. Don't just say "fix it" — provide the most common failure cause and its resolution.
```

**Writing effective steps**:
- Each step should be independently verifiable
- Include actual code, not pseudocode
- Put the most common path first, edge cases in "On failure"
- 5-10 steps is the sweet spot. Under 5 may be too vague; over 12 should be split into multiple skills.
- Reference real tools and real commands, not abstract descriptions

### Step 7: Write "Validation"

A checklist the agent runs after completing the procedure:

```markdown
## Validation

- [ ] Criterion 1 (testable, binary pass/fail)
- [ ] Criterion 2
- [ ] No errors or warnings in output
```

Each item must be objectively verifiable. "Code is clean" is bad. "`devtools::check()` returns 0 errors" is good.

### Step 8: Write "Common Pitfalls"

3-6 pitfalls with cause and avoidance:

```markdown
## Common Pitfalls

- **Pitfall name**: What goes wrong and how to avoid it. Be specific about the symptom and the fix.
```

Draw from real experience. The best pitfalls are ones that waste significant time and are non-obvious.

### Step 9: Write "Related Skills"

Cross-reference 2-5 skills that are commonly used before, after, or alongside this one:

```markdown
## Related Skills

- `prerequisite-skill` - must be done before this skill
- `follow-up-skill` - commonly done after this skill
- `alternative-skill` - alternative approach to the same goal
```

Use the skill `name` field (kebab-case), not the title.

### Step 10: Add to Registry

Edit `skills/_registry.yml` and add the new skill under the appropriate domain:

```yaml
- id: skill-name-here
  path: domain/skill-name-here/SKILL.md
  complexity: intermediate
  language: multi
  description: One-line description matching the frontmatter
```

Update the `total_skills` count at the top of the registry.

### Step 11: Create Slash Command Symlinks

Create symlinks so Claude Code discovers the skill as a `/slash-command`:

```bash
# Project-level (available in this project)
ln -s ../../skills/<domain>/<skill-name> .claude/skills/<skill-name>

# Global (available in all projects)
ln -s /mnt/d/dev/p/development-guides/skills/<domain>/<skill-name> ~/.claude/skills/<skill-name>
```

**Expected**: `ls -la .claude/skills/<skill-name>/SKILL.md` resolves to the skill file.

**On failure**: Verify the relative path is correct. From `.claude/skills/`, the path `../../skills/<domain>/<skill-name>` should reach the skill directory. Use `readlink -f` to debug symlink resolution. Claude Code expects a flat structure at `.claude/skills/<name>/SKILL.md` — domain nesting must be flattened via symlinks.

## Validation

- [ ] SKILL.md exists at `skills/<domain>/<skill-name>/SKILL.md`
- [ ] YAML frontmatter parses without errors
- [ ] `name` field matches directory name
- [ ] `description` is under 1024 characters
- [ ] All required sections present: When to Use, Inputs, Procedure, Validation, Common Pitfalls, Related Skills
- [ ] Every procedure step has concrete code and Expected/On failure pairs
- [ ] Related Skills reference valid skill names
- [ ] Skill is listed in `_registry.yml` with correct path
- [ ] `total_skills` count in registry is updated
- [ ] Symlink exists at `.claude/skills/<skill-name>` pointing to skill directory
- [ ] Global symlink exists at `~/.claude/skills/<skill-name>` (if globally available)

## Common Pitfalls

- **Vague procedures**: "Configure the system appropriately" is useless to an agent. Provide exact commands, file paths, and configuration values.
- **Missing On failure**: Every step that can fail needs recovery guidance. Agents can't improvise — they need the fallback spelled out.
- **Overly broad scope**: A skill that tries to cover "Set up entire development environment" should be 3-5 focused skills instead. One skill = one procedure.
- **Untestable validation**: "Code quality is good" can't be verified. "Linter passes with 0 warnings" can.
- **Stale cross-references**: When renaming or removing skills, grep for the old name in all Related Skills sections.
- **Description too long**: The description field is what agents read to decide activation. Keep it under 1024 characters and front-load the key information.

## Examples

A well-structured skill follows this quality checklist:
1. An agent can decide whether to use it from the description alone
2. The procedure can be followed mechanically without ambiguity
3. Every step has a verifiable outcome
4. Failure modes have concrete recovery paths
5. The skill can be composed with related skills

Size reference from this library:
- Basic skills: ~80-120 lines (e.g., `write-vignette`, `configure-git-repository`)
- Intermediate skills: ~120-180 lines (e.g., `write-testthat-tests`, `manage-renv-dependencies`)
- Advanced skills: ~180-250 lines (e.g., `submit-to-cran`, `setup-gxp-r-project`)

## Related Skills

- `write-claude-md` - CLAUDE.md can reference skills for project-specific workflows
- `configure-git-repository` - skills should be version-controlled
- `commit-changes` - commit the new skill and its symlinks
- `security-audit-codebase` - review skills for accidentally included secrets or credentials

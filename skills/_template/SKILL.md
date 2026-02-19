---
name: skill-name-here
description: >
  One to three sentences describing what this skill accomplishes.
  Must be clear enough for an agent to decide whether to activate it.
  Start with a verb: "Create...", "Configure...", "Diagnose...".
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Your Name
  version: "1.0"
  domain: general  # match the parent directory under skills/
  complexity: intermediate  # one of: basic, intermediate, advanced
  language: multi  # one of: R, TypeScript, Python, Docker, Rust, multi
  tags: tag1, tag2, tag3  # 3-6 lowercase tags for discovery; include the domain
---

# Skill Title (Imperative Verb Form)

One paragraph: what this skill accomplishes and the value it provides.

## When to Use

- Concrete scenario where an agent should activate this skill
- Another trigger condition
- A third use case

## Inputs

- **Required**: Description of required input
- **Required**: Another required input
- **Optional**: Optional input with default (default: value)

## Procedure

### Step 1: Action Title

Context sentence explaining what this step accomplishes.

```bash
# Concrete command or code the agent can execute
example_command --flag value
```

**Expected**: What success looks like. Be specific -- file created, output matches pattern, command exits 0.

**On failure**: Recovery action. What to check, what to retry, when to abort.

### Step 2: Next Action

Context for this step.

```bash
next_command
```

**Expected**: Specific success indicator.

**On failure**: Recovery action.

## Validation

- [ ] First verification check
- [ ] Second verification check
- [ ] Third verification check

## Common Pitfalls

- **Pitfall name**: Explanation and how to avoid it
- **Another pitfall**: Explanation and how to avoid it

## Examples (Optional)

Short worked examples showing the skill in action. Keep inline examples brief; move extended or multi-variant examples to `references/EXAMPLES.md`.

## Related Skills

- `related-skill-name` -- how it relates to this skill
- `another-skill` -- how it relates

<!-- Keep under 500 lines. Extract large examples to references/EXAMPLES.md if needed. -->

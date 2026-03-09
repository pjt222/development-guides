# Tests

6 test scenario(s) for validating team coordination, agent behavior, and skill execution.

## Test Scenarios

| Scenario | Level | Target | Pattern | Description |
|----------|-------|--------|---------|-------------|
| [test-opaque-team-cartographers-audit](scenarios/teams/test-opaque-team-cartographers-audit.md) | team | opaque-team | adaptive | Opaque team audits the knowledge graph integrity of the agent-almanac repository |
| [test-agentskills-alignment-format-audit](scenarios/teams/test-agentskills-alignment-format-audit.md) | team | agentskills-alignment | hub-and-spoke | Agentskills-alignment team audits 10 recent skills for format compliance via hub-and-spoke coordination |
| [test-metal-self-extraction](scenarios/skills/test-metal-self-extraction.md) | skill | metal | - | Metal skill extracts conceptual essence of the agent-almanac repository itself |
| [test-dyad-contemplative-review](scenarios/teams/test-dyad-contemplative-review.md) | team | dyad | reciprocal | Dyad team performs reciprocal review of the metal skill with alternating practitioner/witness roles |
| [test-tending-sequential-session](scenarios/teams/test-tending-sequential-session.md) | team | tending | sequential | Tending team assesses alchemy domain health through sequential handoff chain |
| [test-alchemist-chrysopoeia-optimization](scenarios/agents/test-alchemist-chrysopoeia-optimization.md) | agent | alchemist | - | Alchemist agent performs chrysopoeia value extraction on the test infrastructure |

## Running Tests

Use the `test-team-coordination` skill to execute a scenario:

```
/test-team-coordination
```

Results are stored in `tests/results/YYYY-MM-DD-<target>-NNN/RESULT.md`.

## Registry

The `_registry.yml` file catalogs all test scenarios and defines coordination pattern key behaviors used during evaluation.
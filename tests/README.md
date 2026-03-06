# Tests

1 test scenario(s) for validating team coordination, agent behavior, and skill execution.

## Test Scenarios

| Scenario | Level | Target | Pattern | Description |
|----------|-------|--------|---------|-------------|
| [test-opaque-team-cartographers-audit](scenarios/teams/test-opaque-team-cartographers-audit.md) | team | opaque-team | adaptive | Opaque team audits the knowledge graph integrity of the agent-almanac repository |

## Running Tests

Use the `test-team-coordination` skill to execute a scenario:

```
/test-team-coordination
```

Results are stored in `tests/results/YYYY-MM-DD-<target>-NNN/RESULT.md`.

## Registry

The `_registry.yml` file catalogs all test scenarios and defines coordination pattern key behaviors used during evaluation.
---
name: run-puzzle-tests
description: >
  Run the jigsawR test suite via WSL R execution. Supports full suite,
  filtered by pattern, or single file. Interprets pass/fail/skip counts
  and identifies failing tests. Never uses --vanilla flag (renv needs
  .Rprofile for activation).
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: jigsawr
  complexity: basic
  language: R
  tags: jigsawr, testing, testthat, renv, wsl
---

# Run Puzzle Tests

Run the jigsawR test suite and interpret results.

## When to Use

- After modifying any R source code in the package
- After adding a new puzzle type or feature
- Before committing changes to verify nothing is broken
- Debugging a specific test failure

## Inputs

- **Required**: Test scope (`full`, `filtered`, or `single`)
- **Optional**: Filter pattern (for filtered mode, e.g. `"snic"`, `"rectangular"`)
- **Optional**: Specific test file path (for single mode)

## Procedure

### Step 1: Choose Test Scope

| Scope | Use when | Duration |
|-------|----------|----------|
| Full | Before commits, after major changes | ~2-5 min |
| Filtered | Working on one puzzle type | ~30s |
| Single | Debugging a specific test file | ~10s |

### Step 2: Create and Execute Test Script

**Full suite**:

Create a script file (e.g., `/tmp/run_tests.R`):

```r
devtools::test()
```

```bash
R_EXE="/mnt/c/Program Files/R/R-4.5.0/bin/Rscript.exe"
cd /mnt/d/dev/p/jigsawR && "$R_EXE" -e "devtools::test()"
```

**Filtered by pattern**:

```bash
"$R_EXE" -e "devtools::test(filter = 'snic')"
```

**Single file**:

```bash
"$R_EXE" -e "testthat::test_file('tests/testthat/test-snic-puzzles.R')"
```

**Expected**: Test output with pass/fail/skip counts.

**On failure**:
- Do NOT use `--vanilla` flag; renv needs `.Rprofile` to activate
- If renv errors, run `renv::restore()` first
- For complex commands that fail with Exit code 5, write to a script file instead

### Step 3: Interpret Results

Look for the summary line:

```
[ FAIL 0 | WARN 0 | SKIP 7 | PASS 2042 ]
```

- **PASS**: Tests that succeeded
- **FAIL**: Tests that failed (need investigation)
- **SKIP**: Tests skipped (usually due to missing optional packages like `snic`)
- **WARN**: Warnings during tests (review but not blocking)

### Step 4: Investigate Failures

If tests fail:

1. Read the failure message — it includes file, line, and expected vs actual
2. Check if it's a new failure or pre-existing
3. For assertion failures, read the test and the function being tested
4. For error failures, check if a function signature changed

```bash
# Run just the failing test with verbose output
"$R_EXE" -e "testthat::test_file('tests/testthat/test-failing.R', reporter = 'summary')"
```

### Step 5: Verify Skip Reasons

Skipped tests are normal when optional dependencies are missing:

- `snic` package tests skip with `skip_if_not_installed("snic")`
- Tests requiring specific OS skip with `skip_on_os()`
- CRAN-only skips with `skip_on_cran()`

Confirm skip reasons are legitimate, not masking real failures.

## Validation

- [ ] All tests pass (FAIL = 0)
- [ ] No unexpected warnings
- [ ] Skip count matches expected (only optional dependency skips)
- [ ] Test count hasn't decreased (no tests accidentally removed)

## Common Pitfalls

- **Using `--vanilla`**: Breaks renv activation. Never use it with jigsawR.
- **Complex `-e` strings**: Shell escaping issues cause Exit code 5. Use script files.
- **Stale package state**: Run `devtools::load_all()` or `devtools::document()` before testing if you changed NAMESPACE-affecting code.
- **Missing test dependencies**: Some tests need suggested packages. Check `DESCRIPTION` Suggests field.
- **Parallel test issues**: If tests interfere, run sequentially with `testthat::test_file()`.

## Related Skills

- `generate-puzzle` — generate puzzles to verify behavior matches tests
- `add-puzzle-type` — new types need comprehensive test suites
- `write-testthat-tests` — general patterns for writing R tests
- `validate-piles-notation` — test PILES parsing independently

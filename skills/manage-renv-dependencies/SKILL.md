---
name: manage-renv-dependencies
description: >
  Manage R package dependencies using renv for reproducible environments.
  Covers initialization, snapshot/restore workflow, troubleshooting
  common issues, and CI/CD integration. Use when initializing dependency
  management for a new R project, adding or updating packages, restoring
  an environment on a new machine, troubleshooting restore failures, or
  integrating renv with CI/CD pipelines.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: r-packages
  complexity: intermediate
  language: R
  tags: r, renv, dependencies, reproducibility, lockfile
---

# Manage renv Dependencies

Set up and maintain reproducible R package environments using renv.

## When to Use

- Initializing dependency management for a new R project
- Adding or updating package dependencies
- Restoring a project environment on a new machine
- Troubleshooting renv restore failures
- Integrating renv with CI/CD pipelines

## Inputs

- **Required**: R project directory
- **Optional**: Existing `renv.lock` file (for restore)
- **Optional**: GitHub PAT for private packages

## Procedure

### Step 1: Initialize renv

```r
renv::init()
```

This creates:
- `renv/` directory (library, settings, activation script)
- `renv.lock` (dependency snapshot)
- Updates `.Rprofile` to activate renv on load

**Expected**: Project-local library created. Packages installed.

**On failure**: If it hangs, check network connectivity. If it fails on a specific package, install that package manually first with `install.packages()`.

### Step 2: Add Dependencies

Install packages as usual:

```r
install.packages("dplyr")
renv::install("github-user/private-pkg")
```

Then snapshot to record the state:

```r
renv::snapshot()
```

**Expected**: `renv.lock` updated with new packages and their versions.

### Step 3: Restore on Another Machine

```r
renv::restore()
```

**Expected**: All packages installed at the exact versions in `renv.lock`.

**On failure**: Common issues and solutions:

- **GitHub packages fail**: Set `GITHUB_PAT` in `.Renviron`
- **System dependency missing**: Install with `apt-get` (Linux) or check error message
- **Timeout on large packages**: Set `options(timeout = 600)` before restore
- **Binary not available**: renv will compile from source; ensure build tools are installed

### Step 4: Update Dependencies

```r
# Update a specific package
renv::update("dplyr")

# Update all packages
renv::update()

# Snapshot after updates
renv::snapshot()
```

### Step 5: Check Status

```r
renv::status()
```

**Expected**: "No issues found" or a clear list of out-of-sync packages.

### Step 6: Configure `.Rprofile` for Conditional Activation

```r
if (file.exists("renv/activate.R")) {
  source("renv/activate.R")
}
```

This ensures the project works even if renv isn't installed (CI environments, collaborators).

### Step 7: Git Configuration

Track these files:

```
renv.lock           # Always commit
renv/activate.R     # Always commit
renv/settings.json  # Always commit
.Rprofile           # Commit (contains renv activation)
```

Ignore these (already in renv's `.gitignore`):

```
renv/library/       # Machine-specific
renv/staging/       # Temporary
renv/cache/         # Machine-specific cache
```

### Step 8: CI/CD Integration

In GitHub Actions, use the renv cache action:

```yaml
- uses: r-lib/actions/setup-renv@v2
```

This automatically restores from `renv.lock` with caching.

## Validation

- [ ] `renv::status()` reports no issues
- [ ] `renv.lock` is committed to version control
- [ ] `renv::restore()` works on a clean checkout
- [ ] `.Rprofile` conditionally activates renv
- [ ] CI/CD uses `renv.lock` for dependency resolution

## Common Pitfalls

- **Running `renv::init()` in wrong directory**: Always verify `getwd()` first
- **Mixing renv and system library**: After `renv::init()`, only use the project library
- **Forgetting to snapshot**: After installing packages, always run `renv::snapshot()`
- **`--vanilla` flag**: `Rscript --vanilla` skips `.Rprofile`, so renv won't activate
- **Large lock files in diffs**: Normal — `renv.lock` is designed to be diffable JSON
- **Bioconductor packages**: Use `renv::install("bioc::PackageName")` and ensure BiocManager is configured

## Related Skills

- `create-r-package` - includes renv initialization
- `setup-github-actions-ci` - CI integration with renv
- `submit-to-cran` - dependency management for CRAN packages

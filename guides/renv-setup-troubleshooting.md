# renv Setup and Troubleshooting Guide

## Overview

This guide documents common issues and solutions when setting up renv for R package development, particularly when installing packages like `mcptools` (formerly `acquaint`) that have complex dependencies.

> **TODO**: Update any remaining references from "acquaint" to "mcptools" throughout this document to reflect the package rename.

## Initial renv Setup

### Basic Setup Commands
```r
# Initialize renv in project
renv::init()

# Install packages
renv::install("package_name")

# Create snapshot
renv::snapshot()

# Restore from snapshot
renv::restore()
```

## Common Issues and Solutions

### Issue 1: GitHub Package Installation with Complex Dependencies

**Problem**: Installing packages from GitHub (like `mcptools`) that have many dependencies can fail or timeout.

**Solution**: Install core dependencies first, then add GitHub packages:

```r
# Step 1: Install core CRAN packages
core_packages <- c("dplyr", "tidyr", "ggplot2", "rlang", "testthat")
for (pkg in core_packages) {
  if (!requireNamespace(pkg, quietly = TRUE)) {
    renv::install(pkg)
  }
}

# Step 2: Install GitHub packages
renv::install("posit-dev/mcptools")

# Step 3: Create snapshot
renv::snapshot()
```

### Issue 2: Installation Timeouts

**Problem**: Package installations timeout during download or compilation.

**Solution**: Install packages individually and use force snapshots:

```r
# Install packages one by one to avoid timeouts
packages <- c("dplyr", "tidyr", "ggplot2", "rlang", "testthat", "devtools", "usethis")
for (pkg in packages) {
  try({
    cat("Installing", pkg, "...\n")
    renv::install(pkg)
  })
}

# Force snapshot even if some packages failed
renv::snapshot(force = TRUE)
```

### Issue 3: Package Name Changes (acquaint → mcptools)

**Problem**: Documentation and code references outdated package names after package renames.

**Solution**: Systematic update of all references:

1. **Update `.Rprofile`**:
```r
# OLD
if (requireNamespace("acquaint", quietly = TRUE)) {
  acquaint::mcp_session()
}

# NEW  
if (requireNamespace("mcptools", quietly = TRUE)) {
  mcptools::mcp_session()
}
```

2. **Update Documentation**: Search and replace all instances of old package name
3. **Update Dependencies**: Check DESCRIPTION file and remove old package references
4. **Update Installation Scripts**: Use correct package name and source

### Issue 4: D3 Algorithm Implementation Discrepancy

**Problem**: D3 IAT measure implementation producing different results than published reference.

**Root Cause**: Misunderstanding of error penalty algorithm - reference uses `mean + 2*SD` not fixed 600ms penalty.

**Solution**: 
1. **Examine Reference Code**: Check literature/appendix/ for original implementations
2. **Key Insight**: D3 penalty = `block_mean + 2 * block_SD` for correct trials only
3. **Implementation Fix**:
```r
# Calculate block stats for correct trials only
iat_2 <- iat_1 |>
  filter(.data$correct == 1) |>
  group_by(.data$id, .data$order, .data$test, .data$blocknum) |>
  summarise(
    M_2_lat = mean(.data$latency),
    SD_2_lat = sd(.data$latency),
    .groups = "drop"
  )

# Apply 2*SD penalty
iat_3 <- iat_1 |>
  full_join(iat_2, by = c("id", "order", "test", "blocknum")) |>
  mutate(
    D2SD_P = if_else(.data$correct == 0, 
                     .data$M_2_lat + 2 * .data$SD_2_lat, 
                     .data$latency)
  )
```

**Validation Result**: Perfect correlation (r = 1.0) with published reference after fix.

### Issue 5: Missing Function Imports and Namespace Errors

**Problem**: Functions like `n()`, `sd()`, `vars()` not found during package check.

**Solution**: Add proper `@importFrom` directives:

```r
#' @importFrom dplyr filter group_by summarise n
#' @importFrom stats sd  
#' @importFrom ggplot2 vars
```

**Solutions**:
1. Install packages individually rather than in bulk
2. Use `force = TRUE` for snapshots when some packages are missing
3. Clear renv cache if corrupted: `renv::purge()`

### Issue 3: Git Credential Issues

**Problem**: Error message about GitHub authentication credentials.

**Solution**:
```r
# Set GitHub PAT
usethis::create_github_token()
gitcreds::gitcreds_set()

# Alternative: Use environment variable
Sys.setenv(GITHUB_PAT = "your_token_here")
```

### Issue 4: Snapshot Validation Failures

**Problem**: `renv::snapshot()` fails due to missing packages referenced in project files.

**Solutions**:
1. Use `renv::dependencies()` to see all required packages
2. Install missing packages or remove references
3. Use `renv::snapshot(force = TRUE)` to bypass validation
4. Update `.Rbuildignore` to exclude reference files not needed for package

```r
# Check what packages are required
renv::dependencies()

# Force snapshot despite missing packages
renv::snapshot(force = TRUE)
```

## Installation Helper Scripts

### Basic Installation Script
```r
# install_packages.R
packages <- c("dplyr", "tidyr", "ggplot2", "rlang", "testthat")

for (pkg in packages) {
  if (!requireNamespace(pkg, quietly = TRUE)) {
    message("Installing ", pkg, "...")
    renv::install(pkg)
  } else {
    message(pkg, " already available")
  }
}

# Try installing GitHub packages
try({
  renv::install("posit-dev/mcptools")
}, silent = TRUE)

# Create snapshot
renv::snapshot()
```

### Comprehensive Setup Script
```r
# setup_renv.R
if (!requireNamespace("remotes", quietly = TRUE)) {
  renv::install("remotes")
}

# Install from GitHub
remotes::install_github("posit-dev/mcptools")

# Install development dependencies
renv::install(c(
  "dplyr", "tidyr", "ggplot2", "rlang",
  "testthat", "knitr", "rmarkdown", "covr",
  "devtools", "usethis"
))

renv::snapshot()
```

## Best Practices for R Package Development with renv

### 1. .Rbuildignore Configuration
Add temporary installation scripts to `.Rbuildignore`:
```
^install_packages\.R$
^setup_renv\.R$
^renv$
^renv\.lock$
```

### 2. Conditional Package Loading
In `.Rprofile`, use conditional loading to prevent CI/CD failures:
```r
if (file.exists("renv/activate.R")) {
  source("renv/activate.R")
}

if (requireNamespace("mcptools", quietly = TRUE)) {
  mcptools::mcp_session()
}
```

### 3. Package Dependencies Management
- Keep `DESCRIPTION` file up to date with actual imports
- Use `renv::dependencies()` to audit package usage
- Separate development dependencies (in Suggests) from runtime dependencies (in Imports)

### 4. GitHub Actions Integration
For CI/CD pipelines, consider:
```yaml
# In GitHub Actions workflow
- name: Setup renv
  uses: r-lib/actions/setup-renv@v2
  
- name: Install system dependencies
  run: |
    sudo apt-get update
    sudo apt-get install -y libcurl4-openssl-dev
```

## Troubleshooting Commands

```r
# Check renv status
renv::status()

# Diagnose issues
renv::diagnostics()

# Clear cache and restart
renv::purge()
renv::restore()

# Check installed packages
installed.packages()[,c('Package', 'Version')]

# View renv library path
.libPaths()

# Check package dependencies in project
renv::dependencies()
```

## Windows-Specific Issues

### PATH Issues
- Ensure R and Rtools are in PATH
- Use full paths to R executable if needed: `"/mnt/c/Program Files/R/R-4.5.0/bin/Rscript.exe"`

### Long Path Names
- Windows has path length limitations
- Use shorter project directory names
- Consider using `renv::config$cache.symlinks(TRUE)`

### Package Compilation
- Install Rtools for packages requiring compilation
- Consider using binary packages when available

## Recovery Procedures

### If renv Gets Corrupted
1. Delete `renv/` directory
2. Delete `renv.lock` file
3. Restart R session
4. Run `renv::init()` to start fresh
5. Reinstall packages manually

### If Packages Won't Install
1. Try installing from binary: `renv::install("package", type = "binary")`
2. Check available package versions: `available.packages()`
3. Install specific version: `renv::install("package@version")`
4. Use alternative repositories

## Documentation and Resources

- [renv documentation](https://rstudio.github.io/renv/)
- [R Packages book](https://r-pkgs.org/)
- [GitHub PAT setup](https://usethis.r-lib.org/articles/git-credentials.html)

---
Last updated: 2024-07-04
Based on: iatr package setup experience
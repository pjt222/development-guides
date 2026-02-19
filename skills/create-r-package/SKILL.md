---
name: create-r-package
description: >
  Scaffold a new R package with complete structure including DESCRIPTION,
  NAMESPACE, testthat, roxygen2, renv, Git, GitHub Actions CI, and
  development configuration files (.Rprofile, .Renviron.example, CLAUDE.md).
  Follows usethis conventions and tidyverse style. Use when starting a new R
  package from scratch, converting loose R scripts into a structured package,
  or setting up a package skeleton for collaborative development.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: r-packages
  complexity: basic
  language: R
  tags: r, package, usethis, scaffold, setup
---

# Create R Package

Scaffold a fully configured R package with modern tooling and best practices.

## When to Use

- Starting a new R package from scratch
- Converting loose R scripts into a package
- Setting up a package skeleton for collaborative development

## Inputs

- **Required**: Package name (lowercase, no special characters except `.`)
- **Required**: One-line description of the package purpose
- **Optional**: License type (default: MIT)
- **Optional**: Author information (name, email, ORCID)
- **Optional**: Whether to initialize renv (default: yes)

## Procedure

### Step 1: Create Package Skeleton

```r
usethis::create_package("packagename")
setwd("packagename")
```

**Expected**: Directory created with `DESCRIPTION`, `NAMESPACE`, `R/`, `man/`.

**On failure**: Ensure usethis is installed (`install.packages("usethis")`). Check that the directory doesn't already exist.

### Step 2: Configure DESCRIPTION

Edit `DESCRIPTION` with accurate metadata:

```
Package: packagename
Title: What the Package Does (Title Case)
Version: 0.1.0
Authors@R:
    person("First", "Last", , "email@example.com", role = c("aut", "cre"),
           comment = c(ORCID = "0000-0000-0000-0000"))
Description: One paragraph describing what the package does. Must be more
    than one sentence. Avoid starting with "This package".
License: MIT + file LICENSE
Encoding: UTF-8
Roxygen: list(markdown = TRUE)
RoxygenNote: 7.3.2
URL: https://github.com/username/packagename
BugReports: https://github.com/username/packagename/issues
```

**Expected**: Valid DESCRIPTION that passes `R CMD check`.

### Step 3: Set Up Infrastructure

```r
usethis::use_mit_license()
usethis::use_readme_md()
usethis::use_news_md()
usethis::use_testthat(edition = 3)
usethis::use_git()
usethis::use_github_action("check-standard")
```

**Expected**: LICENSE, README.md, NEWS.md, tests/ directory, .git/ initialized, .github/workflows/ created.

### Step 4: Create Development Configuration

Create `.Rprofile`:

```r
if (file.exists("renv/activate.R")) {
  source("renv/activate.R")
}

if (requireNamespace("mcptools", quietly = TRUE)) {
  mcptools::mcp_session()
}
```

Create `.Renviron.example`:

```
RSTUDIO_PANDOC="C:/Program Files/RStudio/resources/app/bin/quarto/bin/tools"
# GITHUB_PAT=your_github_token_here
```

Create `.Rbuildignore` entries:

```
^\.Rprofile$
^\.Renviron$
^\.Renviron\.example$
^renv$
^renv\.lock$
^CLAUDE\.md$
^\.github$
^.*\.Rproj$
```

### Step 5: Initialize renv

```r
renv::init()
```

**Expected**: `renv/` directory and `renv.lock` created.

**On failure**: Install renv (`install.packages("renv")`). If renv hangs, check network connectivity.

### Step 6: Create Package Documentation File

Create `R/packagename-package.R`:

```r
#' @keywords internal
"_PACKAGE"

## usethis namespace: start
## usethis namespace: end
NULL
```

### Step 7: Create CLAUDE.md

Create `CLAUDE.md` in the project root with project-specific instructions for AI assistants.

## Validation

- [ ] `devtools::check()` returns 0 errors, 0 warnings
- [ ] Package structure matches expected layout
- [ ] `.Rprofile` loads without errors
- [ ] `renv::status()` shows no issues
- [ ] Git repository initialized with appropriate `.gitignore`
- [ ] GitHub Actions workflow file present

## Common Pitfalls

- **Package name conflicts**: Check CRAN with `available::available("packagename")` before committing to a name
- **Missing .Rbuildignore entries**: Development files (`.Rprofile`, `.Renviron`, `renv/`) must be excluded from the built package
- **Forgetting Encoding**: Always include `Encoding: UTF-8` in DESCRIPTION
- **RoxygenNote mismatch**: The version in DESCRIPTION must match your installed roxygen2

## Examples

```r
# Minimal creation
usethis::create_package("myanalysis")

# Full setup in one session
usethis::create_package("myanalysis")
usethis::use_mit_license()
usethis::use_testthat(edition = 3)
usethis::use_readme_md()
usethis::use_git()
usethis::use_github_action("check-standard")
renv::init()
```

## Related Skills

- `write-roxygen-docs` - document the functions you create
- `write-testthat-tests` - add tests for your package
- `setup-github-actions-ci` - detailed CI/CD configuration
- `manage-renv-dependencies` - manage package dependencies
- `write-claude-md` - create effective AI assistant instructions

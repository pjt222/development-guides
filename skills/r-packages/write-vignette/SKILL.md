---
name: write-vignette
description: >
  Create R package vignettes using R Markdown or Quarto. Covers
  vignette setup, YAML configuration, code chunk options, building
  and testing, and CRAN requirements for vignettes.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: r-packages
  complexity: basic
  language: R
  tags: r, vignette, rmarkdown, documentation, tutorial
---

# Write Vignette

Create long-form documentation vignettes for R packages.

## When to Use

- Adding a "Getting Started" tutorial for a package
- Documenting complex workflows that span multiple functions
- Creating domain-specific guides (e.g., statistical methodology)
- CRAN submission requires user-facing documentation beyond function help

## Inputs

- **Required**: R package with functions to document
- **Required**: Vignette title and topic
- **Optional**: Format (R Markdown or Quarto, default: R Markdown)
- **Optional**: Whether the vignette needs external data or APIs

## Procedure

### Step 1: Create Vignette File

```r
usethis::use_vignette("getting-started", title = "Getting Started with packagename")
```

**Expected**: `vignettes/getting-started.Rmd` created. `knitr` and `rmarkdown` added to Suggests.

### Step 2: Write Vignette Content

```markdown
---
title: "Getting Started with packagename"
output: rmarkdown::html_vignette
vignette: >
  %\VignetteIndexEntry{Getting Started with packagename}
  %\VignetteEngine{knitr::rmarkdown}
  %\VignetteEncoding{UTF-8}
---

## Introduction

Brief overview of what the package does and who it's for.

## Installation

```r
install.packages("packagename")
library(packagename)
```

## Basic Usage

Walk through the primary workflow:

```r
# Load example data
data <- example_data()

# Process
result <- main_function(data, option = "default")

# Inspect
summary(result)
```

## Advanced Features

Cover optional or advanced functionality.

## Conclusion

Summarize and point to other vignettes or resources.
```

### Step 3: Configure Code Chunks

Use chunk options for different purposes:

```r
# Standard evaluated chunk
{r example-basic}
result <- compute_something(1:10)
result

# Show code but don't run (for illustrative purposes)
{r api-example, eval=FALSE}
connect_to_api(key = "your_key_here")

# Run but hide code (show only output)
{r hidden-setup, echo=FALSE}
library(packagename)

# Set global options
{r setup, include=FALSE}
knitr::opts_chunk$set(
  collapse = TRUE,
  comment = "#>",
  fig.width = 7,
  fig.height = 5
)
```

### Step 4: Handle External Dependencies

For vignettes that need network access or optional packages:

```r
{r check-available, include=FALSE}
has_suggested <- requireNamespace("optionalpkg", quietly = TRUE)

{r use-suggested, eval=has_suggested}
optionalpkg::special_function()
```

For long-running computations, pre-compute and save results:

```r
# Save pre-computed results to vignettes/
saveRDS(expensive_result, "vignettes/precomputed.rds")

# Load in vignette
{r load-precomputed}
result <- readRDS("precomputed.rds")
```

### Step 5: Build and Test Vignette

```r
# Build single vignette
devtools::build_vignettes()

# Build and check (catches vignette issues)
devtools::check()
```

**Expected**: Vignette builds without errors. HTML output is readable.

**On failure**:
- Missing pandoc: Set `RSTUDIO_PANDOC` in `.Renviron`
- Package not installed: Run `devtools::install()` first
- Missing Suggests: Install packages listed in DESCRIPTION Suggests

### Step 6: Verify in Package Check

```r
devtools::check()
```

Vignette-related checks: builds correctly, doesn't take too long, no errors.

## Validation

- [ ] Vignette builds without errors via `devtools::build_vignettes()`
- [ ] All code chunks execute correctly
- [ ] VignetteIndexEntry matches the title
- [ ] `devtools::check()` passes with no vignette warnings
- [ ] Vignette appears in pkgdown site articles (if applicable)
- [ ] Build time is reasonable (< 60 seconds for CRAN)

## Common Pitfalls

- **VignetteIndexEntry mismatch**: The index entry in YAML must match what you want users to see in `vignette(package = "pkg")`
- **Missing `vignette` YAML block**: All three `%\Vignette*` lines are required
- **Vignette too slow for CRAN**: Pre-compute results or use `eval=FALSE` for expensive operations
- **Pandoc not found**: Ensure `RSTUDIO_PANDOC` environment variable is set
- **Self-referencing package**: Use `library(packagename)` not `devtools::load_all()` in vignettes

## Related Skills

- `write-roxygen-docs` - function-level docs complement vignette tutorials
- `build-pkgdown-site` - vignettes appear as articles on pkgdown site
- `submit-to-cran` - CRAN has specific vignette requirements
- `create-quarto-report` - Quarto as an alternative to R Markdown vignettes

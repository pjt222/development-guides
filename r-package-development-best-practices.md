# R Package Development Best Practices

A comprehensive guide for developing high-quality R packages, based on lessons learned from the putior package and other successful projects.

## Table of Contents
1. [Package Structure](#package-structure)
2. [Development Workflow](#development-workflow)
3. [Documentation Standards](#documentation-standards)
4. [Testing Strategy](#testing-strategy)
5. [Code Quality](#code-quality)
6. [CRAN Submission](#cran-submission)
7. [CI/CD Setup](#cicd-setup)
8. [Common Patterns](#common-patterns)
9. [Troubleshooting](#troubleshooting)

## Package Structure

### Essential Files
```
package-name/
├── DESCRIPTION              # Package metadata
├── NAMESPACE               # Export/import directives
├── LICENSE                 # License file
├── LICENSE.md             # Human-readable license
├── README.md              # Package overview
├── NEWS.md                # Version history
├── R/                     # R source code
├── man/                   # Documentation (generated)
├── tests/                 # Test suite
│   ├── testthat.R
│   └── testthat/
├── vignettes/             # Long-form documentation
├── inst/                  # Additional files
│   ├── WORDLIST          # Spell check dictionary
│   └── examples/         # Example scripts
├── data/                  # Package data (if needed)
├── .Rbuildignore         # Files to exclude from build
├── .gitignore            # Git ignore patterns
├── .Rprofile             # Development session config
└── .Renviron             # Environment variables
```

### Project-Specific Files
```
├── CLAUDE.md              # AI assistant instructions
├── cran-comments.md       # CRAN submission notes
├── _pkgdown.yml          # pkgdown site configuration
├── .github/              # GitHub Actions workflows
└── renv/                 # Package management
    └── renv.lock         # Dependency snapshot
```

## Development Workflow

### Initial Setup
```r
# Create package structure
usethis::create_package("packagename")

# Set up Git
usethis::use_git()

# Configure package
usethis::use_mit_license()  # or other license
usethis::use_readme_md()
usethis::use_news_md()
usethis::use_testthat()
usethis::use_github_action_check_standard()

# Set up renv for reproducibility
renv::init()
```

### Daily Development Cycle
```r
# 1. Load all functions for interactive use
devtools::load_all()

# 2. Make changes to R files

# 3. Update documentation
devtools::document()

# 4. Run tests
devtools::test()

# 5. Check package
devtools::check()

# 6. Install and test
devtools::install()
```

### Feature Development
```r
# Create new R file
usethis::use_r("feature_name")

# Create corresponding test file
usethis::use_test("feature_name")

# Add example
# Create inst/examples/feature_example.R
```

## Documentation Standards

### Function Documentation
```r
#' Brief description in one line
#'
#' More detailed description that explains what the function does,
#' why it exists, and when to use it.
#'
#' @param x Description of parameter x
#' @param y Description of parameter y
#'
#' @return Description of what the function returns
#'
#' @examples
#' # Basic usage
#' result <- function_name(x = 1, y = 2)
#' 
#' # Advanced usage
#' \dontrun{
#' # This won't run during checks
#' expensive_operation()
#' }
#'
#' @export
#' @family related_functions
#' @seealso \code{\link{other_function}}
function_name <- function(x, y) {
  # Implementation
}
```

### Package Documentation
Create `R/packagename-package.R`:
```r
#' @keywords internal
"_PACKAGE"

# The following block is used by usethis to automatically manage
# roxygen namespace tags. Modify with care!
## usethis namespace: start
## usethis namespace: end
NULL
```

### Vignettes
```r
# Create vignette
usethis::use_vignette("getting-started")

# Vignette header
---
title: "Getting Started with packagename"
output: rmarkdown::html_vignette
vignette: >
  %\VignetteIndexEntry{Getting Started with packagename}
  %\VignetteEngine{knitr::rmarkdown}
  %\VignetteEncoding{UTF-8}
---
```

### README Best Practices
- Installation instructions
- Quick start example
- Links to vignettes
- Badge for R CMD check status
- Clear value proposition

## Testing Strategy

### Test Organization
```r
# File: tests/testthat/test-feature.R
test_that("function handles basic input", {
  result <- function_name(1, 2)
  expect_equal(result, expected_value)
})

test_that("function validates input", {
  expect_error(function_name("not_a_number"), "Expected numeric")
})

test_that("function handles edge cases", {
  expect_equal(function_name(NA, 1), NA)
  expect_equal(function_name(NULL, 1), NULL)
})
```

### Testing Patterns
```r
# Test with temporary files
test_that("function writes files correctly", {
  tmp_dir <- tempdir()
  tmp_file <- file.path(tmp_dir, "test.txt")
  
  function_that_writes(tmp_file)
  
  expect_true(file.exists(tmp_file))
  content <- readLines(tmp_file)
  expect_equal(content, "expected content")
  
  # Cleanup happens automatically
})

# Test with mocking
test_that("function handles API calls", {
  mockery::stub(function_name, "api_call", list(data = "mocked"))
  result <- function_name()
  expect_equal(result$data, "mocked")
})
```

### Coverage Goals
- Aim for >80% code coverage
- Test all exported functions
- Test error conditions
- Test edge cases

## Code Quality

### Style Guide
Follow the tidyverse style guide:
```r
# Good
if (condition) {
  do_something()
}

# Bad
if(condition){
  do_something()
}

# Use <- for assignment
x <- 5  # Good
x = 5   # Avoid

# Meaningful variable names
user_age <- 25  # Good
ua <- 25        # Bad
```

### Dependencies
```r
# DESCRIPTION file
Imports:
    package1 (>= 1.0.0),
    package2
Suggests:
    testthat (>= 3.0.0),
    knitr,
    rmarkdown
    
# In R code - always use ::
result <- package1::function_name(x)

# Never use library() or require() in package code
```

### Error Handling
```r
# Validate input
if (!is.numeric(x)) {
  stop("'x' must be numeric", call. = FALSE)
}

# Informative error messages
if (length(x) == 0) {
  stop("Input vector 'x' is empty. Please provide at least one value.",
       call. = FALSE)
}

# Warnings for non-fatal issues
if (any(is.na(x))) {
  warning("NA values found in 'x' and will be removed", call. = FALSE)
  x <- x[!is.na(x)]
}
```

## CRAN Submission

### Pre-submission Checklist
```r
# 1. Update version in DESCRIPTION
# 2. Update NEWS.md
# 3. Run comprehensive checks

# Local check
devtools::check()

# Win-builder
devtools::check_win_devel()
devtools::check_win_release()

# R-hub
rhub::rhub_check()

# Spell check
devtools::spell_check()

# URL check
urlchecker::url_check()
```

### DESCRIPTION Requirements
```
Package: packagename
Title: What the Package Does (One Line, Title Case)
Version: 0.1.0
Authors@R: 
    person("First", "Last", , "email@example.com", role = c("aut", "cre"),
           comment = c(ORCID = "YOUR-ORCID-ID"))
Description: What the package does (one paragraph).
License: MIT + file LICENSE
URL: https://github.com/username/packagename
BugReports: https://github.com/username/packagename/issues
```

### cran-comments.md Template
```markdown
## R CMD check results
0 errors | 0 warnings | 1 note

* This is a new release.

## Test environments
* local: Windows 10, R 4.5.0
* win-builder: release and devel
* R-hub: ubuntu-latest, windows-latest, macos-latest

## Downstream dependencies
There are currently no downstream dependencies for this package.
```

## CI/CD Setup

### GitHub Actions
```yaml
# .github/workflows/R-CMD-check.yaml
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

name: R-CMD-check

jobs:
  R-CMD-check:
    runs-on: ${{ matrix.config.os }}
    
    strategy:
      matrix:
        config:
          - {os: windows-latest, r: 'release'}
          - {os: macOS-latest, r: 'release'}
          - {os: ubuntu-latest, r: 'release'}
          - {os: ubuntu-latest, r: 'devel'}
```

### Conditional Dependencies
```r
# .Rprofile for development tools
if (requireNamespace("devtools", quietly = TRUE)) {
  library(devtools)
}

if (requireNamespace("acquaint", quietly = TRUE)) {
  acquaint::mcp_session()
}
```

## Common Patterns

### S3 Methods
```r
# Generic function
process <- function(x, ...) {
  UseMethod("process")
}

# Method for specific class
process.myclass <- function(x, ...) {
  # Implementation
}

# Register S3 method in NAMESPACE
#' @export
process.myclass
```

### Package Data
```r
# Create data
my_data <- data.frame(x = 1:10, y = letters[1:10])

# Save to package
usethis::use_data(my_data)

# Document in R/data.R
#' Example dataset
#'
#' A dataset containing...
#'
#' @format A data frame with 10 rows and 2 variables:
#' \describe{
#'   \item{x}{numeric values}
#'   \item{y}{character values}
#' }
"my_data"
```

### Options and Defaults
```r
# In R/zzz.R
.onLoad <- function(libname, pkgname) {
  op <- options()
  op.packagename <- list(
    packagename.verbose = FALSE,
    packagename.max_iterations = 1000
  )
  toset <- !(names(op.packagename) %in% names(op))
  if (any(toset)) options(op.packagename[toset])
  
  invisible()
}

# Usage in functions
verbose <- getOption("packagename.verbose", FALSE)
```

## Troubleshooting

### Common Issues

#### 1. "no visible binding for global variable"
```r
# Problem: Using data frame columns without declaration
function(df) {
  df %>% filter(column > 5)  # NOTE about 'column'
}

# Solution: Use .data pronoun or declare variables
function(df) {
  df %>% filter(.data$column > 5)
}

# Or in package-level:
utils::globalVariables(c("column"))
```

#### 2. Examples Taking Too Long
```r
#' @examples
#' \dontrun{
#' # Time-consuming example
#' big_computation()
#' }
#' 
#' \donttest{
#' # Run manually but not during CHECK
#' medium_computation()
#' }
#' 
#' # This always runs during CHECK
#' small_computation()
```

#### 3. Platform-Specific Code
```r
# Check platform
if (.Platform$OS.type == "windows") {
  # Windows-specific code
} else {
  # Unix-like systems
}

# Skip tests on CRAN
testthat::skip_on_cran()

# Skip on specific OS
testthat::skip_on_os("windows")
```

#### 4. Missing Pandoc
```bash
# Set in .Renviron
RSTUDIO_PANDOC="C:/Program Files/RStudio/resources/app/bin/quarto/bin/tools"

# Or install pandoc separately
# https://pandoc.org/installing.html
```

## Best Practices Summary

1. **Start Simple**: Begin with core functionality, add features iteratively
2. **Document Early**: Write documentation as you code
3. **Test Everything**: Write tests before fixing bugs
4. **Check Often**: Run `devtools::check()` frequently
5. **Version Thoughtfully**: Use semantic versioning (major.minor.patch)
6. **Communicate Clearly**: Good error messages and documentation
7. **Be Conservative**: Minimize dependencies
8. **Stay Consistent**: Follow established patterns in your package
9. **Plan for CRAN**: Follow guidelines from the start
10. **Keep Learning**: R Packages book, other packages, R-pkg-devel list

## Resources

- [R Packages (2e)](https://r-pkgs.org/) by Hadley Wickham and Jenny Bryan
- [Writing R Extensions](https://cran.r-project.org/doc/manuals/r-release/R-exts.html)
- [rOpenSci Packages Guide](https://devguide.ropensci.org/)
- [CRAN Policies](https://cran.r-project.org/web/packages/policies.html)
- [tidyverse Style Guide](https://style.tidyverse.org/)
- [R-pkg-devel Mailing List](https://stat.ethz.ch/mailman/listinfo/r-package-devel)
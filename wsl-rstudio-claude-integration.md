# WSL-RStudio-Claude Code Integration Guide

This guide provides comprehensive instructions for setting up and using Claude Code from WSL with RStudio installed on Windows.

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Initial Setup](#initial-setup)
4. [acquaint Package Configuration](#acquaint-package-configuration)
5. [Environment Configuration](#environment-configuration)
6. [Path Management](#path-management)
7. [Development Workflow](#development-workflow)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

## Overview

This setup enables Claude Code running in WSL to interact with R sessions in RStudio on Windows through the Model Context Protocol (MCP) server provided by the `acquaint` package.

### Architecture
```
Claude Code (WSL) <--MCP--> acquaint::mcp_session() <--> RStudio (Windows)
                     |
                     v
              R.exe (Windows)
```

## Prerequisites

- Windows with WSL2 installed
- RStudio installed on Windows
- R installed on Windows (accessible via `/mnt/c/`)
- Claude Code CLI installed in WSL
- Git configured in WSL

## Initial Setup

### 1. Verify R Installation Path
```bash
# Find your R installation
ls "/mnt/c/Program Files/R/"

# Test R access from WSL (adjust version as needed)
"/mnt/c/Program Files/R/R-4.5.0/bin/R.exe" --version
```

### 2. Create Wrapper Scripts (Optional but Recommended)
```bash
# Create local bin directory
mkdir -p ~/bin

# Create R wrapper (adjust R version path as needed)
cat > ~/bin/R << 'EOF'
#!/bin/bash
exec "/mnt/c/Program Files/R/R-4.5.0/bin/R.exe" "$@"
EOF

# Create Rscript wrapper (adjust R version path as needed)
cat > ~/bin/Rscript << 'EOF'
#!/bin/bash
exec "/mnt/c/Program Files/R/R-4.5.0/bin/Rscript.exe" "$@"
EOF

# Make executable
chmod +x ~/bin/R ~/bin/Rscript

# Add to PATH in ~/.bashrc
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

## acquaint Package Configuration

### 1. Install acquaint Package
```r
# In RStudio on Windows
install.packages("remotes")
remotes::install_github("posit-dev/acquaint")
```

### 2. Configure .Rprofile
Create or update `.Rprofile` in your project root:

```r
# Activate renv if available
if (file.exists("renv/activate.R")) {
  source("renv/activate.R")
}

# Load acquaint MCP session if package is available (for development)
if (requireNamespace("acquaint", quietly = TRUE)) {
  acquaint::mcp_session()
}
```

**Important**: The conditional loading prevents errors in environments where acquaint isn't available (like CI/CD).

### 3. Start MCP Session
```r
# In RStudio, after opening your project
acquaint::mcp_session()
```

This starts the MCP server that Claude Code can connect to.

## Environment Configuration

### 1. Create .Renviron File
Create `.Renviron` in your project root with Windows paths:

```bash
# R Environment Variables for development
# Pandoc path for RStudio installation (required for building vignettes)
RSTUDIO_PANDOC="C:/Program Files/RStudio/resources/app/bin/quarto/bin/tools"

# Optional: GitHub PAT for package development
# GITHUB_PAT=your_github_token_here

# Optional: Custom library path
# R_LIBS_USER="C:/Users/YourUsername/R/library"
```

### 2. Verify Environment
```bash
# From WSL, check if .Renviron is loaded
Rscript -e "Sys.getenv('RSTUDIO_PANDOC')"
```

## Path Management

### Windows to WSL Path Conversion
- Windows: `C:\Program Files\R\R-4.5.0`
- WSL: `/mnt/c/Program Files/R/R-4.5.0`

### Common Paths Reference
```bash
# R Installation (adjust version as needed)
R_HOME="/mnt/c/Program Files/R/R-4.5.0"

# RStudio Installation
RSTUDIO_HOME="/mnt/c/Program Files/RStudio"

# User R Library (Windows path in .Renviron - adjust username and R version)
R_LIBS_USER="C:/Users/YourUsername/R/win-library/4.5"

# Pandoc (Windows path in .Renviron)
RSTUDIO_PANDOC="C:/Program Files/RStudio/resources/app/bin/quarto/bin/tools"
```

## Development Workflow

### 1. Starting a Session
```bash
# Navigate to project in WSL
cd /path/to/your-project

# Start Claude Code
claude
```

### 2. In RStudio (Windows)
1. Open your project in RStudio
2. The `.Rprofile` will automatically start `acquaint::mcp_session()`
3. You'll see a message about the MCP server starting

### 3. Common Commands from WSL
```bash
# Run R commands
Rscript -e "devtools::check()"
Rscript -e "devtools::test()"
Rscript -e "devtools::document()"

# Build package
R CMD build .
R CMD check *.tar.gz

# Install dependencies
Rscript -e "renv::restore()"
```

## Troubleshooting

### Issue: R Command Not Found
```bash
# Use full path (adjust R version as needed)
"/mnt/c/Program Files/R/R-4.5.0/bin/Rscript.exe" -e "your_command"

# Or create wrapper scripts (see Initial Setup)
```

### Issue: Pandoc Not Found
```bash
# Ensure .Renviron contains:
RSTUDIO_PANDOC="C:/Program Files/RStudio/resources/app/bin/quarto/bin/tools"

# Verify
Rscript -e "Sys.getenv('RSTUDIO_PANDOC')"
```

### Issue: acquaint Not Loading
```r
# Check if installed
requireNamespace("acquaint", quietly = TRUE)

# Reinstall if needed
remotes::install_github("posit-dev/acquaint")
```

### Issue: renv Not Activating
```bash
# Ensure you're not using --vanilla flag
Rscript -e "command"  # Good
Rscript --vanilla -e "command"  # Bad - skips .Rprofile
```

### Issue: Different R Versions
```bash
# Check R version in WSL (adjust path to your R version)
"/mnt/c/Program Files/R/R-4.5.0/bin/R.exe" --version

# Update wrapper scripts to match your version
```

## Best Practices

### 1. Project Organization
- Always include `.Rprofile` with conditional acquaint loading
- Include `.Renviron` for Windows-specific paths
- Use renv for package management
- Add both files to version control

### 2. Development Files
**Never delete these files:**
- `.Rprofile` - Contains session configuration
- `.Renviron` - Contains environment variables
- `renv.lock` - Package dependencies
- `renv/` - Package library

### 3. CI/CD Compatibility
```r
# Always use conditional loading in .Rprofile
if (requireNamespace("acquaint", quietly = TRUE)) {
  acquaint::mcp_session()
}
```

### 4. Documentation
Create a `CLAUDE.md` file in your project root with:
- Project-specific instructions
- Common commands
- Development workflow
- Known issues

### 5. Git Configuration
```gitignore
# Don't ignore development files
!.Rprofile
!.Renviron

# But ignore user-specific data
.RData
.Rhistory
```

## Example Project Setup

```bash
# 1. Create new project directory
mkdir /path/to/your-projects/new-r-project
cd /path/to/your-projects/new-r-project

# 2. Initialize git
git init

# 3. Create .Rprofile
cat > .Rprofile << 'EOF'
if (file.exists("renv/activate.R")) {
  source("renv/activate.R")
}

if (requireNamespace("acquaint", quietly = TRUE)) {
  acquaint::mcp_session()
}
EOF

# 4. Create .Renviron
cat > .Renviron << 'EOF'
RSTUDIO_PANDOC="C:/Program Files/RStudio/resources/app/bin/quarto/bin/tools"
EOF

# 5. Initialize renv (from R)
Rscript -e "renv::init()"

# 6. Install acquaint
Rscript -e "remotes::install_github('posit-dev/acquaint')"

# 7. Create CLAUDE.md
echo "# Project Name" > CLAUDE.md
echo "" >> CLAUDE.md
echo "Project-specific instructions for Claude Code." >> CLAUDE.md

# 8. Open in RStudio and start developing!
```

## Additional Resources

- [acquaint Package Documentation](https://github.com/posit-dev/acquaint)
- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [WSL Documentation](https://docs.microsoft.com/en/us/windows/wsl/)
- [renv Documentation](https://rstudio.github.io/renv/)
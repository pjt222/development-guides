# WSL-RStudio-Claude Code Integration Guide

This guide provides comprehensive instructions for setting up and using Claude Code from WSL with RStudio installed on Windows.

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Initial Setup](#initial-setup)
4. [acquaint Package Configuration](#acquaint-package-configuration)
5. [Claude Desktop Configuration](#claude-desktop-configuration)
6. [Environment Configuration](#environment-configuration)
7. [Path Management](#path-management)
8. [Development Workflow](#development-workflow)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

## Overview

This setup enables Claude Code running in WSL to interact with R sessions in RStudio on Windows through the Model Context Protocol (MCP) server provided by the `acquaint` package.

### Architecture
```
Claude Code (WSL) <--MCP--> acquaint::mcp_session() <--> RStudio (Windows)
                     |
                     v
              R.exe (Windows)

Claude Desktop (Windows) <--MCP--> Multiple Servers:
                           |        ├── r-acquaint (R integration)
                           |        └── hf-mcp-server (Hugging Face)
                           v
                    AI/ML Workflows + R Analytics
```

### Important: Understanding the Client-Server Relationship

**MCP (Model Context Protocol) operates on a client-server architecture:**

- **MCP Server**: `acquaint::mcp_session()` runs in your R/RStudio session, exposing R functionality
- **MCP Clients**: Both Claude Code and Claude Desktop are independent clients that can connect to any MCP server
- **Key Point**: Claude Code and Claude Desktop do NOT share configurations or depend on each other
- **Connection**: Each client independently discovers and connects to available MCP servers

Think of it like a web server:
- Your R session (with acquaint) is like a web server
- Claude Code and Claude Desktop are like different web browsers
- Both browsers can connect to the same server independently
- Neither browser needs to know about the other

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

## Claude Desktop Configuration

To connect Claude Desktop (running on Windows) to MCP servers, you need to configure Claude Desktop's MCP settings. Your setup can include multiple MCP servers for different capabilities.

### Available MCP Servers

Your Claude Desktop can be configured with the following MCP servers:

#### 1. r-acquaint
- **Purpose**: R integration and data analysis
- **Capabilities**: Package management, data frame analysis, help system, file operations
- **Command**: Uses Rscript to run `acquaint::mcp_server()`
- **Status check**: Look for acquaint::mcp_session() output in R console

#### 2. hf-mcp-server (Hugging Face)
- **Purpose**: AI/ML model access and Hugging Face integration
- **Capabilities**: Model inference, dataset access, transformers pipeline
- **Authentication**: Configured with Bearer token
- **Use cases**: Natural language processing, computer vision, model experimentation

### Checking Available MCP Servers
```bash
# View Claude Desktop configuration
cat /mnt/c/Users/$USER/AppData/Roaming/Claude/claude_desktop_config.json

# Check R MCP server status (in R console)
Rscript -e "acquaint::mcp_session()"
```

### 1. Locate Claude Desktop Configuration

Find or create the Claude Desktop configuration file:

**Windows 11/10:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Full path example:**
```
C:\Users\YourUsername\AppData\Roaming\Claude\claude_desktop_config.json
```

### 2. Configure MCP Server Connection

Create or edit the `claude_desktop_config.json` file. Here's an example with multiple MCP servers:

```json
{
  "globalShortcut": "Alt+Ctrl+Space",
  "mcpServers": {
    "r-acquaint": {
      "command": "C:\\PROGRA~1\\R\\R-45~1.0\\bin\\x64\\Rscript.exe",
      "args": ["-e", "acquaint::mcp_server()"]
    },
    "hf-mcp-server": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://huggingface.co/mcp",
        "--header",
        "Authorization: Bearer YOUR_HF_TOKEN_HERE"
      ]
    }
  }
}
```

**Important**: Replace `YOUR_HF_TOKEN_HERE` with your actual Hugging Face token if you want to use the Hugging Face MCP server.

**Note**: The exact configuration may depend on how the acquaint package exposes the MCP server. You may need to specify:
- A specific port if the server runs on a network port
- Connection parameters for the stdio interface
- Authentication details if required

### 3. Alternative: Network-based Connection

If the acquaint MCP server runs on a specific port, your configuration might look like:

```json
{
  "mcpServers": {
    "r-acquaint": {
      "command": "tcp",
      "args": ["localhost", "3000"],
      "description": "R session MCP server on localhost:3000"
    }
  }
}
```

### 4. Verify Connection

1. **Start R session** with acquaint MCP server:
   ```r
   # In RStudio
   acquaint::mcp_session()
   ```

2. **Restart Claude Desktop** to pick up the new configuration

3. **Test connection** by asking Claude Desktop to interact with your R session

### 5. Connection Troubleshooting

**Check MCP server status:**
```r
# In R console, verify the server is running
# Look for MCP server startup messages when running acquaint::mcp_session()
```

**Verify configuration file:**
- Ensure the JSON syntax is valid
- Check file permissions
- Restart Claude Desktop after configuration changes

**Common issues:**
- Firewall blocking connections
- Port conflicts
- Incorrect server address/port
- Configuration file syntax errors

## Environment Configuration

### 1. Create .Renviron File
Create `.Renviron.example` in your project root as a template:

```bash
# R Environment Variables for development
# Pandoc path for RStudio installation (required for building vignettes)
RSTUDIO_PANDOC="C:/Program Files/RStudio/resources/app/bin/quarto/bin/tools"

# GitHub PAT for package development (get from https://github.com/settings/tokens)
# GITHUB_PAT=your_github_token_here

# Optional: Custom library path
# R_LIBS_USER="C:/Users/YourUsername/R/library"
```

Then copy to create your actual environment file:
```bash
cp .Renviron.example .Renviron
# Edit .Renviron to add your actual API keys and sensitive values
```

**Security Note**: `.Renviron` contains sensitive information and should be git-ignored.

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

## Claude Code Configuration (WSL)

### Configure Claude Code to Connect to MCP Server

Claude Code needs its own configuration to connect to the MCP server. This is separate from Claude Desktop configuration.

#### Option 1: Using Claude CLI
```bash
# Add MCP server to Claude Code configuration
claude mcp add r-acquaint stdio "/mnt/c/Program Files/R/R-4.5.0/bin/Rscript.exe" -e "acquaint::mcp_server()"
```

#### Option 2: Manual Configuration
Edit `~/.claude.json` and add:
```json
{
  "mcpServers": {
    "r-acquaint": {
      "type": "stdio",
      "command": "/mnt/c/Program Files/R/R-4.5.0/bin/Rscript.exe",
      "args": ["-e", "acquaint::mcp_server()"],
      "env": {}
    }
  }
}
```

**Note**: Adjust the R path to match your installation version.

## Development Workflow

### 1. Starting a Session
```bash
# Navigate to project in WSL
cd /path/to/your-project

# Start Claude Code (now configured with MCP)
claude
```

### 2. In RStudio (Windows)
1. Open your project in RStudio
2. The `.Rprofile` will automatically start `acquaint::mcp_session()`
3. You'll see a message about the MCP server starting

### 3. In Claude Desktop (Windows)
1. **Ensure Claude Desktop is configured** with the MCP server settings (see [Claude Desktop Configuration](#claude-desktop-configuration))
2. **Restart Claude Desktop** if you've made configuration changes
3. **Test the connection** by asking Claude Desktop to interact with your R environment
4. Look for MCP server indicators in Claude Desktop's interface

### 4. Common Commands from WSL
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

### Issue: Claude Desktop Not Connecting to MCP Server
```bash
# 1. Verify MCP server is running in R
# Look for startup messages when running:
acquaint::mcp_session()

# 2. Check Claude Desktop configuration file exists
# Windows: %APPDATA%\Claude\claude_desktop_config.json

# 3. Validate JSON syntax in configuration file
# Use an online JSON validator or:
python -m json.tool %APPDATA%\Claude\claude_desktop_config.json

# 4. Restart Claude Desktop after configuration changes

# 5. Check for firewall/antivirus blocking connections

# 6. Verify connection method (stdio vs tcp)
# Check acquaint documentation for correct connection type
```

### Issue: MCP Server Connection Refused
```r
# Check if MCP server port is already in use
netstat -an | findstr :3000  # Replace 3000 with actual port

# Try restarting the MCP server
# In R console:
# Stop any existing session, then restart
acquaint::mcp_session()

# Check for error messages in R console output
```

### Issue: Claude Code Not Connecting to MCP Server
```bash
# 1. Verify Claude Code configuration
cat ~/.claude.json | jq '.mcpServers'

# 2. Check if MCP server is running in RStudio
# Look for "MCP server started" message in R console

# 3. Test R path from WSL
"/mnt/c/Program Files/R/R-4.5.0/bin/Rscript.exe" --version

# 4. Try running MCP server manually from WSL
"/mnt/c/Program Files/R/R-4.5.0/bin/Rscript.exe" -e "acquaint::mcp_server()"

# 5. Check Claude Code logs
# Look for MCP connection errors when starting claude
```

### Issue: Confusion Between Claude Code and Claude Desktop
- **Remember**: These are two separate tools with separate configurations
- Claude Code (CLI): Configuration in `~/.claude.json`
- Claude Desktop (GUI): Configuration in `%APPDATA%\Claude\claude_desktop_config.json`
- You can use both simultaneously with the same MCP server

## Best Practices

### 1. Project Organization
- Always include `.Rprofile` with conditional acquaint loading
- Include `.Renviron.example` template for Windows-specific paths
- Use renv for package management
- Add template files to version control, but git-ignore actual `.Renviron`

### 2. Development Files
**Never delete these files:**
- `.Rprofile` - Contains session configuration
- `.Renviron.example` - Environment variable template
- `.Renviron` - Local environment variables (not in git)
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
# Don't ignore development template files
!.Rprofile
!.Renviron.example

# Ignore sensitive environment files and user-specific data
.Renviron
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

# 4. Create .Renviron.example template
cat > .Renviron.example << 'EOF'
RSTUDIO_PANDOC="C:/Program Files/RStudio/resources/app/bin/quarto/bin/tools"
# GITHUB_PAT=your_github_token_here
EOF

# 5. Copy to create actual .Renviron (add your secrets here)
cp .Renviron.example .Renviron

# 6. Initialize renv (from R)
Rscript -e "renv::init()"

# 7. Install acquaint
Rscript -e "remotes::install_github('posit-dev/acquaint')"

# 8. Create CLAUDE.md
echo "# Project Name" > CLAUDE.md
echo "" >> CLAUDE.md
echo "Project-specific instructions for Claude Code." >> CLAUDE.md

# 9. Open in RStudio and start developing!
```

## Additional Resources

- [acquaint Package Documentation](https://github.com/posit-dev/acquaint)
- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [WSL Documentation](https://docs.microsoft.com/en/us/windows/wsl/)
- [renv Documentation](https://rstudio.github.io/renv/)
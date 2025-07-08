# Claude Desktop MCP Configuration Guide

## Status: ✅ Production Ready

**Last Updated**: July 4, 2025  
**Configuration Status**: Both Claude Code (WSL) and Claude Desktop (Windows) are working with established MCP servers

> **TODO**: Update all references from "acquaint" to "mcptools" throughout this document. The package has been renamed and this guide needs to be updated accordingly.

## Overview

This document provides the definitive configuration for Claude Desktop MCP servers, consolidating all tested solutions and troubleshooting steps into a single reference.

### Current Working Setup

- **Claude Code (WSL)**: Configured with r-acquaint MCP server
- **Claude Desktop (Windows)**: Configured with both r-acquaint and hf-mcp-server 
- **Status**: Both configurations are production-ready and verified working

## Architecture

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

## Working Configuration

### Prerequisites

**Required Installation**:
```cmd
npm install -g mcp-remote
```

**R Package** (in RStudio):
```r
install.packages("remotes")
remotes::install_github("posit-dev/acquaint")
```

### Configuration File

**Location**: `%APPDATA%\Claude\claude_desktop_config.json`  
**Full Path**: `C:\Users\[USERNAME]\AppData\Roaming\Claude\claude_desktop_config.json`

**Working Configuration**:
```json
{
  "globalShortcut": "Alt+Ctrl+Space",
  "mcpServers": {
    "r-acquaint": {
      "command": "C:\\PROGRA~1\\R\\R-45~1.0\\bin\\x64\\Rscript.exe",
      "args": ["-e", "acquaint::mcp_server()"]
    },
    "hf-mcp-server": {
      "command": "mcp-remote",
      "args": [
        "https://huggingface.co/mcp"
      ],
      "env": {
        "HF_TOKEN": "YOUR_HF_TOKEN_HERE"
      }
    }
  }
}
```

## Key Configuration Elements

### 1. R Integration (r-acquaint)
- **Purpose**: Connect to R/RStudio sessions for data analysis
- **Command**: Direct path to Rscript executable
- **Args**: Executes `acquaint::mcp_server()` in R session
- **Dependencies**: Requires acquaint package installed in R

### 2. Hugging Face Integration (hf-mcp-server)
- **Purpose**: Access Hugging Face models and datasets
- **Command**: `mcp-remote` (globally installed)
- **Authentication**: Environment variable `HF_TOKEN`
- **Endpoint**: `https://huggingface.co/mcp`

## Solution History

### Problem Solved
The primary issue was "cannot attach the server" error for Hugging Face MCP server.

### Root Causes Identified
1. **npx Package Download Issues**: Claude Desktop had trouble with `npx mcp-remote` package resolution
2. **Command Line Argument Parsing**: Windows command parsing issues with authentication headers
3. **Execution Context Differences**: Different behavior between command line and Claude Desktop process execution

### Evolution of Solutions

#### ❌ Failed Approaches
1. **Header Arguments**: `"Authorization: Bearer token"` failed due to Windows parsing
2. **npx Command**: `"command": "npx"` unreliable in GUI context
3. **Quoted Arguments**: Complex argument quoting caused parsing errors

#### ✅ Working Solution
1. **Global Installation**: `npm install -g mcp-remote` ensures reliability
2. **Direct Command**: `"command": "mcp-remote"` instead of `"command": "npx"`
3. **Environment Variables**: `"env": {"HF_TOKEN": "..."}` instead of command line headers
4. **Simplified Arguments**: Only URL in args, no complex header parameters

## Troubleshooting

### Common Issues

#### Issue 1: "Cannot attach the server"
**Symptoms**: Claude Desktop shows attachment error  
**Solution**: 
1. Verify global installation: `npm list -g mcp-remote`
2. Test command manually: `mcp-remote https://huggingface.co/mcp`
3. Check environment variable: `echo %HF_TOKEN%`

#### Issue 2: R Server Not Connecting
**Symptoms**: R integration not working  
**Solution**:
1. Verify R path: `"C:\\PROGRA~1\\R\\R-45~1.0\\bin\\x64\\Rscript.exe"`
2. Check acquaint installation: `requireNamespace("acquaint", quietly = TRUE)`
3. Start MCP session manually: `acquaint::mcp_session()`

#### Issue 3: Token Authentication Errors
**Symptoms**: HF server connects but fails authentication  
**Solution**:
1. Verify token validity at https://huggingface.co/settings/tokens
2. Check environment variable setting in config
3. Ensure token has appropriate permissions

### Diagnostic Commands

#### Test HF MCP Server
```cmd
REM Test basic connectivity
mcp-remote https://huggingface.co/mcp

REM Test with authentication
set HF_TOKEN=your_token_here
mcp-remote https://huggingface.co/mcp
```

#### Test R MCP Server
```r
# In RStudio
requireNamespace("acquaint", quietly = TRUE)
acquaint::mcp_session()
```

#### Verify Configuration
```cmd
REM Check file exists
dir "%APPDATA%\Claude\claude_desktop_config.json"

REM Check global package
npm list -g mcp-remote
```

## Configuration Variants

### Minimal Debug Configuration
For testing basic functionality:
```json
{
  "globalShortcut": "Alt+Ctrl+Space",
  "mcpServers": {
    "r-acquaint": {
      "command": "C:\\PROGRA~1\\R\\R-45~1.0\\bin\\x64\\Rscript.exe",
      "args": ["-e", "acquaint::mcp_server()"]
    }
  }
}
```

### R-Only Configuration
For users who only need R integration:
```json
{
  "globalShortcut": "Alt+Ctrl+Space",
  "mcpServers": {
    "r-acquaint": {
      "command": "C:\\PROGRA~1\\R\\R-45~1.0\\bin\\x64\\Rscript.exe",
      "args": ["-e", "acquaint::mcp_server()"]
    }
  }
}
```

## Best Practices

### 1. Configuration Management
- Always backup configuration before changes
- Test changes manually before applying to Claude Desktop
- Use version control for configuration files when possible

### 2. Security
- Store sensitive tokens in environment variables
- Avoid hardcoding tokens in configuration files
- Regularly rotate authentication tokens

### 3. Maintenance
- Keep global npm packages updated: `npm update -g mcp-remote`
- Monitor for new versions of acquaint package
- Test configuration after system updates

## Integration with Claude Code (WSL)

### Separate Configuration
Claude Code (WSL) has its own configuration in `~/.claude.json`:
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

### Key Differences
- **Claude Desktop**: Windows-style paths and npm packages
- **Claude Code**: WSL/Linux-style paths and commands
- **Independence**: Both can connect to the same MCP servers simultaneously

## Environment Setup

### R Session Configuration
Add to `.Rprofile` in your project root:
```r
# Activate renv if available
if (file.exists("renv/activate.R")) {
  source("renv/activate.R")
}

# Load acquaint MCP session if package is available
if (requireNamespace("acquaint", quietly = TRUE)) {
  acquaint::mcp_session()
}
```

### Environment Variables
Create `.Renviron` file (git-ignored):
```
RSTUDIO_PANDOC="C:/Program Files/RStudio/resources/app/bin/quarto/bin/tools"
HF_TOKEN=your_huggingface_token_here
```

## Verification Steps

### 1. Pre-Deployment Checklist
- [ ] Global mcp-remote installed
- [ ] R path correct for your installation
- [ ] Acquaint package installed in R
- [ ] HF token valid and has permissions
- [ ] Configuration file syntax is valid JSON

### 2. Post-Deployment Verification
- [ ] Claude Desktop restarts without errors
- [ ] R MCP server shows as connected
- [ ] HF MCP server shows as connected
- [ ] Both servers respond to test queries

### 3. Functionality Testing
- [ ] R data analysis commands work
- [ ] Hugging Face model queries work
- [ ] No error messages in Claude Desktop
- [ ] Responses include data from both servers

## Related Documentation

- **Main Configuration**: `/mnt/d/dev/p/CLAUDE.md`
- **WSL Integration**: `development-guides/wsl-rstudio-claude-integration.md`
- **Quick Reference**: `development-guides/quick-reference.md`
- **Troubleshooting**: `development-guides/claude-desktop-mcp-troubleshooting.md`

## Legacy Files (To Be Removed)

The following files are superseded by this document:
- `CLAUDE_DESKTOP_FINAL_SOLUTION.md`
- `CLAUDE_DESKTOP_QUICK_FIX.md`
- `CLAUDE_DESKTOP_SOLUTIONS.md`
- `SUCCESSFUL_MCP_SETUP.md`
- `claude-desktop-config-*.json` (various test configurations)

## Support

For issues:
1. Check this document first
2. Review diagnostic commands
3. Test manually before reporting
4. Include configuration and error messages when seeking help

---

**Configuration Status**: ✅ Production Ready  
**Last Verified**: July 4, 2025  
**Working Environment**: Windows 11 + Claude Desktop + R + WSL
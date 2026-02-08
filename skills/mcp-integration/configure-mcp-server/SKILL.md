---
name: configure-mcp-server
description: >
  Configure MCP (Model Context Protocol) servers for Claude Code and
  Claude Desktop. Covers mcptools setup, Hugging Face integration,
  WSL path handling, and multi-client configuration.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: mcp-integration
  complexity: intermediate
  language: multi
  tags: mcp, claude-code, claude-desktop, mcptools, configuration
---

# Configure MCP Server

Set up MCP server connections for Claude Code (WSL) and Claude Desktop (Windows).

## When to Use

- Setting up Claude Code to connect to R via mcptools
- Configuring Claude Desktop with MCP servers
- Adding Hugging Face or other remote MCP servers
- Troubleshooting MCP connectivity between tools

## Inputs

- **Required**: MCP server type (mcptools, Hugging Face, custom)
- **Required**: Client (Claude Code, Claude Desktop, or both)
- **Optional**: Authentication tokens
- **Optional**: Custom server implementation

## Procedure

### Step 1: Install MCP Server Packages

**For R (mcptools)**:

```r
install.packages("remotes")
remotes::install_github("posit-dev/mcptools")
```

**For Hugging Face**:

```bash
npm install -g mcp-remote
```

### Step 2: Configure Claude Code (WSL)

**R mcptools server**:

```bash
claude mcp add r-mcptools stdio \
  "/mnt/c/Program Files/R/R-4.5.0/bin/Rscript.exe" \
  -- -e "mcptools::mcp_server()"
```

**Hugging Face server**:

```bash
claude mcp add hf-mcp-server \
  -e HF_TOKEN=your_token_here \
  -- mcp-remote https://huggingface.co/mcp
```

**Verify configuration**:

```bash
claude mcp list
claude mcp get r-mcptools
```

### Step 3: Configure Claude Desktop (Windows)

Edit `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "r-mcptools": {
      "command": "C:\\PROGRA~1\\R\\R-45~1.0\\bin\\x64\\Rscript.exe",
      "args": ["-e", "mcptools::mcp_server()"]
    },
    "hf-mcp-server": {
      "command": "mcp-remote",
      "args": ["https://huggingface.co/mcp"],
      "env": {
        "HF_TOKEN": "your_token_here"
      }
    }
  }
}
```

**Important**: Use 8.3 short paths for Windows directories with spaces (`PROGRA~1` not `Program Files`). Use environment variables for tokens, not `--header` arguments.

### Step 4: Configure R Session for MCP

Add to project `.Rprofile`:

```r
if (requireNamespace("mcptools", quietly = TRUE)) {
  mcptools::mcp_session()
}
```

This starts the MCP session automatically when opening the project in RStudio.

### Step 5: Verify Connections

**Test R MCP from WSL**:

```bash
"/mnt/c/Program Files/R/R-4.5.0/bin/Rscript.exe" -e "mcptools::mcp_server()"
```

**Test from within Claude Code**:

Start Claude Code and use MCP tools — they should appear in the tool list.

**Test Claude Desktop**:

Restart Claude Desktop after configuration changes. Check for MCP server indicators in the UI.

### Step 6: Multi-Server Configuration

Both Claude Code and Claude Desktop support multiple MCP servers simultaneously:

```bash
# Claude Code: add multiple servers
claude mcp add r-mcptools stdio "/path/to/Rscript.exe" -- -e "mcptools::mcp_server()"
claude mcp add hf-mcp-server -e HF_TOKEN=token -- mcp-remote https://huggingface.co/mcp
claude mcp add custom-server stdio "/path/to/server" -- --port 3001
```

## Validation

- [ ] `claude mcp list` shows all configured servers
- [ ] R MCP server responds to tool calls
- [ ] Hugging Face MCP server authenticates and responds
- [ ] Both Claude Code and Claude Desktop can connect (if both configured)
- [ ] MCP tools appear in the tool list during sessions

## Common Pitfalls

- **Windows path spaces**: Use 8.3 short names or quote paths correctly. Different tools parse paths differently.
- **Token in command args**: On Windows, `--header "Authorization: Bearer token"` fails due to parsing. Use environment variables instead.
- **Confusing Claude Code and Claude Desktop configs**: These are separate tools with separate config files (`~/.claude.json` vs `%APPDATA%\Claude\`)
- **npx vs global install**: `npx mcp-remote` may fail in Claude Desktop context. Install globally with `npm install -g mcp-remote`.
- **mcptools version**: Ensure mcptools is up to date. It requires the `ellmer` package as a dependency.

## Related Skills

- `build-custom-mcp-server` - creating your own MCP server
- `troubleshoot-mcp-connection` - debugging connection issues
- `setup-wsl-dev-environment` - WSL setup prerequisite

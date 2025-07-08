# Claude Desktop MCP Server Troubleshooting Guide

## Common Issue: Hugging Face MCP Server Connection Failure

### Problem Description
Claude Desktop on Windows shows "cannot attach the server" error when trying to connect to the Hugging Face MCP server, while Claude Code in WSL works fine.

### Root Cause
**Command line argument parsing differences between Windows and WSL environments.**

The issue occurs when Windows Command Prompt incorrectly parses quoted header arguments in the MCP server configuration.

### Evidence
- **WSL (Working)**: `Using custom headers: {"Authorization":" Bearer hf_token"}`
- **Windows (Failing)**: `Warning: ignoring invalid header argument: "Authorization:`

### Solutions

#### Solution 1: Globally Install mcp-remote + Environment Variables (RECOMMENDED ✅)

**Step 1**: Install mcp-remote globally
```cmd
npm install -g mcp-remote
```

**Step 2**: Use this configuration
```json
{
  "mcpServers": {
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

**Why this works:**
- Avoids npx package download issues in Claude Desktop execution context
- Uses environment variables instead of problematic command line headers
- Globally installed package ensures reliable availability

#### Solution 2: Alternative Header Format (LEGACY - NOT RECOMMENDED)
```json
{
  "mcpServers": {
    "hf-mcp-server": {
      "command": "C:\\Program Files\\nodejs\\npx.cmd",
      "args": [
        "mcp-remote",
        "https://huggingface.co/mcp",
        "--header",
        "Authorization:Bearer YOUR_HF_TOKEN_HERE"
      ]
    }
  }
}
```

**Note**: This approach still has reliability issues with npx package downloads in Claude Desktop. Use Solution 1 instead.

#### Solution 3: Use Alternative Transport
If mcp-remote supports it, try using SSE instead of HTTP:
```json
{
  "mcpServers": {
    "hf-mcp-server": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://huggingface.co/mcp",
        "--transport",
        "sse",
        "--header",
        "Authorization=Bearer YOUR_HF_TOKEN_HERE"
      ]
    }
  }
}
```

### Diagnostic Commands

#### Check npx availability:
```bash
# Windows
where npx
npx --version

# WSL
which npx
npx --version
```

#### Test mcp-remote connection:
```bash
# Test command (replace with your token)
npx mcp-remote https://huggingface.co/mcp --header "Authorization: Bearer YOUR_TOKEN"
```

#### Check Hugging Face API connectivity:
```bash
curl -I "https://huggingface.co/mcp"
```

### Key Differences: Claude Desktop vs Claude Code

| Aspect | Claude Desktop (Windows) | Claude Code (WSL) |
|--------|-------------------------|-------------------|
| Environment | Windows Command Prompt | Linux/Bash |
| Configuration File | `%APPDATA%\Claude\claude_desktop_config.json` | `~/.claude.json` |
| Argument Parsing | Windows-style quoting | Unix-style quoting |
| Node.js Path | `C:\Program Files\nodejs\` | Via NVM in WSL |

### Best Practices

1. **Always test MCP server commands manually** before adding to configuration
2. **Use full paths** for executables when possible on Windows
3. **Consider environment variables** for sensitive tokens
4. **Keep separate configurations** for different environments
5. **Monitor Claude Desktop logs** for connection errors

### Related Files
- `@development-guides/wsl-rstudio-claude-integration.md` - WSL setup guide
- `/mnt/d/dev/p/CLAUDE.md` - Project-specific MCP server configurations

### Environment-Specific Notes

#### Windows (Claude Desktop)
- Uses Windows Command Prompt for subprocess execution
- Different argument parsing and quoting rules
- May require full paths to executables
- Firewall settings can affect connections

#### WSL (Claude Code)
- Uses Bash for subprocess execution
- Unix-style argument parsing
- npm/npx via NVM installation
- Better handling of quoted arguments

### Testing Your Configuration

1. **Test manual command execution** in respective environments
2. **Check Claude Desktop logs** for specific error messages
3. **Verify network connectivity** to MCP endpoints
4. **Confirm token validity** and permissions
5. **Try alternative authentication methods** if available
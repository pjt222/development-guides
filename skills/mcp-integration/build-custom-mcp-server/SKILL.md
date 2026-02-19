---
name: build-custom-mcp-server
description: >
  Build a custom MCP (Model Context Protocol) server that exposes
  domain-specific tools to AI assistants. Covers server implementation
  in Node.js or R, tool definitions, transport configuration, and testing
  with Claude Code. Use when you need to expose custom functionality beyond
  what mcptools provides, when building specialized domain-specific AI
  integrations, or when wrapping existing APIs or services as MCP tools.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: mcp-integration
  complexity: advanced
  language: multi
  tags: mcp, server, custom-tools, node-js, protocol
---

# Build Custom MCP Server

Create a custom MCP server that exposes domain-specific tools to AI assistants.

## When to Use

- Need to expose custom functionality to Claude Code or Claude Desktop
- Building specialized tools beyond what mcptools provides
- Creating a domain-specific AI assistant integration
- Wrapping existing APIs or services as MCP tools

## Inputs

- **Required**: List of tools to expose (name, description, parameters, behavior)
- **Required**: Implementation language (Node.js or R)
- **Required**: Transport type (stdio or HTTP)
- **Optional**: Authentication requirements
- **Optional**: Docker packaging needs

## Procedure

### Step 1: Define Tool Specifications

Before writing code, define each tool:

```yaml
tools:
  - name: query_database
    description: Execute a read-only SQL query against the analysis database
    parameters:
      query:
        type: string
        description: SQL SELECT query to execute
        required: true
      limit:
        type: integer
        description: Maximum rows to return
        default: 100
    returns: JSON array of result rows

  - name: run_analysis
    description: Execute a predefined statistical analysis by name
    parameters:
      analysis_name:
        type: string
        description: Name of the analysis to run
        enum: [descriptive, regression, survival]
      dataset:
        type: string
        description: Dataset identifier
        required: true
```

### Step 2: Implement in Node.js (Using MCP SDK)

```javascript
// server.js
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "my-analysis-server",
  version: "1.0.0",
});

// Define tools
server.tool(
  "query_database",
  "Execute a read-only SQL query against the analysis database",
  {
    query: z.string().describe("SQL SELECT query"),
    limit: z.number().default(100).describe("Max rows to return"),
  },
  async ({ query, limit }) => {
    // Validate read-only
    if (!/^\s*SELECT/i.test(query)) {
      return {
        content: [{ type: "text", text: "Error: Only SELECT queries allowed" }],
        isError: true,
      };
    }

    const results = await executeQuery(query, limit);
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }
);

server.tool(
  "run_analysis",
  "Execute a predefined statistical analysis",
  {
    analysis_name: z.enum(["descriptive", "regression", "survival"]),
    dataset: z.string().describe("Dataset identifier"),
  },
  async ({ analysis_name, dataset }) => {
    const result = await runAnalysis(analysis_name, dataset);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// Start server with stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Step 3: Implement in R (Using mcptools)

```r
# server.R
library(mcptools)

# Register custom tools
mcp_tool(
  name = "query_database",
  description = "Execute a read-only SQL query",
  parameters = list(
    query = list(type = "string", description = "SQL SELECT query"),
    limit = list(type = "integer", description = "Max rows", default = 100)
  ),
  handler = function(query, limit = 100) {
    if (!grepl("^\\s*SELECT", query, ignore.case = TRUE)) {
      stop("Only SELECT queries allowed")
    }
    result <- DBI::dbGetQuery(con, paste(query, "LIMIT", limit))
    jsonlite::toJSON(result, auto_unbox = TRUE)
  }
)

# Start server
mcptools::mcp_server()
```

### Step 4: Set Up Project Structure

```
my-mcp-server/
├── package.json          # Node.js dependencies
├── server.js             # Server implementation
├── tools/                # Tool implementations
│   ├── database.js
│   └── analysis.js
├── test/                 # Tests
│   └── tools.test.js
├── Dockerfile            # Container packaging
└── README.md             # Setup instructions
```

### Step 5: Test the Server

**Manual testing with stdio**:

```bash
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node server.js
```

**Register with Claude Code**:

```bash
claude mcp add my-server stdio "node" "/path/to/server.js"
```

**Verify tools appear**:

Start a Claude Code session and check that custom tools are listed and functional.

### Step 6: Add Error Handling

```javascript
server.tool("risky_operation", "...", schema, async (params) => {
  try {
    const result = await performOperation(params);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});
```

### Step 7: Package for Distribution

Create a `package.json` with a bin entry:

```json
{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "bin": {
    "my-mcp-server": "./server.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.22.0"
  }
}
```

Users can then install and configure:

```bash
npm install -g my-mcp-server
claude mcp add my-server stdio "my-mcp-server"
```

## Validation

- [ ] Server starts without errors
- [ ] `tools/list` returns all defined tools with correct schemas
- [ ] Each tool executes correctly with valid input
- [ ] Tools return appropriate errors for invalid input
- [ ] Server works with Claude Code via stdio transport
- [ ] Tools are discoverable and usable in Claude sessions

## Common Pitfalls

- **Blocking operations**: MCP servers should handle requests asynchronously. Long-running operations block other tool calls.
- **Missing error handling**: Unhandled exceptions crash the server. Always wrap tool handlers in try/catch.
- **Schema mismatches**: Tool parameter schemas must exactly match what the handler expects
- **stdio buffering**: When using stdio transport, ensure output is flushed. Node.js buffers stdout by default.
- **Security**: MCP servers have the same access as the process. Validate inputs carefully, especially for shell commands or database queries.

## Related Skills

- `configure-mcp-server` - connect the built server to clients
- `troubleshoot-mcp-connection` - debug connectivity issues
- `containerize-mcp-server` - package the server in Docker

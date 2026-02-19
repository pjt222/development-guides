---
name: containerize-mcp-server
description: >
  Containerize an R-based MCP (Model Context Protocol) server using Docker.
  Covers mcptools integration, port exposure, stdio vs HTTP transport,
  and connecting Claude Code to the containerized server. Use when deploying
  an R MCP server without requiring a local R installation, creating a
  reproducible MCP server environment, running MCP servers alongside other
  containerized services, or distributing an MCP server to other developers.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: containerization
  complexity: advanced
  language: Docker
  tags: docker, mcp, mcptools, claude, container
---

# Containerize MCP Server

Package an R MCP server into a Docker container for portable deployment.

## When to Use

- Deploying an R MCP server without requiring a local R installation
- Creating a reproducible MCP server environment
- Running MCP servers alongside other containerized services
- Distributing an MCP server to other developers

## Inputs

- **Required**: R MCP server implementation (mcptools-based or custom)
- **Required**: Docker installed and running
- **Optional**: Additional R packages the server needs
- **Optional**: Transport mode (stdio or HTTP)

## Procedure

### Step 1: Create Dockerfile for MCP Server

```dockerfile
FROM rocker/r-ver:4.5.0

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libcurl4-openssl-dev \
    libssl-dev \
    libxml2-dev \
    libgit2-dev \
    libssh2-1-dev \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install R packages
RUN R -e "install.packages(c( \
    'remotes', \
    'ellmer' \
    ), repos='https://cloud.r-project.org/')"

# Install mcptools
RUN R -e "remotes::install_github('posit-dev/mcptools')"

# Set working directory
WORKDIR /workspace

# Expose MCP server ports
EXPOSE 3000 3001 3002

# Environment variables
ENV R_LIBS_USER=/workspace/renv/library
ENV RENV_PATHS_CACHE=/workspace/renv/cache

# Default: start MCP server
CMD ["R", "-e", "mcptools::mcp_server()"]
```

### Step 2: Create docker-compose.yml

```yaml
version: '3.8'

services:
  mcp-server:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: r-mcp-server
    image: r-mcp-server:latest

    volumes:
      - /path/to/projects:/workspace
      - renv-cache:/workspace/renv/cache

    stdin_open: true
    tty: true

    network_mode: "host"

    environment:
      - TERM=xterm-256color
      - R_LIBS_USER=/workspace/renv/library

    restart: unless-stopped

volumes:
  renv-cache:
    driver: local
```

Using `network_mode: "host"` ensures the MCP server ports are accessible on localhost.

### Step 3: Build and Start

```bash
docker compose build
docker compose up -d
```

**Expected**: Container starts with MCP server running.

**On failure**: Check logs with `docker compose logs mcp-server`. Common issues:
- Missing R packages: Add to Dockerfile RUN install step
- Port already in use: Change exposed port or stop conflicting service

### Step 4: Connect Claude Code to Container

For stdio transport (container must stay running with stdin):

```bash
claude mcp add r-mcp-docker stdio "docker" "exec" "-i" "r-mcp-server" "R" "-e" "mcptools::mcp_server()"
```

For HTTP transport (if the MCP server supports it):

```json
{
  "mcpServers": {
    "r-mcp-docker": {
      "type": "http",
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

### Step 5: Verify Connection

```bash
# Check container is running
docker ps | grep mcp-server

# Test R session inside container
docker exec -it r-mcp-server R -e "sessionInfo()"

# Verify mcptools is available
docker exec -it r-mcp-server R -e "library(mcptools)"
```

### Step 6: Add Custom MCP Tools

To add project-specific MCP tools, mount your R scripts:

```yaml
volumes:
  - ./mcp-tools:/mcp-tools
```

And load them in the CMD:

```dockerfile
CMD ["R", "-e", "source('/mcp-tools/custom_tools.R'); mcptools::mcp_server()"]
```

## Validation

- [ ] Container builds without errors
- [ ] MCP server starts inside the container
- [ ] Claude Code can connect to the containerized server
- [ ] MCP tools respond correctly to requests
- [ ] Container restarts cleanly
- [ ] Volume mounts allow access to project files

## Common Pitfalls

- **stdin/tty requirements**: MCP stdio transport requires `stdin_open: true` and `tty: true`
- **Network isolation**: Default Docker networking may prevent localhost access. Use `network_mode: "host"` or expose specific ports.
- **Package versions**: Pin mcptools to a specific commit for reproducibility
- **Large image size**: mcptools + dependencies can be large. Consider multi-stage builds for production.
- **Windows Docker paths**: When running Docker Desktop on Windows with WSL, path mapping differs

## Related Skills

- `create-r-dockerfile` - base Dockerfile patterns for R
- `setup-docker-compose` - compose configuration details
- `configure-mcp-server` - MCP server configuration without Docker
- `troubleshoot-mcp-connection` - debugging MCP connectivity issues

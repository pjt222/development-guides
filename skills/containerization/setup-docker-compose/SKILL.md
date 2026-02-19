---
name: setup-docker-compose
description: >
  Configure Docker Compose for multi-container R development environments.
  Covers service definitions, volume mounts, networking, environment
  variables, and development vs production configurations. Use when running
  R alongside other services (databases, APIs), setting up a reproducible
  R development environment, orchestrating an R-based MCP server container,
  or managing environment variables and volume mounts for R projects.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: containerization
  complexity: intermediate
  language: Docker
  tags: docker-compose, orchestration, development, volumes
---

# Set Up Docker Compose

Configure Docker Compose for R development and deployment environments.

## When to Use

- Running R alongside other services (databases, APIs)
- Setting up a reproducible development environment
- Orchestrating an R-based MCP server container
- Managing environment variables and volume mounts

## Inputs

- **Required**: Dockerfile for the R service
- **Required**: Project directory to mount
- **Optional**: Additional services (database, cache, web server)
- **Optional**: Environment variable configuration

## Procedure

### Step 1: Create docker-compose.yml

```yaml
version: '3.8'

services:
  r-dev:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: r-dev
    image: r-dev:latest

    volumes:
      - .:/workspace
      - renv-cache:/workspace/renv/cache

    stdin_open: true
    tty: true

    environment:
      - TERM=xterm-256color
      - R_LIBS_USER=/workspace/renv/library
      - RENV_PATHS_CACHE=/workspace/renv/cache

    command: R

    restart: unless-stopped

volumes:
  renv-cache:
    driver: local
```

### Step 2: Add Additional Services (If Needed)

```yaml
services:
  r-dev:
    # ... as above
    depends_on:
      - postgres
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432

  postgres:
    image: postgres:16
    container_name: r-postgres
    environment:
      POSTGRES_DB: analysis
      POSTGRES_USER: ruser
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  renv-cache:
  pgdata:
```

### Step 3: Configure Networking

For services that need localhost access (e.g., MCP servers):

```yaml
services:
  r-dev:
    network_mode: "host"
```

For isolated networking:

```yaml
services:
  r-dev:
    networks:
      - app-network
    ports:
      - "3000:3000"

networks:
  app-network:
    driver: bridge
```

### Step 4: Manage Environment Variables

Create `.env` file (git-ignored):

```
R_VERSION=4.5.0
GITHUB_PAT=your_token_here
```

Reference in compose:

```yaml
services:
  r-dev:
    build:
      args:
        R_VERSION: ${R_VERSION}
    env_file:
      - .env
```

### Step 5: Build and Run

```bash
# Build images
docker compose build

# Start services
docker compose up -d

# Attach to R session
docker compose exec r-dev R

# View logs
docker compose logs -f r-dev

# Stop services
docker compose down
```

**Expected**: All services start. R session accessible.

**On failure**: Check `docker compose logs` for startup errors. Common: port conflicts, missing environment variables.

### Step 6: Create Override for Development

Create `docker-compose.override.yml` for local development settings:

```yaml
services:
  r-dev:
    volumes:
      - /path/to/local/packages:/extra-packages
    environment:
      - DEBUG=true
```

This is automatically merged with `docker-compose.yml`.

## Validation

- [ ] `docker compose build` completes without errors
- [ ] `docker compose up` starts all services
- [ ] Volume mounts correctly share files between host and container
- [ ] Environment variables are available inside containers
- [ ] Services can communicate with each other
- [ ] `docker compose down` cleanly stops everything

## Common Pitfalls

- **Volume mount permissions**: Linux containers may create files as root. Use `user:` directive or fix permissions.
- **Port conflicts**: Check for services already using the same ports on the host
- **Docker Desktop vs CLI**: `docker compose` (v2) vs `docker-compose` (v1). Use v2.
- **WSL path mounts**: Use `/mnt/c/...` paths when mounting Windows directories from WSL
- **Named volumes vs bind mounts**: Named volumes persist across rebuilds; bind mounts reflect host changes immediately

## Related Skills

- `create-r-dockerfile` - create the Dockerfile that compose references
- `containerize-mcp-server` - compose configuration for MCP servers
- `optimize-docker-build-cache` - speed up compose builds

# viz/Dockerfile — Containerised skillnet-viz pipeline (R + Node.js)
#
# Build context: repo root (development-guides/)
#   docker compose build        (from viz/)
#   docker build -f viz/Dockerfile .  (from repo root)

# === Stage 1: R environment with all dependencies ===========================
FROM rocker/r-ver:4.5.2 AS r-deps

# System libraries for ragg, magick, ggfx, and curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    libfreetype6-dev libpng-dev libtiff5-dev libjpeg-dev \
    libharfbuzz-dev libfribidi-dev libfontconfig1-dev \
    libmagick++-dev \
    libcurl4-openssl-dev libssl-dev libxml2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/viz

# renv lockfile-first pattern: only re-restore when deps change
COPY viz/renv.lock renv.lock
COPY viz/.Rprofile .Rprofile
COPY viz/renv/activate.R renv/activate.R
COPY viz/renv/settings.json renv/settings.json

# Tell renv to install into a container-local library
ENV RENV_PATHS_LIBRARY=/app/viz/renv/library
RUN R -e "source('renv/activate.R'); renv::restore(prompt = FALSE)"

# === Stage 2: Add Node.js and all source ====================================
FROM r-deps AS runtime

# Install Node.js 20.x via NodeSource
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl gnupg python3 \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# npm lockfile-first pattern: only re-install when deps change
COPY viz/package.json viz/package-lock.json ./
RUN npm ci --ignore-scripts

# Copy skills + agents (needed by build-data.js via ../skills/ relative path)
COPY skills/ /app/skills/
COPY agents/ /app/agents/

# Copy R source modules
COPY viz/R/ R/

# Copy top-level build scripts
COPY viz/generate-palette-colors.R viz/build-icons.R viz/build-agent-icons.R ./
COPY viz/build-data.js viz/build-icons.js viz/build-icon-manifest.js ./
COPY viz/sync-palette-colors.cjs ./

# Copy frontend
COPY viz/index.html ./
COPY viz/css/ css/
COPY viz/js/ js/

# Entrypoint
COPY viz/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create output directories (will be overlaid by volume mounts)
RUN mkdir -p icons data logs

EXPOSE 8080
ENTRYPOINT ["docker-entrypoint.sh"]

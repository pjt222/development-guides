#!/usr/bin/env bash
set -euo pipefail

# docker-entrypoint.sh — Sequential viz pipeline with progress logging
#
# Environment variables:
#   SKIP_EXISTING=1   Skip already-generated icon files (default: 1)
#   PALETTE=cyberpunk Build only one palette (default: all)
#   ONLY_DOMAIN=git   Build only one domain
#   SKIP_ICONS=1      Skip icon generation entirely (data-only rebuild)
#   DRY_RUN=1         List what would be generated without rendering

cd /app/viz

# ── Build R icon flags from environment ─────────────────────────────────
build_flags=()
if [[ "${SKIP_EXISTING:-1}" == "1" ]]; then
  build_flags+=(--skip-existing)
fi
if [[ -n "${PALETTE:-}" ]]; then
  build_flags+=(--palette "$PALETTE")
fi
if [[ -n "${ONLY_DOMAIN:-}" ]]; then
  build_flags+=(--only "$ONLY_DOMAIN")
fi
if [[ "${DRY_RUN:-0}" == "1" ]]; then
  build_flags+=(--dry-run)
fi

# ── If a custom command was passed, exec it instead ─────────────────────
if [[ $# -gt 0 ]]; then
  exec "$@"
fi

# ── Pipeline ────────────────────────────────────────────────────────────
step=0
total=7

step=$((step + 1))
echo "[$step/$total] Generating palette colors..."
Rscript generate-palette-colors.R

step=$((step + 1))
echo "[$step/$total] Syncing palette colors to JS..."
node sync-palette-colors.cjs

if [[ "${SKIP_ICONS:-0}" != "1" ]]; then
  step=$((step + 1))
  echo "[$step/$total] Building skill icons (flags: ${build_flags[*]:-none})..."
  Rscript build-icons.R "${build_flags[@]}"

  step=$((step + 1))
  echo "[$step/$total] Building agent icons (flags: ${build_flags[*]:-none})..."
  Rscript build-agent-icons.R "${build_flags[@]}"
else
  step=$((step + 2))
  echo "[$((step - 1))/$total] Skipping skill icons (SKIP_ICONS=1)"
  echo "[$step/$total] Skipping agent icons (SKIP_ICONS=1)"
fi

step=$((step + 1))
echo "[$step/$total] Building skills data..."
node build-data.js

step=$((step + 1))
echo "[$step/$total] Building icon manifests..."
node build-icon-manifest.js

step=$((step + 1))
echo "[$step/$total] Starting web server on port 8080..."
echo "  View at: http://localhost:8080"
exec python3 -m http.server 8080

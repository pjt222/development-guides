#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "=== Step 1/4: Generate palette colors (JSON + JS) ==="
Rscript generate-palette-colors.R

echo "=== Step 2/4: Generate skills.json from registries ==="
node build-data.js

echo "=== Step 3/4: Generate icon-manifest.json from skills.json ==="
node build-icon-manifest.js

echo "=== Step 4/4: Render all icons (standard + HD) ==="
Rscript build-all-icons.R --hd "$@"

echo "=== Done ==="

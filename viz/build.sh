#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "=== Step 1: Generate palette colors (JSON + JS) ==="
Rscript generate-palette-colors.R

echo "=== Step 2: Generate skills.json from registries ==="
node build-data.js

echo "=== Done ==="
echo "To render icons, run: Rscript build-icons.R [--only domain]"

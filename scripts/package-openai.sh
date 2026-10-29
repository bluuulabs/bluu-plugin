#!/usr/bin/env bash
# Builds the ZIP that OpenAI's plugin dashboard takes (platform.openai.com/plugins).
# Only committed files go in, so a stray local file never ships.
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/check.mjs
mkdir -p dist
version="$(node -p "require('./plugin.json').version")"
out="dist/bluu-openai-${version}.zip"
git archive --format=zip --output="$out" HEAD plugin.json mcp.json skills assets
echo "$out"

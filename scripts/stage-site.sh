#!/usr/bin/env bash
# Stage a public-only tree for GitHub Pages (C-53 / C-57).
# Keeps .cursor/ in git for Cursor; never copies it (or other internals) into _site/.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${1:-"$ROOT/_site"}"

rm -rf "$DEST"
mkdir -p "$DEST"

# Exclude internals at any depth. Leading-/ patterns are hub-root only so Cap
# mirrors keep their public docs/ (e.g. CarCap/docs/pitch.html).
rsync -a \
  --exclude '.git/' \
  --exclude '.github/' \
  --exclude '.cursor/' \
  --exclude '.claude/' \
  --exclude '.venv/' \
  --exclude '.DS_Store' \
  --exclude '.cursorrules' \
  --exclude 'node_modules/' \
  --exclude 'qa/' \
  --exclude 'tests/' \
  --exclude 'test-results/' \
  --exclude 'playwright-report/' \
  --exclude 'src/' \
  --exclude '_site/' \
  --exclude '/scripts/' \
  --exclude '/docs/' \
  --exclude 'package.json' \
  --exclude 'package-lock.json' \
  --exclude 'playwright.config.js' \
  --exclude 'playwright.config.cjs' \
  --exclude 'playwright.config.ts' \
  --exclude 'tsconfig.json' \
  --exclude 'vite.config.ts' \
  --exclude 'vite.config.js' \
  --exclude 'capacitor.config.json' \
  --exclude 'capacitor.config.ts' \
  --exclude 'HANDOVER.md' \
  --exclude 'ROADMAP.md' \
  --exclude 'ANNOUNCE.md' \
  --exclude 'CLAUDE.md' \
  --exclude 'AGENTS.md' \
  --exclude 'FEATURES.md' \
  --exclude 'AUDIT.md' \
  --exclude 'SECURITY.md' \
  --exclude 'PRIVACY.md' \
  --exclude 'SISTER-*.md' \
  --exclude '*.mdc' \
  "$ROOT"/ "$DEST"/

# Hard gate: never ship Cursor rules or QA/tooling trees
fail=0
for bad in \
  "$DEST/.cursor" \
  "$DEST/.github" \
  "$DEST/qa" \
  "$DEST/scripts" \
  "$DEST/docs" \
  "$DEST/package.json" \
  "$DEST/HANDOVER.md" \
  "$DEST/CarCap/CLAUDE.md" \
  "$DEST/CarCap/package.json" \
  "$DEST/PrismCap/.cursor" \
  "$DEST/PrismCap/qa" \
  "$DEST/PrismCap/src" \
  "$DEST/SoulCap/SISTER-REPLY-guided-path.md"
do
  if [[ -e "$bad" ]]; then
    echo "FAIL: staged forbidden path: ${bad#"$DEST"/}" >&2
    fail=1
  fi
done

# Required public surfaces (hub + hub-hosted Cap mirrors)
for need in \
  "$DEST/index.html" \
  "$DEST/.nojekyll" \
  "$DEST/privacy.html" \
  "$DEST/support.html" \
  "$DEST/assets/logo-D6E8rWk9.svg" \
  "$DEST/assets/index-DYhGqgLA.js" \
  "$DEST/js/products-data.js" \
  "$DEST/CarCap/index.html" \
  "$DEST/CarCap/docs/pitch.html" \
  "$DEST/TravelCap/index.html" \
  "$DEST/IdeaCap/index.html" \
  "$DEST/soulcap.html" \
  "$DEST/manifest.json"
do
  if [[ ! -e "$need" ]]; then
    echo "FAIL: missing required public path: ${need#"$DEST"/}" >&2
    fail=1
  fi
done

if [[ "$fail" -ne 0 ]]; then
  exit 1
fi

echo "OK — staged $(find "$DEST" -type f | wc -l | tr -d ' ') files to ${DEST#"$ROOT"/}"

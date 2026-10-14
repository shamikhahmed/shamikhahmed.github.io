#!/usr/bin/env bash
# C-57: stage an allowlisted GitHub Pages artifact.
# Usage: ALLOW_PATHS="index.html css js ..." bash stage-pages-site.sh [_site]
# Optional: SW_FILE=sw.js (default), FORBIDDEN_EXTRA="worker docs"
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# When copied into <app>/scripts/, ROOT is the app repo.
if [[ "$(basename "$(dirname "$0")")" == "scripts" ]]; then
  ROOT="$(cd "$(dirname "$0")/.." && pwd)"
fi
DEST="${1:-"$ROOT/_site"}"
SW_FILE="${SW_FILE:-sw.js}"

if [[ -z "${ALLOW_PATHS:-}" ]]; then
  echo "FAIL: ALLOW_PATHS is required" >&2
  exit 1
fi

rm -rf "$DEST"
mkdir -p "$DEST"
# Always ship .nojekyll so GitHub Pages does not run Jekyll.
if [[ -f "$ROOT/.nojekyll" ]]; then
  cp -a "$ROOT/.nojekyll" "$DEST/.nojekyll"
else
  touch "$DEST/.nojekyll"
fi

stage() {
  local p="$1"
  if [[ ! -e "$ROOT/$p" ]]; then
    return 0
  fi
  if [[ -d "$ROOT/$p" ]]; then
    mkdir -p "$DEST/$p"
    rsync -a "$ROOT/$p/" "$DEST/$p/"
  else
    local dir
    dir="$(dirname "$p")"
    if [[ "$dir" != "." ]]; then
      mkdir -p "$DEST/$dir"
    fi
    cp -a "$ROOT/$p" "$DEST/$p"
  fi
}

# shellcheck disable=SC2086
for p in $ALLOW_PATHS; do
  stage "$p"
done

fail=0
for bad in \
  qa docs worker tests test-results playwright-report node_modules \
  .cursor .github .claude .venv memory ios ios-templates www \
  HANDOVER.md CLAUDE.md AGENTS.md SECURITY.md AUDIT.md FEATURES.md \
  ROADMAP.md README.md CHANGELOG.md PRIVACY.md LICENSE \
  package.json package-lock.json playwright.config.js playwright.config.cjs \
  playwright.config.ts capacitor.config.json capacitor.config.ts \
  tsconfig.json vite.config.ts vite.config.js \
  ${FORBIDDEN_EXTRA:-}
do
  if [[ -e "$DEST/$bad" ]]; then
    echo "FAIL: staged forbidden path: $bad" >&2
    fail=1
  fi
done

if [[ ! -f "$DEST/index.html" ]]; then
  echo "FAIL: missing index.html in artifact" >&2
  fail=1
fi

if [[ -f "$ROOT/scripts/verify-pages-artifact.cjs" ]]; then
  node "$ROOT/scripts/verify-pages-artifact.cjs" "$DEST" "$SW_FILE" || fail=1
fi

if [[ "$fail" -ne 0 ]]; then
  exit 1
fi

echo "OK — staged $(find "$DEST" -type f | wc -l | tr -d ' ') files → ${DEST#"$ROOT"/}"

# shamikhahmed.github.io — Roadmap

> Updated 2026-10-14. Fleet order & standard: `capricorn-tooling/shared/CAP-STANDARD.md`.

## Now — hub 1.4.0 / Capricorn OS 1.1.0

Ten themes, iPad mode, phone dock + app sheets, live catalog, Privacy Monitor, honest copy, no third-party requests on any page. See `CHANGELOG.md`.

## Next (ordered)

1. **VERSION.json for AuraCap + CookCap** — the two Caps the live catalog can't read yet (they fall back to `products.js`).
2. **Fresh screenshots** — hub shots lag the apps (PulseCap shows v4.5.1). Regenerate per Cap (`scripts/capture-screenshots.mjs`) and redeploy the OS; CookCap still uses a placeholder.
3. **Classic site refresh** — `about.html` / `sovereignty.html` / `solutions.html` use the 2026-06 design system; give them the OS theme tokens (or one shared light theme) so "Classic site" doesn't feel like a different company.
4. **OG image per theme** — `?theme=` links share a themed preview.
5. **Theme ideas backlog** — seasonal (Eid lanterns, monsoon), user-built accent picker, per-Cap themes inside each app (see capricorn-lab HANDOVER).

## Later

- Custom domain decision
- Self-hosted, privacy-preserving visit counter (no third party) — only if it can be shown in Privacy Monitor

## Ground rules

- No dirty trees: commit or discard before ending a session.
- CI green before tag; tag `vX.Y.Z` per release.
- Never commit `.env` / secrets. Never add third-party scripts, fonts or trackers.

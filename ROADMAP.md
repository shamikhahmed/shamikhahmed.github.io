# shamikhahmed.github.io — Roadmap

> Updated 2026-07-11. Fleet order & standard: `capricorn-tooling/shared/CAP-STANDARD.md`.

## Now — v0.10.1 (Capricorn OS)
Current shipped state. See `CHANGELOG.md` for how we got here.

## Cap Standard gaps
| Cap Standard item | Status |
|---|---|
| Docs pack | 🟡 |
| Screen gallery | ❌ |
| Version discipline | ✅ |
| QA / e2e | ❌ |
| CI gate | ❌ |
| PWA polish | ✅ |
| Demo mode | ❌ |

## Next (ordered)
1. Catalog sync automation: app versions/screenshots on catalog pages drift from app repos — script to pull VERSION.json + latest gallery shots from each app
2. CI: link checker + Pages deploy workflow (currently direct push, no checks)
3. Add ScentCap v1.3.0 + MasteryCap + IdeaCap to catalog if missing
4. Prune the three backup dirs once OS homepage is stable (they live outside git)

## Later
- Custom domain decision
- Analytics-free visit counter?

## Ground rules
- No dirty trees: commit or discard before ending a session.
- CI green before tag; tag `vX.Y.Z` per release.
- Bump SW cache with any asset change (PWA apps).
- Never commit `.env` / secrets.

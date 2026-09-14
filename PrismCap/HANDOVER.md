# PrismCap — Handover

> Read this + `ROADMAP.md` + `~/Capricorn-Brain/01 Projects/PrismCap.md` before working here.
> Last updated: 2026-09-14 · Fleet-wide standard: `capricorn-tooling/shared/CAP-STANDARD.md`

## What this is
39 offline Pass & Play games PWA (former PrismCap / Prism branding merged in).

## Facts
**Version:** 4.5.0 / SW `prismcap-v450`
**Live:** https://shamikhahmed.github.io/PrismCap
**Repo:** https://github.com/shamikhahmed/PrismCap
**Stack:** Vanilla JS PWA. Game registry pattern (`js/games/`). Playwright tests.
**Data:** Local storage for scores/settings. Fully offline.

## Run & verify
```bash
python3 -m http.server 8767   # or npm run serve
npm run verify                # Playwright smoke
npm run gallery               # shell screens (CAPTURE_GALLERY=1)
```

## Architecture
- `js/app.js` — shell, toasts, settings, keyboard tab cycling, SW register `?v=438`
- `js/games/` — one module per game (example-game.js is the template)
- `js/cap-demo-mode.js`, `js/cap-desktop-nav.js` — added 2026-07-11
- `public/` — Capricorn OS brand icons (also mirrored to root for PWA)
- `css/capricorn-core.css` — shared design system

## Cap Standard status (2026-07-19)
| Cap Standard item | Status |
|---|---|
| Docs pack | ✅ |
| Screen gallery | ✅ (shell; game-session deferred) |
| Version discipline | ✅ |
| QA / e2e | ✅ |
| CI gate | ✅ |
| PWA polish | ✅ |
| Demo mode | ✅ |

Gaps are tracked as tasks in `ROADMAP.md`.

## Gotchas — read before coding
- Toast recursion bug fixed in bf23028 — don't call toast from within toast dismiss handlers.
- Keyboard tab cycling is deliberate a11y work — regression-test when touching nav.

## Where decisions live
- Dated decisions: Capricorn-Brain project note (path above)
- Release history: `CHANGELOG.md`
- Fleet-level events: `Cap-Apps/docs/CHANGELOG.md` (master)

## Hub deploy
```bash
rsync -a --delete \
  --exclude .git --exclude node_modules --exclude test-results --exclude playwright-report \
  ./ /Users/shamikhahmed/Projects/Cap/Cap-Apps/shamikhahmed.github.io/PrismCap/
```
Commit + push hub repo. Bump VERSION.json + SW together.

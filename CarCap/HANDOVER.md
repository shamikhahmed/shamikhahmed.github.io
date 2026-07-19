# CarCap — Handover

> Read this + `ROADMAP.md` + `~/Capricorn-Brain/01 Projects/CarCap.md` before working here.  
> Last updated: 2026-07-19 · Cap Standard: `capricorn-tooling/shared/CAP-STANDARD.md`

## What this is
Offline-first car garage PWA (Cap family). Vehicles, service + reminders, fuel/odometer, docs wallet (text/meta).

## Facts
**Version:** 0.2.0  
**Live:** https://shamikhahmed.github.io/CarCap/ (rsync from this repo)  
**Repo:** shamikhahmed/CarCap  
**Stack:** vanilla JS PWA — `index.html`, `css/`, `js/app.js` + `js/storage.js`, `manifest.json`, `sw.js` (`carcap-v3`)  
**Data:** `localStorage` key `carcap_v1` via `S`

## Run & verify
```bash
cd /Users/shamikhahmed/Desktop/Cap-Apps/CarCap
npm start          # npx serve . -p 8790
npm run check      # node --check JS
npm run test:e2e   # Playwright smoke
npm run verify     # check + e2e
# open http://localhost:8790/?demo=1
# pitch: docs/pitch.html
```

## Architecture
- Tab router in `js/app.js` (`go(tab)`): Today | Garage | Service | Fuel | Docs | Settings
- `go()` preserves `demo=1` (and other query params) when updating `tab`
- First-run sheet until `meta.onboarded` (Add car / Try demo)
- Storage CRUD + demo seed + JSON backup in `js/storage.js`
- Dark UI, system fonts, accent `#FF6B4A`, safe-area insets
- Icons in `icons/` (mark, 192/512, maskable, apple-touch, favicon)

## Cap Standard status (2026-07-19)
| Cap Standard item | Status |
|---|---|
| Docs pack | ✅ |
| Screen gallery | 🟡 basic HTML (Playwright captures later) |
| Version discipline | ✅ 0.2.0 / carcap-v3 |
| QA / e2e | ✅ smoke (`tests/smoke.spec.js`) |
| CI gate | ❌ deferred |
| PWA polish | ✅ MVP |
| Demo mode | ✅ |

## Gotchas
- Docs are text/meta only — no photo wallet yet.
- L/100 needs ≥2 consecutive full-tank entries with rising odometer.
- Demo **replaces** local data — confirm in UI.
- Bump `VERSION.json`, `window.APP_VERSION`, `sw.js` `CACHE`, and SW register query together.

## Where decisions live
- Capricorn-Brain: `01 Projects/CarCap.md`
- Release history: `CHANGELOG.md`
- Features matrix: `FEATURES.md`

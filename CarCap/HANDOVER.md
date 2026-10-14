# CarCap — Handover

> Read this + `ROADMAP.md` + `~/Capricorn-Brain/01 Projects/CarCap.md` before working here.  
> Last updated: 2026-10-14 · Cap Standard: `capricorn-tooling/shared/CAP-STANDARD.md` · Perfection v3: `qa/perfection/STATE.md`

## What this is
Offline-first car garage PWA (Cap family). Vehicles, service + reminders, fuel/odometer, docs wallet with optional photos.

## Facts
**Version:** 1.1.0  
**Live:** https://shamikhahmed.github.io/CarCap/ (rsync from this repo into hub)  
**Repo:** shamikhahmed/CarCap  
**Stack:** vanilla JS PWA — `index.html`, `css/`, `js/brand/colors.js` + `js/app.js` + `js/storage.js` + `js/photos.js` + `js/dialogs.js`, `manifest.json`, `sw.js` (`carcap-v9`)  
**Data:** `localStorage` key `carcap_v1` via `S`; photos in IndexedDB `carcap_photos`

## Run & verify
```bash
cd /Users/shamikhahmed/Projects/Cap/Cap-Apps/CarCap
export PW_CORE=/Users/shamikhahmed/Projects/Cap/Cap-Apps/MasteryCap/node_modules/playwright-core
export PLAYWRIGHT_BROWSERS_PATH=$HOME/Library/Caches/ms-playwright
npm start          # npx serve . -p 8790
npm run check      # node --check JS
npm run test:e2e   # Playwright (gallery skipped)
npm run verify     # check + e2e
npm run gallery    # CAPTURE_GALLERY=1 · 36 WebP shots
npm run gallery:view  # open /screen-gallery.html
# open http://localhost:8790/?demo=1
```

## Hub deploy (CAR-V3-3 — Hub Engineer)
App is **hub-hosted**. After Auditor VERIFIED + Phase I release bump, Hub Engineer rsyncs:

```bash
rsync -a --delete \
  --exclude node_modules --exclude .git --exclude test-results --exclude tests \
  --exclude qa --exclude playwright.config.js --exclude package-lock.json \
  /Users/shamikhahmed/Projects/Cap/Cap-Apps/CarCap/ \
  /Users/shamikhahmed/Projects/Cap/Cap-Apps/shamikhahmed.github.io/CarCap/
```
Commit + push hub repo. Bump `VERSION.json`, `window.APP_VERSION`, `sw.js` `CACHE`, and SW register query together (G-8).

## Architecture
- Tab router in `js/app.js` (`go(tab)`): Today | Garage | Service | Fuel | Docs | Settings
- Coming up (P-CAR-1): service due + insurance/registration within 30 days
- ConfirmDialog in `js/dialogs.js` (no native confirm)
- Photos: `js/photos.js` (2 MB max, G-6 schema v2)

## Gotchas
- L/100 needs ≥2 consecutive full-tank entries with rising odometer.
- Sample data **replaces** local data — ConfirmDialog in UI.
- Export JSON does not include photo blobs (notes + photoId only).

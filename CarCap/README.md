# CarCap

Service, fuel and documents for your cars.

**Version:** 1.0.1 · **SW cache:** `carcap-v8` · Capricorn Systems

## Features

- **Garage** — make / model / year / plate (+ optional nickname)
- **Service** — log type, date, odometer, cost, notes, reminder date
- **Fuel** — liters, cost, odometer, full-tank flag; L/100 from ≥2 full tanks
- **Docs** — title / insurance / registration notes + optional photos (IndexedDB, max 2 MB)
- **Today** — Coming up (30 days), overdue banners, recent activity
- **Settings** — sample data, JSON export/import, erase, optional notifications, privacy/support
- **PWA** — installable, offline via service worker

## Quick start

```bash
cd /Users/shamikhahmed/Projects/Cap/Cap-Apps/CarCap
npm start
```

Open http://localhost:8790 — or `?demo=1` for sample data.

```bash
npm run check
npm run test:e2e
npm run verify
```

## Deploy

Live at https://shamikhahmed.github.io/CarCap/ via hub sync:

```bash
rsync -a --delete \
  --exclude node_modules --exclude .git --exclude test-results --exclude tests \
  --exclude qa --exclude playwright.config.js --exclude package-lock.json \
  /Users/shamikhahmed/Projects/Cap/Cap-Apps/CarCap/ \
  /Users/shamikhahmed/Projects/Cap/Cap-Apps/shamikhahmed.github.io/CarCap/
```

Then commit and push `shamikhahmed.github.io`.

## Privacy

See [privacy.html](./privacy.html) and [PRIVACY.md](./PRIVACY.md).

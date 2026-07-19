# CarCap

Offline-first vehicle PWA — garage, service log, fuel/odometer, and a docs wallet.

**Version:** 0.1.0 · **SW cache:** `carcap-v1` · Capricorn Systems (Cap family)

## Features (v0.1.0)

- **Garage** — make / model / year / plate (+ optional nickname)
- **Service** — log type, date, odometer, cost, notes, reminder date
- **Fuel** — liters, cost, odometer, full-tank flag; simple L/100 from full tanks
- **Docs** — title / insurance / registration notes (text + expiry; photos later)
- **Today** — active vehicle snapshot, reminders, recent activity
- **Settings** — demo mode, reset, install tips
- **PWA** — installable, offline via service worker

## Quick start

```bash
cd /Users/shamikhahmed/Desktop/Cap-Apps/CarCap
npm start
# or: npm run serve
```

Open http://localhost:8790 — or `?demo=1` for seeded data.

```bash
npm run check   # syntax-check JS
```

## Stack

Vanilla JS · no framework · no bundler · `localStorage` via `S` helper · dark Apple-like UI (accent `#FF6B4A`)

## Key files

| Path | Role |
|------|------|
| `index.html` | Shell + tabs |
| `css/app.css` | UI |
| `js/storage.js` | `S` + demo seed |
| `js/app.js` | Screens + modals |
| `sw.js` | Cache `carcap-v1` |
| `manifest.json` | PWA manifest |
| `VERSION.json` | Version truth |
| `screen-gallery.html` | Screen index (captures later) |

## Demo

Settings → **Load demo**, or open `/?demo=1`. Seeds one 2019 Toyota Corolla with sample service, fuel, and docs.

## Privacy

All data stays in the browser. No accounts, no cloud sync in v0.1.0.

## License

MIT — Shamikh Ahmed / Capricorn Systems. See `LICENSE`.

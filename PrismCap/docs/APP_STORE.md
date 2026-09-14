# PrismCap — App Store / TestFlight Prep

## Current state
- **Shipped as PWA** on GitHub Pages (Add to Home Screen).
- Live: https://shamikhahmed.github.io/PrismCap/
- Privacy URL: https://shamikhahmed.github.io/PrismCap/privacy.html
- Version: see `VERSION.json` (store pack aligned with **4.3.8**).

## Listing copy (draft)

**Name:** PrismCap

**Subtitle (30):** 39 offline party games

**Description:**
PrismCap is a pass-and-play party game console that runs fully offline. Thirty-nine multiplayer and solo games on one device — no accounts, no ads, no cloud required. Smart Hub tracks XP and streaks on-device. Load `?demo=1` for investor demos.

**Keywords:** party games, pass and play, offline games, multiplayer phone, board games

**Category:** Games / Family / Board

**Age:** 12+ (party themes; parental discretion)

**What's New:** Home layout fix for Mac; demo profile sync; Smart Hub LV/XP truth.

## Privacy nutrition
- **Data Not Collected** (local-only XP/profile in localStorage).

## Screenshots
Captured at `docs/store-screenshots/` (iPhone 6.7" class viewport):
- `iphone67-home.png`
- `iphone67-library.png`
- `iphone67-arcade.png`
- `iphone67-dashboard.png`
- `iphone67-profile.png`
- `iphone67-game-spy.png`
- `mac-home.png` (diligence / web)

## Capacitor / TestFlight
1. `npm install` + `npm run cap:init` when Xcode ready
2. Icons: `icon-1024.png` / maskable in `public/`
3. Review notes: offline PWA; no account; demo via `?demo=1`
4. Export compliance: no custom crypto beyond platform TLS for Pages fetch

## Disclaimers
- Offline party entertainment; supervise younger players.
- Rules-based Smart Hub — **not** an LLM coach.

## QA gate (before store upload)
```bash
npx playwright test
```
Expect home integrity + play-smoke green.

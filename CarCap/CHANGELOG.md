## [0.2.0] — 2026-07-20

### Beauty — service booklet / key fob
- Splash key-fob moment; brass/ink tokens light+dark
- Settings Appearance toggle; SW `carcap-v3`

## 0.1.1
- Pad onboarding/export/pitch

# Changelog

All notable changes to CarCap are documented here.

## [0.1.1] — 2026-07-19

### Added
- First-run sheet (`meta.onboarded`): **Add car** vs **Try demo**
- Settings export / import of `carcap_v1` JSON backup
- Cap Store pitch at `docs/pitch.html` (demo CTA `?demo=1`)
- Playwright smoke: `tests/smoke.spec.js` + `test:e2e` / `verify` scripts

### Honesty
- README / ROADMAP / gallery version sync to **0.1.1** / `carcap-v2`; docs = text/meta only

### Fixed
- Tab `replaceState` preserves `demo=1` in the URL
- Fuel empty copy: L/100 needs ≥2 full-tank fills
- Docs empty / subtitle: honest text-wallet (no photos yet)

### Chore
- Version **0.1.1** · SW cache **`carcap-v2`**

## [0.1.0] — 2026-07-19

### Added
- Offline PWA MVP: Today, Garage, Service, Fuel, Docs, Settings
- Vehicle garage (make / model / year / plate / nickname)
- Service log with optional reminder dates
- Fuel + odometer entries; L/100 from full-tank pairs
- Docs wallet (title, insurance, registration, other — text/meta)
- Demo mode (`?demo=1` or Settings) with seeded Corolla + sample data
- Service worker cache `carcap-v1`, manifest + Cap-family icons
- Docs: README, HANDOVER, ROADMAP, FEATURES, basic screen-gallery.html

[0.1.1]: https://github.com/shamikhahmed/CarCap/releases/tag/v0.1.1
[0.1.0]: https://github.com/shamikhahmed/CarCap/releases/tag/v0.1.0

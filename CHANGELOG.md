## 1.4.0 — 2026-10-14

- **Capricorn OS 1.1.0** deployed from capricorn-lab: ten themes (Capricorn, Capricorn Night, Aurora, Synthwave, Terminal, Truck Art, Mughal, Paper, Pixel 95, Brutal), iPad mode, phone dock/app sheets, Run here, live catalog from each Cap's VERSION.json, Privacy Monitor, honest copy. Lighthouse (prod build, local): Performance 100 · Accessibility 100 · Best Practices 100, mobile + desktop.
- **No third-party requests anywhere** — removed Google Fonts from about, sovereignty, solutions, pitch, investor, enterprise and `css/site.css` (system font stacks instead).
- Classic catalog (`js/products-data.js`) synced to live: PulseCap 6.44.0, SoulCap 8.3.2, ScentCap 2.1.4.
- `npm test` no longer hardcodes September versions — compares classic catalog with the deployed OS bundle. `stage-site.sh` derives required assets from `index.html` instead of a stale bundle hash (both gates were red before this release).
- Docs rewritten: README, HANDOVER, ROADMAP, ANNOUNCE, DESIGN_IDENTITY.

## 1.3.3 — 2026-09-16

- Pages: switch from legacy `main/` to Actions deploy of an allowlisted `_site` (excludes `.cursor/`, `qa/`, hub `docs/`, `scripts/`, tooling configs). Keeps Cursor rules in git; public URLs unchanged.

## 1.3.2 — 2026-09-15

- Catalog sync for closed Caps (Soul/Scent/Mastery/Vault/Cook/Pulse/Steady/Travel/Ledger + fleet); Capricorn OS redeploy from lab 1.0.3. Galleries regenerating in parallel.

## 1.3.1 — 2026-09-15

- C-15: Remove TravelOS user-facing copy (TravelCap only); absolute redirect URLs so Hub CI `links` passes for sibling Pages apps; catalog TravelCap 1.0.1 / SteadyCap 2.5.2.

## Fleet leftovers — 2026-07-20
- Honesty + pitch theme sync · Steady 2.4.1 · DeePony 3.7.1 · Aura 5.3.1 · Mastery 42.2.1

## Beauty deep trio 3 — 2026-07-20
- Catalog: IdeaCap 1.1.0 · SoulCap 0.3.0 · CarCap 0.2.0

## Beauty deep trio 2 — 2026-07-20
- Catalog: DeePonyCap 3.7.0 · ScentCap 1.4.0 · AuraCap 5.3.0

## Beauty deep trio — 2026-07-20
- Catalog: SteadyCap 2.4.0 · LedgerCap 3.56.0 · MasteryCap 42.2.0

## Investor kit
- Full 13-Cap + hub/pitch screenshot deck under assets/investor/ (2026-07-19)

## Family announce — 2026-07-19
- ANNOUNCE.md share sheet; marketing redirects for travel/idea/mastery/soul/car Caps
- about/nav: Open Cap → live `p.url`; dead `#apps`/`#products` hashes → Cap Store / pitch / investor
- OS meta: Thirteen Caps (+ Mastery/Idea/Car); SOCIAL GitHub-only; delete orphan apps-data.js
- SoulCap hub rsync: demo always skips onboarding

## 0.11.10 — 2026-07-19
- Honesty: Cap versions (Vault 5.1.12, Pulse 6.2.5, Prism 4.3.9, Travel 0.3.3 Explore densify, …)
- Beauty waves B–E: Travel Explore denser; Vault vault-door; Pulse journal; Prism arcade cartridge.

- Investor/demo pack: Vault PIN 123456 marked Vault-only; MasteryCap demo via Settings (no blind `?demo=1`); enterprise Info links stop 404ing for mastery/soul/idea/travel/car
- IdeaCap FAQ: Local AI → Smart Assistant

## 0.11.9 — 2026-07-19
- Investor pack: pitch.html, investor.html, DEMO-SCRIPT, REHEARSAL, ONE-PAGER, screenshot/QR kit; enterprise walkthrough → 13 Caps

## 0.11.8 — 2026-07-19
- Museum pad: Cap versions synced; Prism 4.3.5 play-smoke; Soul/Car/Travel/Idea live pads

# Changelog

## [0.10.1] - 2026-07-10
- Capricorn OS hub homepage swap; lock screen controls (remember-device removed).
- Dock magnify restored after os-live unlock animation.

## [0.9.6] - 2026-07-10
- Capricorn OS replaces classic hub homepage — desktop metaphor with dock + lock screen.

## 2026-06 — Catalog & design system waves
- cap-tabs design system layer synced across hub + catalog pages.
- App-fast performance layer synced; catalog versions + hub SW cache bumps.
- Hub hero copy aligned with Capricorn catalog voice.
- Product screenshots regenerated; Apple-grade catalog copy synced.
- GSAP cinematic stack (3D widgets, Three.js) added then precached in PWA service worker.

## Earlier
- Initial hub with one catalog page per Cap app (auracap, deeponycap, ledgercap, prismcap, pulsecap, scentcap, steadycap, vaultcap, ...), about, enterprise pages.

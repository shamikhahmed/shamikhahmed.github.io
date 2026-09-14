## 4.5.0 — 2026-09-14
- Tier 1 finish: D-06 renames (Four in a Row · Clue Grid · Word Dodge), device gate removed, system UI fonts (pixel logo-only), manifests PrismCap, game exit ConfirmDialog + aria-live turns, native dialogs replaced. SW `prismcap-v450`.

## 4.4.1 — 2026-07-20
- Home deep: CRT cabinet layout — mobile stack; desktop bezel + sticky scoreboard rail. SW `prismcap-v441`.

## 4.4.0 — 2026-07-20
- Uniqueness remint: CRT warmup flicker, cabinet bezel, restrained scanlines, INSERT COIN boot ritual
- LOUD neon tokens (#FF00FF / #00FFFF on near-black); Press Start 2P + VT323 typography
- Home cartridge marquee strip; SW `prismcap-v440`

## 4.3.9 — 2026-07-20
- Visual DNA: arcade cabinet/cartridge loader, softer neon, home bezel chrome, welcome cart-shell. 39 games offline honesty.

## 4.3.8
- Store pack: Prism-only privacy, listing copy, iPhone 6.7" screenshots under docs/store-screenshots/
- App Store prep docs aligned to 39 games + Data Not Collected

## 4.3.7
- Demo seed AFTER game registry — Smart Hub LV/XP matches header; games = Reg.list.length
- Expose window.Prog/Rec; hub always derives rank from XP.lvl(xp)
- Board/MP/Solo rows share `_buildScrollRow` (keyboard + aria)
- Try-new dedupe vs daily/recent; home integrity Playwright test

## 4.3.6
- Fix Mac/desktop landscape wrongly applying iPad home grid (empty MP/Solo, shredded layout)
- Smart Hub rank syncs to profile LV/XP; demo seed games = Reg.list.length; dedupe recent vs recommended

## 4.3.5
- Playwright play-smoke: interact every game (start/tap/keys) + mobile/iPad samples
- Docs/manifest/presentation: remaining 38→39 honesty

## 4.3.4
- Museum game chrome: safe-area header, ≥44px controls, iPad landscape exempt `#game-screen`
- Playwright: launch all 39 games + mobile/iPad shell checks
- Meta/OG: 39 games (was 38)

## [4.3.3] — 2026-07-19

### Honesty
- Game count synced to **39** (runtime `Reg.list.length`) — pitch/landing/index were mixed 36/38

### Pitch
- Capricorn QR already on CTA

### Ops
- SW `prismcap-v433`

## [4.3.3] — 2026-07-19

### Pitch
- Premium Capricorn QR (`assets/qr-prismcap.png`) — H ECC, Capricorn Systems center mark, gold quiet frame on CTA

### Ops
- SW `prismcap-v433`

# Changelog — PrismCap

## 4.3.1 (2026-07-19)
- Cap Family Mega-Wave: Capricorn OS brand lock — `mark.svg`, favicon, apple-touch-icon-180, and separate any/maskable PWA icons in `public/` + root + `manifest.json`.
- Version / SW cache bump (`prismcap-v431`); SW register query `?v=431`.
- Shell gallery regenerated for release.

## 4.3.0 (2026-07-11)
- Cap Standard rollout: 10-shot screen gallery (5 shell screens x mobile/desktop, `npm run gallery`) + browsable `screen-gallery.html`. Game-screen shots deferred (needs live session).
- CI: PrismCap CI workflow runs Playwright suite on every push; package-lock resynced.
- `verify` / `gallery` / `gallery:view` npm scripts per Cap Standard contract.
- SW cache prismcap-v41.


## 4.1.3 (2026-06-15)
- Restore pre–Capricorn identity home-screen icons; service worker cache bump.

## 4.1.2 (2026-06-15)
- Welcome **game picker** step — style-matched first-game cards with one-tap launch.
- Actionable empty states on Home recent list and Stats most-played widget.
- Service worker cache bump `prismcap-v35`; SW register query aligned.

## 4.1.1 (2026-06-12)
- Phase P4: Stabilized e2e shell load test; Playwright test for most-played widget after game launch; service worker cache bump.

## 4.0.0 (2026-06-10)
- Portfolio CTO pass: PWA icons (192/512 maskable), service worker cache bump (`PrismCap-shell-v4`)
- Truth sprint: docs aligned with shipped features
- Truth Bomb party game, 38-game daily challenges fixed

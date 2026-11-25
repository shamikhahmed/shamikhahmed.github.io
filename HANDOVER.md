# shamikhahmed.github.io — Handover

> Read with `ROADMAP.md` and `~/Capricorn-Brain/01 Projects/shamikhahmed.github.io.md`.
> Updated 2026-11-26 · hub **1.4.1** · Capricorn OS via deploy:hub · fleet standard: `capricorn-tooling/shared/CAP-STANDARD.md`

## What this is

The public face of Capricorn Systems. Root = Capricorn OS (source: `../capricorn-lab`, deployed with `npm run deploy:hub`). Classic pages, investor pack, support/privacy, Cap redirects, and `apps/` mini-sites live beside it.

## Facts

- **Live:** https://shamikhahmed.github.io/ (GitHub Pages via Actions — Hub CI `links` → `deploy-pages`, artifact = `scripts/stage-site.sh` output)
- **Stack:** static HTML/CSS/JS. No build step in this repo (the OS bundle arrives prebuilt from capricorn-lab).
- **Data:** none. No cookies, analytics, ads, fonts or CDNs.
- **Motion:** classic pages use `css/capricorn.css` page-rise + `js/capricorn-motion.js`; mini-sites auto-wire `.cap-reveal` in `apps/assets/minisite.js`. OS shell CSS is separate — do not paste View Transitions into the OS bundle.

## Run & verify

```bash
python3 -m http.server 8000       # static preview of the repo root
npm test && node scripts/check-links.mjs && bash scripts/stage-site.sh /tmp/_site
```

Browser QA for the OS lives in capricorn-lab (`npm run qa:matrix`, `npm run qa:flows`) and can point at a staged copy of this repo.

## Gotchas

- Never hand-edit `index.html` / `assets/index-*` — they're overwritten on the next deploy:hub.
- `js/products-data.js` drives the classic pages; keep versions equal to capricorn-lab `js/products.js` (the hub test compares against the deployed bundle).
- `stage-site.sh` derives required assets from `index.html` — no more hardcoded bundle hashes.
- This repo is the public face: test every Cap link after renames (`check-links.mjs`).
- `.cursor/` stays in git but is never published (allowlisted `_site`).
- Full gallery regen = capricorn-lab `build:minisites` / `sync-screenshots.mjs` (overnight); hub can ship CSS/JS motion without regenerating every webp.

## Where decisions live

- Dated decisions: Capricorn-Brain project note
- Release history: `CHANGELOG.md` here + `capricorn-lab/CHANGELOG.md`
- Fleet events: `Cap-Apps/docs/CHANGELOG.md`

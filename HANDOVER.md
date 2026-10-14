# shamikhahmed.github.io — Handover

> Read with `ROADMAP.md` and `~/Capricorn-Brain/01 Projects/shamikhahmed.github.io.md`.
> Updated 2026-10-14 · hub **1.4.0** · Capricorn OS **1.1.0** · fleet standard: `capricorn-tooling/shared/CAP-STANDARD.md`

## What this is

The public face of Capricorn Systems. Root = Capricorn OS (source: `../capricorn-lab`, deployed with `npm run deploy:hub`). Classic pages, investor pack, support/privacy and Cap redirects live beside it, plus five Cap builds hosted from this repo.

## Facts

- **Live:** https://shamikhahmed.github.io/ (GitHub Pages via Actions — Hub CI `links` → `deploy-pages`, artifact = `scripts/stage-site.sh` output)
- **Stack:** static HTML/CSS/JS. No build step in this repo (the OS bundle arrives prebuilt from capricorn-lab).
- **Data:** none. No cookies, analytics, ads, fonts or CDNs.

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

## Where decisions live

- Dated decisions: Capricorn-Brain project note
- Release history: `CHANGELOG.md` here + `capricorn-lab/CHANGELOG.md`
- Fleet events: `Cap-Apps/docs/CHANGELOG.md`

# shamikhahmed.github.io

**Capricorn Systems hub** — https://shamikhahmed.github.io/

Root is **Capricorn OS** (built from [`capricorn-lab`](https://github.com/shamikhahmed/capricorn-lab), decision D-13): a browser-native desktop on Macs, iPadOS-style home on tablets, iOS-style home on phones — Cap apps, themes, real apps runnable in-place, measured privacy.

Try: [`?theme=synthwave`](https://shamikhahmed.github.io/?theme=synthwave) · [`?theme=truckart`](https://shamikhahmed.github.io/?theme=truckart) · [`?theme=terminal`](https://shamikhahmed.github.io/?theme=terminal) · [`?tour=1`](https://shamikhahmed.github.io/?tour=1)

**Hub version:** 1.4.1

## What lives here

| Path | What |
|---|---|
| `index.html` + `assets/index-*.{js,css}`, `assets/lock-sphere-*.js` | Capricorn OS build — **don't edit here**; change `capricorn-lab` and run `npm run deploy:hub` |
| `about.html` · `sovereignty.html` · `solutions.html` · `support.html` | Classic (non-OS) site pages — lock screen "Classic site" link |
| `pitch.html` · `investor.html` · `enterprise.html` | Investor / demo pack (`assets/investor/`) |
| `privacy.html` · `terms.html` | Privacy, terms |
| `<cap>.html` | Lightweight Cap-gold redirects to `/apps/<slug>/` (old links keep working) |
| `apps/` | Cap mini-sites (galleries, stories, install) — shared `apps/assets/minisite.{css,js}` |
| `PrismCap/` · `SoulCap/` · `TravelCap/` · `CarCap/` · `IdeaCap/` | Cap builds / retired notices hosted from this repo (others deploy from their own repos to `/<Cap>/`) |
| `js/products-data.js` | Catalog for classic pages — must match the OS bundle (`npm test` enforces) |
| `css/capricorn-core.css` · `js/capricorn-motion.js` | Design-system motion (synced from `capricorn-tooling/shared/design-system/`) |

## Motion (classic + mini-sites)

- Scroll reveals: `.cap-reveal` / `.is-visible` and legacy `.reveal` / `.visible` (bridged).
- No cinematic canvas → skip heavy intro; fail-open reveals stuck content after ~2.8s.
- Classic CSS only: page-rise + optional `@view-transition` — **not** applied to Capricorn OS shell CSS.
- Cap gold / per-Cap theme tokens only — never TS360 harbor colors.
- `prefers-reduced-motion: reduce` disables rise/reveal/tilt animations.

## Test & deploy

```bash
npm test                          # required files, legacy catalog ↔ OS bundle versions, redirects
node scripts/check-links.mjs      # every internal ref resolves (CI gate)
bash scripts/stage-site.sh _site  # allowlisted public tree; fails on internals or missing bundle assets
git push                          # Hub CI: links → deploy-pages (Actions artifact = _site)
```

### Gallery / stories regen (lab)

Full overnight gallery regen is **not** automatic from this repo. From `capricorn-lab`:

```bash
npm run build:minisites           # rebuild /apps/*/ mini-sites into hub
node scripts/sync-screenshots.mjs # when shot pipelines are ready
npm test                          # includes validate-stories
```

No third-party requests: no analytics, ads, CDNs or web fonts on any page (G-9). Capricorn OS's Privacy Monitor shows the live count.

Design: [docs/DESIGN_IDENTITY.md](docs/DESIGN_IDENTITY.md) · Handoff: [HANDOVER.md](HANDOVER.md) · Plan: [ROADMAP.md](ROADMAP.md) · History: [CHANGELOG.md](CHANGELOG.md)

# shamikhahmed.github.io

**Capricorn Systems hub** — https://shamikhahmed.github.io/

Root is **Capricorn OS 1.1.0** (built from [`capricorn-lab`](https://github.com/shamikhahmed/capricorn-lab), decision D-13): a browser-native desktop on Macs, iPadOS-style home on tablets, iOS-style home on phones — fifteen Cap apps, ten themes, real apps runnable in-place, measured privacy.

Try: [`?theme=synthwave`](https://shamikhahmed.github.io/?theme=synthwave) · [`?theme=truckart`](https://shamikhahmed.github.io/?theme=truckart) · [`?theme=terminal`](https://shamikhahmed.github.io/?theme=terminal) · [`?tour=1`](https://shamikhahmed.github.io/?tour=1)

## What lives here

| Path | What |
|---|---|
| `index.html` + `assets/index-*.{js,css}`, `assets/lock-sphere-*.js` | Capricorn OS build — **don't edit here**; change `capricorn-lab` and run `npm run deploy:hub` |
| `about.html` · `sovereignty.html` · `solutions.html` | Classic (non-OS) site pages — the lock screen's "Classic site" link |
| `pitch.html` · `investor.html` · `enterprise.html` | Investor / demo pack (`assets/investor/`) |
| `support.html` · `privacy.html` · `terms.html` | Support (GitHub Issues), privacy, terms |
| `<cap>.html` | Lightweight redirects to each live Cap (old links keep working) |
| `PrismCap/` · `SoulCap/` · `TravelCap/` | Cap builds hosted from this repo (`CarCap/`, `IdeaCap/` = retired notices) (others deploy from their own repos to `/<Cap>/`) |
| `js/products-data.js` | Catalog for the classic pages — must match the OS bundle (`npm test` enforces) |

## Test & deploy

```bash
npm test                          # required files, legacy catalog ↔ OS bundle versions, redirects
node scripts/check-links.mjs      # every internal ref resolves (CI gate)
bash scripts/stage-site.sh _site  # allowlisted public tree; fails on internals or missing bundle assets
git push                          # Hub CI: links → deploy-pages (Actions artifact = _site)
```

No third-party requests: no analytics, ads, CDNs or web fonts on any page (G-9). Capricorn OS's Privacy Monitor shows the live count.

Design: [docs/DESIGN_IDENTITY.md](docs/DESIGN_IDENTITY.md) · Handoff: [HANDOVER.md](HANDOVER.md) · Plan: [ROADMAP.md](ROADMAP.md) · History: [CHANGELOG.md](CHANGELOG.md)

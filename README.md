# shamikhahmed.github.io

Capricorn Systems hub — marketing site for six Cap apps.

## Site structure

| Page | Purpose |
|------|---------|
| [index.html](index.html) | Marketing home — product grid, Device Sovereignty |
| [app.html?a=slug](app.html) | Product detail → **Launch** opens live PWA |
| [enterprise.html](enterprise.html) | Investor walkthrough |

**Flow:** Home → product → read → **Launch** → GitHub Pages PWA.

## Slugs

`vaultcap` · `pulsecap` · `prismcap` · `steadycap` · `ledgercap` · `deeponycap`

## Design & assets

- [docs/DESIGN_IDENTITY.md](docs/DESIGN_IDENTITY.md) — six experiences, one rule (on-device data)
- [assets/screenshots/README.md](assets/screenshots/README.md) — marketing screenshot naming

## Screenshots

```bash
node scripts/capture-screenshots.mjs
```

Output: `assets/screenshots/` (canonical — do not duplicate in app repos).

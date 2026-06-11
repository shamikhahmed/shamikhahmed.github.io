# Marketing screenshots

Canonical screenshot store for [shamikhahmed.github.io](https://shamikhahmed.github.io). Referenced by `js/products-data.js` and `sw.js`.

## Naming (per product slug)

| File | Role |
|------|------|
| `{slug}.png` | Hero / primary phone shot |
| `{slug}-2.png` … `{slug}-8.png` | Gallery carousel |
| `{slug}-ipad.png` | iPad frame |
| `{slug}-mac.png` | Mac frame |

## Current slugs (Capricorn)

`vaultcap`, `pulsecap`, `prismcap`, `steadycap`, `ledgercap`, `deeponycap` — 9 files each (60 total).

## Standalone apps (add when ready)

| Slug | App |
|------|-----|
| `scentcap` | ScentCap — fragrance wardrobe PWA |
| `auracap` | AuraCap — Apple ecosystem studio |

Expected set per slug: 11 files (hero + 7 gallery + ipad + mac), same pattern as above.

## Regenerate

```bash
cd shamikhahmed.github.io
node scripts/capture-screenshots.mjs
```

# Marketing screenshots

Canonical screenshot store for [shamikhahmed.github.io](https://shamikhahmed.github.io). Referenced by `js/products-data.js` and `sw.js`.

## Naming (per product slug)

| File | Role |
|------|------|
| `{slug}.png` | Hero / primary phone shot |
| `{slug}-2.png` … `{slug}-8.png` | Gallery carousel |
| `{slug}-ipad.png` | iPad frame |
| `{slug}-mac.png` | Mac frame |

## Current slugs (all 8 Cap apps)

`vaultcap`, `pulsecap`, `prismcap`, `steadycap`, `ledgercap`, `deeponycap`, `scentcap`, `auracap` — 11 files each (88 total).

Capricorn six use 9 gallery files (`-2` … `-8` + ipad + mac). ScentCap and AuraCap include `-9.png` as an extra gallery frame.

## Regenerate

```bash
cd shamikhahmed.github.io
node scripts/capture-screenshots.mjs
```

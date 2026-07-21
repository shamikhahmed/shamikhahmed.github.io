# Marketing screenshots

Canonical screenshot store for [shamikhahmed.github.io](https://shamikhahmed.github.io). Referenced by `js/products-data.js` and `sw.js`.

## Naming (per product slug)

| File | Role |
|------|------|
| `{slug}.png` | Hero / primary phone shot |
| `{slug}-2.png` … `{slug}-8.png` | Gallery carousel |
| `{slug}-ipad.png` | iPad frame |
| `{slug}-mac.png` | Mac frame |

## Full gallery slugs

`soulcap`, `vaultcap`, `pulsecap`, `prismcap`, `steadycap`, `ledgercap`, `deeponycap`,
`scentcap`, `auracap` — primary, carousel, iPad, and Mac captures.

Most full galleries use 10 files (primary + `-2` … `-8` + iPad + Mac). ScentCap and AuraCap
include `-9.png` as an extra gallery frame.

## Regenerate

```bash
cd shamikhahmed.github.io
node scripts/capture-screenshots.mjs

# One product, optionally against a local build
CAP_SCREENSHOT_SLUGS=soulcap \
CAP_SOULCAP_URL=http://127.0.0.1:8788/ \
node scripts/capture-screenshots.mjs
```

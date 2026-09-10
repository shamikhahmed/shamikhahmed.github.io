# Investor screenshot + QR kit

Captured **2026-07-19** via Playwright @ 1280×800 from live GitHub Pages.

## Screenshots
| File | Source |
|------|--------|
| hub.png | `/` |
| pitch.png | `/pitch.html` |
| investor-page.png | `/investor.html` |
| vault.png … car.png | Cap roots (`?demo=1` where supported) |

## QR codes (`qr-*.png`)
H ECC Capricorn-framed QRs via `capricorn-tooling/shared/scripts/make-capricorn-qr.mjs`.
13 Caps + hub + investor + pitch.

**MasteryCap:** Settings → Enter demo mode (no query demo).

```bash
# screenshots
cd ../PrismCap && node ../shamikhahmed.github.io/scripts/capture-investor-shots.js

# single QR
node ../capricorn-tooling/shared/scripts/make-capricorn-qr.mjs \
  'https://shamikhahmed.github.io/PulseCap/?demo=1' \
  ../shamikhahmed.github.io/assets/investor/qr-pulsecap.png
```

Log: `CAPTURE-LOG.json`

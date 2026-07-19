# CarCap — Roadmap

> Updated 2026-07-19. Fleet standard: `capricorn-tooling/shared/CAP-STANDARD.md`.

## Now — v0.1.0 (shipped)
- Vehicles garage (make/model/year/plate)
- Service log + reminders
- Fuel / odometer entries + basic L/100
- Docs wallet (text/meta)
- Today / Settings / demo mode
- PWA offline (`carcap-v1`)
- Docs pack + basic `screen-gallery.html`

## Cap Standard gaps
| Cap Standard item | Status |
|---|---|
| Docs pack | ✅ |
| Screen gallery | 🟡 HTML shell; Playwright capture later |
| Version discipline | ✅ |
| QA / e2e | ❌ |
| CI gate | ❌ |
| PWA polish | ✅ MVP |
| Demo mode | ✅ |

## Next (ordered)
1. Playwright smoke + gallery capture (`CAPTURE_GALLERY=1`)
2. Multi-vehicle cost summaries / export JSON
3. Soft notifications for reminders (Add to Home Screen)
4. Optional doc photo attachments (IndexedDB)

## Later
- Valuations
- OBD / live telemetry
- Marketplace / service shop discovery

## Ground rules
- No dirty trees: commit or discard before ending a session.
- Tag `vX.Y.Z` per release; bump SW cache with asset changes.
- Never commit `.env` / secrets.
- No fake AI claims — this app is rules/CRUD, not an LLM coach.

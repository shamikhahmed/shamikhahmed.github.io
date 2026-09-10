**Hub OS:** 0.11.8

# shamikhahmed.github.io — Handover

> Read this + `ROADMAP.md` + `~/Capricorn-Brain/01 Projects/shamikhahmed.github.io.md` before working here.
> Last updated: 2026-07-11 · Fleet-wide standard: `capricorn-tooling/shared/CAP-STANDARD.md`

## What this is
Capricorn hub — OS-style homepage + product catalog pages for every Cap app.

## Facts
**Version:** 0.10.1 (Capricorn OS)
**Live:** https://shamikhahmed.github.io/
**Repo:** https://github.com/shamikhahmed/shamikhahmed.github.io
**Stack:** Static HTML/CSS/JS PWA. 'Capricorn OS' desktop metaphor (dock, lock screen). Per-app catalog pages.
**Data:** None (marketing/hub).

## Run & verify
```bash
python3 -m http.server 8000   # static preview
```

## Architecture
- `index.html` — Capricorn OS hub (v0.10.1, lock screen + dock)
- `<app>.html` — one catalog page per app (auracap, deeponycap, ledgercap, ...)
- `css/`, `js/`, `assets/` — shared design system + product screenshots
- Backups: three timestamped sibling dirs in Cap-Apps (pre-os-live snapshots)

## Cap Standard status (2026-07-11)
| Cap Standard item | Status |
|---|---|
| Docs pack | 🟡 |
| Screen gallery | ❌ |
| Version discipline | ✅ |
| QA / e2e | ❌ |
| CI gate | ❌ |
| PWA polish | ✅ |
| Demo mode | ❌ |

Gaps are tracked as tasks in `ROADMAP.md`.

## Gotchas — read before coding
- This is the public face — broken links here hurt every app. Test all catalog links after any app renames.
- OS lock screen has unlock animation state — dock magnify regression fixed in f147809; test unlock flow after JS changes.

## Where decisions live
- Dated decisions: Capricorn-Brain project note (path above)
- Release history: `CHANGELOG.md`
- Fleet-level events: `Cap-Apps/docs/CHANGELOG.md` (master)

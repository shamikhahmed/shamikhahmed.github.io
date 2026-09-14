# PrismCap — Tier 1 App Report

**Released:** 2026-09-15 · **v4.5.0** / SW `prismcap-v450` · tag `v4.5.0`

| Field | Value |
|-------|--------|
| Status | Tier 1 (P0/P1 complete) |
| Live | https://shamikhahmed.github.io/PrismCap/ |
| Branch | `finish/prismcap` → `main` |
| Score (baseline → after) | 49 → ~86 |

## P0 / P1 register

| ID | Severity | What was wrong | What was done | Status |
|----|----------|----------------|---------------|--------|
| PRSM-P0-01 | P0 | Trademarked game names (D-06) | Connect Four → **Four in a Row** (neutral cyan/violet discs); Word Assassin → **Word Dodge** (blocked words); Dead Drop → **Clue Grid** (4×5, Clue giver/Guessers); Mind Meld → Think Alike; hist/leaderboard title migration (G-6); pitch/docs updated | ✅ |
| PRSM-P1-01 | P1 | Device-select gate | Gate removed; layout from viewport width; stored preference kept unused (P-PRSM-1) | ✅ |
| PRSM-P1-02 | P1 | Pixel fonts on body | Press Start logo-only; body/buttons system UI; dim contrast raised | ✅ |
| PRSM-P1-03 | P1 | Manifest PrismOS | `manifest.json` + `public/manifest.webmanifest` → PrismCap + §4.1 description | ✅ |
| PRSM-P1-04 | P1 | Game shell / a11y | `GL.requestExit` ConfirmDialog; `GameShell` + `#turn-live` aria-live; Pass to {player} interstitial | ✅ |
| PRSM-P1-05 | P1 | Native dialogs | `CapConfirm` / `CapPrompt`; demo seed + preset naming migrated | ✅ |

## Decisions applied
D-06, P-PRSM-1, G-3, G-4 (§4.1 description), G-8 (4.5.0 + SW), P-VLT-1 (marketing JS removed from app shell).

## Verify
- `npm run verify` — smoke + games + play-smoke + tier1
- Native `alert/confirm/prompt` in product path — **0**
- Version: `VERSION.json` / `APP_VERSION` / SW / package — **4.5.0** / `prismcap-v450`

## Remaining / gaps
- PRSM-P2-01/02 (board `innerHTML` rebuilds, raw hex/`!important` token migration) — deferred (not required for Tier 1 gate close)
- Physical VoiceOver/TalkBack: ⛔ BLOCKED-EXTERNAL
- Gallery regen optional

## Release log
- Branch `finish/prismcap`
- Tag `v4.5.0`
- Hub rsync → shamikhahmed.github.io/PrismCap/
- Live SW proof: `curl …/sw.js` → **prismcap-v450**

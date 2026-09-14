# PrismCap — Product Presentation

**Interactive deck:** [presentation.html](../presentation.html) (24 slides) · **Scroll pitch:** [pitch.html](../pitch.html)

---

## Slide 1 — Title

# PrismCap ✨
### 39 Offline Games · Pass & Play

*Solo to 10+ players · AI bots · Eco performance · Zero servers*

**Live:** shamikhahmed.github.io/PrismCap

---

## Slide 2 — Problem

- App store games want accounts and ads before you play with friends
- Pass-and-play is rare on mobile — party games need props, hosts, and Wi‑Fi
- Janky performance kills the fun during fast reflex games
- Cloud-dependent — dead at the campsite

---

## Slide 3 — Solution

A pocket arcade — 39 games, one device, zero internet.

- **39 games in one PWA** — deception, reflex, board, puzzle — all offline after first load
- **Pass & Play for 1–10+ players** — private reveals, handoffs, bot fill
- **No account. No server. Ever.** — XP, settings, suspended games in localStorage

---

## Slide 4 — Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | HTML5 PWA |
| Styling | CSS3 — 10 themes, glass UI |
| Logic | Vanilla JS — 5,600+ lines `app.js` |
| Storage | localStorage |
| Offline | Service Worker |
| Audio | Web Audio API — synthesized music & SFX |

No framework. No CDN. No build step.

---

## Slide 5 — Architecture

```
index.html          — shell + nav tabs
├── css/            base.css · layout.css · components.css
├── js/app.js       39 games, Drama Engine, bots
├── sw.js           offline asset cache
├── manifest.json   PWA install
└── docs/           GUIDE.md · PRESENTATION.md
```

Drama Engine · Director Engine · Persona AI · QR Transfer · Tournament brackets

---

## Slide 6 — Device Selection

Onboarding: pick exact iPhone, iPad, or Mac. Safe areas and Dynamic Island spacing calibrate automatically.

- iPhone 16 Pro · 15 · 13 · SE
- iPad Pro · iPad Air
- Mac / Browser layout

---

## Slide 7 — Welcome Flow

First launch: name · age · gender theme · playstyle scan · operator profile

- **Identity** — name, avatar, theme preference
- **Playstyle Scan** — Deceptive · Strategic · Aggressive
- **Persona Engine** — operative type assigned at boot
- **Starting Rank** — Rookie · Level 1 · 0 XP

---

## Slide 8 — Game Library

Library tab: 39 games · fully offline · filter by category

| Game | Type | Players |
|------|------|---------|
| Shadow Protocol | deduction | 3–10p |
| The Heist | strategy | 3–8p |
| Chess | strategy | 2p · bot |
| Ludo | board | 2–4p · bot |
| Spy Hunt | deduction | 3–10p |
| Neon Reflex | reflex | Solo |
| Split Truth | bluffing | 2–10p |
| Chaos Cards | party | 2–10p |

---

## Slide 9 — Featured Scroll

Home tab: horizontal mcard carousel — tap to launch.

Featured: Shadow Protocol, The Heist, Imposter Frequency, Blitz Duel, Word Assassin, Mind Meld.

Cinematic intro before every game launch · Drama Engine wired.

---

## Slide 10 — Pass & Play Setup

1–10 players · name each seat · add bots to fill empty slots.

- Player count stepper (e.g. 4/10)
- Named chips per seat
- **Add Bot** · **Fill All** · **Random Names**
- Start Game → private role reveals on one device

---

## Slide 11 — Pillar 1: Social Deception

| Game | Hook |
|------|------|
| Shadow Protocol | Hidden roles · voting rounds |
| The Heist | Co-op vault · one mole |
| Spy Hunt | Find the spy · locations |
| Imposter Frequency | Same topic — except imposters |
| Dead Drop | Pass intel · double agent |
| Silent Vote | Secret agendas · elimination |

---

## Slide 12 — Pillar 2: Reflex & Speed

| Game | Hook |
|------|------|
| Neon Reflex | Sub-200ms achievements |
| Reflex Ladder | Endless tiers · ghost run |
| Rhythm Pulse | Tap to the beat |
| Quick Tap | Maximum tap speed |
| Hot Device | Pass before it explodes |
| Blitz Duel | 1v1 reaction · best of 5 |

---

## Slide 13 — Pillar 3: Board Classics

Pass-and-play + AI bot opponents on one device.

Chess · Draughts · Four in a Row · Tic-Tac-Toe · Ludo · Snakes & Ladders

`BOT_BOARD_GAMES`: chess, draughts, ttt, c4, blitz, ludo, snl

---

## Slide 14 — Pillar 4: Strategy & Puzzles

- **AI Survival** — procedural director scenarios
- **Infinite Maze** — endless generated mazes
- **Memory Matrix** — pattern recall under pressure
- **Signal Decode** — crack transmissions in time
- **Pressure Cooker** — tap before pressure explodes
- **Cyber Tiles** — tile-merge chain reactions

---

## Slide 15 — Pillar 5: Party & Chaos

- **Chaos Cards** — procedural party challenges
- **Split Truth** — truth or lie detection
- **Word Assassin** — forbidden word clues
- **Mind Meld** — think the same thought
- **One Device Dungeon** — roguelike alliances & betrayals
- **Chain Reaction** — escalating combo chaos

---

## Slide 16 — XP & Ranks

10 ranks from **Rookie → Legend**. XP on every game.

Example: Specialist · Level 4 · 520 XP · next Veteran @ 700.

Ranks: Rookie · Operative · Agent · Specialist · Veteran · Elite · Phantom · Shadow · Ghost · Legend

---

## Slide 17 — Achievements

16 achievements — unlock through gameplay milestones · toast popup on unlock.

Examples: First Launch · Betrayer · On Fire · Lightning · Explorer · Night Owl · Daily Grinder · Survivor · Champion (+250 XP)

---

## Slide 18 — Themes

10 visual themes — unlock Cyber, Horror, Gold, Synth, Glitch via XP & wins.

Cyber · Horror · Glitch · Neon · Gold · Synth · Terminal · Deep Space · Midnight · Red Alert · Minimal

---

## Slide 19 — Mutators

Stack up to 3 before launch · remix any game.

Speed Round · Silent Mode · Sudden Death · Blind · Elite Mode · Corrupted · Double Chaos

Example stack: Speed Round + Sudden Death — timers halved, one miss = eliminated.

---

## Slide 20 — Eco Mode

Battery-friendly by default. Particles, grid, and wake lock tuned for long game nights.

| Setting | Default |
|---------|---------|
| Eco Mode | On — 8 vs 22 particles |
| Low Power | On — disables background grid |
| Background FX | Off |
| Haptic Feedback | On |
| Synthesized Music | Off (tap 🔇 to toggle) |

---

## Slide 21 — Tournament Bracket

4-player bracket across any game · game night ready.

Semi-finals → Final (e.g. Blitz Duel) · live match tracking.

---

## Slide 22 — Drama & Director Engines

- **Drama Engine** — tracks tension & trust; betrayal events spike paranoia; announcer calls out chaos
- **Director Engine** — adapts difficulty and pacing; procedural events per game type
- **Persona AI** — analyzes wins, betrayals, bluffs — assigns Deceptive, Strategic, Aggressive
- **QR Transfer** — suspend any game → export via QR → scan on second device

---

## Slide 23 — PWA Offline

- 100% offline after first load
- Add to Home Screen
- Wake lock during games
- Suspend & resume any game

No app store · No account · No subscription · No ads

---

## Slide 24 — By The Numbers & CTA

| Stat | Value |
|------|-------|
| Games | 38 |
| Achievements | 16 |
| Themes | 10 |
| Ranks | 10 |
| Mutators | 7 |
| Dependencies | 0 |

📱 Safari → shamikhahmed.github.io/PrismCap → Add to Home Screen

🎮 Pick a game. Hand the phone. Play.

*Built by Shamikh Ahmed · © 2026*

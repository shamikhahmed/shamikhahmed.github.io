# PrismCap — Security Notes

## Local-only data

- Player profile, XP, achievements, and game state are stored in **localStorage** only.
- **No accounts**, cloud sync, or analytics SDKs.
- Pass-and-play games run entirely on-device — no match data is uploaded.

## Network surface

- PrismCap is **fully offline** after first load. No API calls during gameplay.
- QR transfer features exchange data locally between devices you control — verify recipients before sharing.

## Child safety

- Party games may include mature prompts in Truth Bomb and similar modes — **supervise younger players**.
- Parental guidance recommended for pass-and-play sessions with mixed ages.

## PWA / supply chain

- Static assets served from GitHub Pages; verify `sw.js` cache version (`PrismCap-shell-v4`) when updating.
- Do not commit `.env` or API keys to the repository.

## Reporting

Open a private security issue on the [PrismCap GitHub repo](https://github.com/shamikhahmed/PrismCap) for vulnerabilities.

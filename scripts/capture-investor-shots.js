#!/usr/bin/env node
/**
 * Regen investor screenshots into assets/investor/.
 * Run from a Cap repo that has playwright: cd ../PrismCap && node ../shamikhahmed.github.io/scripts/capture-investor-shots.js
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const out = path.resolve(__dirname, '../assets/investor');
fs.mkdirSync(out, { recursive: true });

const shots = [
  { file: 'hub.png', url: 'https://shamikhahmed.github.io/', wait: 3500 },
  { file: 'pitch.png', url: 'https://shamikhahmed.github.io/pitch.html', wait: 2500 },
  { file: 'investor-page.png', url: 'https://shamikhahmed.github.io/investor.html', wait: 2000 },
  { file: 'vault.png', url: 'https://shamikhahmed.github.io/VaultCap/?demo=1', wait: 4000 },
  { file: 'pulse.png', url: 'https://shamikhahmed.github.io/PulseCap/?demo=1', wait: 4500 },
  { file: 'prism.png', url: 'https://shamikhahmed.github.io/PrismCap/?demo=1&e2e=1', wait: 4500 },
  { file: 'steady.png', url: 'https://shamikhahmed.github.io/SteadyCap/?demo=1', wait: 4000 },
  { file: 'ledger.png', url: 'https://shamikhahmed.github.io/LedgerCap/?demo=1', wait: 4000 },
  { file: 'deepony.png', url: 'https://shamikhahmed.github.io/DeePonyCap/?demo=1', wait: 4000 },
  { file: 'scent.png', url: 'https://shamikhahmed.github.io/ScentCap/?demo=1', wait: 4000 },
  { file: 'aura.png', url: 'https://shamikhahmed.github.io/AuraCap/?demo=1', wait: 4000 },
  { file: 'mastery.png', url: 'https://shamikhahmed.github.io/MasteryCap/', wait: 3500 },
  { file: 'travel.png', url: 'https://shamikhahmed.github.io/TravelCap/?demo=1', wait: 4500 },
  { file: 'idea.png', url: 'https://shamikhahmed.github.io/IdeaCap/?demo=1', wait: 4500 },
  { file: 'soul.png', url: 'https://shamikhahmed.github.io/SoulCap/?demo=1', wait: 4000 },
  { file: 'car.png', url: 'https://shamikhahmed.github.io/CarCap/?demo=1', wait: 4000 },
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const results = [];
  for (const s of shots) {
    try {
      await page.goto(s.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(s.wait);
      await page.evaluate(() => {
        ['welcome', 'loader', 'device-sel'].forEach((id) => {
          const el = document.getElementById(id);
          if (el) el.style.display = 'none';
        });
      }).catch(() => {});
      await page.waitForTimeout(400);
      const dest = path.join(out, s.file);
      await page.screenshot({ path: dest, fullPage: false });
      results.push({ file: s.file, ok: true, bytes: fs.statSync(dest).size });
      console.log('OK', s.file);
    } catch (e) {
      results.push({ file: s.file, ok: false, err: String(e.message).slice(0, 160) });
      console.log('FAIL', s.file, e.message.slice(0, 160));
    }
  }
  fs.writeFileSync(path.join(out, 'CAPTURE-LOG.json'), JSON.stringify({ at: new Date().toISOString(), results }, null, 2));
  await browser.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log(JSON.stringify({ total: results.length, failed }));
  process.exit(failed ? 1 : 0);
})();

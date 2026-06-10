import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../assets/screenshots');

const APPS = [
  { slug: 'vaultcap', urls: ['https://shamikhahmed.github.io/VaultCap/landing.html', 'https://shamikhahmed.github.io/VaultCap/'] },
  { slug: 'pulsecap', urls: ['https://shamikhahmed.github.io/PulseCap/landing.html', 'https://shamikhahmed.github.io/PulseCap/'] },
  { slug: 'prismcap', urls: ['https://shamikhahmed.github.io/PrismCap/landing.html', 'https://shamikhahmed.github.io/PrismCap/'] },
  { slug: 'steadycap', urls: ['https://shamikhahmed.github.io/SteadyCap/landing.html', 'https://shamikhahmed.github.io/SteadyCap/'] },
  { slug: 'ledgercap', urls: ['https://shamikhahmed.github.io/LedgerCap/landing.html', 'https://shamikhahmed.github.io/LedgerCap/'] },
  { slug: 'deeponycap', urls: ['https://shamikhahmed.github.io/DeePonyCap/landing.html', 'https://shamikhahmed.github.io/DeePonyCap/'] },
];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});

for (const app of APPS) {
  let captured = 0;
  for (let i = 0; i < app.urls.length && captured < 2; i++) {
    const url = app.urls[i];
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(2000);
      const suffix = captured === 0 ? '' : '-2';
      const file = path.join(OUT, `${app.slug}${suffix}.png`);
      await page.screenshot({ path: file, fullPage: false });
      console.log('OK', file, url);
      captured++;
    } catch (e) {
      console.error('FAIL', app.slug, url, e.message);
    }
  }
}

await browser.close();
console.log('Done');

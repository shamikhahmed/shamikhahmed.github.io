import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../assets/screenshots');
const BASE = 'https://shamikhahmed.github.io';

const APPS = [
  {
    slug: 'vaultcap',
    shots: [
      { url: `${BASE}/VaultCap/landing.html` },
      { url: `${BASE}/VaultCap/`, setup: async (page) => {
        await page.waitForTimeout(3000);
        await page.evaluate(() => {
          if (typeof VaultProfiles !== 'undefined') VaultProfiles.switch('demo');
        });
        await page.waitForTimeout(1200);
        const pin = page.locator('input[type="password"], input[inputmode="numeric"]').first();
        if (await pin.isVisible().catch(() => false)) {
          await pin.fill('123456');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(2000);
        }
      }},
      { nav: 'R.goto("dashboard")' },
      { nav: 'R.goto("banks")' },
      { nav: 'R.goto("networth")' },
      { nav: 'R.goto("documents")' },
      { nav: 'R.goto("zakat")' },
      { nav: 'R.goto("family")' },
    ],
  },
  {
    slug: 'pulsecap',
    shots: [
      { url: `${BASE}/PulseCap/landing.html` },
      { url: `${BASE}/PulseCap/`, setup: async (page) => {
        await page.waitForTimeout(2500);
        await page.evaluate(() => { if (typeof loadDemoMode === 'function') loadDemoMode(); });
        await page.waitForTimeout(2000);
      }},
      { nav: "go('dashboard')" },
      { nav: "go('workout')" },
      { nav: "go('nutrition')" },
      { nav: "go('recovery')" },
      { nav: "go('bodymap')" },
      { nav: "go('progress')" },
    ],
  },
  {
    slug: 'prismcap',
    shots: [
      { url: `${BASE}/PrismCap/landing.html` },
      { url: `${BASE}/PrismCap/`, setup: async (page) => {
        await page.waitForTimeout(2000);
        await page.evaluate(() => {
          localStorage.setItem('po5', JSON.stringify({ p: { name: 'Player', av: '🎮', xp: 420, lvl: 3 }, c: { haptic: false, sfx: false, music: false, theme: 'neon' }, a: {} }));
          localStorage.setItem('po5_device', 'iphone15');
          if (typeof DevSel !== 'undefined' && DevSel._pick) DevSel._pick('iphone15');
          ['device-sel', 'welcome', 'loader'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
          });
          if (typeof Nav !== 'undefined') Nav.go('home');
        });
        await page.waitForTimeout(2000);
      }},
      { nav: "Nav.go('library')" },
      { nav: "Nav.go('arcade')" },
      { nav: "Nav.go('dashboard')" },
      { nav: "Nav.go('profile')" },
      { nav: "Nav.go('arcade')", scroll: 520 },
      { nav: "Nav.go('dashboard')", scroll: 480 },
    ],
  },
  {
    slug: 'steadycap',
    shots: [
      { url: `${BASE}/SteadyCap/landing.html` },
      { url: `${BASE}/SteadyCap/?demo=1`, setup: async (page) => {
        await page.waitForTimeout(3500);
      }},
      { nav: "Navigation.go('dashboard')" },
      { nav: "Navigation.go('recovery')" },
      { nav: "Navigation.go('emergency')" },
      { nav: "Navigation.go('knowledge')" },
      { nav: "Navigation.go('journal')" },
      { nav: "Navigation.go('profile')" },
    ],
  },
  {
    slug: 'ledgercap',
    shots: [
      { url: `${BASE}/LedgerCap/landing.html` },
      { url: `${BASE}/LedgerCap/?demo=1`, setup: async (page) => {
        await page.waitForTimeout(3500);
      }},
      { nav: "Navigation.go('dashboard')" },
      { nav: "Navigation.go('portfolio')" },
      { nav: "Navigation.go('transactions')" },
      { nav: "Navigation.go('income')" },
      { nav: "Navigation.go('settings')" },
      { nav: "Navigation.go('income')", scroll: 380 },
    ],
  },
  {
    slug: 'deeponycap',
    shots: [
      { url: `${BASE}/DeePonyCap/landing.html` },
      { url: `${BASE}/DeePonyCap/?demo=1`, setup: async (page) => {
        await page.waitForTimeout(3500);
      }},
      { nav: "Nav.go('stable')" },
      { nav: "Nav.go('collection')" },
      { nav: "Nav.go('wishlist')" },
      { nav: "Nav.go('shelves')" },
      { nav: "Nav.go('stats')" },
      { nav: "Nav.go('settings')" },
    ],
  },
];

function shotFile(slug, index) {
  return index === 0 ? `${slug}.png` : `${slug}-${index + 1}.png`;
}

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});

for (const app of APPS) {
  const page = await context.newPage();
  let loaded = false;

  for (let i = 0; i < app.shots.length; i++) {
    const shot = app.shots[i];
    const file = path.join(OUT, shotFile(app.slug, i));

    try {
      if (shot.url) {
        await page.goto(shot.url, { waitUntil: 'networkidle', timeout: 90000 });
        loaded = true;
        if (shot.setup) await shot.setup(page);
      } else if (shot.nav && loaded) {
        await page.evaluate((expr) => { eval(expr); }, shot.nav);
        await page.waitForTimeout(2000);
        if (shot.scroll) {
          await page.evaluate((y) => {
            const active = document.querySelector('.screen.active');
            if (active) active.scrollTop = y;
            else window.scrollTo(0, y);
          }, shot.scroll);
          await page.waitForTimeout(600);
        }
      } else {
        continue;
      }

      await page.screenshot({ path: file, fullPage: false });
      console.log('OK', file);
    } catch (e) {
      console.error('FAIL', app.slug, i + 1, e.message);
    }
  }

  await page.close();
}

await browser.close();
console.log('Done — 48 screenshots');

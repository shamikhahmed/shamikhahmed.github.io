import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../assets/screenshots');
const BASE = 'https://shamikhahmed.github.io';

async function waitMs(page, ms) {
  await page.waitForTimeout(ms);
}

async function vaultUnlock(page) {
  await page.goto(`${BASE}/VaultCap/`, { waitUntil: 'networkidle', timeout: 90000 });
  await waitMs(page, 2500);
  await page.evaluate(() => {
    if (typeof VaultProfiles !== 'undefined') VaultProfiles.switch('demo');
  });
  await waitMs(page, 1500);
  const pin = page.locator('input[type="password"], input[inputmode="numeric"]').first();
  if (await pin.isVisible({ timeout: 5000 }).catch(() => false)) {
    await pin.fill('123456');
    await page.keyboard.press('Enter');
  }
  await page.waitForFunction(() => document.getElementById('pg-dashboard')?.classList.contains('on'), { timeout: 15000 }).catch(() => {});
  await waitMs(page, 2000);
}

async function vaultNav(page, pg) {
  await page.evaluate((p) => {
    if (typeof R !== 'undefined') R.goto(p, true);
  }, pg);
  await page.waitForFunction((p) => document.getElementById('pg-' + p)?.classList.contains('on'), pg, { timeout: 10000 }).catch(() => {});
  await waitMs(page, 2200);
}

const APPS = [
  {
    slug: 'vaultcap',
    async capture(page) {
      await vaultUnlock(page);
      const shots = [
        { file: 'vaultcap.png', fn: async () => { await page.goto(`${BASE}/VaultCap/landing.html`, { waitUntil: 'networkidle' }); } },
        { file: 'vaultcap-2.png', fn: async () => { await vaultUnlock(page); } },
        { file: 'vaultcap-3.png', fn: async () => { await vaultNav(page, 'dashboard'); } },
        { file: 'vaultcap-4.png', fn: async () => { await vaultNav(page, 'family'); } },
        { file: 'vaultcap-5.png', fn: async () => { await vaultNav(page, 'banks'); } },
        { file: 'vaultcap-6.png', fn: async () => { await vaultNav(page, 'documents'); } },
        { file: 'vaultcap-7.png', fn: async () => { await vaultNav(page, 'zakat'); } },
        { file: 'vaultcap-8.png', fn: async () => { await vaultNav(page, 'investments'); } },
      ];
      for (const s of shots) {
        await s.fn();
        await page.screenshot({ path: path.join(OUT, s.file) });
        console.log('OK', s.file);
      }
      await captureDevices(page, 'vaultcap', async () => { await vaultNav(page, 'dashboard'); });
    },
  },
  {
    slug: 'pulsecap',
    setupUrl: `${BASE}/PulseCap/`,
    landing: `${BASE}/PulseCap/landing.html`,
    setup: async (page) => {
      await page.evaluate(() => { if (typeof loadDemoMode === 'function') loadDemoMode(); });
      await waitMs(page, 2000);
    },
    navs: ["go('workout')", "go('nutrition')", "go('recovery')", "go('bodymap')", "go('progress')", "go('profiles')"],
    deviceNav: "go('dashboard')",
  },
  {
    slug: 'prismcap',
    setupUrl: `${BASE}/PrismCap/`,
    landing: `${BASE}/PrismCap/landing.html`,
    setup: async (page) => {
      await page.evaluate(() => {
        localStorage.setItem('po5', JSON.stringify({ p: { name: 'Player', av: '🎮', xp: 420, lvl: 3 }, c: { haptic: false, sfx: false, music: false, theme: 'neon' }, a: {} }));
        localStorage.setItem('po5_device', 'iphone15');
        if (typeof DevSel !== 'undefined' && DevSel._pick) DevSel._pick('iphone15');
        ['device-sel', 'welcome', 'loader'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
        if (typeof Nav !== 'undefined') Nav.go('home');
        if (typeof UI !== 'undefined' && UI.home) UI.home();
      });
      await waitMs(page, 2500);
    },
    navs: [
      "Nav.go('library')",
      "Nav.go('arcade')",
      "Nav.go('dashboard')",
      "Nav.go('profile')",
      "Nav.go('home')",
      { nav: "Nav.go('arcade')", scroll: 500 },
    ],
    deviceNav: "Nav.go('home')",
  },
  {
    slug: 'steadycap',
    setupUrl: `${BASE}/SteadyCap/?demo=1`,
    landing: `${BASE}/SteadyCap/landing.html`,
    setup: async (page) => { await waitMs(page, 3500); },
    navs: ["Navigation.go('recovery')", "Navigation.go('emergency')", "Navigation.go('knowledge')", "Navigation.go('journal')", "Navigation.go('profile')", "Navigation.go('dashboard')"],
    deviceNav: "Navigation.go('dashboard')",
  },
  {
    slug: 'ledgercap',
    setupUrl: `${BASE}/LedgerCap/?demo=1`,
    landing: `${BASE}/LedgerCap/landing.html`,
    setup: async (page) => { await waitMs(page, 3500); },
    navs: [
      "Navigation.go('portfolio')",
      "Navigation.go('transactions')",
      "Navigation.go('income')",
      "Navigation.go('settings')",
      { nav: "Navigation.go('portfolio')", scroll: 420 },
      { nav: "Navigation.go('transactions')", scroll: 360 },
    ],
    deviceNav: "Navigation.go('dashboard')",
  },
  {
    slug: 'deeponycap',
    setupUrl: `${BASE}/DeePonyCap/?demo=1`,
    landing: `${BASE}/DeePonyCap/landing.html`,
    setup: async (page) => { await waitMs(page, 3500); },
    navs: ["Nav.go('collection')", "Nav.go('wishlist')", "Nav.go('shelves')", "Nav.go('stats')", "Nav.go('settings')", "Nav.go('stable')"],
    deviceNav: "Nav.go('stable')",
  },
];

async function captureDevices(page, slug, navFn) {
  await navFn();
  const viewports = [
    { suffix: 'ipad', width: 834, height: 1194, scale: 2 },
    { suffix: 'mac', width: 1280, height: 800, scale: 1 },
  ];
  for (const v of viewports) {
    await page.setViewportSize({ width: v.width, height: v.height });
    await waitMs(page, 1200);
    const file = path.join(OUT, `${slug}-${v.suffix}.png`);
    await page.screenshot({ path: file });
    console.log('OK', file);
  }
  await page.setViewportSize({ width: 390, height: 844 });
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

for (const app of APPS) {
  if (app.capture) {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    await app.capture(page);
    await page.close();
    continue;
  }

  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  await page.goto(app.landing, { waitUntil: 'networkidle', timeout: 90000 });
  await page.screenshot({ path: path.join(OUT, `${app.slug}.png`) });
  console.log('OK', `${app.slug}.png`);

  await page.goto(app.setupUrl, { waitUntil: 'networkidle', timeout: 90000 });
  if (app.setup) await app.setup(page);
  await page.screenshot({ path: path.join(OUT, `${app.slug}-2.png`) });
  console.log('OK', `${app.slug}-2.png`);

  for (let i = 0; i < app.navs.length; i++) {
    const step = app.navs[i];
    const expr = typeof step === 'string' ? step : step.nav;
    await page.evaluate((e) => { eval(e); }, expr);
    await waitMs(page, 2200);
    if (typeof step === 'object' && step.scroll) {
      await page.evaluate((y) => {
        const active = document.querySelector('.screen.active');
        if (active) active.scrollTop = y;
        else window.scrollTo(0, y);
      }, step.scroll);
      await waitMs(page, 600);
    }
    const file = path.join(OUT, `${app.slug}-${i + 3}.png`);
    await page.screenshot({ path: file });
    console.log('OK', path.basename(file));
  }

  await captureDevices(page, app.slug, async () => {
    await page.evaluate((expr) => { eval(expr); }, app.deviceNav);
    await waitMs(page, 1500);
  });

  await page.close();
}

await browser.close();
console.log('Done');

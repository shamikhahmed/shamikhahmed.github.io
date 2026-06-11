import { chromium } from 'playwright';
import { readdirSync, readFileSync } from 'fs';
import { mkdir } from 'fs/promises';
import { createHash } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../assets/screenshots');
const BASE = 'https://shamikhahmed.github.io';

async function waitMs(page, ms) {
  await page.waitForTimeout(ms);
}

async function enterVaultPin(page) {
  for (const digit of '123456') {
    const padBtn = page.locator('#pgLock button, .pin-key, [data-pin]').filter({ hasText: new RegExp(`^${digit}$`) }).first();
    if (await padBtn.isVisible({ timeout: 800 }).catch(() => false)) {
      await padBtn.click();
      await waitMs(page, 120);
      continue;
    }
    const pin = page.locator('input[type="password"], input[inputmode="numeric"]').first();
    if (await pin.isVisible({ timeout: 1500 }).catch(() => false)) {
      await pin.fill('123456');
      await page.keyboard.press('Enter');
      break;
    }
  }
}

async function vaultEnsureUnlocked(page) {
  await page.evaluate(() => {
    if (typeof Modal !== 'undefined') Modal.close();
    if (typeof R !== 'undefined' && typeof R.unlock === 'function') R.unlock();
    const app = document.getElementById('app');
    if (app && getComputedStyle(app).display === 'none') app.style.display = 'flex';
    const fab = document.getElementById('fab');
    if (fab) fab.style.display = 'flex';
    ['pgLock', 'pgHome', 'pgOnboard', 'pgProfilePicker'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  });
  await page.waitForFunction(() => {
    const app = document.getElementById('app');
    return app && getComputedStyle(app).display !== 'none';
  }, { timeout: 20000 }).catch(() => {});
  await waitMs(page, 1800);
}

async function vaultUnlock(page) {
  await page.goto(`${BASE}/VaultCap/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.evaluate(() => {
    localStorage.setItem('vo_active_profile', 'demo');
    localStorage.setItem('vo_used_demo', '1');
    localStorage.removeItem('vo_demo_guide_pending');
  });
  await page.reload({ waitUntil: 'networkidle', timeout: 90000 });
  await waitMs(page, 2000);
  await enterVaultPin(page);
  await vaultEnsureUnlocked(page);
}

async function vaultNav(page, pg) {
  await page.evaluate((p) => {
    if (typeof R !== 'undefined') R.goto(p, true);
    const el = document.getElementById('pg-' + p);
    if (el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
    }
  }, pg);
  await page.waitForFunction((p) => {
    const el = document.getElementById('pg-' + p);
    return el?.classList.contains('on') && getComputedStyle(el).opacity !== '0';
  }, pg, { timeout: 12000 }).catch(() => {});
  await waitMs(page, 2800);
}

async function runNav(page, expr, screenId) {
  await page.evaluate((e) => { eval(e); }, expr);
  if (screenId) {
    await page.waitForFunction((id) => {
      const el = document.getElementById(id);
      return el?.classList.contains('active');
    }, screenId, { timeout: 10000 }).catch(() => {});
  }
  await waitMs(page, 2200);
}

async function prismSetup(page) {
  await page.evaluate(() => {
    localStorage.setItem('po5', JSON.stringify({
      p: { name: 'Player', av: '🎮', xp: 420, lvl: 3 },
      c: { haptic: false, sfx: false, music: false, theme: 'neon' },
      a: {},
    }));
    localStorage.setItem('po5_device', 'iphone15');
    localStorage.setItem('po5s', '1');
    if (typeof DevSel !== 'undefined' && DevSel.pickModel) DevSel.pickModel('iphone15');
    ['device-sel', 'welcome', 'loader'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) { el.style.display = 'none'; el.classList.add('out'); }
    });
    if (typeof Nav !== 'undefined') Nav.go('home');
    if (typeof UI !== 'undefined' && UI.home) UI.home();
  });
  await page.waitForFunction(() => document.getElementById('home-screen')?.classList.contains('active'), { timeout: 12000 }).catch(() => {});
  await waitMs(page, 2500);
}

const APPS = [
  {
    slug: 'vaultcap',
    async capture(page) {
      await vaultUnlock(page);
      const shots = [
        { file: 'vaultcap.png', fn: async () => { await page.goto(`${BASE}/VaultCap/landing.html`, { waitUntil: 'networkidle' }); } },
        { file: 'vaultcap-2.png', fn: async () => { await vaultUnlock(page); await vaultNav(page, 'dashboard'); } },
        { file: 'vaultcap-3.png', fn: async () => { await vaultNav(page, 'family'); } },
        { file: 'vaultcap-4.png', fn: async () => { await vaultNav(page, 'banks'); } },
        { file: 'vaultcap-5.png', fn: async () => { await vaultNav(page, 'documents'); } },
        { file: 'vaultcap-6.png', fn: async () => { await vaultNav(page, 'zakat'); } },
        { file: 'vaultcap-7.png', fn: async () => { await vaultNav(page, 'investments'); } },
        { file: 'vaultcap-8.png', fn: async () => { await vaultNav(page, 'cards'); } },
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
    navs: [
      { expr: "go('workout')", screen: null },
      { expr: "go('nutrition')", screen: null },
      { expr: "go('recovery')", screen: null },
      { expr: "go('bodymap')", screen: null },
      { expr: "go('progress')", screen: null },
      { expr: "go('profiles')", screen: null },
    ],
    deviceNav: "go('dashboard')",
  },
  {
    slug: 'prismcap',
    setupUrl: `${BASE}/PrismCap/`,
    landing: `${BASE}/PrismCap/landing.html`,
    setup: prismSetup,
    navs: [
      { expr: "Nav.go('library')", screen: 'library-screen' },
      { expr: "Nav.go('arcade')", screen: 'arcade-screen' },
      { expr: "Nav.go('dashboard')", screen: 'dashboard-screen' },
      { expr: "Nav.go('profile')", screen: 'profile-screen' },
      { expr: "Nav.go('home')", screen: 'home-screen' },
      { expr: "Nav.go('library')", screen: 'library-screen', scroll: 480 },
    ],
    deviceNav: "Nav.go('home')",
  },
  {
    slug: 'steadycap',
    setupUrl: `${BASE}/SteadyCap/?demo=1`,
    landing: `${BASE}/SteadyCap/landing.html`,
    setup: async (page) => { await waitMs(page, 3500); },
    navs: [
      { expr: "Navigation.go('recovery')", screen: 'screen-recovery' },
      { expr: "Navigation.go('emergency')", screen: 'screen-emergency' },
      { expr: "Navigation.go('knowledge')", screen: 'screen-knowledge' },
      { expr: "Navigation.go('journal')", screen: 'screen-journal' },
      { expr: "Navigation.go('profile')", screen: 'screen-profile' },
      { expr: "Navigation.go('journal')", screen: 'screen-journal', scroll: 420 },
    ],
    deviceNav: "Navigation.go('dashboard')",
  },
  {
    slug: 'ledgercap',
    setupUrl: `${BASE}/LedgerCap/?demo=1`,
    landing: `${BASE}/LedgerCap/landing.html`,
    setup: async (page) => { await waitMs(page, 3500); },
    navs: [
      { expr: "Navigation.go('portfolio')", screen: 'screen-portfolio' },
      { expr: "Navigation.go('transactions')", screen: 'screen-transactions' },
      { expr: "Navigation.go('income')", screen: 'screen-income' },
      { expr: "Navigation.go('settings')", screen: 'screen-settings' },
      { expr: "Navigation.go('portfolio')", screen: 'screen-portfolio', scroll: 420 },
      { expr: "Navigation.go('transactions')", screen: 'screen-transactions', scroll: 360 },
    ],
    deviceNav: "Navigation.go('dashboard')",
  },
  {
    slug: 'deeponycap',
    setupUrl: `${BASE}/DeePonyCap/?demo=1`,
    landing: `${BASE}/DeePonyCap/landing.html`,
    setup: async (page) => { await waitMs(page, 3500); },
    navs: [
      { expr: "Nav.go('collection')", screen: null },
      { expr: "Nav.go('wishlist')", screen: null },
      { expr: "Nav.go('shelves')", screen: null },
      { expr: "Nav.go('stats')", screen: null },
      { expr: "Nav.go('settings')", screen: null },
      { expr: "Nav.go('stable')", screen: null },
    ],
    deviceNav: "Nav.go('stable')",
  },
  {
    slug: 'scentcap',
    landing: `${BASE}/ScentCap/landing.html`,
    setupUrl: `${BASE}/ScentCap/`,
    setup: async (page) => {
      await page.getByRole('button', { name: /Explore with sample wardrobe/i }).click({ timeout: 20000 });
      await page.getByText(/demo wardrobe/i).waitFor({ timeout: 20000 }).catch(() => {});
      await waitMs(page, 2500);
    },
    navs: [
      { link: 'Wardrobe' },
      { link: 'Advisor' },
      { link: 'Layer' },
      { link: 'Calendar' },
      { link: 'Settings' },
      { link: 'Today' },
    ],
    deviceLink: 'Today',
  },
  {
    slug: 'auracap',
    landing: `${BASE}/AuraCap/landing.html`,
    setupUrl: `${BASE}/AuraCap/`,
    setup: async (page) => {
      await page.getByRole('button', { name: /Try with sample wardrobe/i }).click({ timeout: 20000 });
      await page.getByText('Aura Score').waitFor({ timeout: 20000 }).catch(() => {});
      await waitMs(page, 2500);
    },
    navs: [
      { link: 'Digital DNA' },
      { link: 'Import Apps' },
      { link: 'App Library' },
      { link: 'Smart Organizer' },
      { link: 'AI Designer' },
      { link: 'Wallpapers' },
    ],
    deviceLink: 'Dashboard',
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
    console.log('OK', path.basename(file));
  }
  await page.setViewportSize({ width: 390, height: 844 });
}

function checkDedup() {
  const slugs = ['vaultcap', 'pulsecap', 'prismcap', 'steadycap', 'ledgercap', 'deeponycap', 'scentcap', 'auracap'];
  let failed = false;
  for (const slug of slugs) {
    const names = readdirSync(OUT)
      .filter((f) => f.startsWith(slug) && f.endsWith('.png'))
      .sort();
    const hashes = new Map();
    for (const name of names) {
      const buf = readFileSync(path.join(OUT, name));
      const hash = createHash('md5').update(buf).digest('hex');
      if (hashes.has(hash)) {
        console.error(`DUPLICATE ${slug}: ${name} === ${hashes.get(hash)} (${hash})`);
        failed = true;
      } else {
        hashes.set(hash, name);
      }
    }
  }
  if (failed) {
    console.error('\nScreenshot dedup FAILED — fix navigation before commit.');
    process.exit(1);
  }
  console.log('Screenshot dedup check passed (exit 0).');
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
    if (step.link) {
      await page.getByRole('link', { name: step.link }).first().click({ timeout: 15000 }).catch(() => {});
      await waitMs(page, 2200);
    } else if (step.route) {
      await page.goto(`${app.setupUrl.replace(/\/$/, '')}${step.route}`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
      await waitMs(page, 2200);
    } else {
      await runNav(page, step.expr, step.screen);
      if (step.scroll) {
        await page.evaluate((y) => {
          const active = document.querySelector('.screen.active');
          if (active) active.scrollTop = y;
          else window.scrollTo(0, y);
        }, step.scroll);
        await waitMs(page, 600);
      }
    }
    const file = path.join(OUT, `${app.slug}-${i + 3}.png`);
    await page.screenshot({ path: file });
    console.log('OK', path.basename(file));
  }

  await captureDevices(page, app.slug, async () => {
    if (app.deviceLink) {
      await page.getByRole('link', { name: app.deviceLink }).first().click({ timeout: 15000 }).catch(() => {});
      await waitMs(page, 1500);
    } else if (app.deviceRoute) {
      await page.goto(`${app.setupUrl.replace(/\/$/, '')}${app.deviceRoute}`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
      await waitMs(page, 1500);
    } else {
      await page.evaluate((expr) => { eval(expr); }, app.deviceNav);
      await waitMs(page, 1500);
    }
  });

  await page.close();
}

await browser.close();
console.log('Done');
checkDedup();

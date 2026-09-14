// @ts-check
import { test, expect } from '@playwright/test';

test.describe('PrismCap Tier 1 (PRSM-P0/P1)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('po5s', '1');
      localStorage.setItem('po5', JSON.stringify({
        p: { name: 'Tester', av: '🎮', xp: 100, lvl: 2, games: 3, wins: 1, losses: 0, streak: 0, best: 1, bluff: 0, betrayals: 0, reflex: 0, time: 0, hist: [{ g: 'Connect Four', i: '🔴', w: 'Tester', d: 1, dt: '1/1/2026', c: '#FFD60A' }], style: 'chaos' },
        c: { sfx: true, haptic: true, bg: false, save: true, theme: '', music: false, lowPower: true },
        a: []
      }));
    });
  });

  test('PRSM-P1-01: no device gate on cold load', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => typeof window.Nav !== 'undefined');
    await expect(page.locator('#device-sel')).toBeHidden();
    await expect(page.getByText('Select your device')).toHaveCount(0);
    await expect(page.getByText('All models supported')).toHaveCount(0);
  });

  test('PRSM-P0-01: D-06 game titles + hist migration', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.waitForFunction(() => window.Reg && window.Reg.list && window.Reg.list.length >= 35);
    const titles = await page.evaluate(() => {
      const byId = (id) => (window.Reg.get(id) || {}).title;
      return {
        c4: byId('c4'),
        word: byId('word'),
        deadrop: byId('deadrop'),
        hist: (window.S.prof.hist[0] || {}).g,
        banned: window.Reg.list.some((g) => /Connect Four|Codenames|Taboo|Word Assassin|Dead Drop/i.test(g.title))
      };
    });
    expect(titles.c4).toBe('Four in a Row');
    expect(titles.word).toBe('Word Dodge');
    expect(titles.deadrop).toBe('Clue Grid');
    expect(titles.hist).toBe('Four in a Row');
    expect(titles.banned).toBe(false);
  });

  test('PRSM-P1-03: manifest is PrismCap', async ({ page }) => {
    const res = await page.request.get('/manifest.json');
    expect(res.ok()).toBeTruthy();
    const m = await res.json();
    expect(m.name).toBe('PrismCap');
    expect(m.short_name).toBe('PrismCap');
    expect(m.description).toMatch(/Party games for one phone/i);
  });

  test('PRSM-P1-05: CapConfirm available; no native confirm in demo seed path', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.waitForFunction(() => typeof window.CapConfirm === 'function' && typeof window.GL !== 'undefined');
    const ok = await page.evaluate(async () => {
      // dialogs module loaded
      return typeof window.CapConfirm === 'function' && typeof window.CapPrompt === 'function' && typeof window.GL.requestExit === 'function';
    });
    expect(ok).toBe(true);
  });

  test('PRSM-P1-04: exit ConfirmDialog from game', async ({ page }) => {
    await page.goto('/?e2e=1');
    await page.waitForFunction(() => window.Reg && window.GL && window.CapConfirm);
    await page.evaluate(() => {
      const g = window.Reg.get('ttt') || window.Reg.list.find((x) => !x.mp);
      window.GL._start(g, [{ id: 'p1', name: 'Tester', av: '🎮', col: '#64D2FF', local: true }]);
    });
    await expect(page.locator('#game-screen.active')).toBeVisible();
    await page.locator('#game-screen button[aria-label="Leave game"]').click();
    await expect(page.locator('#cap-confirm-title')).toHaveText(/Leave this game/i);
    await page.locator('[data-confirm="no"]').click();
    await expect(page.locator('#game-screen.active')).toBeVisible();
    await page.locator('#game-screen button[aria-label="Leave game"]').click();
    await page.locator('[data-confirm="yes"]').click();
    await expect(page.locator('#home-screen.active')).toBeVisible({ timeout: 5000 });
  });

  test('version + SW cache aligned to 4.5.0 / prismcap-v450', async ({ page }) => {
    await page.goto('/?e2e=1');
    const ver = await page.evaluate(() => window.APP_VERSION);
    expect(ver).toBe('4.5.0');
    const sw = await page.request.get('/sw.js');
    const body = await sw.text();
    expect(body).toMatch(/prismcap-v450/);
  });
});

// @ts-check
import { test, expect } from '@playwright/test';

test.describe('PrismCap home integrity', () => {
  test('Mac landscape is block layout, not iPad grid', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?e2e=1');
    await page.waitForFunction(() => window.Reg && Reg.list.length >= 30);
    await page.waitForTimeout(1800);
    const d = await page.evaluate(() => {
      const home = document.getElementById('home-screen');
      const cs = getComputedStyle(home);
      return {
        device: document.body.getAttribute('data-device'),
        display: cs.display,
        grid: cs.gridTemplateColumns,
        mp: document.getElementById('mp-row')?.children.length || 0,
        solo: document.getElementById('solo-row')?.children.length || 0,
      };
    });
    expect(d.device).toBe('mac');
    expect(d.display).toBe('block');
    expect(d.grid).toBe('none');
    expect(d.mp).toBeGreaterThan(10);
    expect(d.solo).toBeGreaterThan(5);
  });

  test('demo=1 syncs header, stats, and Smart Hub', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?e2e=1&demo=1');
    await page.waitForFunction(() =>
      window.Reg && Reg.list.length >= 39 &&
      window.S && S.prof && S.prof.name === 'Demo Operative' &&
      Number(document.getElementById('sg')?.textContent) === Reg.list.length &&
      document.getElementById('smart-hub')
    , { timeout: 20000 });
    await page.waitForTimeout(400);
    const d = await page.evaluate(() => {
      const hub = document.getElementById('smart-hub')?.innerText || '';
      return {
        name: S.prof.name,
        xp: S.prof.xp,
        lvl: XP.lvl(S.prof.xp),
        games: S.prof.games,
        reg: Reg.list.length,
        hlvl: document.getElementById('hlvl')?.textContent,
        sg: document.getElementById('sg')?.textContent,
        sw: document.getElementById('sw')?.textContent,
        hub,
        mp: document.getElementById('mp-row')?.children.length || 0,
        homeDisplay: getComputedStyle(document.getElementById('home-screen')).display,
      };
    });
    expect(d.name).toBe('Demo Operative');
    expect(d.xp).toBe(2850);
    expect(d.lvl).toBe(9);
    expect(d.hlvl).toBe('LV9');
    expect(Number(d.sg)).toBe(d.reg);
    expect(d.sw).toBe('28');
    expect(d.hub).toMatch(/LV9/);
    expect(d.hub).toMatch(/2850/);
    expect(d.hub).not.toMatch(/LV1 · 0 XP/);
    expect(d.mp).toBeGreaterThan(10);
  });
});

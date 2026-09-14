// @ts-check
/**
 * Deep play-smoke: every Reg game starts, takes interactive input, survives without fatal error.
 * Not a full ranked match — covers first actionable UI path for museum gate.
 */
import { test, expect, devices } from '@playwright/test';

async function waitReg39(page) {
  await page.goto('/?e2e=1', { timeout: 30000 });
  await page.waitForFunction(() => typeof window.Reg !== 'undefined' && window.Reg.list?.length >= 30, {
    timeout: 20000,
  });
  await page.waitForTimeout(900);
  await page.waitForFunction(() => window.Reg.list.length >= 39, { timeout: 10000 });
}

async function startGame(page, id) {
  return page.evaluate((gid) => {
    const g = window.Reg.get(gid);
    if (!g) return { err: 'missing ' + gid };
    const n = g.mp ? Math.max(g.min || 2, 2) : 1;
    const players = Array.from({ length: n }, (_, i) => ({
      id: 'p' + (i + 1),
      name: 'P' + (i + 1),
      av: '🎮',
      col: '#64D2FF',
      local: i === 0,
      isBot: i > 0,
    }));
    try {
      window.GL._start(g, players);
      return { err: null, mp: !!g.mp, title: g.title };
    } catch (e) {
      return { err: String(e && e.message || e) };
    }
  }, id);
}

async function interactOnce(page, id) {
  // Close pass/cinematic overlays if any stuck
  await page.evaluate(() => {
    if (typeof window.Modal !== 'undefined' && window.Modal.close) window.Modal.close();
    const pass = document.getElementById('pass-c');
    if (pass) pass.style.display = 'none';
    document.querySelectorAll('[style*="z-index:999"]').forEach((el) => {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
  });

  // Prefer explicit start / begin / watch / pass controls
  const labeled = page
    .locator('#gbody button, #gbody .btn, #pass-c button')
    .filter({ hasText: /▶|Start|START|Begin|Watch|Pass to|Continue|Got it|Reveal|Play Again|Apply|Vote|Next/i });
  if ((await labeled.count()) > 0) {
    await labeled.first().click({ timeout: 600 }).catch(() => {});
    await page.waitForTimeout(50);
  }

  // Tap interactive board / targets
  const tap = page.locator(
    '#gbody button.btn, #gbody .mcell, #gbody .rtgt, #gbody .tapz, #gbody .board-cell, #gbody .tile, #gbody .bgcell, #gbody .pcell, #gbody .vopt, #gbody [onclick], #gbody canvas',
  );
  const n = await tap.count();
  if (n > 0) {
    await tap.nth(Math.min(1, n - 1)).click({ timeout: 600, force: true }).catch(() => {});
    await page.waitForTimeout(30);
    if (n > 2) await tap.nth(Math.min(2, n - 1)).click({ timeout: 400, force: true }).catch(() => {});
  }

  // Keyboard / D-pad games
  if (id === 'maze' || id === 'snake' || id === 'ghost' || id === 'cyber') {
    for (const k of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) {
      await page.keyboard.press(k);
      await page.waitForTimeout(40);
    }
  }

  // Second labeled action (sequence watch → recreate, etc.)
  if ((await labeled.count()) > 0) {
    await labeled.first().click({ timeout: 400 }).catch(() => {});
  }

  await page.waitForTimeout(60);
}

async function exitClean(page) {
  await page.evaluate(() => {
    try {
      if (typeof window.GL !== 'undefined' && window.GL.exitGame) window.GL.exitGame();
    } catch (_) {}
    if (typeof window.Modal !== 'undefined' && window.Modal.close) window.Modal.close();
  });
  await page.waitForTimeout(30);
}

test.describe('All 39 games play-smoke', () => {
  test('desktop: start + interact + exit every game', async ({ page }) => {
    test.setTimeout(240000);
    const errors = [];
    const failures = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await waitReg39(page);
    page.setDefaultTimeout(2500);
    const ids = await page.evaluate(() => window.Reg.list.map((g) => g.id));
    expect(ids.length).toBe(39);

    for (const id of ids) {
      const started = await startGame(page, id);
      if (started.err) {
        failures.push(id + ': start ' + started.err);
        await exitClean(page);
        continue;
      }
      try {
        await interactOnce(page, id);
        const bodyLen = await page.locator('#gbody').evaluate((el) => (el.innerHTML || '').trim().length);
        if (bodyLen < 10) failures.push(id + ': gbody emptied after interact');
      } catch (e) {
        failures.push(id + ': interact ' + String(e && e.message || e));
      }
      await exitClean(page);
    }

    const fatal = errors.filter(
      (e) => !/serviceWorker|ResizeObserver|favicon|AudioContext|play\(\)|NotAllowedError/i.test(e),
    );
    expect(failures, failures.join('\n')).toEqual([]);
    expect(fatal, fatal.join('\n')).toEqual([]);
  });
});

test.describe('Play-smoke mobile / iPad samples', () => {
  test('iPhone SE: play 5 representative games', async ({ browser }) => {
    test.setTimeout(120000);
    const context = await browser.newContext({ ...devices['iPhone SE'] });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await waitReg39(page);
    for (const id of ['reflex', 'ttt', 'mem', 'c4', 'ludo']) {
      const started = await startGame(page, id);
      expect(started.err, id).toBeNull();
      await interactOnce(page, id);
      await exitClean(page);
    }
    const fatal = errors.filter((e) => !/serviceWorker|ResizeObserver|favicon|AudioContext/i.test(e));
    expect(fatal).toEqual([]);
    await context.close();
  });

  test('iPad landscape: play board + solo sample', async ({ browser }) => {
    test.setTimeout(90000);
    const context = await browser.newContext({
      ...devices['iPad Pro 11'],
      viewport: { width: 1194, height: 834 },
    });
    const page = await context.newPage();
    await waitReg39(page);
    for (const id of ['snl', 'chess', 'qtap']) {
      const started = await startGame(page, id);
      expect(started.err, id).toBeNull();
      await interactOnce(page, id);
      const display = await page.locator('#game-screen').evaluate((el) => getComputedStyle(el).display);
      expect(display, id).not.toBe('grid');
      await exitClean(page);
    }
    await context.close();
  });
});

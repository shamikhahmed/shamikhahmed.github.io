// @ts-check
const { test, expect } = require('@playwright/test');

const TABS = ['today', 'garage', 'service', 'fuel', 'docs', 'settings'];

test.describe('CarCap smoke', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('?demo=1 loads all tabs without fatal pageerrors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/?demo=1');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('#app')).toBeVisible();
    await expect(page.locator('#header-pill')).toBeVisible();
    await expect(page.locator('#header-pill')).toHaveText('Demo');
    await page.waitForTimeout(400);

    for (const tab of TABS) {
      await page.locator(`.tab-btn[data-tab="${tab}"]`).click();
      await expect(page.locator('#content .screen')).toBeVisible();
      await expect(page.locator('#content .page-title')).toBeVisible();
      await expect(page).toHaveURL(new RegExp('[?&]demo=1'));
      await expect(page).toHaveURL(new RegExp('[?&]tab=' + tab));
    }

    const fatal = errors.filter((e) => !/serviceWorker|ResizeObserver|favicon/i.test(e));
    expect(fatal).toEqual([]);
  });

  test('manifest link present', async ({ page }) => {
    await page.goto('/?demo=1');
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
  });
});

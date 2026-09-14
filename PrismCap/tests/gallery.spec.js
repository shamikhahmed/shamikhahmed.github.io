// @ts-check
// Screen gallery capture — shell screens, mobile + desktop. CAPTURE_GALLERY-gated.
// Game screen excluded: needs a live game session; see ROADMAP.
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const GALLERY_DIR = join(process.cwd(), 'docs', 'screenshots', 'gallery');

const SCREENS = ['home', 'library', 'dashboard', 'arcade', 'profile'];

const VIEWPORTS = {
  mobile: { width: 393, height: 852 },
  desktop: { width: 1280, height: 800 },
};

function appendManifest(shots) {
  const manifestPath = join(GALLERY_DIR, 'gallery-manifest.json');
  let existing = { shots: [] };
  try {
    existing = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    /* first writer */
  }
  const merged = [...existing.shots.filter((s) => !shots.some((n) => n.file === s.file)), ...shots];
  merged.sort((a, b) => a.file.localeCompare(b.file));
  const version = JSON.parse(readFileSync(join(process.cwd(), 'VERSION.json'), 'utf8')).version;
  writeFileSync(
    manifestPath,
    JSON.stringify({ app: 'PrismCap', version, generated: new Date().toISOString(), shots: merged }, null, 2),
  );
}

for (const viewport of ['mobile', 'desktop']) {
  test.describe(`Screen gallery — ${viewport}`, () => {
    test.skip(!process.env.CAPTURE_GALLERY, 'Gallery capture runs via `npm run gallery` (CAPTURE_GALLERY=1)');
    test.use({ viewport: VIEWPORTS[viewport], deviceScaleFactor: 2 });

    test.beforeAll(() => {
      mkdirSync(GALLERY_DIR, { recursive: true });
    });

    test(`capture ${SCREENS.length} ${viewport} screens`, async ({ page }) => {
      test.setTimeout(120_000);
      // Skip first-run welcome overlay so Nav.go shots show real shell screens.
      await page.addInitScript(() => {
        try {
          localStorage.setItem('po5s', '1');
        } catch {
          /* ignore */
        }
      });
      await page.goto('/?e2e=1&demo=1');
      await page.waitForFunction(
        () => typeof window.Nav !== 'undefined' && typeof window.Nav.go === 'function',
        undefined,
        { timeout: 20_000 },
      );
      await page.evaluate(() => {
        const w = document.getElementById('welcome');
        if (w) {
          w.classList.add('out');
          w.style.display = 'none';
        }
      });
      await page.waitForTimeout(600);

      const shots = [];
      for (const [i, id] of SCREENS.entries()) {
        const ok = await page.evaluate((screen) => {
          try {
            window.Nav.go(screen);
            return true;
          } catch {
            return false;
          }
        }, id);
        expect(ok, `Nav.go('${id}') should not throw`).toBe(true);
        await page.waitForTimeout(500);
        const file = `${viewport}-${String(i + 1).padStart(2, '0')}-${id}.png`;
        await page.screenshot({ path: join(GALLERY_DIR, file), fullPage: false });
        shots.push({ file, label: id.charAt(0).toUpperCase() + id.slice(1), route: `Nav.go('${id}')`, viewport });
      }
      appendManifest(shots);
    });
  });
}

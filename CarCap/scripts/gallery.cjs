/**
 * Minimal screen gallery — Today + Garage (mobile + desktop).
 * Run: npm run gallery
 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const outDir = path.join(root, 'docs', 'screenshots', 'gallery');
const TABS = ['today', 'garage'];
const VIEWPORTS = {
  mobile: { width: 393, height: 852 },
  desktop: { width: 1280, height: 800 },
};

function contentType(p) {
  if (p.endsWith('.html')) return 'text/html';
  if (p.endsWith('.js')) return 'text/javascript';
  if (p.endsWith('.css')) return 'text/css';
  if (p.endsWith('.json') || p.endsWith('.webmanifest')) return 'application/json';
  if (p.endsWith('.png')) return 'image/png';
  if (p.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let url = decodeURIComponent((req.url || '/').split('?')[0]);
      if (url === '/') url = '/index.html';
      const file = path.join(root, url.replace(/^\//, ''));
      if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404);
        res.end('missing');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType(file), 'Cache-Control': 'no-store' });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () =>
      resolve({ server, base: `http://127.0.0.1:${server.address().port}` }),
    );
  });
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const { server, base } = await startServer();
  const browser = await chromium.launch();
  const shots = [];

  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2 });
    const page = await ctx.newPage();

    for (const [i, tab] of TABS.entries()) {
      await page.goto(`${base}/?demo=1&tab=${tab}`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#content', { timeout: 10000 });
      await page.waitForTimeout(400);
      const file = `${vpName}-${String(i + 1).padStart(2, '0')}-${tab}.png`;
      await page.screenshot({ path: path.join(outDir, file), fullPage: false });
      shots.push({ file, label: tab[0].toUpperCase() + tab.slice(1), route: `?demo=1&tab=${tab}`, viewport: vpName });
      console.log('shot', file);
    }
    await ctx.close();
  }

  const version = JSON.parse(fs.readFileSync(path.join(root, 'VERSION.json'), 'utf8')).version;
  shots.sort((a, b) => a.file.localeCompare(b.file));
  fs.writeFileSync(
    path.join(outDir, 'gallery-manifest.json'),
    JSON.stringify({ app: 'CarCap', version, generated: new Date().toISOString(), shots }, null, 2),
  );
  await browser.close();
  server.close();
  console.log(`done: ${shots.length} shots`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

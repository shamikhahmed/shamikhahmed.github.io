import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HUB = join(__dirname, '..');
const required = [
  'index.html', 'support.html', 'privacy.html', 'robots.txt', 'sitemap.xml',
  'assets/og.png', 'vaultcap.html', 'cookcap.html', 'js/products-data.js',
];
let fail = 0;
for (const f of required) {
  if (!existsSync(join(HUB, f))) { console.error('missing', f); fail++; }
  else console.log('ok', f);
}
const catalog = readFileSync(join(HUB, 'js/products-data.js'), 'utf8');

// Legacy pages (products-data.js) must match the deployed Capricorn OS bundle,
// whose fallback versions come from capricorn-lab js/products.js (deploy:hub).
const index = readFileSync(join(HUB, 'index.html'), 'utf8');
const bundleRef = index.match(/src="\/?(assets\/index-[\w-]+\.js)"/)?.[1];
const bundle = bundleRef && existsSync(join(HUB, bundleRef)) ? readFileSync(join(HUB, bundleRef), 'utf8') : '';
if (!bundle) { console.error('missing OS bundle', bundleRef); fail++; }
const osVer = Object.fromEntries([...bundle.matchAll(/slug:"([a-z]+)"[\s\S]{0,200}?ver:"([^"]+)"/g)].map((m) => [m[1], m[2]]));
const SLUGS = ['vaultcap', 'pulsecap', 'steadycap', 'ledgercap', 'deeponycap', 'scentcap', 'soulcap', 'travelcap', 'masterycap', 'ideacap', 'carcap', 'cookcap', 'deefoodie'];
for (const slug of SLUGS) {
  const re = new RegExp(`${slug}:[\\s\\S]*?ver:\\s*'([^']+)'`);
  const legacy = catalog.match(re)?.[1];
  const os = osVer[slug];
  if (!legacy || !os || legacy !== os) { console.error('ver', slug, 'legacy', legacy, '≠ OS', os); fail++; }
  else console.log('ver', slug, legacy);
}
if (!catalog.includes('privateBeta: true') && !catalog.includes("Private beta")) {
  // deefoodie block has privateBeta
}
if (!/deefoodie:[\s\S]*privateBeta:\s*true/.test(catalog)) {
  console.error('DeeFoodie privateBeta missing'); fail++;
} else console.log('ok deefoodie private beta');

const redirects = ['vaultcap','pulsecap','steadycap','ledgercap','deeponycap','scentcap','soulcap','travelcap','ideacap','carcap','masterycap','cookcap'];
for (const s of redirects) {
  const html = readFileSync(join(HUB, `${s}.html`), 'utf8');
  if (!html.includes('http-equiv="refresh"')) { console.error('not redirect', s); fail++; }
}
console.log(fail ? `FAIL ${fail}` : 'link-check passed');
process.exit(fail ? 1 : 0);

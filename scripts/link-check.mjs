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
for (const [slug, ver] of Object.entries({
  vaultcap:'5.2.1', pulsecap:'6.43.0', prismcap:'4.5.0', steadycap:'2.5.1',
  ledgercap:'3.57.0', deeponycap:'3.8.0', scentcap:'2.1.0', soulcap:'8.2.0',
  travelcap:'1.0.0', auracap:'5.4.0', masterycap:'51.9.0', ideacap:'2.0.0',
  carcap:'1.0.0', cookcap:'3.5.0', deefoodie:'1.0.0+3',
})) {
  const re = new RegExp(`${slug}:[\\s\\S]*?ver:\\s*'([^']+)'`);
  const m = catalog.match(re);
  if (!m || m[1] !== ver) { console.error('ver', slug, m?.[1]); fail++; }
  else console.log('ver', slug, ver);
}
if (!catalog.includes('privateBeta: true') && !catalog.includes("Private beta")) {
  // deefoodie block has privateBeta
}
if (!/deefoodie:[\s\S]*privateBeta:\s*true/.test(catalog)) {
  console.error('DeeFoodie privateBeta missing'); fail++;
} else console.log('ok deefoodie private beta');

const redirects = ['vaultcap','pulsecap','prismcap','steadycap','ledgercap','deeponycap','scentcap','auracap','soulcap','travelcap','ideacap','carcap','masterycap','cookcap'];
for (const s of redirects) {
  const html = readFileSync(join(HUB, `${s}.html`), 'utf8');
  if (!html.includes('http-equiv="refresh"')) { console.error('not redirect', s); fail++; }
}
console.log(fail ? `FAIL ${fail}` : 'link-check passed');
process.exit(fail ? 1 : 0);

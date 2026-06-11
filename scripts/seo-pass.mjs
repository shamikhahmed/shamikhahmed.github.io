#!/usr/bin/env node
/**
 * One-shot, idempotent SEO + design-system pass over hub pages.
 * - canonical + Open Graph + Twitter meta (from each page's title/description)
 * - capricorn-core.css linked before capricorn.css (cache-busted to v=16)
 * - Google Fonts made non-render-blocking (media=print swap + noscript)
 * - capricorn-motion.js runtime added before </body>
 * index.html is maintained by hand and skipped.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://shamikhahmed.github.io/';
const SKIP = new Set(['index.html', 'app.html']);

const PAGES = [
  'about.html', 'solutions.html', 'sovereignty.html', 'enterprise.html', 'product.html',
  'vaultcap.html', 'pulsecap.html', 'prismcap.html', 'steadycap.html',
  'ledgercap.html', 'deeponycap.html', 'scentcap.html', 'auracap.html',
];

const get = (html, re) => { const m = html.match(re); return m ? m[1].trim() : null; };

for (const page of PAGES) {
  if (SKIP.has(page)) continue;
  const file = join(ROOT, page);
  if (!existsSync(file)) { console.warn(`skip ${page} (missing)`); continue; }
  let html = readFileSync(file, 'utf8');
  const before = html;

  const title = get(html, /<title>([^<]+)<\/title>/i) || 'Capricorn Systems';
  const desc = get(html, /<meta name="description" content="([^"]+)"/i) ||
    'Capricorn Systems builds premium offline-first personal software. Your device, your data, your call.';
  const slug = page.replace('.html', '');
  const shot = existsSync(join(ROOT, 'assets', 'screenshots', `${slug}.png`))
    ? `${BASE}assets/screenshots/${slug}.png`
    : `${BASE}icon-1024.png`;

  if (!html.includes('property="og:title"')) {
    const block = [
      `  <link rel="canonical" href="${BASE}${page}">`,
      `  <meta property="og:type" content="website">`,
      `  <meta property="og:site_name" content="Capricorn Systems">`,
      `  <meta property="og:title" content="${title}">`,
      `  <meta property="og:description" content="${desc}">`,
      `  <meta property="og:url" content="${BASE}${page}">`,
      `  <meta property="og:image" content="${shot}">`,
      `  <meta name="twitter:card" content="summary_large_image">`,
      `  <meta name="twitter:title" content="${title}">`,
      `  <meta name="twitter:description" content="${desc}">`,
      `  <meta name="twitter:image" content="${shot}">`,
    ].join('\n');
    html = html.replace(/(<title>[^<]+<\/title>)/i, `$1\n${block}`);
  }

  if (!html.includes('name="description"')) {
    html = html.replace(/(<title>[^<]+<\/title>)/i, `$1\n  <meta name="description" content="${desc}">`);
  }

  if (!html.includes('capricorn-core.css')) {
    html = html.replace(
      /<link rel="stylesheet" href="css\/capricorn\.css[^"]*">/,
      `<link rel="stylesheet" href="css/capricorn-core.css?v=1">\n  <link rel="stylesheet" href="css/capricorn.css?v=16">`
    );
  }
  html = html.replace(/css\/capricorn\.css\?v=15/g, 'css/capricorn.css?v=16');

  html = html.replace(
    /<link (href="https:\/\/fonts\.googleapis\.com[^"]+" rel="stylesheet")>(?!\s*<noscript>)/g,
    (m, attrs) => `<link ${attrs} media="print" onload="this.media='all'">\n  <noscript><link ${attrs}></noscript>`
  );

  if (!html.includes('capricorn-motion.js')) {
    html = html.replace(/<\/body>/, `  <script src="js/capricorn-motion.js" defer></script>\n</body>`);
  }

  if (html !== before) { writeFileSync(file, html); console.log(`✓ ${page}`); }
  else console.log(`= ${page} (no change)`);
}

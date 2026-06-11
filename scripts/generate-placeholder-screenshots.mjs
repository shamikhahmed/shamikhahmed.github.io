import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../assets/screenshots');

const APPS = {
  scentcap: { name: 'ScentCap', tag: 'Fragrance OS', accent: '#c9a87c', bg: '#1a1614', emoji: '💧' },
  auracap: { name: 'AuraCap', tag: 'Ecosystem Studio', accent: '#4f6ef7', bg: '#050507', emoji: '◎' },
};

const LABELS = ['Landing', 'Home', 'Feature 2', 'Feature 3', 'Feature 4', 'Feature 5', 'Feature 6', 'Feature 7', 'Feature 8'];

async function renderPng(app, label, w, h, outfile) {
  const { name, tag, accent, bg, emoji } = APPS[app];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="${bg}"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="${bg}"/>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <text x="50%" y="42%" text-anchor="middle" font-family="system-ui,sans-serif" font-size="${Math.round(w * 0.12)}" fill="${accent}">${emoji}</text>
    <text x="50%" y="54%" text-anchor="middle" font-family="system-ui,sans-serif" font-size="${Math.round(w * 0.055)}" font-weight="700" fill="#ffffff">${name}</text>
    <text x="50%" y="61%" text-anchor="middle" font-family="system-ui,sans-serif" font-size="${Math.round(w * 0.028)}" fill="${accent}">${tag}</text>
    <text x="50%" y="70%" text-anchor="middle" font-family="system-ui,sans-serif" font-size="${Math.round(w * 0.032)}" fill="#888">${label}</text>
    <rect x="${w * 0.08}" y="${h * 0.78}" width="${w * 0.84}" height="4" rx="2" fill="${accent}" opacity="0.35"/>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(outfile);
  console.log('PLACEHOLDER', path.basename(outfile));
}

await mkdir(OUT, { recursive: true });

for (const slug of Object.keys(APPS)) {
  await renderPng(slug, LABELS[0], 780, 1688, path.join(OUT, `${slug}.png`));
  for (let i = 0; i < 8; i++) {
    await renderPng(slug, LABELS[i + 1] || `Screen ${i + 2}`, 780, 1688, path.join(OUT, `${slug}-${i + 2}.png`));
  }
  await renderPng(slug, 'iPad', 1668, 2388, path.join(OUT, `${slug}-ipad.png`));
  await renderPng(slug, 'Mac', 2560, 1600, path.join(OUT, `${slug}-mac.png`));
}

console.log('Placeholder screenshots generated.');

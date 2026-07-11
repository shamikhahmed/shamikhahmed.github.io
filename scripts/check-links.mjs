#!/usr/bin/env node
// Internal link/asset check across all HTML pages. Fails on missing local targets.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const pages = readdirSync(ROOT).filter((f) => f.endsWith('.html'));
let broken = 0;
for (const page of pages) {
  const html = readFileSync(join(ROOT, page), 'utf8');
  const refs = [...html.matchAll(/(?:href|src)=["']([^"'#?]+)[^"']*["']/g)].map((m) => m[1]);
  for (const ref of refs) {
    if (/^(https?:|mailto:|tel:|data:|javascript:|\/\/)/.test(ref)) continue;
    if (ref.includes('${')) continue; // JS template literal inside inline script, not a static link
    const target = join(ROOT, ref.replace(/^\.?\//, ''));
    if (!existsSync(target)) { console.log(`BROKEN ${page} -> ${ref}`); broken++; }
  }
}
console.log(broken ? `${broken} broken internal ref(s)` : `OK — ${pages.length} pages, all internal refs resolve`);
process.exit(broken ? 1 : 0);

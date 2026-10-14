#!/usr/bin/env node
'use strict';
/**
 * C-57: assert every classic SW precache URL exists in the staged Pages artifact.
 * Usage: node scripts/verify-pages-artifact.mjs <destDir> [swFile]
 */
var fs = require('fs');
var path = require('path');

var dest = process.argv[2];
var swName = process.argv[3] || 'sw.js';
if (!dest) {
  console.error('Usage: node scripts/verify-pages-artifact.mjs <destDir> [swFile]');
  process.exit(2);
}

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch (e) {
    return false;
  }
}

var swPath = path.join(dest, swName);
if (!exists(swPath)) {
  var alts = ['sw.js', 'sw-v51.js'];
  var found = null;
  for (var i = 0; i < alts.length; i++) {
    if (exists(path.join(dest, alts[i]))) {
      found = path.join(dest, alts[i]);
      break;
    }
  }
  if (!found) {
    console.error('FAIL: service worker missing in artifact:', swName);
    process.exit(1);
  }
  swPath = found;
}

if (!exists(path.join(dest, 'index.html'))) {
  console.error('FAIL: index.html missing from artifact');
  process.exit(1);
}

var text = fs.readFileSync(swPath, 'utf8');
var m = text.match(/(?:ASSETS|PRECACHE|CACHE_URLS|urlsToCache)\s*=\s*\[([\s\S]*?)\]/);
if (!m) {
  console.log('OK — SW + index.html present (no classic ASSETS array)');
  process.exit(0);
}

var urls = [];
var re = /['"]([^'"]+)['"]/g;
var hit;
while ((hit = re.exec(m[1]))) urls.push(hit[1]);

var missing = [];
urls.forEach(function (u) {
  if (u === './' || u === '/') return;
  var rel = u.replace(/^\.\//, '').replace(/^\//, '');
  if (!rel) return;
  if (!exists(path.join(dest, rel))) missing.push(u);
});

if (missing.length) {
  console.error(
    'FAIL: SW precache URLs missing from artifact:\n' +
      missing
        .map(function (x) {
          return '  - ' + x;
        })
        .join('\n')
  );
  process.exit(1);
}

console.log('OK — ' + urls.length + ' SW precache URLs present in artifact');

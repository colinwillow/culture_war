// npm run bump -- run before EVERY push to main.
// GitHub Pages tells browsers to cache files for 10 minutes and iOS Safari holds module scripts even longer, so a
// phone can run a new index.html against OLD scripts (dead buttons, "could not load src/main.js"). This raises BUILD
// and stamps ?v=BUILD on every relative script/style URL, so each push is a set of brand-new URLs nothing has cached.
import fs from 'fs';
import path from 'path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const vf = path.join(root, 'version.json');
const v = (fs.existsSync(vf) ? JSON.parse(fs.readFileSync(vf, 'utf8')).build : 0) + 1;
fs.writeFileSync(vf, JSON.stringify({ build: v }) + '\n');

const files = [path.join(root, 'index.html')];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (p.endsWith('.js')) files.push(p); } })(path.join(root, 'src'));

// relative imports in JS, plus src= / href= of local .js/.css in index.html
const RX = /((?:from\s+|import\s*\(\s*|import\s+|src=|href=)(['"]))(\.{1,2}\/[^'"?]+\.(?:js|css))(?:\?v=\d+)?\2/g;
let n = 0;
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  const o = s;
  s = s.replace(RX, (m, pre, q, url) => { n++; return pre + url + '?v=' + v + q; });
  if (f.endsWith('index.html')) s = s.replace(/<b id="build">[^<]*<\/b>/, '<b id="build">B' + v + '</b>');
  if (f.endsWith(path.join('src', 'main.js'))) s = s.replace(/export const BUILD = \d+;/, 'export const BUILD = ' + v + ';');
  if (s !== o) fs.writeFileSync(f, s);
}
console.log('build ' + v + ': stamped ' + n + ' URLs');

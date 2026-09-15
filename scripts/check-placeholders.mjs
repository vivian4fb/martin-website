// Fails the build on any placeholder token in shipped source.
// Rule from 2_Business/context.md: a placeholder in a deployed site is a build failure.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const PATTERNS = [/YOUR_/, /XXXXX/, /\bTODO\b/, /\binfo@/i, /\+91 98765/, /lorem ipsum/i, /example\.com/i];
const EXT = new Set(['.astro', '.ts', '.js', '.mjs', '.css', '.html', '.md', '.json', '.svg', '.txt']);
const ROOTS = ['src', 'public'];

const hits = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!EXT.has(extname(p))) continue;
    readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
      for (const re of PATTERNS) if (re.test(line)) hits.push(`${p}:${i + 1}  ${re}  ${line.trim().slice(0, 100)}`);
    });
  }
}
ROOTS.forEach(walk);

if (hits.length) {
  console.error(`\n✖ Placeholder check FAILED — ${hits.length} hit(s):\n` + hits.join('\n') + '\n');
  process.exit(1);
}
console.log('✔ Placeholder check passed (src/, public/).');

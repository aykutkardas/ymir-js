// Builds the GitHub Pages site into _site/:
//   index.html, learn.js,     copied from site/
//   llms.txt
//   lib/core/                 the core's ES modules, for the live lessons
//   llms-full.txt             README + every public type declaration
//   examples/<name>/          each example app, built
//
// Run after `pnpm build` (for the .d.ts files) and after installing each
// example's dependencies.
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const out = join(root, '_site');
const examples = readdirSync(join(root, 'examples')).filter((name) =>
  existsSync(join(root, 'examples', name, 'package.json'))
);

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

cpSync(join(root, 'site'), out, { recursive: true });

// The core's ES modules, for the live lessons on the home page (learn.js).
cpSync(join(root, 'packages', 'core', 'dist'), join(out, 'lib', 'core'), {
  recursive: true,
  filter: (path) => !path.endsWith('.d.ts') && !path.includes('.bench.'),
});

for (const name of examples) {
  const dir = join(root, 'examples', name);
  console.log(`Building examples/${name}`);
  execSync('pnpm build', { cwd: dir, stdio: 'inherit' });
  cpSync(join(dir, 'dist'), join(out, 'examples', name), { recursive: true });
}

// llms-full.txt: everything an LLM needs in one file.
const declarations = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir).sort()) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path);
    else if (entry.endsWith('.d.ts')) declarations.push(path);
  }
};
// Each package's declarations, from its dist/ (run `pnpm build` first).
const packages = readdirSync(join(root, 'packages')).sort();
const packageNames = Object.fromEntries(
  packages.map((pkg) => [pkg, JSON.parse(readFileSync(join(root, 'packages', pkg, 'package.json'), 'utf8')).name])
);
packages.forEach((pkg) => walk(join(root, 'packages', pkg, 'dist')));

const llms = readFileSync(join(root, 'site', 'llms.txt'), 'utf8');
const readme = readFileSync(join(root, 'README.md'), 'utf8');
const types = declarations
  .map((path) => {
    const [pkg, , ...rest] = relative(join(root, 'packages'), path).split(/[\\/]/);
    return `### ${packageNames[pkg]}: ${rest.join('/')}\n\n\`\`\`ts\n${readFileSync(path, 'utf8').trim()}\n\`\`\``;
  })
  .join('\n\n');

writeFileSync(
  join(out, 'llms-full.txt'),
  [
    llms.trim(),
    '---',
    '# README',
    readme.trim(),
    '---',
    '# Public type declarations',
    "Generated from each package's published `dist/` folder; `ymir-js` re-exports all of them. Coordinates are \"row|col\" strings unless noted.",
    types,
  ].join('\n\n') + '\n'
);

// GitHub Pages would otherwise run Jekyll and drop files starting with "_".
writeFileSync(join(out, '.nojekyll'), '');

console.log(`Site written to ${relative(root, out)}/ (${examples.join(', ')})`);

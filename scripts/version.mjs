// Gives every package the same new version, commits and tags it.
//
//   node scripts/version.mjs minor      # or major, patch, or 1.2.3
//   git push --follow-tags              # CI publishes the tag
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const bump = process.argv[2];

if (!bump) {
  console.error('Usage: node scripts/version.mjs <major|minor|patch|x.y.z>');
  process.exit(1);
}

const files = readdirSync(join(root, 'packages')).map((pkg) => join(root, 'packages', pkg, 'package.json'));
const current = JSON.parse(readFileSync(join(root, 'packages', 'ymir-js', 'package.json'), 'utf8')).version;
const [major, minor, patch] = current.split('.').map(Number);

const next =
  bump === 'major'
    ? `${major + 1}.0.0`
    : bump === 'minor'
      ? `${major}.${minor + 1}.0`
      : bump === 'patch'
        ? `${major}.${minor}.${patch + 1}`
        : bump;

if (!/^\d+\.\d+\.\d+$/.test(next)) throw new Error(`Not a version: ${next}`);

const status = execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
if (status.trim()) throw new Error('Commit or stash your changes first.');

for (const file of files) {
  const pkg = JSON.parse(readFileSync(file, 'utf8'));
  pkg.version = next;
  writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
}

execFileSync('git', ['commit', '-am', next], { cwd: root, stdio: 'inherit' });
// An annotated tag, so `git push --follow-tags` pushes it.
execFileSync('git', ['tag', '-a', `v${next}`, '-m', next], { cwd: root, stdio: 'inherit' });

console.log(`${current} → ${next}. Push with: git push --follow-tags`);

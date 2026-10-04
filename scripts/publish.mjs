// Publishes every package whose version is not on npm yet, core first and
// the ymir-js umbrella last. Run after `pnpm build`. CI runs it for each
// version tag; it also works locally after `npm login`. Pass --dry-run to
// see what would be published.
//
// Each package is packed with pnpm (which turns `workspace:^` into a real
// version range) and published with npm (which supports trusted publishing
// and provenance from GitHub Actions).
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const ORDER = ['core', 'checkers', 'chess', 'go', 'match3', 'ymir-js'];
const inCI = !!process.env.GITHUB_ACTIONS;
const dryRun = process.argv.includes('--dry-run');
const shell = process.platform === 'win32';

const isPublished = (name, version) => {
  try {
    execFileSync('npm', ['view', `${name}@${version}`, 'version'], { stdio: 'pipe', shell });
    return true;
  } catch {
    return false;
  }
};

// The umbrella package's npm page shows the repository README.
copyFileSync(join(root, 'README.md'), join(root, 'packages', 'ymir-js', 'README.md'));

const out = mkdtempSync(join(tmpdir(), 'ymir-publish-'));

for (const folder of ORDER) {
  const dir = join(root, 'packages', folder);
  const { name, version } = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));

  if (isPublished(name, version)) {
    console.log(`${name}@${version} is already on npm; skipping`);
    continue;
  }

  const tarball = execFileSync('pnpm', ['pack', '--pack-destination', out], { cwd: dir, encoding: 'utf8', shell })
    .trim()
    .split('\n')
    .pop();

  console.log(`${dryRun ? 'Would publish' : 'Publishing'} ${name}@${version}`);
  const flags = [...(inCI ? ['--provenance'] : []), ...(dryRun ? ['--dry-run'] : [])];
  execFileSync('npm', ['publish', tarball, '--access', 'public', ...flags], {
    cwd: dir,
    stdio: 'inherit',
    shell,
  });
}

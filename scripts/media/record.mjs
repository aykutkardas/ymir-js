// Records the README GIFs by playing each example app in a headless browser
// and capturing the board.
//
//   pnpm build                          # the library, used for the Go game
//   node scripts/build-site.mjs         # builds the examples into _site/
//   cd scripts/media && pnpm record     # writes docs/media/*.gif
//   cd scripts/media && pnpm record go  # or only some of them
//
// Uses an installed Microsoft Edge or Chrome (no browser download).
import { createServer } from 'node:http';
import { readFileSync, existsSync, writeFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

import gifenc from 'gifenc';
import { chromium } from 'playwright-core';
import { PNG } from 'pngjs';

import { GoGame } from '../../dist/index.js';

const { GIFEncoder, quantize, applyPalette } = gifenc;

const root = new URL('../..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const site = join(root, '_site');
const out = join(root, 'docs', 'media');
const only = process.argv.slice(2);

if (!existsSync(join(site, 'examples'))) {
  throw new Error('Run `node scripts/build-site.mjs` first.');
}

// A tiny static server for _site/.
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
const server = createServer((req, res) => {
  let path = join(site, decodeURIComponent(req.url.split('?')[0]));
  if (existsSync(path) && statSync(path).isDirectory()) path = join(path, 'index.html');
  if (!existsSync(path)) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
  res.end(readFileSync(path));
});
await new Promise((resolve) => server.listen(0, resolve));
const base = `http://localhost:${server.address().port}`;

const browser = await chromium
  .launch({ channel: 'msedge' })
  .catch(() => chromium.launch({ channel: 'chrome' }));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Opens an example and returns helpers for clicking and recording its board. */
const open = async (name, boardSelector) => {
  const page = await browser.newPage({
    viewport: { width: 480, height: 900 },
    colorScheme: 'light',
    reducedMotion: 'no-preference',
  });
  await page.goto(`${base}/examples/${name}/`);
  await page.waitForSelector(boardSelector);

  const frames = [];
  let recording = false;
  let loop = null;

  const capture = async () => {
    const png = await page.locator(boardSelector).screenshot({ animations: 'allow' });
    frames.push({ png, at: Date.now() });
  };

  return {
    page,
    frames,
    /** Captures frames continuously until stop(). */
    start(interval = 90) {
      recording = true;
      loop = (async () => {
        while (recording) {
          const started = Date.now();
          await capture();
          await sleep(Math.max(0, interval - (Date.now() - started)));
        }
      })();
    },
    async stop() {
      recording = false;
      await loop;
      await capture();
    },
  };
};

/** Encodes frames as a GIF, merging identical frames and scaling delays to real time. */
const writeGif = (name, frames, { endHold = 2500, maxWidth = 420 } = {}) => {
  const decoded = frames.map(({ png, at }) => ({ image: PNG.sync.read(png), at }));
  const { width, height } = decoded[0].image;
  const scale = Math.min(1, maxWidth / width);
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);

  const resize = ({ data }) => {
    if (scale === 1) return data;
    const outData = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const sx = Math.min(width - 1, Math.floor(x / scale));
        const sy = Math.min(height - 1, Math.floor(y / scale));
        const s = (sy * width + sx) * 4;
        const d = (y * w + x) * 4;
        outData[d] = data[s];
        outData[d + 1] = data[s + 1];
        outData[d + 2] = data[s + 2];
        outData[d + 3] = 255;
      }
    }
    return outData;
  };

  const images = decoded.map(({ image }) => resize(image));

  // One palette for the whole animation, from a few frames spread across it.
  // Index 255 is kept free for "unchanged since the last frame".
  const samples = [0, 0.25, 0.5, 0.75, 1].map((f) => images[Math.round(f * (images.length - 1))]);
  const sample = new Uint8Array(samples.reduce((n, img) => n + img.length, 0));
  samples.reduce((offset, img) => (sample.set(img, offset), offset + img.length), 0);
  const palette = quantize(sample, 255);
  while (palette.length < 256) palette.push([0, 0, 0]);
  const TRANSPARENT = 255;

  const gif = GIFEncoder();
  let previous = null;
  let pending = null;

  const flush = () => {
    gif.writeFrame(pending.index, w, h, {
      palette: pending.first ? palette : undefined,
      delay: pending.delay,
      transparent: !pending.first,
      transparentIndex: TRANSPARENT,
      dispose: 1, // keep the previous frame; only changed pixels are drawn
    });
  };

  images.forEach((rgba, i) => {
    const at = decoded[i].at;
    const next = decoded[i + 1]?.at ?? at + endHold;
    const delay = Math.max(40, next - at);
    const index = applyPalette(rgba, palette);

    if (!previous) {
      pending = { index, delay, first: true };
      previous = index;
      return;
    }

    // Draw only what changed; everything else stays transparent.
    const diff = new Uint8Array(index.length);
    let changed = false;
    for (let p = 0; p < index.length; p += 1) {
      if (index[p] === previous[p]) {
        diff[p] = TRANSPARENT;
      } else {
        diff[p] = index[p];
        changed = true;
      }
    }

    if (!changed) {
      pending.delay += delay;
      return;
    }

    flush();
    pending = { index: diff, delay, first: false };
    previous = index;
  });

  pending.delay += endHold;
  flush();
  gif.finish();

  // DUMP=dir writes a few frames as PNG, to look at without a GIF viewer.
  if (process.env.DUMP) {
    [0.33, 0.66, 1].forEach((f) => {
      const { png } = frames[Math.round(f * (frames.length - 1))];
      writeFileSync(join(process.env.DUMP, `${name}-${Math.round(f * 100)}.png`), png);
    });
  }

  const bytes = gif.bytes();
  writeFileSync(join(out, `${name}.gif`), bytes);
  console.log(`${name}.gif  ${w}x${h}  ${decoded.length} frames  ${(bytes.length / 1024).toFixed(0)} KB`);
};


/** Plays `count` moves of 9x9 Go with the example's simple heuristic for both sides. */
const selfPlayGo = (size, count) => {
  let seed = 12;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const game = new GoGame({ size });
  const moves = [];
  const center = (size - 1) / 2;

  while (moves.length < count) {
    const me = game.turn;
    const { board } = game;
    const before = board.getPosition();
    let best = null;

    for (const coord of game.getLegalMoves()) {
      const neighbors = board.getNeighbors(coord);
      if (neighbors.every((n) => board.getColor(n) === me)) continue;
      const ownAtari = neighbors.some((n) => {
        const g = board.getGroup(n);
        return g?.color === me && g.liberties.length === 1;
      });
      const captured = board.placeStone(me, coord);
      const liberties = board.getGroup(coord).liberties.length;
      const enemyAtari = board
        .getNeighbors(coord)
        .map((n) => board.getGroup(n))
        .some((g) => g && g.color !== me && g.liberties.length === 1);
      board.setPosition(before);

      const [r, c] = coord.split('|').map(Number);
      const edge = Math.min(r, c, size - 1 - r, size - 1 - c);
      const value =
        captured.length * 100 +
        (ownAtari && liberties > 1 ? 60 : 0) +
        (enemyAtari ? 25 : 0) +
        (liberties === 1 && !captured.length ? -80 : 0) +
        (neighbors.some((n) => board.getColor(n)) ? 4 : 0) +
        (edge === 0 ? -6 : edge === 2 ? 3 : 0) +
        (moves.length < 4 ? -Math.hypot(r - center, c - center) : 0) +
        random() * 6;

      if (!best || value > best.value) best = { coord, value };
    }

    if (!best) break;
    game.play(best.coord);
    moves.push(best.coord);
  }

  return moves;
};

const scenarios = {
  // Morphy's "Opera Game" (1858), played on the chess example in 2-player mode.
  async chess() {
    const moves = [
      ['e2', 'e4'], ['e7', 'e5'], ['g1', 'f3'], ['d7', 'd6'], ['d2', 'd4'], ['c8', 'g4'],
      ['d4', 'e5'], ['g4', 'f3'], ['d1', 'f3'], ['d6', 'e5'], ['f1', 'c4'], ['g8', 'f6'],
      ['f3', 'b3'], ['d8', 'e7'], ['b1', 'c3'], ['c7', 'c6'], ['c1', 'g5'], ['b7', 'b5'],
      ['c3', 'b5'], ['c6', 'b5'], ['c4', 'b5'], ['b8', 'd7'], ['e1', 'c1'], ['a8', 'd8'],
      ['d1', 'd7'], ['d8', 'd7'], ['h1', 'd1'], ['e7', 'e6'], ['b5', 'd7'], ['f6', 'd7'],
      ['b3', 'b8'], ['d7', 'b8'], ['d1', 'd8'],
    ];
    const app = await open('chess', '.board');
    const square = (s) => app.page.locator(`.square[aria-label^="${s}"]`).first();

    await app.page.getByRole('tab', { name: '2 players' }).click();
    app.start(120);
    await sleep(600);
    for (const [from, to] of moves) {
      await square(from).click();
      await sleep(260);
      await square(to).click();
      await sleep(520);
    }
    await sleep(400);
    await app.stop();
    writeGif('chess', app.frames, { endHold: 3500 });
  },

  // Turkish checkers against the computer; we play black, looking for captures.
  async checkers() {
    const app = await open('checkers', '.board');
    const { page } = app;
    const status = () => page.locator('.status').textContent();
    const waitTurn = async () => {
      for (let i = 0; i < 80 && !/Your move|Keep|win/.test(await status()); i += 1) await sleep(50);
    };

    app.start(140);
    await waitTurn();

    for (let turn = 0; turn < 14 && !/win/.test(await status()); turn += 1) {
      // Prefer a piece that has to capture (it is outlined), otherwise any.
      const hinted = page.locator('.square:has(.piece.hint)');
      const pieces = (await hinted.count()) ? hinted : page.locator('.square:has(.piece.black)');
      const count = await pieces.count();

      for (let i = 0; i < count; i += 1) {
        await pieces.nth((i + turn * 3) % count).click();
        await sleep(120);
        if (await page.locator('.square.target').count()) break;
      }

      // Follow the chain until it ends.
      while (await page.locator('.square.target').count()) {
        await sleep(250);
        await page.locator('.square.target').first().click();
        await sleep(300);
      }

      await sleep(200);
      await waitTurn();
      await sleep(250);
    }

    await app.stop();
    writeGif('checkers', app.frames);
  },

  // A 9x9 Go game between two copies of the example's simple computer
  // player, replayed in 2-player mode, ending on the score.
  async go() {
    const moves = selfPlayGo(9, 46);
    const app = await open('go', '.board');
    const { page } = app;

    await page.getByRole('tab', { name: '2 players' }).click();
    app.start(120);
    await sleep(500);

    for (const coord of moves) {
      const [r, c] = coord.split('|').map(Number);
      await page.locator('.hit').nth(r * 9 + c).click();
      await sleep(420);
    }

    for (let i = 0; i < 2; i += 1) {
      await page.getByRole('button', { name: 'Pass' }).click();
      await sleep(500);
    }
    await sleep(600);
    await app.stop();
    writeGif('go', app.frames, { endHold: 3500 });
  },

  // Hnefatafl: a game between two copies of the example's computer player
  // (hnefatafl-game.json), replayed in 2-player mode. The king escapes.
  async hnefatafl() {
    const moves = JSON.parse(readFileSync(new URL('./hnefatafl-game.json', import.meta.url), 'utf8'));
    const app = await open('hnefatafl', '.board');
    const { page } = app;
    const square = (coord) => {
      const [r, c] = coord.split('|').map(Number);
      return page.locator('.square').nth(r * 11 + c);
    };

    await page.getByRole('tab', { name: '2 players' }).click();
    app.start(120);
    await sleep(500);

    for (const [from, to] of moves) {
      await square(from).click();
      await sleep(160);
      await square(to).click();
      await sleep(330);
    }

    await sleep(500);
    await app.stop();
    writeGif('hnefatafl', app.frames, { endHold: 3500 });
  },

  // Sokoban: the third level, solved by the app's own "Show solution".
  async sokoban() {
    const app = await open('sokoban', '.board');
    const { page } = app;

    await page.getByRole('tab', { name: /Storeroom/ }).click();
    await sleep(200);
    app.start(110);
    await sleep(600);
    await page.getByRole('button', { name: 'Show solution' }).click();
    for (let i = 0; i < 100 && !/Solved/.test(await page.locator('.notice').textContent()); i += 1) {
      await sleep(100);
    }
    await sleep(1200);
    await app.stop();
    writeGif('sokoban', app.frames, { endHold: 3000 });
  },

  // Match 3: play the hinted swaps and watch the cascades.
  async match3() {
    const app = await open('match3', '.grid');
    const { page } = app;
    const hint = page.getByRole('button', { name: 'Hint' });

    app.start(110);
    await sleep(500);

    for (let move = 0; move < 7; move += 1) {
      await hint.click();
      await sleep(500);
      const cells = page.locator('.cell.hint');
      await cells.nth(0).click();
      await sleep(180);
      await cells.nth(1).click();
      await sleep(200);
      for (let i = 0; i < 60 && (await hint.isDisabled()); i += 1) await sleep(50);
      await sleep(300);
    }

    await app.stop();
    writeGif('match3', app.frames);
  },
};

for (const [name, run] of Object.entries(scenarios)) {
  if (only.length && !only.includes(name)) continue;
  console.log(`Recording ${name}…`);
  await run();
}

await browser.close();
server.close();

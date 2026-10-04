// The interactive tutorial on the home page: short lessons on the core Board
// and Item, each with code that runs as you type and a live board preview.
// The core is loaded from lib/core/, copied there by scripts/build-site.mjs.
import * as core from './lib/core/index.js';

const API = {
  Board: core.Board,
  Item: core.Item,
  toCoord: core.toCoord,
  parseCoord: core.parseCoord,
  stepCoord: core.stepCoord,
  manhattan: core.manhattan,
  DIRECTIONS: core.DIRECTIONS,
  LINEAR_DIRECTIONS: core.LINEAR_DIRECTIONS,
  ANGULAR_DIRECTIONS: core.ANGULAR_DIRECTIONS,
};

const LESSONS = [
  {
    title: 'A board of squares',
    text: `A <code>Board</code> is a grid of squares. Every square has a coord, a string <code>"row|col"</code> counting from 0, with row 0 at the top. Hover over the preview to see each square's coord, or change the size and the highlights below.`,
    code: `const board = new Board({ rows: 6, cols: 8 });

log(board.isExistCoord('5|7'));  // true: bottom right
log(board.isExistCoord('6|0'));  // false: off the board
log(toCoord(2, 5));              // "2|5"

show(board, { highlight: ['0|0', '2|5', '5|7'] });`,
  },
  {
    title: 'Items',
    text: `An <code>Item</code> is anything that sits on a square: a piece, a wall, a gem. Give it a <code>name</code>, and keep your own fields in <code>data</code>. (The preview draws <code>data.symbol</code> in <code>data.color</code>.)`,
    code: `const board = new Board({ rows: 5, cols: 5 });

const king = new Item({ name: 'king', data: { symbol: '♚', color: '#ca8a04' } });
const pawn = new Item({ name: 'pawn', data: { symbol: '♟', color: '#dc2626' } });

board.setItem('2|2', king);
board.setItem('3|1', pawn);

log(board.getItem('2|2').name);  // "king"
log(board.getItem('0|0'));       // null: nothing there
log(board.isEmpty('3|1'));       // false

show(board);`,
  },
  {
    title: 'Move, swap, remove',
    text: `Items move between squares with <code>moveItem</code>, trade places with <code>switchItem</code> and leave with <code>removeItem</code>. <code>countItems</code> and <code>findCoord</code> search the board.`,
    code: `const board = new Board({ rows: 4, cols: 6 });
const piece = (symbol, color) => new Item({ name: symbol, data: { symbol, color } });

board.setItem('1|1', piece('A', '#2563eb'));
board.setItem('1|4', piece('B', '#db2777'));
board.setItem('3|0', piece('C', '#16a34a'));

board.moveItem('1|1', '2|2');    // A walks
board.switchItem('2|2', '1|4');  // A and B trade places
board.removeItem('3|0');         // C is gone

log(board.countItems());                          // 2
log(board.findCoord((item) => item.name === 'A')); // where A is now

show(board);`,
  },
  {
    title: 'Directions and rays',
    text: `There are eight directions, from <code>'top'</code> to <code>'bottomRight'</code>. <code>ray(coord, direction)</code> is the line of squares that way, up to the edge: the building block for sliding pieces, blasts and lines of sight.`,
    code: `const board = new Board({ rows: 7, cols: 7 });
const center = '3|3';
board.setItem(center, new Item({ name: 'queen', data: { symbol: '♛', color: '#7c3aed' } }));
board.setItem('3|5', new Item({ name: 'rock', data: { block: true } }));
board.setItem('1|1', new Item({ name: 'rock', data: { block: true } }));

log(board.ray(center, 'right'));       // ["3|4", "3|5", "3|6"]
log(board.ray(center, 'topLeft', 1));  // at most one step

// Slide until something is in the way, like a queen:
const slide = (from, direction) => {
  const squares = [];
  for (const coord of board.ray(from, direction)) {
    if (!board.isEmpty(coord)) break;
    squares.push(coord);
  }
  return squares;
};

show(board, { highlight: DIRECTIONS.flatMap((d) => slide(center, d)) });`,
  },
  {
    title: 'Neighbours and movement',
    text: `<code>getNeighbors</code> gives the four squares around a square, or eight with <code>diagonal</code>. An item can also carry a <code>movement</code> pattern, and <code>getAvailableColumns</code> lists the squares it covers.`,
    code: `const board = new Board({ rows: 7, cols: 7 });

log(board.getNeighbors('0|0'));                           // a corner has two
log(board.getNeighbors('3|3', { diagonal: true }).length); // 8

const scout = new Item({
  name: 'scout',
  data: { symbol: 'S', color: '#0891b2' },
  movement: { linear: true, angular: true, stepCount: 2 },
});
board.setItem('3|3', scout);

// Try { linear: true, stepCount: 3 } or { angular: true }:
const squares = board.getAvailableColumns('3|3', scout.movement);
log(squares.length, 'squares');

show(board, { highlight: squares });`,
  },
  {
    title: 'Reach and paths',
    text: `<code>getReachable</code> finds every square you can walk to, with how many steps each takes; <code>findPath</code> gives the shortest way. Both go around items unless you pass your own <code>canEnter</code>. Draw a wall in the level and watch the path change.`,
    code: `const level = [
  '.........',
  '.###.###.',
  '...#...#.',
  '.#.#.#.#.',
  '.#...#...',
  '.#####.#.',
  '.......#.',
];
const wall = () => new Item({ name: 'wall', data: { block: true } });
const board = new Board({ rows: 7, cols: 9 }).loadRows(level, (char) => (char === '#' ? wall() : null));

// Every square within 5 steps of the start, with its distance:
const reach = board.getReachable('0|0', { steps: 5 });

// The shortest way to the far corner:
const path = board.findPath('0|0', '6|8');
log(path ? path.length + ' steps' : 'no way through');

show(board, { highlight: reach, path });`,
  },
  {
    title: 'Text in, text out',
    text: `<code>loadRows</code> sets up a position from text, one character per square, and <code>toRows</code> writes it back: handy for levels, tests and saving. <code>findCoords</code> finds every item that matches.`,
    code: `const mark = (char) => new Item({ name: char, data: { symbol: char.toUpperCase(), color: char === 'x' ? '#2563eb' : '#dc2626' } });
const board = new Board({ rows: 3, cols: 3 }).loadRows(['x.o', '.x.', 'o..'], (char) => (char === '.' ? null : mark(char)));

board.setItem('2|2', mark('x'));

log(board.toRows((item) => item?.name ?? '.'));

const xs = board.findCoords((item) => item.name === 'x');
const diagonal = ['0|0', '1|1', '2|2'].every((coord) => xs.includes(coord));
log(diagonal ? 'x wins on the diagonal' : 'no winner yet');

show(board, { highlight: xs });`,
  },
  {
    title: 'Undo with snapshots',
    text: `<code>snapshot()</code> saves where every item is and <code>restore()</code> puts it back: a whole undo history in a few lines. <code>clone()</code> makes an independent copy of the board, for trying a move without touching the real one.`,
    code: `const board = new Board({ rows: 4, cols: 4 });
board.setItem('0|0', new Item({ name: 'p', data: { symbol: '●', color: '#2563eb' } }));

const history = [];
const move = (from, to) => {
  history.push(board.snapshot());  // save before changing anything
  board.moveItem(from, to);
};
const undo = () => board.restore(history.pop());

move('0|0', '1|1');
move('1|1', '2|2');
move('2|2', '3|3');
undo();                            // back on 2|2; try undoing twice

const copy = board.clone();
copy.moveItem('2|2', '0|3');
log('board:', board.findCoord(() => true), ' copy:', copy.findCoord(() => true));

show(board, { path: ['0|0', '1|1', '2|2'] });`,
  },
  {
    title: 'Your turn: a rook',
    text: `Write <code>rookMoves(board, from)</code>: every square a rook on <code>from</code> may move to. It slides along rows and columns, stops <em>before</em> a piece of its own side, and may capture the first enemy piece in its way. Each piece has <code>data.side</code>. The checks below run on every edit.`,
    expose: 'rookMoves',
    code: `function rookMoves(board, from) {
  const side = board.getItem(from).data.side;
  const moves = [];

  for (const direction of LINEAR_DIRECTIONS) {
    for (const coord of board.ray(from, direction)) {
      // TODO: stop at pieces, and capture the enemy ones.
      moves.push(coord);
    }
  }

  return moves;
}

// A board to try it on:
const piece = (side, symbol) =>
  new Item({ name: symbol, data: { side, symbol, color: side === 'white' ? '#a16207' : '#1c1917' } });
const board = new Board({ rows: 8, cols: 8 });
board.setItem('4|3', piece('white', '♜'));
board.setItem('4|6', piece('black', '♟'));
board.setItem('1|3', piece('white', '♟'));

show(board, { highlight: rookMoves(board, '4|3') });`,
    test(rookMoves) {
      const piece = (side) => new core.Item({ name: 'p', data: { side } });
      const setup = (pieces) => {
        const board = new core.Board({ rows: 8, cols: 8 });
        Object.entries(pieces).forEach(([coord, side]) => board.setItem(coord, piece(side)));
        return board;
      };
      const same = (a, b) => a.length === b.length && [...a].sort().join() === [...b].sort().join();
      const cases = [
        ['Alone in a corner, it reaches 14 squares', { '0|0': 'white' }, '0|0', 14],
        ['It stops before its own piece', { '4|3': 'white', '4|5': 'white' }, '4|3', ['4|4']],
        ['It captures the first enemy, and goes no further', { '4|3': 'white', '2|3': 'black', '1|3': 'black' }, '4|3', ['2|3', '3|3']],
      ];

      return cases.map(([name, pieces, from, expected]) => {
        try {
          const board = setup(pieces);
          const moves = rookMoves(board, from) ?? [];
          if (typeof expected === 'number') return { name, ok: moves.length === expected };
          const along = (dir) => moves.filter((coord) => board.ray(from, dir).includes(coord));
          const dir = expected[0].split('|')[0] === from.split('|')[0] ? 'right' : 'top';
          return { name, ok: same(along(dir), expected) };
        } catch (error) {
          return { name, ok: false, error: error.message };
        }
      });
    },
  },
];

// ---------------------------------------------------------------------------

const root = document.querySelector('#learn');
const $ = (selector) => root.querySelector(selector);
const steps = $('.learn-steps');
const editor = $('.learn-editor');
const preview = $('.learn-board');
const output = $('.learn-log');
const checks = $('.learn-checks');
const hoverLine = $('.learn-hover');

const storageKey = (i) => `ymir-learn-${i}`;
const load = (i) => {
  try {
    return localStorage.getItem(storageKey(i)) ?? LESSONS[i].code;
  } catch {
    return LESSONS[i].code;
  }
};
const save = (i, code) => {
  try {
    if (code === LESSONS[i].code) localStorage.removeItem(storageKey(i));
    else localStorage.setItem(storageKey(i), code);
  } catch {
    // Storage may be unavailable; edits just aren't kept.
  }
};

let current = 0;

const format = (value) => {
  if (typeof value === 'string') return value;
  if (value instanceof Map) return `Map(${value.size}) ${JSON.stringify(Object.fromEntries(value))}`;
  if (value instanceof core.Item) return `Item ${JSON.stringify({ name: value.name, data: value.data })}`;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** Draws a board, with optional highlighted squares (array, Set or Map with labels) and a path. */
const draw = (board, { highlight = [], path = [] } = {}) => {
  if (!(board instanceof core.Board)) throw new Error('show() needs a Board');
  const { rows, cols } = board.config;
  const marks =
    highlight instanceof Map ? highlight : new Map([...highlight].map((coord) => [coord, '']));
  const steps = new Map(path.map((coord, i) => [coord, i + 1]));

  preview.style.setProperty('--rows', rows);
  preview.style.setProperty('--cols', cols);
  preview.innerHTML = board
    .squares()
    .map(({ coord, row, col, item }) => {
      const classes = ['sq', (row + col) % 2 ? 'odd' : ''];
      if (marks.has(coord)) classes.push('mark');
      if (steps.has(coord)) classes.push('step');
      let inner = '';
      if (item?.data?.block) classes.push('block');
      else if (item) {
        const label = String(item.data?.symbol ?? item.name ?? '?').slice(0, 2);
        const color = item.data?.color ?? 'var(--accent)';
        inner = `<span class="piece" style="--piece:${escape(String(color))}">${escape(label)}</span>`;
      }
      const tag = steps.has(coord) ? steps.get(coord) : marks.get(coord);
      if (tag !== '' && tag !== undefined) inner += `<span class="tag">${escape(String(tag))}</span>`;
      return `<div class="${classes.join(' ')}" data-coord="${coord}" title="${coord}">${inner}</div>`;
    })
    .join('');
};

const run = () => {
  const lesson = LESSONS[current];
  const code = editor.value;
  const lines = [];
  let shown = false;

  const log = (...values) => lines.push({ text: values.map(format).join(' ') });
  const show = (board, options) => {
    draw(board, options);
    shown = true;
  };

  let error = null;
  let exposed = null;
  try {
    const names = Object.keys(API);
    const params = [...names, 'show', 'log', 'console'];
    // Compile the code on its own first, so a syntax error is about the reader's code only.
    let fn = new Function(...params, `"use strict";\n${code}`);
    if (lesson.expose) {
      const tail = `\nreturn typeof ${lesson.expose} === 'function' ? ${lesson.expose} : null;`;
      fn = new Function(...params, `"use strict";\n${code}${tail}`);
    }
    exposed = fn(...names.map((name) => API[name]), show, log, { log, info: log, warn: log, error: log });
  } catch (e) {
    error = e;
  }

  if (!shown) preview.innerHTML = `<p class="learn-empty">${error ? 'Fix the error to see the board.' : 'Call <code>show(board)</code> to draw it here.'}</p>`;
  if (error) lines.push({ text: `${error.name}: ${error.message}`, error: true });

  output.innerHTML = lines.length
    ? lines.map(({ text, error: bad }) => `<div class="${bad ? 'err' : ''}">${escape(text)}</div>`).join('')
    : '<div class="quiet">log(…) output appears here</div>';

  checks.hidden = !lesson.test;
  if (lesson.test) {
    const results = exposed ? lesson.test(exposed) : [{ name: `Define a function called ${lesson.expose}`, ok: false }];
    const passed = results.filter((r) => r.ok).length;
    checks.innerHTML =
      `<strong>${passed === results.length ? 'All checks pass. Nicely done!' : `${passed} of ${results.length} checks pass`}</strong>` +
      results
        .map((r) => `<div class="${r.ok ? 'ok' : 'no'}">${r.ok ? '✓' : '✗'} ${escape(r.name)}${r.error ? `: ${escape(r.error)}` : ''}</div>`)
        .join('');
  }
};

const open = (i) => {
  current = i;
  steps.querySelectorAll('button').forEach((button, j) => {
    button.classList.toggle('active', j === i);
    button.setAttribute('aria-current', j === i ? 'step' : 'false');
  });
  $('.learn-title').textContent = `${i + 1}. ${LESSONS[i].title}`;
  $('.learn-text').innerHTML = LESSONS[i].text;
  $('.learn-prev').disabled = i === 0;
  $('.learn-next').disabled = i === LESSONS.length - 1;
  editor.value = load(i);
  run();
};

steps.innerHTML = LESSONS.map(
  (lesson, i) => `<button type="button"><span>${i + 1}</span> ${escape(lesson.title)}</button>`
).join('');
steps.querySelectorAll('button').forEach((button, i) => button.addEventListener('click', () => open(i)));
$('.learn-prev').addEventListener('click', () => open(current - 1));
$('.learn-next').addEventListener('click', () => open(current + 1));
$('.learn-reset').addEventListener('click', () => {
  editor.value = LESSONS[current].code;
  save(current, editor.value);
  run();
});

let timer;
editor.addEventListener('input', () => {
  save(current, editor.value);
  clearTimeout(timer);
  timer = setTimeout(run, 150);
});

// Tab indents instead of leaving the editor (Esc, then Tab, still leaves).
let escaped = false;
editor.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') escaped = true;
  if (e.key !== 'Tab' || escaped || e.shiftKey) {
    if (e.key !== 'Escape') escaped = false;
    return;
  }
  e.preventDefault();
  const { selectionStart: start, selectionEnd: end, value } = editor;
  editor.value = value.slice(0, start) + '  ' + value.slice(end);
  editor.selectionStart = editor.selectionEnd = start + 2;
  editor.dispatchEvent(new Event('input'));
});

preview.addEventListener('mouseover', (e) => {
  const square = e.target.closest('[data-coord]');
  if (!square) return;
  const coord = square.dataset.coord;
  const [row, col] = coord.split('|');
  hoverLine.textContent = `"${coord}": row ${row}, col ${col}`;
});
preview.addEventListener('mouseleave', () => (hoverLine.textContent = 'Hover a square to see its coord'));

open(0);

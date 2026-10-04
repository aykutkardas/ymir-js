// "Learn the core in puzzles": each puzzle is a small board and a goal.
// The reader changes a line or two of code and presses Run; every change
// the code makes to the board is recorded and played back step by step,
// then the board is checked against the goal.
//
// The core is loaded from lib/core/, copied there by scripts/build-site.mjs.
import { Board, Item, DIRECTIONS, LINEAR_DIRECTIONS, toCoord } from './lib/core/index.js';
import { highlight } from './highlight.js';

// How each item name is drawn. Walls are drawn as blocks.
const ICONS = {
  coin: '🪙',
  gem: '💎',
  robot: '🤖',
  cat: '🐱',
  dog: '🐶',
  rock: '🪨',
  puck: '🥌',
  sheep: '🐑',
  fence: '🧱',
  lamp: '💡',
};

const item = (name) => new Item({ name });
const random = (list) => list[Math.floor(Math.random() * list.length)];
const level = (board, rows, items = {}) =>
  board.loadRows(rows, (char) => (char === '#' ? item('wall') : items[char] ? item(items[char]) : null));

/** A board from a puzzle's `layout`: { coord: name }. */
const place = (board, layout) => {
  Object.entries(layout).forEach(([coord, name]) => board.setItem(coord, item(name)));
  return board;
};

const API = {
  setItem: { sig: "board.setItem('row|col', item)", doc: 'puts an item on a square', insert: "board.setItem('?', new Item({ name: '?' }));" },
  newItem: { sig: "new Item({ name: 'coin' })", doc: 'makes an item; the name is what it is', insert: "new Item({ name: '?' })" },
  moveItem: { sig: 'board.moveItem(from, to)', doc: 'moves the item on `from` to `to`', insert: "board.moveItem('?', '?');" },
  switchItem: { sig: 'board.switchItem(a, b)', doc: 'the items on two squares trade places', insert: "board.switchItem('?', '?');" },
  removeItem: { sig: 'board.removeItem(coord)', doc: 'takes the item off a square', insert: "board.removeItem('?');" },
  findCoord: { sig: 'board.findCoord(test)', doc: 'the first square whose item passes the test', insert: "board.findCoord((item) => item.name === '?')" },
  findCoords: { sig: 'board.findCoords(test)', doc: 'every square whose item passes the test', insert: "board.findCoords((item) => item.name === '?')" },
  findPath: { sig: 'board.findPath(from, to)', doc: 'the squares to step on, around anything in the way', insert: "board.findPath('?', '?')" },
  ray: { sig: "board.ray(from, 'right')", doc: 'the squares in one direction, nearest first, up to the edge', insert: "board.ray('?', 'right')" },
  isEmpty: { sig: 'board.isEmpty(coord)', doc: 'true if nothing is on the square', insert: "board.isEmpty('?')" },
  getNeighbors: { sig: 'board.getNeighbors(coord, { diagonal })', doc: 'the 4 squares around, or 8 with diagonal: true', insert: "board.getNeighbors('?', { diagonal: true })" },
  getReachable: { sig: 'board.getReachable(from, { steps })', doc: 'every square you can walk to in that many steps', insert: "board.getReachable('?', { steps: 2 })" },
  restore: { sig: 'board.restore(snapshot)', doc: 'puts every item back where a snapshot saw it', insert: 'board.restore(saved);' },
};

const PUZZLES = [
  {
    title: 'Squares have names',
    goal: 'Put the coin on its spot.',
    text: 'Every square is named <code>"row|col"</code>, counting from 0 at the top left. The faded coin shows where it belongs: select the <code>?</code> in the code, click that square, then Run.',
    size: [5, 5],
    goalLayout: { '1|3': 'coin' },
    api: ['setItem', 'newItem'],
    code: `const coin = new Item({ name: 'coin' });
board.setItem('?', coin);`,
    solution: `const coin = new Item({ name: 'coin' });
board.setItem('1|3', coin);`,
    hint: 'Row 1 is the second row from the top, col 3 the fourth column: "1|3".',
  },
  {
    title: 'More of them',
    goal: 'Place a gem on each of the three spots.',
    text: 'One line places one item. Add a line for each missing gem.',
    size: [5, 5],
    goalLayout: { '0|4': 'gem', '2|2': 'gem', '4|0': 'gem' },
    api: ['setItem'],
    code: `board.setItem('0|4', new Item({ name: 'gem' }));
`,
    solution: `board.setItem('0|4', new Item({ name: 'gem' }));
board.setItem('2|2', new Item({ name: 'gem' }));
board.setItem('4|0', new Item({ name: 'gem' }));`,
    hint: 'Copy the line twice and change the squares to "2|2" and "4|0".',
  },
  {
    title: 'Moving',
    goal: 'Drive the robot to the end of the road.',
    text: '<code>moveItem(from, to)</code> takes whatever is on one square to another.',
    size: [3, 6],
    setup: (board) => place(board, { '1|0': 'robot' }),
    goalLayout: { '1|5': 'robot' },
    api: ['moveItem'],
    code: `board.moveItem('1|0', '?');`,
    solution: `board.moveItem('1|0', '1|5');`,
    hint: 'The faded robot is on "1|5".',
  },
  {
    title: 'Ask the board',
    goal: 'Put the cat in its bed.',
    text: 'The cat starts somewhere new on every run, so a fixed square won\'t do. Ask the board where it is with <code>findCoord</code>, then move it.',
    size: [5, 5],
    setup(board) {
      const spots = board.squares().map((s) => s.coord).filter((c) => c !== '0|4');
      return place(board, { [random(spots)]: 'cat' });
    },
    goalLayout: { '0|4': 'cat' },
    api: ['findCoord', 'moveItem'],
    code: `const cat = board.findCoord((item) => item.name === 'cat');
board.moveItem(cat, '?');`,
    solution: `const cat = board.findCoord((item) => item.name === 'cat');
board.moveItem(cat, '0|4');`,
    hint: '`cat` already holds the square the cat is on. Its bed is "0|4".',
  },
  {
    title: 'Swap',
    goal: 'The cat and the dog are in each other\'s beds. Swap them.',
    text: '<code>switchItem(a, b)</code> trades the items on two squares in one go. The little badges show who belongs where.',
    size: [3, 5],
    setup: (board) => place(board, { '1|1': 'cat', '1|3': 'dog' }),
    goalLayout: { '1|1': 'dog', '1|3': 'cat' },
    api: ['switchItem'],
    code: `board.switchItem('?', '?');`,
    solution: `board.switchItem('1|1', '1|3');`,
    hint: 'Swap the two squares they are on: "1|1" and "1|3".',
  },
  {
    title: 'Clear the way',
    goal: 'Take every rock off the board, and leave the robot.',
    text: 'You could remove the rocks one by one, or ask for all of them with <code>findCoords</code> and remove each.',
    size: [5, 5],
    setup: (board) => place(board, { '2|2': 'robot', '0|1': 'rock', '1|3': 'rock', '3|0': 'rock', '4|4': 'rock' }),
    goalLayout: { '2|2': 'robot' },
    api: ['removeItem', 'findCoords'],
    code: `board.removeItem('0|1');

// Every square with a rock on it:
// board.findCoords((item) => item.name === 'rock')`,
    solution: `for (const coord of board.findCoords((item) => item.name === 'rock')) {
  board.removeItem(coord);
}`,
    hint: 'Either add a removeItem line for 1|3, 3|0 and 4|4, or loop over findCoords.',
  },
  {
    title: 'Find a path',
    goal: 'Walk the robot to the far corner, one square at a time.',
    text: 'Here robots walk, they don\'t jump: each move has to be to a square next to them. <code>findPath</code> works out the squares to step on, around the walls.',
    size: [5, 7],
    setup: (board) => level(board, ['R#.....', '.#.###.', '.#.#...', '.#.#.#.', '...#...'], { R: 'robot' }),
    goalLayout: { '0|6': 'robot' },
    walking: true,
    api: ['findPath', 'moveItem'],
    code: `const path = board.findPath('0|0', '?');

let at = '0|0';
for (const step of path) {
  board.moveItem(at, step);
  at = step;
}`,
    solution: `const path = board.findPath('0|0', '0|6');

let at = '0|0';
for (const step of path) {
  board.moveItem(at, step);
  at = step;
}`,
    hint: 'The goal is the top-right square, "0|6".',
  },
  {
    title: 'Slide',
    goal: 'Slide the stone right; it stops just before the rock.',
    text: 'The rock moves on every run. <code>ray</code> lists the squares to the right, nearest first, and <code>rock</code> below is the index of the first square that isn\'t empty.',
    size: [3, 7],
    setup(board) {
      const col = random([3, 4, 5, 6]);
      place(board, { '1|0': 'puck', [`1|${col}`]: 'rock' });
      return { goal: { [`1|${col - 1}`]: 'puck', [`1|${col}`]: 'rock' } };
    },
    api: ['ray', 'isEmpty', 'moveItem'],
    code: `const line = board.ray('1|0', 'right');
const rock = line.findIndex((coord) => !board.isEmpty(coord));

// Which square of the line is the one just before the rock?
board.moveItem('1|0', line[0]);`,
    solution: `const line = board.ray('1|0', 'right');
const rock = line.findIndex((coord) => !board.isEmpty(coord));

board.moveItem('1|0', line[rock - 1]);`,
    hint: 'The square before the rock is one index lower: line[rock - 1].',
  },
  {
    title: 'Neighbours',
    goal: 'Fence the sheep in, diagonals too.',
    text: '<code>getNeighbors</code> gives the squares around a square: the four beside it, or all eight with <code>{ diagonal: true }</code>.',
    size: [5, 5],
    setup: (board) => place(board, { '2|2': 'sheep' }),
    goalLayout: {
      '2|2': 'sheep',
      '1|1': 'fence', '1|2': 'fence', '1|3': 'fence',
      '2|1': 'fence', '2|3': 'fence',
      '3|1': 'fence', '3|2': 'fence', '3|3': 'fence',
    },
    api: ['getNeighbors', 'setItem'],
    code: `for (const coord of board.getNeighbors('2|2')) {
  board.setItem(coord, new Item({ name: 'fence' }));
}`,
    solution: `for (const coord of board.getNeighbors('2|2', { diagonal: true })) {
  board.setItem(coord, new Item({ name: 'fence' }));
}`,
    hint: "Four fences aren't enough: pass { diagonal: true } as getNeighbors' second argument.",
  },
  {
    title: 'How far can it go?',
    goal: 'Light every square the robot can reach in two steps.',
    text: '<code>getReachable</code> walks out from a square, around the walls, and gives every square it reaches with the number of steps.',
    size: [5, 5],
    setup: (board) => level(board, ['.....', '.#.#.', '..R..', '.#.#.', '.....'], { R: 'robot' }),
    goalLayout: {
      '2|2': 'robot', '1|2': 'lamp', '2|1': 'lamp', '2|3': 'lamp', '3|2': 'lamp',
      '0|2': 'lamp', '2|0': 'lamp', '2|4': 'lamp', '4|2': 'lamp',
    },
    api: ['getReachable', 'isEmpty', 'setItem'],
    code: `const reach = board.getReachable('2|2', { steps: 1 });

for (const [coord] of reach) {
  if (board.isEmpty(coord)) board.setItem(coord, new Item({ name: 'lamp' }));
}`,
    solution: `const reach = board.getReachable('2|2', { steps: 2 });

for (const [coord] of reach) {
  if (board.isEmpty(coord)) board.setItem(coord, new Item({ name: 'lamp' }));
}`,
    hint: 'One step lights the four squares beside the robot. Two steps go one further.',
  },
  {
    title: 'Undo',
    goal: 'Somebody scrambled the board. Put it back.',
    text: '<code>saved</code> is a snapshot taken before the mess. Snapshots are how you build undo: <code>board.snapshot()</code> to save, <code>board.restore(saved)</code> to go back.',
    size: [4, 4],
    setup(board) {
      place(board, { '0|0': 'cat', '0|3': 'dog', '3|0': 'gem', '3|3': 'coin' });
      const saved = board.snapshot();
      board.switchItem('0|0', '3|3');
      board.moveItem('0|3', '1|2');
      board.moveItem('3|0', '2|1');
      return { vars: { saved } };
    },
    goalLayout: { '0|0': 'cat', '0|3': 'dog', '3|0': 'gem', '3|3': 'coin' },
    api: ['restore'],
    code: `// saved is a snapshot from before the mess.
`,
    solution: `board.restore(saved);`,
    hint: 'One line does it: board.restore(saved);',
  },
];

// ---------------------------------------------------------------------------

const root = document.getElementById('puzzle');
const $ = (selector) => root.querySelector(selector);

const list = $('.pz-list');
const input = $('.pz-input');
const colored = $('.pz-highlight code');
const boardEl = $('.pz-board');
const status = $('.pz-status');
const result = $('.pz-result');
const runButton = $('.pz-run');

const store = {
  get(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(`ymir-puzzles-${key}`)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(`ymir-puzzles-${key}`, JSON.stringify(value));
    } catch {
      // Storage may be unavailable; progress just isn't kept.
    }
  },
};

let current = 0;
let solved = new Set(store.get('solved', []));
let playing = null;

const escape = (text) => String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const nameAt = (board, coord) => board.getItem(coord)?.name ?? null;

/** A fresh board for the current puzzle, the goal, and any variables the code gets. */
const fresh = (puzzle) => {
  const [rows, cols] = puzzle.size;
  const board = new Board({ rows, cols });
  const extra = puzzle.setup?.(board) ?? {};
  const made = extra instanceof Board ? {} : extra;
  const goal = { ...(made.goal ?? puzzle.goalLayout) };
  // Walls stay where they are; the goal includes them.
  board.findCoords((it) => it.name === 'wall').forEach((coord) => (goal[coord] = 'wall'));
  return { board, goal, vars: made.vars ?? {} };
};

/** Every square where the board and the goal differ; squares still waiting for something first. */
const differences = (board, goal) =>
  board
    .squares()
    .map(({ coord }) => ({ coord, has: nameAt(board, coord), want: goal[coord] ?? null }))
    .filter(({ has, want }) => has !== want)
    .sort((a, b) => Number(!a.want) - Number(!b.want));

const icon = (name) => ICONS[name] ?? escape(String(name).slice(0, 2));

const draw = (board, goal, { changed = new Set(), done = false } = {}) => {
  const [rows, cols] = [board.config.rows, board.config.cols];
  boardEl.style.setProperty('--rows', rows);
  boardEl.style.setProperty('--cols', cols);
  boardEl.classList.toggle('solved', done);
  boardEl.innerHTML = board
    .squares()
    .map(({ coord, row, col }) => {
      const has = nameAt(board, coord);
      const want = goal[coord] ?? null;
      const classes = ['sq', (row + col) % 2 ? 'odd' : 'even'];
      let inner = '';

      if (has === 'wall') classes.push('wall');
      else {
        if (has) inner += `<span class="it">${icon(has)}</span>`;
        if (want && want !== has && !has) inner += `<span class="ghost">${icon(want)}</span>`;
        if (want && want !== has && has) inner += `<span class="badge" title="${escape(want)} belongs here">${icon(want)}</span>`;
        if (has && !want) classes.push('extra');
        if (want && want === has) classes.push('ok');
      }
      if (changed.has(coord)) classes.push('changed');

      return `<button type="button" class="${classes.join(' ')}" data-coord="${coord}" aria-label="${coord}${has ? `, ${has}` : ''}">${inner}</button>`;
    })
    .join('');
};

/** Runs the reader's code on a fresh board, recording a frame after every change. */
const execute = (puzzle, code) => {
  const { board, goal, vars } = fresh(puzzle);
  const frames = [];
  const layout = () => new Map(board.squares().map(({ coord, item: it }) => [coord, it?.name ?? null]));
  let last = layout();

  const record = (label) => {
    const now = layout();
    const changed = new Set([...now.keys()].filter((coord) => now.get(coord) !== last.get(coord)));
    if (!changed.size) return; // a call that changed nothing
    last = now;
    frames.push({ snapshot: board.snapshot(), changed, label });
    if (frames.length > 400) throw new Error('That is a lot of moves. Is a loop running forever?');
  };

  // Some methods call others (removeItem calls setItem): only the outermost call is a step.
  let depth = 0;
  for (const method of ['setItem', 'moveItem', 'switchItem', 'removeItem', 'restore']) {
    const original = board[method].bind(board);
    board[method] = (...args) => {
      if (depth) return original(...args);
      if (method === 'moveItem' && puzzle.walking) {
        const [from, to] = args;
        if (!board.getNeighbors(from).includes(to)) {
          throw new Error(`Robots walk one square at a time: ${from} to ${to} is too far.`);
        }
        if (!board.isEmpty(to)) throw new Error(`${to} isn't free.`);
      }
      depth += 1;
      let value;
      try {
        value = original(...args);
      } finally {
        depth -= 1;
      }
      record(`${method}(${args.filter((a) => typeof a === 'string').join(', ')})`);
      return value;
    };
  }

  const start = board.snapshot();
  let error = null;
  try {
    const names = ['board', 'Item', 'toCoord', 'DIRECTIONS', 'LINEAR_DIRECTIONS', ...Object.keys(vars)];
    const fn = new Function(...names, `"use strict";\n${code}`);
    fn(board, Item, toCoord, DIRECTIONS, LINEAR_DIRECTIONS, ...Object.values(vars));
  } catch (e) {
    error = e;
  }

  return { board, goal, frames, start, error };
};

const friendly = (error) => {
  const message = error.message ?? String(error);
  if (/is not iterable|Cannot read properties of null/.test(message)) {
    return `${message}. Did a method return null? Check that every '?' is a real square.`;
  }
  if (error instanceof SyntaxError) return `The code doesn't parse yet: ${message}.`;
  return message;
};

const say = (kind, html) => {
  result.className = `pz-result ${kind}`;
  result.innerHTML = html;
};

const check = (board, goal, error, moves) => {
  const puzzle = PUZZLES[current];
  if (error) {
    say('bad', `<strong>Stopped:</strong> ${escape(friendly(error))}`);
    return;
  }
  const wrong = differences(board, goal);
  if (!wrong.length) {
    solved.add(current);
    store.set('solved', [...solved]);
    renderList();
    const next = current < PUZZLES.length - 1;
    say(
      'good',
      `<strong>Solved${moves ? ` in ${moves} ${moves === 1 ? 'change' : 'changes'}` : ''}!</strong> ` +
        (next
          ? '<button type="button" class="pz-next">Next puzzle →</button>'
          : 'That was the last one. Every game on this page is built from these same calls.')
    );
    result.querySelector('.pz-next')?.addEventListener('click', () => open(current + 1));
    return;
  }

  const { coord, has, want } = wrong[0];
  const what = !want
    ? `${coord} should be empty, but has a ${has} on it.`
    : has
      ? `${coord} should have a ${want}, not a ${has}.`
      : `No ${want} on ${coord} yet.`;
  say(
    'bad',
    `<strong>Not yet.</strong> ${escape(what)}${wrong.length > 1 ? ` (${wrong.length} squares still differ.)` : ''}` +
      `<span class="pz-hint">Hint: ${escape(puzzle.hint)}</span>`
  );
};

const run = () => {
  if (playing) return;
  const puzzle = PUZZLES[current];

  if (/['"]\?['"]/.test(input.value)) {
    say('bad', "<strong>Almost:</strong> replace each <code>'?'</code> with a square's name first. Click a square on the board to put it in.");
    const at = input.value.indexOf('?');
    input.focus();
    input.setSelectionRange(at, at + 1);
    return;
  }
  const { board, goal, frames, start, error } = execute(puzzle, input.value);

  // Play the changes back, one by one.
  const view = new Board({ rows: board.config.rows, cols: board.config.cols });
  view.restore(start);
  draw(view, goal);
  status.textContent = frames.length ? 'Running…' : 'Nothing moved.';

  const delay = frames.length > 12 ? 140 : 320;
  let i = 0;
  runButton.disabled = true;
  const step = () => {
    if (i < frames.length) {
      const frame = frames[i];
      view.restore(frame.snapshot);
      draw(view, goal, { changed: frame.changed });
      status.textContent = `${i + 1}/${frames.length}  ${frame.label}`;
      i += 1;
      playing = setTimeout(step, delay);
      return;
    }
    playing = null;
    runButton.disabled = false;
    draw(view, goal, { done: !error && !differences(view, goal).length });
    check(view, goal, error, frames.length);
  };
  playing = setTimeout(step, frames.length ? 200 : 0);
};

const stop = () => {
  clearTimeout(playing);
  playing = null;
  runButton.disabled = false;
};

// ---- The editor: a textarea over a highlighted copy of its text.

const paint = () => {
  colored.innerHTML = highlight(input.value) + (input.value.endsWith('\n') ? ' ' : '');
  input.style.height = 'auto';
  input.style.height = `${input.scrollHeight}px`;
};

const setCode = (code) => {
  input.value = code;
  paint();
  store.set(`code-${current}`, code === PUZZLES[current].code ? null : code);
};

/** Inserts text at the cursor; selects the first '?' in it, if any. */
const insert = (text) => {
  const { selectionStart: start, selectionEnd: end, value } = input;
  input.value = value.slice(0, start) + text + value.slice(end);
  const mark = text.indexOf('?');
  input.focus();
  if (mark >= 0) input.setSelectionRange(start + mark, start + mark + 1);
  else input.setSelectionRange(start + text.length, start + text.length);
  input.dispatchEvent(new Event('input'));
};

input.addEventListener('input', () => setCode(input.value));
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    run();
  } else if (e.key === 'Tab' && !e.shiftKey) {
    e.preventDefault();
    insert('  ');
  }
});

// Clicking a square puts its name into the code: inside quotes as is,
// otherwise quoted. A selected '?' is replaced.
boardEl.addEventListener('click', (e) => {
  const square = e.target.closest('[data-coord]');
  if (!square) return;
  const { selectionStart: start, selectionEnd: end, value } = input;
  const inQuotes = value.slice(start, end) === '?' || /['"]$/.test(value.slice(0, start));
  insert(inQuotes ? square.dataset.coord : `'${square.dataset.coord}'`);
  status.textContent = `Put ${square.dataset.coord} into the code`;
});
boardEl.addEventListener('mouseover', (e) => {
  const square = e.target.closest('[data-coord]');
  if (!square || playing) return;
  status.textContent = `${square.dataset.coord}: click to use it in the code`;
});

// ---- Navigation

const renderList = () => {
  list.innerHTML = PUZZLES.map(
    (puzzle, i) =>
      `<li><button type="button" class="${i === current ? 'active' : ''} ${solved.has(i) ? 'done' : ''}" aria-current="${i === current ? 'step' : 'false'}">` +
      `<span class="n">${solved.has(i) ? '✓' : i + 1}</span><span class="t">${escape(puzzle.title)}</span></button></li>`
  ).join('');
  list.querySelectorAll('button').forEach((button, i) => button.addEventListener('click', () => open(i)));
  $('.pz-progress').textContent = `${solved.size} of ${PUZZLES.length} solved`;
};

const open = (i) => {
  stop();
  current = i;
  const puzzle = PUZZLES[i];
  store.set('current', i);
  renderList();

  $('.pz-step').textContent = `Puzzle ${i + 1} of ${PUZZLES.length}`;
  $('.pz-title').textContent = puzzle.title;
  $('.pz-goal').textContent = puzzle.goal;
  $('.pz-text').innerHTML = puzzle.text;
  $('.pz-api').innerHTML = puzzle.api
    .map((key) => `<button type="button" data-api="${key}" title="${escape(API[key].doc)}"><code>${escape(API[key].sig)}</code><span>${escape(API[key].doc)}</span></button>`)
    .join('');
  $('.pz-api').querySelectorAll('button').forEach((button) =>
    button.addEventListener('click', () => insert(API[button.dataset.api].insert))
  );

  input.value = store.get(`code-${i}`, null) ?? puzzle.code;
  paint();
  result.className = 'pz-result';
  result.innerHTML = 'Change the code, then press <strong>Run</strong> (or Ctrl + Enter).';
  status.textContent = 'Hover a square to see its name; click it to use it in the code.';

  const { board, goal } = fresh(puzzle);
  draw(board, goal);
};

runButton.addEventListener('click', run);
$('.pz-reset').addEventListener('click', () => {
  stop();
  setCode(PUZZLES[current].code);
  open(current);
});
$('.pz-solution').addEventListener('click', () => {
  stop();
  setCode(PUZZLES[current].solution);
  input.focus();
});

open(Math.min(store.get('current', 0), PUZZLES.length - 1));

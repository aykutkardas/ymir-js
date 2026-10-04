import { useEffect, useRef, useState } from 'preact/hooks';
import { Match3Board, type CascadeStep } from 'ymir-js';

const SIZE = 8;
const MOVES = 20;
const KINDS = ['ruby', 'amber', 'citrine', 'jade', 'sapphire', 'amethyst'];
const STEP_MS = 280;

type Grid = (string | null)[][];

/** How a square should animate when a frame is shown. */
type Motion = { kind: 'fall' | 'spawn'; rows: number } | { kind: 'clear' };

type Frame = { grid: Grid; motion: Map<string, Motion> };

const copy = (grid: Grid): Grid => grid.map((row) => [...row]);
const at = (coord: string) => coord.split('|').map(Number) as [number, number];

/** The frames to show for one cascade step, starting from `grid`. */
const framesFor = (grid: Grid, step: CascadeStep): [Frame, Frame] => {
  const clearing: Frame = {
    grid,
    motion: new Map(step.cleared.map((coord) => [coord, { kind: 'clear' }])),
  };

  const next = copy(grid);
  const motion = new Map<string, Motion>();

  step.cleared.forEach((coord) => {
    const [r, c] = at(coord);
    next[r][c] = null;
  });
  // Falls are listed bottom-up within each column, so moving them in order
  // never overwrites a gem that has not moved yet.
  step.fallen.forEach(({ from, to }) => {
    const [fr, fc] = at(from);
    const [tr, tc] = at(to);
    next[tr][tc] = next[fr][fc];
    next[fr][fc] = null;
    motion.set(to, { kind: 'fall', rows: tr - fr });
  });
  const spawnedPerColumn = new Map<number, number>();
  step.spawned.forEach(({ coord }) => {
    const [, c] = at(coord);
    spawnedPerColumn.set(c, (spawnedPerColumn.get(c) ?? 0) + 1);
  });
  step.spawned.forEach(({ coord, kind }) => {
    const [r, c] = at(coord);
    next[r][c] = kind;
    motion.set(coord, { kind: 'spawn', rows: spawnedPerColumn.get(c)! });
  });

  return [clearing, { grid: next, motion }];
};

const newBoard = () => new Match3Board({ rows: SIZE, cols: SIZE, kinds: KINDS }).init();

export function App() {
  const board = useRef(newBoard());
  const [frame, setFrame] = useState<Frame>(() => ({
    grid: board.current.getKinds(),
    motion: new Map(),
  }));
  const [frameId, setFrameId] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [hint, setHint] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(MOVES);
  const [best, setBest] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Swap two neighbouring gems to make a line of three.');
  const timers = useRef<number[]>([]);

  const show = (next: Frame) => {
    setFrame(next);
    setFrameId((id) => id + 1);
  };

  const later = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const over = moves === 0 && !busy;

  const trySwap = (from: string, to: string) => {
    const before = board.current.getKinds();
    const result = board.current.swap(from, to);

    setSelected(null);
    setHint([]);

    if (!result.valid) {
      setMessage('No match there — try another pair.');
      return;
    }

    // Show the swap itself, then each cascade step.
    const swapped = copy(before);
    const [fr, fc] = at(from);
    const [tr, tc] = at(to);
    [swapped[fr][fc], swapped[tr][tc]] = [swapped[tr][tc], swapped[fr][fc]];

    setBusy(true);
    setMoves((m) => m - 1);
    show({ grid: swapped, motion: new Map() });

    let grid = swapped;
    let delay = STEP_MS;

    result.steps.forEach((step, i) => {
      const [clearing, settled] = framesFor(grid, step);
      grid = settled.grid;

      later(delay, () => show(clearing));
      later(delay + STEP_MS, () => {
        show(settled);
        setScore((s) => s + step.points);
        if (i > 0) setMessage(`Cascade ×${i + 1}!`);
      });
      delay += STEP_MS * 2;
    });

    later(delay, () => {
      if (result.shuffled) {
        show({ grid: board.current.getKinds(), motion: new Map() });
        setMessage('No moves left — the board was shuffled.');
      } else if (result.steps.length === 1) {
        setMessage(`+${result.points}`);
      }
      setBest((b) => Math.max(b, result.points));
      setBusy(false);
    });
  };

  const onGem = (coord: string) => {
    if (busy || over) return;

    if (!selected) {
      setSelected(coord);
      return;
    }

    if (selected === coord) {
      setSelected(null);
      return;
    }

    if (board.current.isAdjacent(selected, coord)) {
      trySwap(selected, coord);
    } else {
      setSelected(coord);
    }
  };

  const showHint = () => {
    const [move] = board.current.getPossibleMoves();
    if (move) setHint([move.from, move.to]);
  };

  const restart = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    board.current = newBoard();
    show({ grid: board.current.getKinds(), motion: new Map() });
    setSelected(null);
    setHint([]);
    setScore(0);
    setMoves(MOVES);
    setBest(0);
    setBusy(false);
    setMessage('Swap two neighbouring gems to make a line of three.');
  };

  return (
    <main class="layout">
      <header class="header">
        <div>
          <h1>Match 3</h1>
          <p class="muted">
            Built with <a href="https://github.com/aykutkardas/ymir-js">ymir-js</a>
          </p>
        </div>
        <div class="controls">
          <button class="ghost" onClick={showHint} disabled={busy || over}>
            Hint
          </button>
          <button class="ghost" onClick={restart}>
            New game
          </button>
        </div>
      </header>

      <dl class="stats">
        <div>
          <dt>Score</dt>
          <dd>{score}</dd>
        </div>
        <div>
          <dt>Moves left</dt>
          <dd>{moves}</dd>
        </div>
        <div>
          <dt>Best move</dt>
          <dd>{best}</dd>
        </div>
      </dl>

      <p class="message" aria-live="polite">
        {over ? `Game over — ${score} points.` : message}
      </p>

      <div class={`grid ${over ? 'over' : ''}`} style={{ '--size': SIZE }}>
        {frame.grid.flatMap((row, r) =>
          row.map((kind, c) => {
            const coord = `${r}|${c}`;
            const motion = frame.motion.get(coord);
            const classes = [
              'cell',
              selected === coord ? 'selected' : '',
              hint.includes(coord) ? 'hint' : '',
            ];

            return (
              <button
                key={`${coord}-${motion ? frameId : 0}`}
                class={classes.join(' ')}
                onClick={() => onGem(coord)}
                aria-label={kind ? `${kind} at ${coord}` : `empty ${coord}`}
              >
                {kind && (
                  <span
                    class={`gem ${kind} ${motion?.kind ?? ''}`}
                    style={
                      motion && 'rows' in motion ? { '--rows': motion.rows } : undefined
                    }
                  />
                )}
              </button>
            );
          })
        )}
      </div>
    </main>
  );
}

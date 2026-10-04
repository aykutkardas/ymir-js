import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import { LEVELS } from './levels';
import { SokobanGame, solve, type Move } from './rules';

const KEYS: Record<string, Move> = {
  ArrowUp: 'top',
  ArrowDown: 'bottom',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'top',
  s: 'bottom',
  a: 'left',
  d: 'right',
};

const ARROWS: Record<Move, string> = { top: '↑', bottom: '↓', left: '←', right: '→' };

export function App() {
  const [index, setIndex] = useState(0);
  const [game, setGame] = useState(() => new SokobanGame(LEVELS[0]));
  const [version, setVersion] = useState(0);
  const [solved, setSolved] = useState<Set<number>>(new Set());
  const [notice, setNotice] = useState('');
  const [playing, setPlaying] = useState(false);
  const timers = useRef<number[]>([]);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const refresh = () => setVersion((v) => v + 1);
  const best = useMemo(() => solve(new SokobanGame(LEVELS[index]).board)?.length ?? null, [index]);
  const { board } = game;

  const stopPlayback = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPlaying(false);
  };

  const open = (i: number) => {
    stopPlayback();
    setIndex(i);
    setGame(new SokobanGame(LEVELS[i]));
    setNotice('');
    refresh();
  };

  const after = () => {
    if (game.solved) {
      setSolved((s) => new Set(s).add(index));
      setNotice(
        best !== null && game.moves <= best
          ? `Solved in ${game.moves} moves — the best possible!`
          : `Solved in ${game.moves} moves. The best is ${best}.`
      );
    } else {
      setNotice('');
    }
    refresh();
  };

  const move = (direction: Move) => {
    if (playing) return;
    if (game.move(direction)) after();
  };

  const undo = () => {
    if (playing) return;
    game.undo();
    after();
  };

  const restart = () => {
    stopPlayback();
    game.restart();
    after();
  };

  // Plays the shortest solution from where the player stands now.
  const showSolution = () => {
    const solution = solve(game.board);

    if (!solution) {
      setNotice('No way to solve it from here — undo or restart.');
      return;
    }

    setPlaying(true);
    setNotice('');
    solution.forEach((step, i) => {
      timers.current.push(
        window.setTimeout(() => {
          game.move(step);
          if (i === solution.length - 1) {
            setPlaying(false);
            after();
          } else {
            refresh();
          }
        }, 220 * (i + 1))
      );
    });
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

      if (KEYS[key]) {
        event.preventDefault();
        move(KEYS[key]);
      } else if (key === 'z' || key === 'u') {
        undo();
      } else if (key === 'r') {
        restart();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => stopPlayback, []);

  // Swipe on the board to move.
  const onTouchStart = (event: TouchEvent) => {
    const t = event.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (event: TouchEvent) => {
    const start = touch.current;
    const t = event.changedTouches[0];
    touch.current = null;
    if (!start) return;

    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'bottom' : 'top');
  };

  const { rows, cols } = board.config;
  const boxesOnGoals = board.boxes().filter((b) => board.goals.has(b)).length;

  return (
    <main class="layout">
      <header class="header">
        <div>
          <h1>Sokoban</h1>
          <p class="muted">
            Push every box onto a goal. Built on the{' '}
            <a href="https://github.com/aykutkardas/ymir-js#custom-games">ymir-js core</a>
          </p>
        </div>
        <div class="segmented" role="tablist" aria-label="Level">
          {LEVELS.map((level, i) => (
            <button
              role="tab"
              aria-selected={i === index}
              class={i === index ? 'active' : ''}
              onClick={() => i !== index && open(i)}
            >
              {solved.has(i) ? '✓ ' : ''}
              {i + 1}. {level.name}
            </button>
          ))}
        </div>
      </header>

      <dl class="stats">
        <div>
          <dt>Moves</dt>
          <dd>{game.moves}</dd>
        </div>
        <div>
          <dt>Pushes</dt>
          <dd>{game.pushes}</dd>
        </div>
        <div>
          <dt>Boxes on goals</dt>
          <dd>
            {boxesOnGoals} <span class="muted">/ {board.goals.size}</span>
          </dd>
        </div>
        <div>
          <dt>Best</dt>
          <dd>{best ?? '–'}</dd>
        </div>
      </dl>

      <div
        class={`board ${game.solved ? 'solved' : ''}`}
        style={{ '--rows': rows, '--cols': cols }}
        role="grid"
        aria-label={`Level ${index + 1}: ${LEVELS[index].name}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {Object.keys(board.board).map((coord) => {
          const tile = board.getItem(coord);
          const kind = tile?.kind ?? (board.floor.has(coord) ? 'floor' : 'void');
          const goal = board.goals.has(coord);

          return (
            <div
              key={coord}
              class={`cell ${kind === 'wall' || kind === 'void' ? kind : 'floor'} ${goal ? 'goal' : ''}`}
              role="gridcell"
            >
              {tile?.kind === 'box' && <span class={`box ${goal ? 'on-goal' : ''}`} />}
              {tile?.kind === 'player' && <span class="player" aria-label="you" />}
            </div>
          );
        })}
      </div>

      <p class="notice" aria-live="polite">
        {notice || (playing ? 'Showing the shortest solution…' : ' ')}
      </p>

      <div class="controls">
        <div class="pad" aria-label="Move">
          {(['top', 'left', 'bottom', 'right'] as Move[]).map((direction) => (
            <button
              class={`ghost ${direction}`}
              onClick={() => move(direction)}
              aria-label={`Move ${direction === 'top' ? 'up' : direction === 'bottom' ? 'down' : direction}`}
            >
              {ARROWS[direction]}
            </button>
          ))}
        </div>
        <div class="actions">
          <button class="ghost" onClick={undo} disabled={!game.moves || playing}>
            Undo <kbd>Z</kbd>
          </button>
          <button class="ghost" onClick={restart} disabled={!game.moves && !playing}>
            Restart <kbd>R</kbd>
          </button>
          <button class="ghost" onClick={showSolution} disabled={game.solved || playing}>
            Show solution
          </button>
          {game.solved && index < LEVELS.length - 1 && (
            <button class="ghost primary" onClick={() => open(index + 1)}>
              Next level →
            </button>
          )}
        </div>
      </div>

      <p class="muted help">Arrow keys or WASD to move, or swipe on the board.</p>
    </main>
  );
}

import { useEffect, useRef, useState } from 'preact/hooks';

import { CANNON_ROW, COLS, InvadersGame, ROWS, SHIP_ROW, type Kind } from './rules';

/** The game advances in fixed steps, whatever the screen's frame rate. */
const STEP = 20;

const LEFT = ['ArrowLeft', 'KeyA'];
const RIGHT = ['ArrowRight', 'KeyD'];
const FIRE = ['Space', 'ArrowUp', 'KeyW'];

const newSeed = () => 1 + Math.floor(Math.random() * 100_000);
const startSeed = () => {
  const seed = Number(new URLSearchParams(location.search).get('seed'));
  return seed > 0 ? seed : newSeed();
};

// Pixel sprites, two poses each: '#' is a pixel.
const SPRITES: Record<Kind | 'cannon' | 'ship', string[][]> = {
  squid: [
    ['...##...', '..####..', '.##..##.', '.######.', '..#..#..', '.#.##.#.'],
    ['...##...', '..####..', '.##..##.', '.######.', '.#.##.#.', '#......#'],
  ],
  crab: [
    ['..#..#..', '.######.', '##.##.##', '########', '.#....#.', '#......#'],
    ['..#..#..', '#.####.#', '##.##.##', '########', '..#..#..', '.#....#.'],
  ],
  octopus: [
    ['..####..', '.######.', '##.##.##', '########', '.##..##.', '##....##'],
    ['..####..', '.######.', '##.##.##', '########', '..#..#..', '.#.##.#.'],
  ],
  cannon: [['...##...', '..####..', '.######.', '########', '########']],
  ship: [['...####...', '.########.', '##.#..#.##', '..##..##..']],
};

/** One SVG path for a sprite, a square per pixel. */
const toPath = (rows: string[]) =>
  rows.flatMap((row, y) => [...row].map((p, x) => (p === '#' ? `M${x} ${y}h1v1h-1z` : ''))).join('');

const PATHS = Object.fromEntries(
  Object.entries(SPRITES).map(([name, poses]) => [name, poses.map(toPath)])
) as Record<keyof typeof SPRITES, string[]>;

const Sprite = ({ name, pose = 0 }: { name: keyof typeof SPRITES; pose?: number }) => {
  const rows = SPRITES[name][pose];
  return (
    <svg viewBox={`0 0 ${rows[0].length} ${rows.length}`} aria-hidden="true">
      <path d={PATHS[name][pose]} fill="currentColor" />
    </svg>
  );
};

/** Places something on a square, as percentages of the board. */
const place = (row: number, col: number) => ({
  top: `${(row / ROWS) * 100}%`,
  left: `${(col / COLS) * 100}%`,
});

const loadBest = () => {
  try {
    return Number(localStorage.getItem('ymir-invaders-best')) || 0;
  } catch {
    return 0;
  }
};

export function App() {
  const [game, setGame] = useState(() => new InvadersGame({ seed: startSeed() }));
  const [, setFrame] = useState(0);
  // The game waits for the first key.
  const [started, setStarted] = useState(false);
  const [best, setBest] = useState(loadBest);
  const held = useRef({ left: false, right: false, fire: false });
  // A tap shorter than one step still counts: its release waits for a tick.
  const pressedAt = useRef(-1);
  const lateRelease = useRef(false);
  const elapsed = useRef(0);

  const status = game.getStatus();

  const applyHeld = () => {
    const { left, right, fire } = held.current;
    game.setInput({ move: left === right ? 0 : left ? -1 : 1, fire });
  };
  const press = (key: 'left' | 'right' | 'fire') => {
    held.current[key] = true;
    pressedAt.current = elapsed.current;
    applyHeld();
    setStarted(true);
  };
  const release = (key: 'left' | 'right' | 'fire') => {
    held.current[key] = false;
    if (elapsed.current === pressedAt.current) lateRelease.current = true;
    else applyHeld();
  };

  const restart = () => {
    held.current = { left: false, right: false, fire: false };
    elapsed.current = 0;
    setGame(new InvadersGame({ seed: newSeed() }));
    setStarted(false);
  };

  useEffect(() => {
    const which = (code: string) =>
      LEFT.includes(code) ? 'left' : RIGHT.includes(code) ? 'right' : FIRE.includes(code) ? 'fire' : null;

    const down = (e: KeyboardEvent) => {
      const key = which(e.code);
      if (key) {
        e.preventDefault();
        if (!e.repeat && game.getStatus().state === 'playing') press(key);
      } else if (e.code === 'Enter' && game.getStatus().state !== 'playing') {
        restart();
      }
    };
    const up = (e: KeyboardEvent) => {
      const key = which(e.code);
      if (key) release(key);
    };
    // Letting go of everything when the window loses focus avoids a stuck key.
    const blur = () => {
      held.current = { left: false, right: false, fire: false };
      applyHeld();
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [game]);

  // The game loop.
  useEffect(() => {
    if (!started) return;

    let last: number | null = null;
    let pending = 0;
    let frame = 0;

    const loop = (now: number) => {
      // Time starts on the first frame. After a long pause (a hidden tab),
      // carry on rather than catch up.
      if (last !== null) pending += Math.min(now - last, 200);
      last = now;
      while (pending >= STEP) {
        game.tick(STEP);
        elapsed.current += STEP;
        pending -= STEP;
        if (lateRelease.current) {
          lateRelease.current = false;
          applyHeld();
        }
      }
      setFrame((f) => f + 1);
      if (game.getStatus().state === 'playing') frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [game, started]);

  // Remember the best score.
  useEffect(() => {
    if (status.state !== 'over' || game.score <= best) return;
    setBest(game.score);
    try {
      localStorage.setItem('ymir-invaders-best', String(game.score));
    } catch {
      // Storage may be unavailable; the best score just isn't kept.
    }
  }, [status.state]);

  const things = [];

  for (const coord of Object.keys(game.board.board)) {
    const tile = game.board.getItem(coord);
    if (!tile) continue;
    const [row, col] = coord.split('|').map(Number);
    if (tile.type === 'invader') {
      const kind = tile.data!.kind!;
      things.push(
        <span key={`i${coord}`} class={`cell invader ${kind}`} style={place(row, col)}>
          <Sprite name={kind} pose={game.pose} />
        </span>
      );
    } else {
      things.push(
        <span key={`s${coord}`} class={`cell shield ${tile.data!.hp === 1 ? 'worn' : ''}`} style={place(row, col)} />
      );
    }
  }

  if (game.ship) {
    things.push(
      <span key="ship" class="cell ship" style={place(SHIP_ROW, game.ship.col - 0.5)}>
        <Sprite name="ship" />
      </span>
    );
  }
  if (game.shot) {
    things.push(<span key="shot" class="cell shot" style={place(game.shot.row, game.shot.col)} />);
  }
  game.bombs.forEach((bomb, i) =>
    things.push(<span key={`b${i}`} class="cell bomb" style={place(bomb.row, bomb.col)} />)
  );
  for (const coord of game.blasts.keys()) {
    const [row, col] = coord.split('|').map(Number);
    things.push(<span key={`x${coord}`} class="cell blast" style={place(row, col)} />);
  }
  if (status.state === 'playing' || status.reason === 'invaded') {
    things.push(
      <span
        key="cannon"
        class={`cell cannon ${game.hit ? 'hit' : ''}`}
        style={place(CANNON_ROW, game.cannon)}
        data-col={game.cannon}
      >
        <Sprite name="cannon" />
      </span>
    );
  }

  const between = game.pause > 0 && !game.hit && !game.invaders().length;
  const headline =
    status.state === 'over'
      ? status.reason === 'invaded'
        ? 'They landed!'
        : 'Game over'
      : !started
        ? 'Press ← → and Space to start'
        : between
          ? `Wave ${game.wave + 1}`
          : `Wave ${game.wave}`;

  return (
    <main class="layout">
      <header class="header">
        <div>
          <h1>Invaders</h1>
          <p class="muted">
            A real-time shooter on <a href="https://github.com/aykutkardas/ymir-js">ymir-js</a>'s core Board.
          </p>
        </div>
        <button type="button" class="ghost" onClick={restart}>
          New game
        </button>
      </header>

      <section class="hud" aria-live="polite">
        <span class="stat score">
          <small>Score</small> {game.score}
        </span>
        <strong class="status">{headline}</strong>
        <span class="stat lives" title={`${game.lives} lives`}>
          {Array.from({ length: Math.max(game.lives, 0) }, (_, i) => (
            <Sprite key={i} name="cannon" />
          ))}
        </span>
        <span class="stat">
          <small>Best</small> {Math.max(best, game.score)}
        </span>
      </section>

      <div class="board" role="img" aria-label="Invaders board">
        <div class="ground" />
        {things}

        {status.state === 'over' && (
          <div class="overlay">
            <p>{status.reason === 'invaded' ? 'The invaders landed.' : 'Your last cannon is gone.'}</p>
            <p class="muted">
              Score {game.score} · wave {game.wave}
            </p>
            <button type="button" class="primary" onClick={restart}>
              Play again
            </button>
          </div>
        )}
      </div>

      <div class="touch" aria-label="Touch controls">
        {(['left', 'right'] as const).map((key) => (
          <button
            type="button"
            key={key}
            class={`dir ${key}`}
            aria-label={key === 'left' ? 'Left' : 'Right'}
            onPointerDown={(e) => {
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              press(key);
            }}
            onPointerUp={() => release(key)}
            onPointerCancel={() => release(key)}
          />
        ))}
        <button
          type="button"
          class="fire"
          onPointerDown={(e) => {
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            press('fire');
          }}
          onPointerUp={() => release('fire')}
          onPointerCancel={() => release('fire')}
        >
          Fire
        </button>
      </div>

      <section class="rules">
        <h2>How to play</h2>
        <ul>
          <li>Move with ← → or A D; fire with Space. One shot is in the air at a time.</li>
          <li>The invaders march sideways and step down at each edge, faster as fewer are left.</li>
          <li>Shields soak up two hits a square, from either side. Shooting a bomb cancels it.</li>
          <li>Squids are worth 30, crabs 20, octopuses 10, and the ship up top 50 to 300.</li>
          <li>Three hits and the game is over; so is letting them land.</li>
        </ul>
      </section>
    </main>
  );
}

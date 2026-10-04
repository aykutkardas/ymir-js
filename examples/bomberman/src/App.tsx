import { useEffect, useRef, useState } from 'preact/hooks';

import { BombermanGame, BOMB_MS, COLS, ROWS, type Actor, type Move } from './rules';

/** The game advances in fixed steps, whatever the screen's frame rate. */
const STEP = 20;

const KEYS: Record<string, Move> = {
  ArrowUp: 'top',
  ArrowDown: 'bottom',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'top',
  KeyS: 'bottom',
  KeyA: 'left',
  KeyD: 'right',
};

const newSeed = () => 1 + Math.floor(Math.random() * 100_000);

const startSeed = () => {
  const seed = Number(new URLSearchParams(location.search).get('seed'));
  return seed > 0 ? seed : newSeed();
};

/** Where an actor is drawn: between its two squares, as percentages of the board. */
const position = (actor: Actor) => {
  const [fr, fc] = actor.from.split('|').map(Number);
  const [tr, tc] = actor.to.split('|').map(Number);
  const r = fr + (tr - fr) * actor.progress;
  const c = fc + (tc - fc) * actor.progress;
  return { top: `${(r / ROWS) * 100}%`, left: `${(c / COLS) * 100}%` };
};

const PowerIcon = ({ power }: { power: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    {power === 'bomb' && (
      <>
        <circle cx="11" cy="14" r="6.5" fill="currentColor" />
        <path d="M15 8.5 18 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </>
    )}
    {power === 'fire' && (
      <path
        fill="currentColor"
        d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 1.5.8 2.5 1.8 2.8C10 8.5 11 5.5 12 3Z"
      />
    )}
    {power === 'speed' && <path fill="currentColor" d="M13 2 5 13.5h5.5L9.5 22 19 9.5h-5.8L13 2Z" />}
  </svg>
);

export function App() {
  const [game, setGame] = useState(() => new BombermanGame({ seed: startSeed() }));
  const [, setFrame] = useState(0);
  // The game waits for the first key, so nobody is caught before they look.
  const [started, setStarted] = useState(false);
  const held = useRef<Move[]>([]);
  // A tap shorter than one step still moves one square: its release waits for a tick.
  const pressedAt = useRef(-1);
  const lateRelease = useRef(false);

  const status = game.getStatus();

  const restart = () => {
    held.current = [];
    setGame(new BombermanGame({ seed: newSeed() }));
    setStarted(false);
  };

  // The most recently pressed direction that is still held wins.
  const press = (move: Move) => {
    held.current = [...held.current.filter((m) => m !== move), move];
    pressedAt.current = game.elapsed;
    game.setInput({ move });
    setStarted(true);
  };
  const applyHeld = () => game.setInput({ move: held.current[held.current.length - 1] ?? null });
  const release = (move: Move) => {
    held.current = held.current.filter((m) => m !== move);
    if (game.elapsed === pressedAt.current) lateRelease.current = true;
    else applyHeld();
  };
  const bomb = () => {
    game.setInput({ bomb: true });
    setStarted(true);
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code in KEYS) {
        e.preventDefault();
        if (!e.repeat) press(KEYS[e.code]);
      } else if (e.code === 'Space' || e.code === 'KeyX') {
        e.preventDefault();
        if (game.getStatus().state === 'playing') bomb();
      } else if (e.code === 'Enter' && game.getStatus().state !== 'playing') {
        restart();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code in KEYS) release(KEYS[e.code]);
    };
    // Letting go of everything when the window loses focus avoids a stuck key.
    const blur = () => {
      held.current = [];
      game.setInput({ move: null });
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

  const squares = [];
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      const coord = `${r}|${c}`;
      const tile = game.board.getItem(coord);
      const fire = game.fire.has(coord);
      const urgent = tile?.kind === 'bomb' && tile.data!.timer! < BOMB_MS / 3;

      squares.push(
        <div key={coord} class={`square ${(r + c) % 2 ? 'odd' : ''}`}>
          {tile?.kind === 'wall' && <span class="wall" />}
          {tile?.kind === 'crate' && <span class="crate" />}
          {tile?.kind === 'bomb' && <span class={`bomb ${urgent ? 'urgent' : ''}`} />}
          {tile?.kind === 'power' && (
            <span class={`power ${tile.data!.power}`}>
              <PowerIcon power={tile.data!.power!} />
            </span>
          )}
          {fire && <span class="fire" />}
        </div>
      );
    }
  }

  const headline =
    status.state === 'won'
      ? 'You win!'
      : status.state === 'lost'
        ? 'Caught!'
        : started
          ? `${game.enemies.length} ${game.enemies.length === 1 ? 'enemy' : 'enemies'} left`
          : 'Press an arrow key to start';

  return (
    <main class="layout">
      <header class="header">
        <div>
          <h1>Bomberman</h1>
          <p class="muted">
            A real-time game on <a href="https://github.com/aykutkardas/ymir-js">ymir-js</a>'s core Board.
          </p>
        </div>
        <button type="button" class="ghost" onClick={restart}>
          New game
        </button>
      </header>

      <section class="hud" aria-live="polite">
        <span class="stat" title="Bombs at once">
          <PowerIcon power="bomb" /> {game.maxBombs}
        </span>
        <span class="stat" title="Blast length">
          <PowerIcon power="fire" /> {game.range}
        </span>
        <span class="stat" title="Speed">
          <PowerIcon power="speed" /> {game.player.speed.toFixed(1)}
        </span>
        <strong class="status">{headline}</strong>
        <span class="stat score">{game.score}</span>
      </section>

      <div class="board" role="img" aria-label="Bomberman board">
        <div class="squares">{squares}</div>

        {game.actors
          .filter((actor) => actor.alive || actor.kind === 'player')
          .map((actor) => (
            <span
              key={actor.id}
              class={`actor ${actor.kind} ${actor.alive ? '' : 'dead'} ${actor.facing ?? ''}`}
              style={position(actor)}
              data-from={actor.from}
              data-to={actor.to}
            >
              <span class="body" />
            </span>
          ))}

        {status.state !== 'playing' && (
          <div class="overlay">
            <p>{status.state === 'won' ? 'Every enemy is gone.' : 'Better luck next time.'}</p>
            <p class="muted">Score {game.score}</p>
            <button type="button" class="primary" onClick={restart}>
              Play again
            </button>
          </div>
        )}
      </div>

      <div class="touch" aria-label="Touch controls">
        <div class="pad">
          {(['top', 'left', 'right', 'bottom'] as Move[]).map((move) => (
            <button
              type="button"
              key={move}
              class={`dir ${move}`}
              aria-label={move === 'top' ? 'Up' : move === 'bottom' ? 'Down' : move === 'left' ? 'Left' : 'Right'}
              onPointerDown={(e) => {
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                press(move);
              }}
              onPointerUp={() => release(move)}
              onPointerCancel={() => release(move)}
            />
          ))}
        </div>
        <button type="button" class="drop" onPointerDown={bomb}>
          Bomb
        </button>
      </div>

      <section class="rules">
        <h2>How to play</h2>
        <ul>
          <li>Move with the arrow keys or WASD; drop a bomb with Space.</li>
          <li>A bomb goes off after two seconds, in a cross. It burns the first crate on each line and sets off other bombs.</li>
          <li>Burnt crates sometimes leave a power-up: more bombs, a longer blast or more speed.</li>
          <li>Blow up every enemy to win. Don't touch them, and stay out of the blast.</li>
        </ul>
      </section>
    </main>
  );
}

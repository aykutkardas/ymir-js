import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import {
  COMPUTER,
  HUMAN,
  SHARED_RULES,
  VARIANTS,
  coordOf,
  createGame,
  pickComputerMove,
  type Color,
  type Game,
  type Move,
  type Variant,
} from './game';
import { play, setMuted } from './sound';

const STEP_MS = 260;

type State = {
  game: Game;
  // Bumped after every change to the game so the UI re-renders.
  version: number;
};

const newState = (variant: Variant): State => ({
  game: createGame(variant),
  version: 0,
});

export function App() {
  const [variant, setVariant] = useState<Variant>('turkish');
  const [{ game, version }, setState] = useState(() => newState('turkish'));
  const [selected, setSelected] = useState<string | null>(null);
  // Squares the moving piece has already jumped to in the current chain.
  const [progress, setProgress] = useState<string[]>([]);
  const [muted, setMutedState] = useState(false);
  const timers = useRef<number[]>([]);

  const { board, turn } = game;
  const lastMove = game.moves.at(-1) ?? null;
  const { size, checkered, name } = VARIANTS[variant];

  const gameStatus = useMemo(() => game.getStatus(), [game, version]);
  const legalMoves = useMemo(
    () => game.getLegalMoves() as Move[],
    [game, version]
  );
  const mustCapture = legalMoves.some((move) => move.captured.length);
  const over = gameStatus.state !== 'playing';

  // Moves that are still possible given the piece and the jumps made so far.
  const candidates = selected
    ? legalMoves.filter(
        (move) =>
          move.from === selected &&
          progress.every((square, i) => move.path[i] === square)
      )
    : [];
  const nextSquares = new Set(candidates.map((move) => move.path[progress.length]));
  const capturedSoFar = new Set(
    candidates[0]?.captured.slice(0, progress.length) ?? []
  );
  const movablePieces = new Set(legalMoves.map((move) => move.from));
  const piecePosition = progress.at(-1) ?? selected;

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const refresh = () => setState((s) => ({ ...s, version: s.version + 1 }));

  const commit = (move: Move) => {
    game.play(move);
    play(move.captured.length ? 'capture' : 'move');
    setSelected(null);
    setProgress([]);
    refresh();
  };

  // The computer plays its whole chain one jump at a time.
  useEffect(() => {
    if (turn !== COMPUTER || over) return;

    const move = pickComputerMove(board, COMPUTER);
    if (!move) return;

    timers.current.push(
      window.setTimeout(() => {
        setSelected(move.from);
        play('select');
      }, 400)
    );

    move.path.slice(0, -1).forEach((_, i) => {
      timers.current.push(
        window.setTimeout(() => {
          setProgress(move.path.slice(0, i + 1));
          play('capture');
        }, 400 + STEP_MS * (i + 1))
      );
    });

    timers.current.push(
      window.setTimeout(() => commit(move), 400 + STEP_MS * move.path.length)
    );

    return clearTimers;
  }, [game, version]);

  const restart = (next: Variant = variant) => {
    clearTimers();
    setVariant(next);
    setState(newState(next));
    setSelected(null);
    setProgress([]);
  };

  const onSquare = (coord: string) => {
    if (turn !== HUMAN || over) return;

    if (nextSquares.has(coord)) {
      const nextProgress = [...progress, coord];
      const done = candidates.find(
        (move) => move.path.join() === nextProgress.join()
      );

      if (done) {
        commit(done);
      } else {
        setProgress(nextProgress);
        play('capture');
      }
      return;
    }

    // Mid-chain the piece has to keep going.
    if (progress.length) return;

    if (movablePieces.has(coord)) {
      setSelected(coord === selected ? null : coord);
      play('select');
    } else {
      setSelected(null);
    }
  };

  // Take back your last move and the computer's reply.
  const undo = () => {
    clearTimers();
    setSelected(null);
    setProgress([]);
    game.undo();
    while (game.turn !== HUMAN && game.canUndo) game.undo();
    refresh();
  };

  // White (the computer) moves first, so the second move is the first of yours.
  const canUndo = game.moves.length >= 2;

  const toggleMute = () => {
    setMuted(!muted);
    setMutedState(!muted);
  };

  const remaining = (color: Color) => board.getItemsByColor(color).length;
  const start = size === 8 ? 16 : 20;

  const status =
    gameStatus.state === 'won'
      ? gameStatus.winner === HUMAN
        ? 'You win'
        : 'The computer wins'
      : gameStatus.state === 'draw'
        ? gameStatus.reason === 'repetition'
          ? 'Draw — the same position came up three times'
          : 'Draw — too many king moves without a capture'
        : turn === HUMAN
      ? progress.length
        ? 'Keep capturing'
        : mustCapture
          ? 'Your move — you must capture'
          : 'Your move'
      : 'Computer is thinking…';

  return (
    <main class="layout">
      <header class="header">
        <div>
          <h1>Checkers</h1>
          <p class="muted">
            Built with{' '}
            <a href="https://github.com/aykutkardas/ymir-js">ymir-js</a>
          </p>
        </div>
        <div class="controls">
          <div class="segmented" role="tablist" aria-label="Variant">
            {(Object.keys(VARIANTS) as Variant[]).map((v) => (
              <button
                role="tab"
                aria-selected={v === variant}
                class={v === variant ? 'active' : ''}
                onClick={() => v !== variant && restart(v)}
              >
                {VARIANTS[v].name}
              </button>
            ))}
          </div>
          <button class="ghost" onClick={undo} disabled={!canUndo}>
            Undo
          </button>
          <button class="ghost" onClick={() => restart()}>
            New game
          </button>
          <button
            class="ghost icon"
            onClick={toggleMute}
            aria-label={muted ? 'Unmute' : 'Mute'}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      <section class="game">
        <div class="status" aria-live="polite">
          <span class={`dot ${over ? 'over' : turn}`} />
          {status}
        </div>

        <div
          class={`board ${checkered ? 'checkered' : 'plain'}`}
          style={{ '--size': size }}
          aria-label={`${name} checkers board`}
        >
          {Array.from({ length: size * size }, (_, i) => {
            const row = Math.floor(i / size);
            const col = i % size;
            const coord = coordOf(row, col);
            const dark = (row + col) % 2 === 1;

            // While a chain is in progress the piece is drawn where it is.
            let item = board.getItem(coord);
            if (selected && progress.length) {
              if (coord === selected) item = null;
              if (coord === piecePosition) item = board.getItem(selected);
            }

            const classes = [
              'square',
              checkered && dark ? 'dark' : '',
              lastMove &&
              (lastMove.from === coord || lastMove.path.includes(coord))
                ? 'last'
                : '',
              turn === HUMAN && nextSquares.has(coord) ? 'target' : '',
            ];

            const pieceClasses = item
              ? [
                  'piece',
                  item.color,
                  item.king ? 'king' : '',
                  coord === piecePosition ? 'selected' : '',
                  capturedSoFar.has(coord) ? 'taken' : '',
                  turn === HUMAN &&
                  !selected &&
                  mustCapture &&
                  movablePieces.has(coord)
                    ? 'hint'
                    : '',
                ]
              : [];

            return (
              <button
                key={coord}
                class={classes.join(' ')}
                onClick={() => onSquare(coord)}
                aria-label={`${coord}${item ? ` ${item.color}${item.king ? ' king' : ''}` : ''}`}
              >
                {item && <span class={pieceClasses.join(' ')} />}
              </button>
            );
          })}
        </div>

        <dl class="score">
          <div>
            <dt>You (black)</dt>
            <dd>
              {remaining('black')} <span class="muted">/ {start}</span>
            </dd>
          </div>
          <div>
            <dt>Computer (white)</dt>
            <dd>
              {remaining('white')} <span class="muted">/ {start}</span>
            </dd>
          </div>
        </dl>
      </section>

      <section class="rules">
        <h2>{name} rules</h2>
        <ul>
          {[...VARIANTS[variant].rules, ...SHARED_RULES].map((rule) => (
            <li>{rule}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}

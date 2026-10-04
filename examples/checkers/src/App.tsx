import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import {
  COMPUTER,
  HUMAN,
  SHARED_RULES,
  VARIANTS,
  coordOf,
  createBoard,
  other,
  pickComputerMove,
  type Board,
  type Color,
  type Move,
  type Variant,
} from './game';
import { play, setMuted } from './sound';

const STEP_MS = 260;

type Game = {
  board: Board;
  turn: Color;
  lastMove: Move | null;
  version: number;
};

const newGame = (variant: Variant): Game => ({
  board: createBoard(variant),
  turn: HUMAN,
  lastMove: null,
  version: 0,
});

export function App() {
  const [variant, setVariant] = useState<Variant>('turkish');
  const [game, setGame] = useState(() => newGame('turkish'));
  const [selected, setSelected] = useState<string | null>(null);
  // Squares the moving piece has already jumped to in the current chain.
  const [progress, setProgress] = useState<string[]>([]);
  const [muted, setMutedState] = useState(false);
  const timers = useRef<number[]>([]);

  const { board, turn, lastMove } = game;
  const { size, checkered, name } = VARIANTS[variant];

  const legalMoves = useMemo(
    () => board.getLegalMoves(turn) as Move[],
    [board, turn, game.version]
  );
  const mustCapture = legalMoves.some((move) => move.captured.length);
  const winner = legalMoves.length ? null : other(turn);

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

  const commit = (move: Move) => {
    board.playMove(move);
    play(move.captured.length ? 'capture' : 'move');
    setSelected(null);
    setProgress([]);
    setGame((g) => ({
      ...g,
      turn: other(g.turn),
      lastMove: move,
      version: g.version + 1,
    }));
  };

  // The computer plays its whole chain one jump at a time.
  useEffect(() => {
    if (turn !== COMPUTER || winner) return;

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
  }, [board, turn, game.version]);

  const restart = (next: Variant = variant) => {
    clearTimers();
    setVariant(next);
    setGame(newGame(next));
    setSelected(null);
    setProgress([]);
  };

  const onSquare = (coord: string) => {
    if (turn !== HUMAN || winner) return;

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

  const toggleMute = () => {
    setMuted(!muted);
    setMutedState(!muted);
  };

  const remaining = (color: Color) => board.getItemsByColor(color).length;
  const start = size === 8 ? 16 : 20;

  const status = winner
    ? winner === HUMAN
      ? 'You win'
      : 'The computer wins'
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
          <span class={`dot ${winner ? 'over' : turn}`} />
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

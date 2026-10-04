import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import { pickMove } from './ai';
import { ReversiGame, type Color } from './rules';

type Mode = 'computer' | 'local';

const LEVELS = [
  { name: 'Easy', depth: 1 },
  { name: 'Medium', depth: 2 },
  { name: 'Hard', depth: 4 },
];

const HUMAN: Color = 'black';
const title = (color: Color) => (color === 'black' ? 'Black' : 'White');

export function App() {
  const [mode, setMode] = useState<Mode>('computer');
  const [level, setLevel] = useState(1);
  const [game, setGame] = useState(() => new ReversiGame());
  const [version, setVersion] = useState(0);
  // Discs that just changed colour, so they can play the flip animation.
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const [placed, setPlaced] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const refresh = () => setVersion((v) => v + 1);
  const status = useMemo(() => game.getStatus(), [game, version]);
  const moves = useMemo(() => (status.state === 'playing' ? game.legalMoves() : []), [game, version, status.state]);
  const legal = new Set(moves.map((m) => m.coord));
  const computerTurn = mode === 'computer' && game.turn !== HUMAN && status.state === 'playing';

  const play = (coord: string) => {
    const move = game.play(coord);
    setPlaced(coord);
    setFlipped(new Set(move.flips));
    refresh();
  };

  // The computer plays white.
  useEffect(() => {
    if (!computerTurn) return;

    timer.current = window.setTimeout(() => {
      const move = pickMove(game.board, game.turn, LEVELS[level].depth);
      if (move) play(move.coord);
    }, 450);

    return () => clearTimeout(timer.current);
  }, [game, version, computerTurn, level]);

  const onSquare = (coord: string) => {
    if (computerTurn || !legal.has(coord)) return;
    play(coord);
  };

  const undo = () => {
    clearTimeout(timer.current);
    game.undo();
    // Against the computer, go back to your own turn.
    if (mode === 'computer' && game.turn !== HUMAN) game.undo();
    setFlipped(new Set());
    setPlaced(null);
    refresh();
  };

  const restart = (next: Mode = mode) => {
    clearTimeout(timer.current);
    setMode(next);
    setGame(new ReversiGame());
    setFlipped(new Set());
    setPlaced(null);
    refresh();
  };

  const black = game.board.count('black');
  const white = game.board.count('white');
  const passed = game.lastWasPass ? `${title(game.turn === 'black' ? 'white' : 'black')} had no move and passed. ` : '';

  const headline =
    status.state === 'over'
      ? status.winner
        ? `${title(status.winner)} wins, ${Math.max(status.black, status.white)} to ${Math.min(status.black, status.white)}`
        : `A draw, ${status.black} to ${status.white}`
      : computerTurn
        ? 'White is thinking…'
        : `${title(game.turn)} to move`;

  return (
    <main class="layout">
      <header class="header">
        <div>
          <h1>Reversi</h1>
          <p class="muted">
            Built on the <a href="https://github.com/aykutkardas/ymir-js#custom-games">ymir-js core</a>
          </p>
        </div>
        <div class="controls">
          <div class="segmented" role="tablist" aria-label="Opponent">
            {(['computer', 'local'] as Mode[]).map((m) => (
              <button role="tab" aria-selected={m === mode} class={m === mode ? 'active' : ''} onClick={() => m !== mode && restart(m)}>
                {m === 'computer' ? 'vs computer' : '2 players'}
              </button>
            ))}
          </div>
          {mode === 'computer' && (
            <div class="segmented" role="tablist" aria-label="Difficulty">
              {LEVELS.map((l, i) => (
                <button role="tab" aria-selected={i === level} class={i === level ? 'active' : ''} onClick={() => setLevel(i)}>
                  {l.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div class="scores">
        <div class={`score ${game.turn === 'black' && status.state === 'playing' ? 'turn' : ''}`}>
          <span class="disc black" /> <strong>{black}</strong> <span class="muted">{mode === 'computer' ? 'You' : 'Black'}</span>
        </div>
        <p class="status" aria-live="polite">
          {passed}
          {headline}
        </p>
        <div class={`score ${game.turn === 'white' && status.state === 'playing' ? 'turn' : ''}`}>
          <span class="muted">{mode === 'computer' ? 'Computer' : 'White'}</span> <strong>{white}</strong> <span class="disc white" />
        </div>
      </div>

      <div class="board" role="grid" aria-label="Reversi board">
        {Object.keys(game.board.board).map((coord) => {
          const disc = game.board.getItem(coord);
          const hint = !computerTurn && legal.has(coord);

          return (
            <button
              key={coord}
              class={`cell ${hint ? 'hint' : ''} ${placed === coord ? 'placed' : ''}`}
              onClick={() => onSquare(coord)}
              aria-label={`${coord}${disc ? ` ${disc.color}` : hint ? ' playable' : ''}`}
            >
              {disc && (
                <span
                  key={`${coord}-${flipped.has(coord) ? version : 0}`}
                  class={`disc ${disc.color} ${flipped.has(coord) ? 'flip' : ''} ${placed === coord ? 'drop' : ''}`}
                />
              )}
            </button>
          );
        })}
      </div>

      <div class="actions">
        <button class="ghost" onClick={undo} disabled={!game.history.length || computerTurn}>
          Undo
        </button>
        <button class="ghost" onClick={() => restart()}>
          New game
        </button>
      </div>

      <section class="rules">
        <h2>How to play</h2>
        <ul>
          <li>Place a disc so that it traps a line of the other colour between it and one of yours.</li>
          <li>Every trapped disc, in all eight directions, flips to your colour. Dots show where you can play.</li>
          <li>If you cannot move, you pass. When neither side can move, the most discs wins.</li>
        </ul>
      </section>
    </main>
  );
}

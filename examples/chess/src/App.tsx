import { useEffect, useMemo, useState } from 'preact/hooks';
import {
  ChessGame,
  type ChessColor,
  type ChessDrawReason,
  type ChessMove,
  type ChessPieceType,
} from 'ymir-js';

type Mode = 'computer' | 'local';

const LEVELS = [
  { name: 'Easy', depth: 1 },
  { name: 'Medium', depth: 2 },
  { name: 'Hard', depth: 3 },
];

// Each piece is a filled glyph with the outline glyph on top, so white
// pieces come out white with a black outline in any font. U+FE0E asks for
// the text glyph, not the emoji one (the pawn is also an emoji).
const FILLED: Record<ChessPieceType, string> = {
  k: '♚',
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟',
};

const OUTLINE: Record<ChessPieceType, string> = {
  k: '♔',
  q: '♕',
  r: '♖',
  b: '♗',
  n: '♘',
  p: '♙',
};

const Piece = ({ type, color }: { type: ChessPieceType; color: ChessColor }) => (
  <span class={`piece ${color}`} aria-hidden="true">
    <span class="fill">{FILLED[type]}︎</span>
    <span class="line">{OUTLINE[type]}︎</span>
  </span>
);

const NAMES: Record<ChessPieceType, string> = {
  k: 'king',
  q: 'queen',
  r: 'rook',
  b: 'bishop',
  n: 'knight',
  p: 'pawn',
};

const DRAWS: Record<ChessDrawReason, string> = {
  stalemate: 'Stalemate',
  repetition: 'Draw by threefold repetition',
  'fifty-move': 'Draw by the fifty-move rule',
  'insufficient-material': 'Draw — not enough material to mate',
};

const FILES = 'abcdefgh';
const title = (color: ChessColor) => (color === 'white' ? 'White' : 'Black');

export function App() {
  const [game, setGame] = useState(() => new ChessGame());
  const [version, setVersion] = useState(0);
  const [mode, setMode] = useState<Mode>('computer');
  const [side, setSide] = useState<ChessColor>('white');
  const [level, setLevel] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  // A promotion waiting for the player to pick a piece.
  const [pending, setPending] = useState<{ from: string; to: string } | null>(null);

  const refresh = () => setVersion((v) => v + 1);
  const status = useMemo(() => game.getStatus(), [game, version]);
  const legal = useMemo(() => game.getLegalMoves(), [game, version]);
  const moves = game.moves;
  const last = moves[moves.length - 1];
  const computerColor: ChessColor = side === 'white' ? 'black' : 'white';
  const computerTurn = mode === 'computer' && game.turn === computerColor;
  const playing = status.state === 'playing';

  const targets = new Map<string, ChessMove>(
    selected ? legal.filter((m) => m.from === selected).map((m) => [m.to, m]) : []
  );
  const movable = new Set(legal.map((m) => m.from));

  // The computer's move, after a short pause so it does not feel instant.
  useEffect(() => {
    if (!playing || !computerTurn) return;

    const timer = window.setTimeout(() => {
      const move = game.getBestMove({ depth: LEVELS[level].depth });
      if (move) game.move(move.uci);
      refresh();
    }, 300);

    return () => clearTimeout(timer);
  }, [game, version, playing, computerTurn, level]);

  const restart = (next: { mode?: Mode; side?: ChessColor } = {}) => {
    setMode(next.mode ?? mode);
    setSide(next.side ?? side);
    setGame(new ChessGame());
    setSelected(null);
    setPending(null);
    refresh();
  };

  const commit = (from: string, to: string, promotion?: ChessPieceType) => {
    game.move({ from, to, promotion });
    setSelected(null);
    setPending(null);
    refresh();
  };

  const onSquare = (square: string) => {
    if (!playing || computerTurn || pending) return;

    const target = targets.get(square);

    if (selected && target) {
      if (target.promotion) setPending({ from: selected, to: square });
      else commit(selected, square);
      return;
    }

    setSelected(movable.has(square) && square !== selected ? square : null);
  };

  const undo = () => {
    game.undo();
    // Against the computer, take back its reply as well.
    if (mode === 'computer' && game.turn === computerColor) game.undo();
    setSelected(null);
    setPending(null);
    refresh();
  };

  const headline =
    status.state === 'checkmate'
      ? `Checkmate — ${title(status.winner)} wins`
      : status.state === 'draw'
        ? DRAWS[status.reason]
        : computerTurn
          ? 'Computer is thinking…'
          : `${title(game.turn)} to move${status.check ? ' — check!' : ''}`;

  // Draw rank 8 first for white, rank 1 first for black.
  const rows = side === 'white' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const cols = rows;
  const kingInCheck =
    status.state === 'playing' && status.check
      ? Object.entries(game.board.board).find(
          ([, { item }]) => item?.type === 'k' && item.color === game.turn
        )?.[0]
      : null;

  const pgn = game.pgn();

  return (
    <main class="layout">
      <header class="header">
        <div>
          <h1>Chess</h1>
          <p class="muted">
            Built with <a href="https://github.com/aykutkardas/ymir-js">ymir-js</a>
          </p>
        </div>
        <div class="controls">
          <div class="segmented" role="tablist" aria-label="Opponent">
            {(['computer', 'local'] as Mode[]).map((m) => (
              <button
                role="tab"
                aria-selected={m === mode}
                class={m === mode ? 'active' : ''}
                onClick={() => m !== mode && restart({ mode: m })}
              >
                {m === 'computer' ? 'vs computer' : '2 players'}
              </button>
            ))}
          </div>
          {mode === 'computer' && (
            <div class="segmented" role="tablist" aria-label="Difficulty">
              {LEVELS.map((l, i) => (
                <button
                  role="tab"
                  aria-selected={i === level}
                  class={i === level ? 'active' : ''}
                  onClick={() => setLevel(i)}
                >
                  {l.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <p class="status" aria-live="polite">
        {headline}
      </p>

      <div class="board-wrap">
        <div class="board" role="grid" aria-label="Chess board">
          {rows.map((r) =>
            cols.map((c) => {
              const coord = `${r}|${c}`;
              const square = `${FILES[c]}${8 - r}`;
              const piece = game.board.getItem(coord);
              const target = targets.get(square);
              const classes = [
                'square',
                (r + c) % 2 ? 'dark' : 'light',
                last && (last.from === square || last.to === square) ? 'last' : '',
                selected === square ? 'selected' : '',
                coord === kingInCheck ? 'check' : '',
                target ? (target.captured ? 'capture' : 'target') : '',
              ];

              return (
                <button
                  key={coord}
                  role="gridcell"
                  class={classes.join(' ')}
                  onClick={() => onSquare(square)}
                  aria-label={`${square}${piece ? ` ${piece.color} ${NAMES[piece.type]}` : ''}`}
                >
                  {piece && <Piece type={piece.type} color={piece.color} />}
                  {c === cols[0] && <span class="rank">{8 - r}</span>}
                  {r === rows[7] && <span class="file">{FILES[c]}</span>}
                </button>
              );
            })
          )}
        </div>

        {pending && (
          <div class="promotion" role="dialog" aria-label="Promote to">
            <p>Promote to</p>
            <div>
              {(['q', 'r', 'b', 'n'] as ChessPieceType[]).map((type) => (
                <button
                  onClick={() => commit(pending.from, pending.to, type)}
                  aria-label={NAMES[type]}
                >
                  <Piece type={type} color={game.turn} />
                </button>
              ))}
            </div>
            <button class="ghost" onClick={() => setPending(null)}>
              Cancel
            </button>
          </div>
        )}
      </div>

      <div class="actions">
        <button class="ghost" onClick={undo} disabled={!moves.length || computerTurn}>
          Undo
        </button>
        <button class="ghost" onClick={() => restart({ side: 'white' })}>
          New game as white
        </button>
        <button class="ghost" onClick={() => restart({ side: 'black' })}>
          New game as black
        </button>
      </div>

      <section class="moves">
        <h2>Moves</h2>
        <p class={pgn ? '' : 'muted'}>{pgn || 'No moves yet.'}</p>
      </section>
    </main>
  );
}

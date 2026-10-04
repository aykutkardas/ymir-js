import { useEffect, useMemo, useState } from 'preact/hooks';

import { pickMove } from './ai';
import { CORNERS, SIZE, THRONE, TaflGame, type Side, type WinReason } from './rules';

type Mode = Side | 'local';

const MODES: { mode: Mode; label: string }[] = [
  { mode: 'defenders', label: 'Play the king' },
  { mode: 'attackers', label: 'Play the attackers' },
  { mode: 'local', label: '2 players' },
];

const REASONS: Record<WinReason, string> = {
  escape: 'the king escaped to a corner',
  'exit-fort': 'the king built an unbreakable fort on the edge',
  'king-captured': 'the king was captured',
  encircled: 'the attackers encircled every defender',
  'no-moves': 'the other side could not move',
  repetition: 'perpetual repetition (a loss for the defenders)',
};

const NAMES: Record<Side, string> = { attackers: 'Attackers', defenders: 'Defenders' };

export function App() {
  const [mode, setMode] = useState<Mode>('defenders');
  const [game, setGame] = useState(() => new TaflGame());
  const [version, setVersion] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const refresh = () => setVersion((v) => v + 1);
  const status = useMemo(() => game.getStatus(), [game, version]);
  const legal = useMemo(() => game.getLegalMoves(), [game, version]);
  const last = game.moves[game.moves.length - 1];

  const computerSide: Side | null = mode === 'local' ? null : mode === 'defenders' ? 'attackers' : 'defenders';
  const computerTurn = status.state === 'playing' && game.turn === computerSide;
  const targets = new Set(selected ? legal.filter((m) => m.from === selected).map((m) => m.to) : []);
  const movable = new Set(legal.map((m) => m.from));

  // The computer moves after a short pause.
  useEffect(() => {
    if (!computerTurn) return;

    const timer = window.setTimeout(() => {
      const move = pickMove(game);
      if (move) game.play(move);
      refresh();
    }, 350);

    return () => clearTimeout(timer);
  }, [game, version, computerTurn]);

  const restart = (next: Mode = mode) => {
    setMode(next);
    setGame(new TaflGame());
    setSelected(null);
    refresh();
  };

  const onSquare = (coord: string) => {
    if (status.state !== 'playing' || computerTurn) return;

    if (selected && targets.has(coord)) {
      game.play({ from: selected, to: coord });
      setSelected(null);
      refresh();
      return;
    }

    setSelected(movable.has(coord) && coord !== selected ? coord : null);
  };

  const undo = () => {
    game.undo();
    // Against the computer, take back its reply too.
    if (computerSide && game.turn === computerSide) game.undo();
    setSelected(null);
    refresh();
  };

  const headline =
    status.state === 'won'
      ? `${NAMES[status.winner]} win — ${REASONS[status.reason]}`
      : computerTurn
        ? 'The computer is thinking…'
        : `${NAMES[game.turn]} to move`;

  const count = (role: string) => game.board.countItems((piece) => piece.role === role);

  return (
    <main class="layout">
      <header class="header">
        <div>
          <h1>Hnefatafl</h1>
          <p class="muted">
            Viking chess, built on the <a href="https://github.com/aykutkardas/ymir-js#building-your-own-game">ymir-js core</a>
          </p>
        </div>
        <div class="segmented" role="tablist" aria-label="Mode">
          {MODES.map(({ mode: m, label }) => (
            <button
              role="tab"
              aria-selected={m === mode}
              class={m === mode ? 'active' : ''}
              onClick={() => m !== mode && restart(m)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <p class="status" aria-live="polite">
        <span class={`dot ${status.state === 'won' ? 'over' : game.turn}`} />
        {headline}
      </p>

      <div class="board" role="grid" aria-label="Hnefatafl board" style={{ '--size': SIZE }}>
        {game.board.squares().map(({ coord, item: piece }) => {
          const classes = [
            'square',
            coord === THRONE ? 'throne' : '',
            CORNERS.includes(coord) ? 'corner' : '',
            last && (last.from === coord || last.to === coord) ? 'last' : '',
            last?.captured.includes(coord) ? 'captured' : '',
            selected === coord ? 'selected' : '',
            targets.has(coord) ? 'target' : '',
          ];

          return (
            <button
              key={coord}
              role="gridcell"
              class={classes.join(' ')}
              onClick={() => onSquare(coord)}
              aria-label={`${coord}${piece ? ` ${piece.role}` : ''}`}
            >
              {piece && <span class={`piece ${piece.role}`} />}
            </button>
          );
        })}
      </div>

      <div class="actions">
        <button class="ghost" onClick={undo} disabled={!game.moves.length || computerTurn}>
          Undo
        </button>
        <button class="ghost" onClick={() => restart()}>
          New game
        </button>
        <span class="muted counts">
          Attackers {count('attacker')} / 24 · Defenders {count('defender')} / 12
        </span>
      </div>

      <section class="rules">
        <h2>How to play</h2>
        <ul>
          <li>The attackers move first. Every piece moves like a rook in chess.</li>
          <li>
            Trap an enemy between two of yours, or between yours and a marked square, to capture it.
            Moving in between two enemies is safe.
          </li>
          <li>
            The <strong>king</strong> wins by reaching a corner. Only he may stop on the throne or a
            corner; the others may pass over the empty throne.
          </li>
          <li>
            The attackers win by surrounding the king on four sides (three next to the throne). He
            cannot be captured on the edge.
          </li>
        </ul>
        <p class="muted">
          Copenhagen rules, including shieldwalls, exit forts and encirclement.{' '}
          <a href="https://aagenielsen.dk/Copenhagen_Hnefatafl_11x11.pdf">Full rules</a>
        </p>
      </section>
    </main>
  );
}

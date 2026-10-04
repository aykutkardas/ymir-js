import { useEffect, useMemo, useState } from 'preact/hooks';
import { GoGame, type GoColor } from 'ymir-js';

import { pickMove } from './ai';

type Mode = 'computer' | 'local';

const SIZES = [9, 13, 19];
const HUMAN: GoColor = 'black';

const STAR_POINTS: Record<number, number[]> = {
  9: [2, 4, 6],
  13: [3, 6, 9],
  19: [3, 9, 15],
};

const newGame = (size: number) => new GoGame({ size, rules: 'area' });

const name = (color: GoColor) => (color === 'black' ? 'Black' : 'White');

export function App() {
  const [size, setSize] = useState(9);
  const [mode, setMode] = useState<Mode>('computer');
  const [game, setGame] = useState(() => newGame(9));
  const [version, setVersion] = useState(0);
  const [hover, setHover] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const refresh = () => setVersion((v) => v + 1);
  const status = useMemo(() => game.getStatus(), [game, version]);
  const score = useMemo(
    () => (status.state === 'scoring' ? game.getScore() : null),
    [game, version, status.state]
  );
  const legal = useMemo(
    () => new Set(status.state === 'playing' ? game.getLegalMoves() : []),
    [game, version, status.state]
  );

  const moves = game.moves;
  const last = moves[moves.length - 1];
  const lastStone = last?.type === 'play' ? last.coord : null;
  const computerTurn = mode === 'computer' && game.turn !== HUMAN;
  const dead = new Set(game.getDeadStones());

  // The computer plays white.
  useEffect(() => {
    if (status.state !== 'playing' || !computerTurn) return;

    const timer = window.setTimeout(() => {
      const coord = pickMove(game, last?.type === 'pass');

      if (coord) {
        game.play(coord);
        setNotice('');
      } else {
        game.pass();
        setNotice('White passes.');
      }
      refresh();
    }, 350);

    return () => clearTimeout(timer);
  }, [game, version, status.state, computerTurn]);

  const restart = (nextSize = size, nextMode = mode) => {
    setSize(nextSize);
    setMode(nextMode);
    setGame(newGame(nextSize));
    setNotice('');
    refresh();
  };

  const onPoint = (coord: string) => {
    if (status.state === 'scoring') {
      game.toggleDead(coord);
      refresh();
      return;
    }

    if (status.state !== 'playing' || computerTurn) return;

    const check = game.checkPlay(coord);

    if (!check.legal) {
      setNotice(
        check.reason === 'ko'
          ? 'Ko — you cannot retake right away. Play elsewhere first.'
          : check.reason === 'suicide'
            ? 'That stone would have no liberties.'
            : ''
      );
      return;
    }

    game.play(coord);
    setNotice('');
    refresh();
  };

  const pass = () => {
    game.pass();
    setNotice(`${name(game.turn === 'black' ? 'white' : 'black')} passes.`);
    refresh();
  };

  const resign = () => {
    game.resign();
    refresh();
  };

  const undo = () => {
    // Against the computer, take back its reply as well.
    game.undo();
    if (mode === 'computer' && game.turn !== HUMAN) game.undo();
    setNotice('');
    refresh();
  };

  const headline =
    status.state === 'resigned'
      ? `${name(status.winner)} wins by resignation`
      : status.state === 'scoring' && score
        ? score.winner
          ? `${name(score.winner)} wins by ${Math.abs(score.margin)}`
          : 'Jigo — a draw'
        : computerTurn
          ? 'White is thinking…'
          : `${name(game.turn)} to play`;

  // Board geometry: one unit per line spacing, half a unit of margin.
  const n = game.board.size;
  const at = (i: number) => i + 0.5;
  const points = Array.from({ length: n * n }, (_, i) => ({
    r: Math.floor(i / n),
    c: i % n,
    coord: `${Math.floor(i / n)}|${i % n}`,
  }));
  const stars = STAR_POINTS[n] ?? [];
  const territory = new Map<string, GoColor>();
  score?.territory.black.forEach((coord) => territory.set(coord, 'black'));
  score?.territory.white.forEach((coord) => territory.set(coord, 'white'));

  return (
    <main class="layout">
      <header class="header">
        <div>
          <h1>Go</h1>
          <p class="muted">
            Built with <a href="https://github.com/aykutkardas/ymir-js">ymir-js</a>
          </p>
        </div>
        <div class="controls">
          <div class="segmented" role="tablist" aria-label="Board size">
            {SIZES.map((s) => (
              <button
                role="tab"
                aria-selected={s === size}
                class={s === size ? 'active' : ''}
                onClick={() => s !== size && restart(s)}
              >
                {s}×{s}
              </button>
            ))}
          </div>
          <div class="segmented" role="tablist" aria-label="Opponent">
            {(['computer', 'local'] as Mode[]).map((m) => (
              <button
                role="tab"
                aria-selected={m === mode}
                class={m === mode ? 'active' : ''}
                onClick={() => m !== mode && restart(size, m)}
              >
                {m === 'computer' ? 'vs computer' : '2 players'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section class="status">
        <strong aria-live="polite">{headline}</strong>
        <span class="muted">
          {status.state === 'scoring'
            ? 'Click groups to mark them dead or alive. Area scoring, komi 7.5.'
            : notice || `Captures — Black ${game.captures.black} · White ${game.captures.white}`}
        </span>
      </section>

      <svg
        class={`board ${status.state !== 'playing' ? 'ended' : ''}`}
        viewBox={`0 0 ${n} ${n}`}
        role="grid"
        aria-label={`${n} by ${n} Go board`}
        onPointerLeave={() => setHover(null)}
      >
        <rect class="wood" width={n} height={n} />
        {Array.from({ length: n }, (_, i) => (
          <g class="line">
            <line x1={at(0)} y1={at(i)} x2={at(n - 1)} y2={at(i)} />
            <line x1={at(i)} y1={at(0)} x2={at(i)} y2={at(n - 1)} />
          </g>
        ))}
        {stars.flatMap((r) =>
          stars.map((c) => <circle class="star" cx={at(c)} cy={at(r)} r={0.09} />)
        )}

        {points.map(({ r, c, coord }) => {
          const color = game.board.getColor(coord);
          const owner = territory.get(coord);
          const preview =
            !color &&
            hover === coord &&
            status.state === 'playing' &&
            !computerTurn &&
            legal.has(coord);

          return (
            <g
              key={coord}
              role="gridcell"
              aria-label={`${game.board.toGTP(coord)}${color ? ` ${color}` : ''}`}
              onClick={() => onPoint(coord)}
              onPointerEnter={() => setHover(coord)}
            >
              <rect class="hit" x={c} y={r} width={1} height={1} />
              {color && (
                <circle
                  class={`stone ${color} ${dead.has(coord) ? 'dead' : ''}`}
                  cx={at(c)}
                  cy={at(r)}
                  r={0.46}
                />
              )}
              {preview && (
                <circle class={`stone ${game.turn} preview`} cx={at(c)} cy={at(r)} r={0.46} />
              )}
              {coord === lastStone && (
                <circle class={`last ${color}`} cx={at(c)} cy={at(r)} r={0.16} />
              )}
              {coord === game.koPoint && (
                <rect class="ko" x={at(c) - 0.18} y={at(r) - 0.18} width={0.36} height={0.36} />
              )}
              {owner && (!color || dead.has(coord)) && (
                <rect
                  class={`territory ${owner}`}
                  x={at(c) - 0.14}
                  y={at(r) - 0.14}
                  width={0.28}
                  height={0.28}
                />
              )}
            </g>
          );
        })}
      </svg>

      <div class="actions">
        <button
          class="ghost"
          onClick={pass}
          disabled={status.state !== 'playing' || computerTurn}
        >
          Pass
        </button>
        <button
          class="ghost"
          onClick={undo}
          disabled={!moves.length || computerTurn}
        >
          Undo
        </button>
        <button
          class="ghost"
          onClick={resign}
          disabled={status.state !== 'playing' || computerTurn}
        >
          Resign
        </button>
        <button class="ghost" onClick={() => restart()}>
          New game
        </button>
      </div>

      {score && (
        <dl class="score">
          <div>
            <dt>Black</dt>
            <dd>{score.black}</dd>
          </div>
          <div>
            <dt>White (incl. komi)</dt>
            <dd>{score.white}</dd>
          </div>
        </dl>
      )}
    </main>
  );
}

import { useEffect, useRef, useState } from 'preact/hooks';

import { actingOrder, planFor } from './ai';
import { newBattle, type AttackResult, type Side, type Unit, type UnitType } from './rules';

const NAMES: Record<UnitType, string> = { knight: 'Knight', archer: 'Archer', scout: 'Scout' };
const STEP_MS = 110;

const Icon = ({ type }: { type: UnitType }) => (
  <svg viewBox="0 0 24 24" class="icon" aria-hidden="true">
    {type === 'knight' && <path d="M12 3l7 3v5c0 5-3.2 8.4-7 10-3.8-1.6-7-5-7-10V6z" />}
    {type === 'archer' && (
      <>
        <path d="M7 3c7 3 9 13 0 18" fill="none" stroke-width="2.4" />
        <path d="M7 3v18M5 12h13l-3-2.5M18 12l-3 2.5" fill="none" stroke-width="1.8" />
      </>
    )}
    {type === 'scout' && <path d="M12 2l2.4 9H13v7h3v2.5H8V18h3v-7H9.6z" />}
  </svg>
);

const describe = (unitOf: (c: string) => string, r: AttackResult) => {
  let text = `${unitOf(r.attacker)} hits ${unitOf(r.target)} for ${r.damage}`;
  if (r.killed) text += ` — defeated`;
  if (r.counter) text += `; it strikes back for ${r.counter.damage}${r.counter.killed ? ' — defeated' : ''}`;
  return text + '.';
};

export function App() {
  const [board, setBoard] = useState(newBattle);
  const [version, setVersion] = useState(0);
  const [turn, setTurn] = useState<Side>('blue');
  const [selected, setSelected] = useState<string | null>(null);
  // A unit that has moved this turn and may still attack, wait or cancel.
  const [moved, setMoved] = useState<{ from: string; to: string } | null>(null);
  // While a unit walks, where it is drawn.
  const [walking, setWalking] = useState<{ from: string; at: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>(['Your turn. Pick a blue unit.']);
  const [turnNumber, setTurnNumber] = useState(1);
  const timers = useRef<number[]>([]);

  const refresh = () => setVersion((v) => v + 1);
  const status = board.status();
  const later = (ms: number) => new Promise<void>((resolve) => timers.current.push(window.setTimeout(resolve, ms)));
  const say = (line: string) => setLog((lines) => [line, ...lines].slice(0, 6));
  const label = (unit: Unit) => `${unit.data.side === 'blue' ? 'Your' : 'Red'} ${NAMES[unit.data.type].toLowerCase()}`;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const walk = async (from: string, to: string) => {
    if (from === to) return;
    for (const square of board.routeTo(from, to)) {
      setWalking({ from, at: square });
      await later(STEP_MS);
    }
    setWalking(null);
  };

  const attack = (from: string, target: string) => {
    const attacker = board.getItem(from)!;
    const defender = board.getItem(target)!;
    const names: Record<string, string> = { [from]: label(attacker), [target]: label(defender) };
    say(describe((c) => names[c], board.attack(from, target)));
  };

  // The red side plays every unit, one after another.
  const enemyTurn = async () => {
    setBusy(true);
    setTurn('red');
    board.refresh('red');
    refresh();
    await later(400);

    for (const from of actingOrder(board, 'red')) {
      if (!board.getItem(from) || board.status().state !== 'playing') continue;

      const plan = planFor(board, from);
      setSelected(from);
      await later(250);
      await walk(from, plan.to);
      board.moveUnit(from, plan.to);
      refresh();

      if (plan.target) {
        await later(200);
        attack(plan.to, plan.target);
      } else {
        board.wait(plan.to);
      }
      setSelected(null);
      refresh();
      await later(350);
    }

    if (board.status().state === 'playing') {
      board.refresh('blue');
      setTurn('blue');
      setTurnNumber((n) => n + 1);
      say('Your turn.');
    }
    setBusy(false);
    refresh();
  };

  // When every blue unit has acted, the turn passes.
  const finishIfDone = () => {
    if (board.status().state !== 'playing') return;
    if (board.unitsOf('blue').every((c) => board.getItem(c)!.data.acted)) void enemyTurn();
  };

  const onSquare = async (coord: string) => {
    if (busy || turn !== 'blue' || status.state !== 'playing') return;
    const unit = board.getItem(coord);

    // After moving: attack a target in range, or click elsewhere to keep waiting.
    if (moved) {
      const mover = board.getItem(moved.to)!;
      if (unit && board.targetsFrom(moved.to, mover).includes(coord)) {
        attack(moved.to, coord);
        setMoved(null);
        setSelected(null);
        refresh();
        finishIfDone();
      }
      return;
    }

    if (selected) {
      const mover = board.getItem(selected)!;

      // Attack without moving.
      if (unit && board.targetsFrom(selected, mover).includes(coord)) {
        attack(selected, coord);
        setSelected(null);
        refresh();
        finishIfDone();
        return;
      }

      // Move.
      if (board.movesFor(selected).has(coord) && (!unit || coord === selected)) {
        const from = selected;
        setBusy(true);
        await walk(from, coord);
        board.moveUnit(from, coord);
        setBusy(false);
        setSelected(coord);
        setMoved({ from, to: coord });
        refresh();
        return;
      }
    }

    // Select a ready blue unit.
    setSelected(unit?.data.side === 'blue' && !unit.data.acted ? coord : null);
  };

  const wait = () => {
    if (!moved && !selected) return;
    board.wait(moved?.to ?? selected!);
    setMoved(null);
    setSelected(null);
    refresh();
    finishIfDone();
  };

  const cancelMove = () => {
    if (!moved) return;
    const unit = board.getItem(moved.to)!;
    if (moved.from !== moved.to) board.moveItem(moved.to, moved.from);
    unit.data.moved = false;
    setSelected(moved.from);
    setMoved(null);
    refresh();
  };

  const endTurn = () => {
    board.unitsOf('blue').forEach((c) => board.wait(c));
    setSelected(null);
    setMoved(null);
    refresh();
    finishIfDone();
  };

  const restart = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setBoard(newBattle());
    setTurn('blue');
    setTurnNumber(1);
    setSelected(null);
    setMoved(null);
    setWalking(null);
    setBusy(false);
    setLog(['Your turn. Pick a blue unit.']);
  };

  // What to highlight.
  const active = moved?.to ?? selected;
  const activeUnit = active ? board.getItem(active) : null;
  const moveSquares =
    turn === 'blue' && selected && !moved && activeUnit?.data.side === 'blue' ? board.movesFor(selected) : new Map();
  const targets = new Set(
    activeUnit && turn === 'blue' && activeUnit.data.side === 'blue' && !activeUnit.data.acted
      ? board.targetsFrom(active!, activeUnit)
      : []
  );

  const headline =
    status.state === 'won'
      ? status.winner === 'blue'
        ? 'Victory — every red unit is down.'
        : 'Defeat — your army is gone.'
      : turn === 'blue'
        ? `Turn ${turnNumber} · your move`
        : `Turn ${turnNumber} · red is moving…`;

  const info = activeUnit ?? null;
  const { rows, cols } = board.config;

  return (
    <main class="layout">
      <header class="header">
        <div>
          <h1>Tactics</h1>
          <p class="muted">
            A small turn-based battle, built on the{' '}
            <a href="https://github.com/aykutkardas/ymir-js#custom-games">ymir-js core</a>
          </p>
        </div>
        <button class="ghost" onClick={restart}>
          New battle
        </button>
      </header>

      <p class={`status ${status.state === 'won' ? status.winner : turn}`} aria-live="polite">
        {headline}
      </p>

      <div class="board" style={{ '--rows': rows, '--cols': cols }} role="grid" aria-label="Battlefield">
        {Object.keys(board.board).map((coord) => {
          // A walking unit is drawn where it is, not where it started.
          const drawn =
            walking?.at === coord
              ? board.getItem(walking.from)
              : walking?.from === coord
                ? null
                : board.getItem(coord);
          const classes = [
            'cell',
            board.terrain[coord],
            coord.split('|').map(Number).reduce((a, b) => a + b) % 2 ? 'alt' : '',
            moveSquares.has(coord) ? 'move' : '',
            targets.has(coord) ? 'target' : '',
            active === coord ? 'active' : '',
          ];

          return (
            <button key={coord} class={classes.join(' ')} onClick={() => onSquare(coord)} aria-label={coord}>
              {drawn && (
                <span class={`unit ${drawn.data.side} ${drawn.data.acted && drawn.data.side === turn && status.state === 'playing' ? 'done' : ''}`}>
                  <Icon type={drawn.data.type} />
                  <span class="hp" style={{ '--hp': drawn.data.hp / drawn.data.maxHp }} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div class="panel">
        <div class="info">
          {info ? (
            <>
              <strong>
                {label(info)} · {info.data.hp}/{info.data.maxHp} HP
              </strong>
              <span class="muted">
                Attack {info.data.attack} · Defense {info.data.defense} · Move {info.data.move} · Range{' '}
                {info.data.range[0] === info.data.range[1] ? info.data.range[0] : info.data.range.join('–')}
              </span>
            </>
          ) : (
            <span class="muted">Select a unit to see its moves (blue) and targets (red).</span>
          )}
        </div>
        <div class="actions">
          {moved && (
            <button class="ghost" onClick={cancelMove} disabled={busy}>
              Cancel move
            </button>
          )}
          <button class="ghost" onClick={wait} disabled={busy || turn !== 'blue' || (!moved && !selected)}>
            Wait
          </button>
          <button class="ghost" onClick={endTurn} disabled={busy || turn !== 'blue' || status.state !== 'playing'}>
            End turn
          </button>
        </div>
      </div>

      <ol class="log" aria-label="Battle log">
        {log.map((line) => (
          <li>{line}</li>
        ))}
      </ol>

      <section class="rules">
        <h2>How to play</h2>
        <ul>
          <li>Each turn, every unit may move, then attack or wait.</li>
          <li>
            Knights and scouts hit the square next to them; archers shoot 2 to 3 squares away but not
            next to them.
          </li>
          <li>Damage is attack minus defense. A unit in a forest gets +1 defense. Rocks block the way.</li>
          <li>A unit that survives strikes back if the attacker is in its range.</li>
        </ul>
      </section>
    </main>
  );
}

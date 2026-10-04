// The computer player for one side. Each unit, in turn, looks at every square
// it can reach and every attack from there, and picks the best by a simple
// score. With nothing to attack, it walks towards the nearest enemy.
import { other, type Side, type TacticsBoard } from './rules';

export type Plan = { from: string; to: string; target: string | null };

/** How many steps the nearest enemy is from each square (rocks block, units don't). */
const distanceToEnemies = (board: TacticsBoard, side: Side): Map<string, number> => {
  const best = new Map<string, number>();

  for (const enemy of board.unitsOf(other(side))) {
    const reach = board.getReachable(enemy, { canEnter: (square) => board.terrain[square] !== 'rock' });
    reach.forEach((d, square) => {
      if (!best.has(square) || d < best.get(square)!) best.set(square, d);
    });
  }

  return best;
};

/** What the unit on `from` should do this turn. */
export const planFor = (board: TacticsBoard, from: string): Plan => {
  const unit = board.getItem(from)!;
  const side = unit.data.side;
  const moves = board.movesFor(from);
  const toEnemy = distanceToEnemies(board, side);

  // Squares enemy melee units could reach and hit next turn.
  const threatened = new Set<string>();
  for (const enemy of board.unitsOf(other(side))) {
    const foe = board.getItem(enemy)!;
    if (foe.data.range[0] > 1) continue;
    for (const square of board.movesFor(enemy, { nextTurn: true }).keys()) {
      board.getNeighbors(square).forEach((n) => threatened.add(n));
    }
  }

  let best: Plan = { from, to: from, target: null };
  let bestScore = -Infinity;

  for (const to of moves.keys()) {
    const cover = board.terrain[to] === 'forest' ? 2 : 0;
    const exposed = unit.data.type === 'archer' && threatened.has(to) ? -6 : 0;

    for (const target of board.targetsFrom(to, unit)) {
      const foe = board.getItem(target)!;
      const damage = Math.min(foe.data.hp, board.damage(unit, target));
      const kills = damage >= foe.data.hp;

      // The strike back, if the target survives and can reach this square.
      const [r1, c1] = to.split('|').map(Number);
      const [r2, c2] = target.split('|').map(Number);
      const d = Math.abs(r1 - r2) + Math.abs(c1 - c2);
      const strikesBack = !kills && d >= foe.data.range[0] && d <= foe.data.range[1];
      const counter = strikesBack ? Math.max(1, foe.data.attack - unit.data.defense - cover / 2) : 0;

      const score = (kills ? 50 : 0) + damage * 4 - counter * 3 + cover + exposed + (foe.data.type === 'archer' ? 2 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = { from, to, target };
      }
    }

    // Moving without attacking: get closer, keep archers out of reach.
    const closer = -(toEnemy.get(to) ?? 99);
    const score = closer + cover + exposed - 20;
    if (score > bestScore) {
      bestScore = score;
      best = { from, to, target: null };
    }
  }

  return best;
};

/** The units of `side` that can still act, archers first so they fire before others block them. */
export const actingOrder = (board: TacticsBoard, side: Side): string[] =>
  board
    .unitsOf(side)
    .filter((coord) => !board.getItem(coord)!.data.acted)
    .sort((a, b) => Number(board.getItem(b)!.data.type === 'archer') - Number(board.getItem(a)!.data.type === 'archer'));

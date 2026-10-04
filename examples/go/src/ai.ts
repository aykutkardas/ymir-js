import type { GoColor, GoGame } from 'ymir-js';

const other = (color: GoColor): GoColor => (color === 'black' ? 'white' : 'black');

/**
 * A simple computer player. It is not strong; it just plays sensibly:
 * capture, save stones in atari, put enemy stones in atari, avoid
 * self-atari, never fill its own eyes, and stay near the action.
 * Returns a coord, or null to pass.
 */
export const pickMove = (game: GoGame, opponentPassed: boolean): string | null => {
  const { board } = game;
  const me = game.turn;
  const size = board.size;
  const center = (size - 1) / 2;
  const before = board.getPosition();
  const hasStones = Object.keys(before).length > 0;

  let best: { coord: string; value: number } | null = null;

  for (const coord of game.getLegalMoves()) {
    const neighbors = board.getNeighbors(coord);

    // Filling a point surrounded by your own stones throws away an eye.
    if (neighbors.every((n) => board.getColor(n) === me)) continue;

    const ownAtari = neighbors.some((n) => {
      const group = board.getGroup(n);
      return group?.color === me && group.liberties.length === 1;
    });

    const captured = board.placeStone(me, coord)!;
    const ownLiberties = board.getGroup(coord)!.liberties.length;
    const enemyAtari = board
      .getNeighbors(coord)
      .map((n) => board.getGroup(n))
      .some((group) => group?.color === other(me) && group.liberties.length === 1);
    board.setPosition(before);

    const [r, c] = coord.split('|').map(Number);
    const nearStones = neighbors.some((n) => board.getColor(n)) ? 4 : 0;
    const edge = Math.min(r, c, size - 1 - r, size - 1 - c);

    let value =
      captured.length * 100 +
      (ownAtari && ownLiberties > 1 ? 60 : 0) +
      (enemyAtari ? 25 : 0) +
      (ownLiberties === 1 && !captured.length ? -80 : 0) +
      nearStones +
      // Early on, prefer the third and fourth lines; avoid the first line.
      (edge === 0 ? -6 : edge === 2 || edge === 3 ? 3 : 0) +
      (hasStones ? 0 : -Math.hypot(r - center, c - center)) +
      Math.random() * 3;

    if (!best || value > best.value) best = { coord, value };
  }

  // Once the opponent has passed, only keep playing for something concrete.
  if (!best || (opponentPassed && best.value < 20)) return null;

  return best.coord;
};

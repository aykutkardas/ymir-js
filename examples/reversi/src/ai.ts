// A computer player: alpha-beta search with the usual Reversi evaluation.
// Corners are worth a lot (they can never be flipped), the squares next to an
// empty corner are dangerous, and having more moves than the opponent helps.
// It has no randomness, so the same position always gets the same move.
import { other, type Color, type Move, ReversiBoard } from './rules';

// Square weights, row by row (a common table for 8x8 Reversi).
const WEIGHTS = [
  [100, -20, 10, 5, 5, 10, -20, 100],
  [-20, -50, -2, -2, -2, -2, -50, -20],
  [10, -2, 1, 1, 1, 1, -2, 10],
  [5, -2, 1, 0, 0, 1, -2, 5],
  [5, -2, 1, 0, 0, 1, -2, 5],
  [10, -2, 1, 1, 1, 1, -2, 10],
  [-20, -50, -2, -2, -2, -2, -50, -20],
  [100, -20, 10, 5, 5, 10, -20, 100],
];

const CORNERS: [number, number][] = [
  [0, 0],
  [0, 7],
  [7, 0],
  [7, 7],
];

/** How good the position is for `color`. */
export const evaluate = (board: ReversiBoard, color: Color): number => {
  let score = 0;

  Object.entries(board.board).forEach(([coord, { item }]) => {
    if (!item) return;
    const [r, c] = coord.split('|').map(Number);
    let weight = WEIGHTS[r][c];

    // Next to a corner that is already taken, the square is no longer a risk.
    if (weight < 0) {
      const corner = CORNERS.find(([cr, cc]) => Math.abs(cr - r) <= 1 && Math.abs(cc - c) <= 1);
      if (corner && board.getItem(`${corner[0]}|${corner[1]}`)) weight = 5;
    }

    score += item.color === color ? weight : -weight;
  });

  const mine = board.movesFor(color).length;
  const theirs = board.movesFor(other(color)).length;
  return score + 5 * (mine - theirs);
};

const clone = (board: ReversiBoard) => new ReversiBoard().load(board.toString().split('\n'));

const search = (board: ReversiBoard, color: Color, depth: number, alpha: number, beta: number): number => {
  const moves = board.movesFor(color);

  if (depth === 0) return evaluate(board, color);

  if (!moves.length) {
    // Pass, or the game is over: then only the disc count matters.
    if (!board.movesFor(other(color)).length) {
      return 10_000 * Math.sign(board.count(color) - board.count(other(color)));
    }
    return -search(board, other(color), depth - 1, -beta, -alpha);
  }

  for (const move of moves) {
    const next = clone(board);
    next.play(color, move);
    const score = -search(next, other(color), depth - 1, -beta, -alpha);
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }

  return alpha;
};

/** The move `color` plays, looking `depth` moves ahead, or null if it has none. */
export const pickMove = (board: ReversiBoard, color: Color, depth = 4): Move | null => {
  const moves = board.movesFor(color);
  let best: Move | null = null;
  let bestScore = -Infinity;

  for (const move of moves) {
    const next = clone(board);
    next.play(color, move);
    const score = -search(next, other(color), depth - 1, -Infinity, -bestScore);
    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  }

  return best;
};

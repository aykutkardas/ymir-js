// A small computer player for either side: alpha-beta search two moves deep
// (its move and the reply) with a hand-written evaluation. It is not strong,
// but it captures, protects the king, and goes for a corner when it can.
import { manhattan } from 'ymir-js';

import { CORNERS, type Move, type Side, type TaflBoard, type TaflGame } from './rules';

const WIN = 100_000;

/** How good the position is for the defenders (negative: good for the attackers). */
const evaluate = (board: TaflBoard): number => {
  const king = board.findKing();
  if (!king) return -WIN;
  if (CORNERS.includes(king)) return WIN;

  const attackers = board.countItems((piece) => piece.role === 'attacker');
  const defenders = board.countItems((piece) => piece.role === 'defender');
  const kingMoves = board.movesFrom(king);
  const openCorners = kingMoves.filter((square) => CORNERS.includes(square)).length;
  const pressure = board.getNeighbors(king).filter((n) => board.getItem(n)?.role === 'attacker').length;
  const toCorner = Math.min(...CORNERS.map((corner) => manhattan(king, corner)));

  return (
    defenders * 30 -
    attackers * 15 +
    openCorners * 400 +
    kingMoves.length * 4 -
    pressure * 30 -
    toCorner * 3
  );
};

/** The game's outcome right after `side` moved, if it ended. Cheap checks only. */
const decided = (board: TaflBoard, side: Side, move: Move): number | null => {
  const king = board.findKing();
  if (!king) return -WIN;
  if (CORNERS.includes(king)) return WIN;
  if (side === 'attackers' && board.getNeighbors(king).includes(move.to) && board.isKingCaptured()) {
    return -WIN;
  }
  return null;
};

// Captures first, so alpha-beta cuts more.
const ordered = (board: TaflBoard, moves: Move[]) => {
  const king = board.findKing();
  return moves
    .map((move) => ({ move, score: move.from === king ? 2 : board.getNeighbors(move.to).some((n) => board.getItem(n)) ? 1 : 0 }))
    .sort((a, b) => b.score - a.score)
    .map(({ move }) => move);
};

const search = (board: TaflBoard, side: Side, depth: number, alpha: number, beta: number): number => {
  const sign = side === 'defenders' ? 1 : -1;
  if (depth === 0) return sign * evaluate(board);

  const moves = board.movesFor(side);
  if (!moves.length) return -WIN; // no moves loses

  for (const move of ordered(board, moves)) {
    const undo = board.playAndUndo(move);
    const result = decided(board, side, move);
    const score =
      result !== null
        ? sign * result
        : -search(board, side === 'defenders' ? 'attackers' : 'defenders', depth - 1, -beta, -alpha);
    undo();

    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }

  return alpha;
};

/** The move the computer plays for the side to move, or null if it has none. */
export const pickMove = (game: TaflGame, depth = 2): Move | null => {
  const { board, turn } = game;
  const moves = game.getLegalMoves();
  if (!moves.length) return null;

  let best: Move[] = [];
  let bestScore = -Infinity;

  for (const move of ordered(board, moves)) {
    // A third repetition loses for the defenders, so they avoid it and the
    // attackers aim for it.
    if (game.timesSeenAfter(move) >= 2) {
      const score = turn === 'attackers' ? WIN : -WIN;
      if (score > bestScore) {
        bestScore = score;
        best = [move];
      } else if (score === bestScore) {
        best.push(move);
      }
      continue;
    }

    const undo = board.playAndUndo(move);
    const result = decided(board, turn, move);
    const sign = turn === 'defenders' ? 1 : -1;
    const score =
      result !== null
        ? sign * result
        : -search(board, turn === 'defenders' ? 'attackers' : 'defenders', depth - 1, -Infinity, -bestScore + 1);
    undo();

    if (score > bestScore) {
      bestScore = score;
      best = [move];
    } else if (score === bestScore) {
      best.push(move);
    }
  }

  return best[Math.floor(Math.random() * best.length)];
};

import parseCoord from '../../../utils/parseCoord.js';
import type {
  CheckersColorType,
  CheckersMove,
  CheckersPosition,
  PieceCode,
} from '../board.js';

// Standard international draughts numbering: dark squares 1-50, counted
// row by row from the top of a diagram with White at the bottom. ymir puts
// White at the top (rows 0-3), so coords are rotated 180 degrees first.

const SIZE = 10;

/** The standard square number (1-50) of a dark-square coord. */
export const toSquareNumber = (coord: string): number => {
  const [row, col] = parseCoord(coord);
  const r = SIZE - 1 - row;
  const c = SIZE - 1 - col;

  if ((r + c) % 2 === 0 || r < 0 || r >= SIZE || c < 0 || c >= SIZE) {
    throw new Error(`${coord} is not a dark square on a 10x10 board`);
  }

  return r * 5 + Math.floor(c / 2) + 1;
};

/** The coord of a standard square number (1-50). */
export const fromSquareNumber = (square: number): string => {
  if (!Number.isInteger(square) || square < 1 || square > 50) {
    throw new Error(`Square ${square} is not between 1 and 50`);
  }

  const r = Math.floor((square - 1) / 5);
  const c = ((square - 1) % 5) * 2 + (r % 2 === 0 ? 1 : 0);

  return `${SIZE - 1 - r}|${SIZE - 1 - c}`;
};

/**
 * A position as a PDN FEN string, e.g. `W:W31,32,K46:B1,2,3`.
 * `turn` is the side to move.
 */
export const toFEN = (
  position: CheckersPosition,
  turn: CheckersColorType
): string => {
  const side = (color: 'w' | 'b') =>
    Object.entries(position)
      .filter(([, code]) => code.toLowerCase() === color)
      .map(([coord, code]) => ({
        square: toSquareNumber(coord),
        king: code === code.toUpperCase(),
      }))
      .sort((a, b) => a.square - b.square)
      .map(({ square, king }) => `${king ? 'K' : ''}${square}`)
      .join(',');

  return `${turn === 'white' ? 'W' : 'B'}:W${side('w')}:B${side('b')}`;
};

/** Reads a PDN FEN string. Ranges like `B1-20` are accepted. */
export const fromFEN = (
  fen: string
): { position: CheckersPosition; turn: CheckersColorType } => {
  const [turnPart, ...sides] = fen.trim().replace(/\.$/, '').split(':');
  const turn = turnPart.toUpperCase();

  if (turn !== 'W' && turn !== 'B') {
    throw new Error(`FEN must start with W or B, got "${turnPart}"`);
  }

  const position: CheckersPosition = {};

  sides.forEach((side) => {
    const color = side[0]?.toUpperCase();

    if (color !== 'W' && color !== 'B') {
      throw new Error(`FEN side must start with W or B, got "${side}"`);
    }

    side
      .slice(1)
      .split(',')
      .filter(Boolean)
      .forEach((token) => {
        const king = /^K/i.test(token);
        const [from, to = from] = token.replace(/^K/i, '').split('-').map(Number);

        for (let square = from; square <= to; square += 1) {
          const letter = color === 'W' ? 'w' : 'b';
          position[fromSquareNumber(square)] = (
            king ? letter.toUpperCase() : letter
          ) as PieceCode;
        }
      });
  });

  return { position, turn: turn === 'W' ? 'white' : 'black' };
};

/** A move in PDN notation: `32-28` for a step, `28x19x10` for captures. */
export const toPDNMove = (move: CheckersMove): string =>
  [move.from, ...move.path]
    .map(toSquareNumber)
    .join(move.captured.length ? 'x' : '-');

/**
 * The square numbers of a PDN move (`32-28`, `28x19x10`). Match them
 * against `getLegalMoves` to find the move; a capture may be written with
 * only its start and end square.
 */
export const parsePDNMove = (notation: string): string[] =>
  notation
    .trim()
    .split(/[-x]/i)
    .map((square) => fromSquareNumber(Number(square)));

import { Board, Item, ItemType } from '@ymir-js/core';

export type ChessColor = 'white' | 'black';

/** Pawn, knight, bishop, rook, queen, king. */
export type ChessPieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export type ChessPieceItemType = ItemType & {
  type: ChessPieceType;
  color: ChessColor;
};

export class ChessPiece extends Item implements ChessPieceItemType {
  type: ChessPieceType;

  color: ChessColor;

  constructor({ type, color }: { type: ChessPieceType; color: ChessColor }) {
    super({ name: type });
    this.type = type;
    this.color = color;
  }
}

const FILES = 'abcdefgh';

/** `'e4'` for the coord `'4|4'`. Row 0 is rank 8, so white sits at the bottom. */
export const toSquare = (coord: string): string => {
  const [r, c] = coord.split('|').map(Number);

  if (!(r >= 0 && r < 8 && c >= 0 && c < 8)) {
    throw new Error(`${coord} is not on a chess board`);
  }

  return `${FILES[c]}${8 - r}`;
};

/** `'4|4'` for the square `'e4'`. */
export const fromSquare = (square: string): string => {
  const match = /^([a-h])([1-8])$/.exec(square);

  if (!match) throw new Error(`"${square}" is not a square`);

  return `${8 - Number(match[2])}|${FILES.indexOf(match[1])}`;
};

/**
 * The pieces of a chess game as a board, so they can be read with the same
 * methods as every other ymir board. `ChessGame` keeps it up to date; change
 * the position through the game, not here.
 */
class ChessBoard extends Board<ChessPiece> {
  constructor() {
    super({ rows: 8, cols: 8 });
  }

  /** The piece on a square in algebraic notation, e.g. `'e4'`. */
  getPiece(square: string): ChessPiece | null {
    return this.getItem(fromSquare(square));
  }
}

export default ChessBoard;

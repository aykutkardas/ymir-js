import { BoardConfig, Direction } from '@ymir-js/core';
import CheckersBoard, { CheckersColorType, CheckersMove } from '../board.js';
import Item from './item.js';
import { fromFEN, parsePDNMove, toFEN, toPDNMove } from './notation.js';

export type {
  AttackCoord,
  AttactCoord,
  CheckersBoardType,
  DefendCoord,
} from '../board.js';
export type { BoardConfig };

// Dark squares of the given rows on a 10x10 board.
const darkSquares = (...rowIds: number[]) =>
  rowIds.flatMap((rowId) =>
    Array.from({ length: 5 }, (_, i) => `${rowId}|${i * 2 + ((rowId + 1) % 2)}`)
  );

class InternationalCheckersBoard extends CheckersBoard {
  readonly variant = 'international' as const;

  protected readonly whiteItemCoords = darkSquares(0, 1, 2, 3);

  protected readonly blackItemCoords = darkSquares(6, 7, 8, 9);

  constructor(config: BoardConfig = { rows: 10, cols: 10 }) {
    super(config);
  }

  // Men move forward only, but capture both forward and backward.
  protected getCaptureDirections(): Direction[] {
    return ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];
  }

  /** The position as a PDN FEN string, e.g. `W:W31-50:B1-20`. */
  toFEN(turn: CheckersColorType): string {
    return toFEN(this.getPosition(), turn);
  }

  /** Sets up the position from a PDN FEN string and returns the side to move. */
  setFEN(fen: string): CheckersColorType {
    const { position, turn } = fromFEN(fen);
    this.setPosition(position);
    return turn;
  }

  /** A move in PDN notation, e.g. `32-28` or `28x19x10`. */
  toPDNMove(move: CheckersMove): string {
    return toPDNMove(move);
  }

  /**
   * The legal move written as `notation` (`32-28`, `28x19x10`, or a capture
   * by its start and end square, `28x10`), or null if there is none.
   */
  findPDNMove(notation: string, turn: CheckersColorType): CheckersMove | null {
    const [from, ...squares] = parsePDNMove(notation);
    const to = squares[squares.length - 1];

    return (
      this.getLegalMoves(turn, from).find(
        (move) =>
          move.path.join() === squares.join() ||
          (move.path[move.path.length - 1] === to &&
            squares.every((square) => move.path.includes(square)))
      ) ?? null
    );
  }

  protected createItem(item: { color: CheckersColorType; king?: boolean }) {
    return new Item(item);
  }
}

export default InternationalCheckersBoard;

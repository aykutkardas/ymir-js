import { BoardConfig, Direction } from '../../core/board.js';
import CheckersBoard, { CheckersColorType } from '../board.js';
import Item from './item.js';

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
  protected readonly whiteItemCoords = darkSquares(0, 1, 2, 3);

  protected readonly blackItemCoords = darkSquares(6, 7, 8, 9);

  constructor(config: BoardConfig = { rows: 10, cols: 10 }) {
    super(config);
  }

  // Men move forward only, but capture both forward and backward.
  protected getCaptureDirections(): Direction[] {
    return ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];
  }

  protected createItem(item: { color: CheckersColorType; king?: boolean }) {
    return new Item(item);
  }
}

export default InternationalCheckersBoard;

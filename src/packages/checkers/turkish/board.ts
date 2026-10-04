import { BoardConfig } from '../../core/board.js';
import CheckersBoard, { CheckersColorType } from '../board.js';
import Item from './item.js';

export type {
  AttackCoord,
  AttactCoord,
  CheckersBoardType,
  DefendCoord,
} from '../board.js';
export type { BoardConfig };

const rows = (...rowIds: number[]) =>
  rowIds.flatMap((rowId) =>
    Array.from({ length: 8 }, (_, colId) => `${rowId}|${colId}`)
  );

class TurkishCheckersBoard extends CheckersBoard {
  protected readonly whiteItemCoords = rows(1, 2);

  protected readonly blackItemCoords = rows(5, 6);

  constructor(config: BoardConfig = { rows: 8, cols: 8 }) {
    super(config);
  }

  // Turkish draughts takes captured pieces off the board one by one.
  protected removesCapturedImmediately() {
    return true;
  }

  protected createItem(item: { color: CheckersColorType; king?: boolean }) {
    return new Item(item);
  }
}

export default TurkishCheckersBoard;

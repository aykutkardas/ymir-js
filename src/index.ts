import Core from './packages/core/index.js';
import Checkers from './packages/checkers/index.js';
import Utils from './utils/index.js';

// Named exports: import only what you use.
export { default as Board } from './packages/core/board.js';
export { default as Item } from './packages/core/item.js';
export { default as CheckersBoard } from './packages/checkers/board.js';
export { default as TurkishBoard } from './packages/checkers/turkish/board.js';
export { default as TurkishItem } from './packages/checkers/turkish/item.js';
export { default as InternationalBoard } from './packages/checkers/international/board.js';
export { default as InternationalItem } from './packages/checkers/international/item.js';
export { default as parseCoord } from './utils/parseCoord.js';
export {
  CHECKERS_BLACK,
  CHECKERS_INTERNATIONAL,
  CHECKERS_TURKISH,
  CHECKERS_WHITE,
} from './packages/checkers/constant.js';

export type {
  BoardConfig,
  BoardMatrixItem,
  BoardSize,
  BoardType,
  ColumnsByDirection,
  ColumnType,
  Direction,
  DistanceType,
  ResolvedBoardConfig,
} from './packages/core/board.js';
export type { ItemOptions, ItemType, MovementType } from './packages/core/item.js';
export type {
  AttackCoord,
  AutoPlayCallbacks,
  CheckersBoardType,
  CheckersColorType,
  CheckersItemType,
  CheckersMove,
  DefendCoord,
} from './packages/checkers/board.js';

// Grouped exports from earlier versions; they keep working.
export { Core, Checkers, Utils };

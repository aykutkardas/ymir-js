// The core every ymir-js game is built on: a board of "row|col" squares
// holding items, with movement patterns, directions and pathfinding.
export { default as Board } from './board.js';
export { default as Item } from './item.js';
export { default as cloneItem } from './utils/cloneItem.js';
export { default as parseCoord } from './utils/parseCoord.js';
export {
  ANGULAR_DIRECTIONS,
  DIRECTION_STEPS,
  DIRECTIONS,
  LINEAR_DIRECTIONS,
  manhattan,
  stepCoord,
  toCoord,
} from './coords.js';

export type {
  BoardConfig,
  BoardMatrixItem,
  BoardSnapshot,
  BoardSize,
  BoardType,
  ColumnsByDirection,
  ColumnType,
  Direction,
  DistanceType,
  ItemPredicate,
  PathOptions,
  ResolvedBoardConfig,
  Square,
} from './board.js';
export type { ItemOptions, ItemType, MovementType } from './item.js';

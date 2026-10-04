// The core every ymir-js game is built on: a board of "row|col" squares
// holding items, with movement patterns, directions and pathfinding.
export { default as Board } from './board.js';
export { default as Item } from './item.js';
export { default as parseCoord } from './utils/parseCoord.js';

export type {
  BoardConfig,
  BoardMatrixItem,
  BoardSize,
  BoardType,
  ColumnsByDirection,
  ColumnType,
  Direction,
  DistanceType,
  PathOptions,
  ResolvedBoardConfig,
} from './board.js';
export type { ItemOptions, ItemType, MovementType } from './item.js';

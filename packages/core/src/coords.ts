import type { Direction } from './board.js';
import parseCoord from './utils/parseCoord.js';

/** The four straight directions, the ones `linear` movement uses. */
export const LINEAR_DIRECTIONS: readonly Direction[] = Object.freeze(['top', 'bottom', 'left', 'right']);

/** The four diagonal directions, the ones `angular` movement uses. */
export const ANGULAR_DIRECTIONS: readonly Direction[] = Object.freeze([
  'topLeft',
  'topRight',
  'bottomLeft',
  'bottomRight',
]);

/** All eight directions, in the order `getColumnsByDirection` lists them. */
export const DIRECTIONS: readonly Direction[] = Object.freeze([...LINEAR_DIRECTIONS, ...ANGULAR_DIRECTIONS]);

/** One step in each direction, as `[rows, cols]`. */
export const DIRECTION_STEPS: Readonly<Record<Direction, readonly [number, number]>> = Object.freeze({
  top: [-1, 0],
  bottom: [1, 0],
  left: [0, -1],
  right: [0, 1],
  topLeft: [-1, -1],
  topRight: [-1, 1],
  bottomLeft: [1, -1],
  bottomRight: [1, 1],
});

/** `row` and `col` as a `"row|col"` coord. */
export const toCoord = (row: number, col: number): string => `${row}|${col}`;

/** The coord `steps` squares from `coord` in `direction`, on the board or not. */
export const stepCoord = (coord: string, direction: Direction, steps = 1): string => {
  const [row, col] = parseCoord(coord);
  const [dr, dc] = DIRECTION_STEPS[direction];

  return toCoord(row + dr * steps, col + dc * steps);
};

/** Steps from one coord to another along rows and columns only. */
export const manhattan = (from: string, to: string): number => {
  const [fromRow, fromCol] = parseCoord(from);
  const [toRow, toCol] = parseCoord(to);

  return Math.abs(fromRow - toRow) + Math.abs(fromCol - toCol);
};

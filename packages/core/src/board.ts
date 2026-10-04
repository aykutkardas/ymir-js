import { stepCoord, toCoord } from './coords.js';
import getAvailableColumns from './utils/getAvailableColumns.js';
import parseCoord from './utils/parseCoord.js';
import Item, { ItemType, MovementType } from './item.js';

export type DistanceType = {
  /** Columns between the two coords; positive to the right. */
  x: number;
  /** Rows between the two coords; positive downward. */
  y: number;
};

export type BoardSize = {
  rows: number;
  cols: number;
};

/** @deprecated Use `{ rows, cols }`. `x` is the row count, `y` the column count. */
export type LegacyBoardSize = {
  x: number;
  y: number;
};

export type BoardConfig = BoardSize | LegacyBoardSize;

export type ResolvedBoardConfig = BoardSize & {
  /** @deprecated Use `rows`. */
  x: number;
  /** @deprecated Use `cols`. */
  y: number;
};

export type ColumnType<T extends ItemType = ItemType> = {
  item: T | null;
};

export type BoardType<T extends ItemType = ItemType> = {
  [key: string]: ColumnType<T>;
};

export type Direction =
  | 'bottomLeft'
  | 'bottomRight'
  | 'topLeft'
  | 'topRight'
  | 'right'
  | 'left'
  | 'top'
  | 'bottom';

export type ColumnsByDirection = Record<Direction, string[]>;

export type BoardMatrixItem<T extends ItemType = ItemType> = {
  coord: string;
  item: T | null;
};

const resolveConfig = (config: BoardConfig): ResolvedBoardConfig => {
  const rows = 'rows' in config ? config.rows : config.x;
  const cols = 'cols' in config ? config.cols : config.y;

  return { rows, cols, x: rows, y: cols };
};

/**
 * Binds every method on the prototype chain to the instance, so methods
 * keep working when passed around as callbacks (`coords.forEach(board.removeItem)`).
 */
const bindMethods = (instance: object) => {
  let proto = Object.getPrototypeOf(instance);

  while (proto && proto !== Object.prototype) {
    for (const key of Object.getOwnPropertyNames(proto)) {
      const descriptor = Object.getOwnPropertyDescriptor(proto, key);

      if (
        key !== 'constructor' &&
        typeof descriptor?.value === 'function' &&
        !Object.prototype.hasOwnProperty.call(instance, key)
      ) {
        Object.defineProperty(instance, key, {
          value: descriptor.value.bind(instance),
          writable: true,
          configurable: true,
        });
      }
    }

    proto = Object.getPrototypeOf(proto);
  }
};

class Board<T extends ItemType = ItemType> {
  config: ResolvedBoardConfig;

  board: BoardType<T>;

  constructor(config: BoardConfig) {
    bindMethods(this);

    this.config = resolveConfig(config);
    this.board = Board.createBoard<T>(this.config);
  }

  static createBoard<T extends ItemType = ItemType>(
    config: BoardConfig
  ): BoardType<T> {
    const { rows, cols } = resolveConfig(config);
    const board: BoardType<T> = {};

    for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
      for (let colIndex = 0; colIndex < cols; colIndex += 1) {
        board[`${rowIndex}|${colIndex}`] = { item: null };
      }
    }

    return board;
  }

  updateBoard(board: BoardType<T>): this {
    this.board = board;
    return this;
  }

  updateBoardWithMatrix(matrix: (T | null)[][]): this {
    const newBoard: BoardType<T> = {};

    matrix.forEach((row, rowIndex) => {
      row.forEach((item, colIndex) => {
        newBoard[`${rowIndex}|${colIndex}`] = {
          item: item ? (new Item(item) as unknown as T) : null,
        };
      });
    });

    return this.updateBoard(newBoard);
  }

  getBoardMatrix(): BoardMatrixItem<T>[][] {
    const matrix: BoardMatrixItem<T>[][] = [];

    Object.entries(this.board).forEach(([coord, data]) => {
      const [rowId, colId] = parseCoord(coord);
      (matrix[rowId] ??= [])[colId] = { coord, ...data };
    });

    return matrix;
  }

  /**
   * Sets up the board from text rows, one character per square: `toItem`
   * turns each character into an item, or null for an empty square.
   * Squares the rows don't reach are emptied.
   */
  loadRows(rows: string[], toItem: (char: string, coord: string) => T | null | undefined): this {
    Object.keys(this.board).forEach(this.removeItem);

    rows.forEach((row, rowId) =>
      [...row].forEach((char, colId) => {
        const coord = toCoord(rowId, colId);
        if (this.isExistCoord(coord)) this.setItem(coord, toItem(char, coord) ?? null);
      })
    );

    return this;
  }

  /** The board as text rows, one character per square from `toChar`. */
  toRows(toChar: (item: T | null, coord: string) => string): string[] {
    return this.getBoardMatrix().map((row) => row.map(({ coord, item }) => toChar(item, coord)).join(''));
  }

  /** Every square with its row, col and item, row by row. */
  squares(): Square<T>[] {
    return Object.entries(this.board).map(([coord, { item }]) => {
      const [row, col] = parseCoord(coord);
      return { coord, row, col, item };
    });
  }

  /** The coord of the first item that passes `predicate`, or null. */
  findCoord(predicate: ItemPredicate<T>): string | null {
    for (const [coord, { item }] of Object.entries(this.board)) {
      if (item && predicate(item, coord)) return coord;
    }

    return null;
  }

  /** The coords of every item that passes `predicate`; of every item without one. */
  findCoords(predicate?: ItemPredicate<T>): string[] {
    const coords: string[] = [];

    for (const [coord, { item }] of Object.entries(this.board)) {
      if (item && (!predicate || predicate(item, coord))) coords.push(coord);
    }

    return coords;
  }

  /** How many items pass `predicate`; how many items there are without one. */
  countItems(predicate?: ItemPredicate<T>): number {
    let count = 0;

    for (const [coord, { item }] of Object.entries(this.board)) {
      if (item && (!predicate || predicate(item, coord))) count += 1;
    }

    return count;
  }

  getItem(coord: string): T | null {
    return this.board[coord]?.item ?? null;
  }

  setItem(coord: string, item: T | null): void {
    if (!this.isExistCoord(coord)) return;

    this.board[coord].item = item;
  }

  removeItem(coord: string): void {
    this.setItem(coord, null);
  }

  moveItem(fromCoord: string, toCoord: string): void {
    if (!this.isExistCoord(fromCoord) || !this.isExistCoord(toCoord)) return;

    const { item } = this.board[fromCoord];
    this.board[fromCoord].item = null;
    this.board[toCoord].item = item;
  }

  switchItem(fromCoord: string, toCoord: string): void {
    if (!this.isExistCoord(fromCoord) || !this.isExistCoord(toCoord)) return;

    const { item: fromItem } = this.board[fromCoord];
    const { item: toItem } = this.board[toCoord];

    this.board[fromCoord].item = toItem;
    this.board[toCoord].item = fromItem;
  }

  /** @deprecated Selection is UI state; keep it in your app. Removed in 1.0. */
  selectItem(coord: string): void {
    const item = this.getItem(coord);

    if (item) item.selected = true;
  }

  /** @deprecated Selection is UI state; keep it in your app. Removed in 1.0. */
  deselectItem(coord: string): void {
    const item = this.getItem(coord);

    if (item) item.selected = false;
  }

  /** @deprecated Selection is UI state; keep it in your app. Removed in 1.0. */
  deselectAllItems(): void {
    Object.values(this.board).forEach(({ item }) => {
      if (item) item.selected = false;
    });
  }

  /** Whether the square is on the board and has no item on it. */
  isEmpty(coord: string): boolean {
    return this.isExistCoord(coord) && !this.board[coord].item;
  }

  isExistCoord(coord: string): boolean {
    return !!this.board[coord];
  }

  /** Whether the square is on the board's outer ring. */
  isEdge(coord: string): boolean {
    if (!this.isExistCoord(coord)) return false;

    const [row, col] = parseCoord(coord);
    const { rows, cols } = this.config;

    return row === 0 || col === 0 || row === rows - 1 || col === cols - 1;
  }

  /** Distance from one coord to another, or null if either is off the board. */
  getDistanceBetweenTwoCoords(
    fromCoord: string,
    toCoord: string
  ): DistanceType | null {
    if (!this.isExistCoord(fromCoord) || !this.isExistCoord(toCoord)) {
      return null;
    }

    const [fromRowId, fromColId] = parseCoord(fromCoord);
    const [toRowId, toColId] = parseCoord(toCoord);

    return { y: toRowId - fromRowId, x: toColId - fromColId };
  }

  /**
   * Direction from one coord to another, or null when either coord is off
   * the board or both are the same square.
   */
  getDirection(fromCoord: string, toCoord: string): Direction | null {
    if (!this.isExistCoord(fromCoord) || !this.isExistCoord(toCoord)) {
      return null;
    }

    const [fromRowId, fromColId] = parseCoord(fromCoord);
    const [toRowId, toColId] = parseCoord(toCoord);

    if (fromColId > toColId && fromRowId < toRowId) return 'bottomLeft';
    if (fromColId < toColId && fromRowId < toRowId) return 'bottomRight';
    if (fromColId > toColId && fromRowId > toRowId) return 'topLeft';
    if (fromColId < toColId && fromRowId > toRowId) return 'topRight';
    if (fromColId < toColId && fromRowId === toRowId) return 'right';
    if (fromColId > toColId && fromRowId === toRowId) return 'left';
    if (fromColId === toColId && fromRowId > toRowId) return 'top';
    if (fromColId === toColId && fromRowId < toRowId) return 'bottom';

    return null;
  }

  /**
   * Squares reachable with `movement`, grouped by direction. Squares off
   * the board are included, as the movement describes them.
   */
  getColumnsByDirection(
    coord: string,
    movement: MovementType
  ): ColumnsByDirection {
    return getAvailableColumns(coord, movement) as ColumnsByDirection;
  }

  /** Squares on the board reachable with `movement`. */
  getAvailableColumns(coord: string, movement: MovementType): string[];
  /** @deprecated Use `getColumnsByDirection(coord, movement)`. */
  getAvailableColumns(
    coord: string,
    movement: MovementType,
    columnsObj: true
  ): ColumnsByDirection;
  getAvailableColumns(
    coord: string,
    movement: MovementType,
    columnsObj?: boolean
  ): string[] | ColumnsByDirection {
    const columns = this.getColumnsByDirection(coord, movement);

    if (columnsObj) return columns;

    const available: string[] = [];

    for (const direction of Object.values(columns)) {
      for (const column of direction) {
        if (this.isExistCoord(column)) available.push(column);
      }
    }

    return available;
  }

  /**
   * The squares from `coord` (not included) in `direction`, nearest first:
   * at most `steps` of them, and none past the edge of the board.
   */
  ray(coord: string, direction: Direction, steps = Infinity): string[] {
    const squares: string[] = [];

    for (
      let square = stepCoord(coord, direction);
      squares.length < steps && this.isExistCoord(square);
      square = stepCoord(square, direction)
    ) {
      squares.push(square);
    }

    return squares;
  }

  /** The squares next to `coord` on the board: four, or eight with `diagonal`. */
  getNeighbors(coord: string, { diagonal = false }: { diagonal?: boolean } = {}): string[] {
    const [r, c] = parseCoord(coord);
    const steps = diagonal ? NEIGHBORS_8 : NEIGHBORS_4;
    const neighbors: string[] = [];

    for (const [dr, dc] of steps) {
      const next = `${r + dr}|${c + dc}`;
      if (this.isExistCoord(next)) neighbors.push(next);
    }

    return neighbors;
  }

  /**
   * Every square reachable from `from` in at most `steps` steps, with the
   * number of steps it takes (the start is included, at 0). By default a
   * step may go to any empty square; pass `canEnter` to decide yourself,
   * e.g. to walk through allies or around water. With several starts,
   * each square gets the steps from the nearest one.
   */
  getReachable(from: string | string[], options: PathOptions = {}): Map<string, number> {
    const { steps = Infinity, diagonal = false } = options;
    const canEnter = options.canEnter ?? ((coord: string) => this.isEmpty(coord));
    const reached = new Map((typeof from === 'string' ? [from] : from).map((start) => [start, 0]));
    const queue = [...reached.keys()];

    for (let i = 0; i < queue.length; i += 1) {
      const coord = queue[i];
      const distance = reached.get(coord)!;

      if (distance >= steps) continue;

      for (const next of this.getNeighbors(coord, { diagonal })) {
        if (reached.has(next) || !canEnter(next, coord)) continue;
        reached.set(next, distance + 1);
        queue.push(next);
      }
    }

    return reached;
  }

  /**
   * The shortest way from `from` to `to`, as the squares stepped on (not
   * including `from`), or null if there is none. Same options as
   * `getReachable`; `to` itself must pass `canEnter`.
   */
  findPath(from: string, to: string, options: PathOptions = {}): string[] | null {
    const { steps = Infinity, diagonal = false } = options;
    const canEnter = options.canEnter ?? ((coord: string) => this.isEmpty(coord));
    const cameFrom = new Map<string, string | null>([[from, null]]);
    const queue: [string, number][] = [[from, 0]];

    for (let i = 0; i < queue.length; i += 1) {
      const [coord, distance] = queue[i];

      if (coord === to) {
        const path: string[] = [];
        for (let at: string | null = to; at && at !== from; at = cameFrom.get(at)!) path.push(at);
        return path.reverse();
      }
      if (distance >= steps) continue;

      for (const next of this.getNeighbors(coord, { diagonal })) {
        if (cameFrom.has(next) || !canEnter(next, coord)) continue;
        cameFrom.set(next, coord);
        queue.push([next, distance + 1]);
      }
    }

    return null;
  }
}

const NEIGHBORS_4: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const NEIGHBORS_8: [number, number][] = [...NEIGHBORS_4, [-1, -1], [-1, 1], [1, -1], [1, 1]];

export type Square<T extends ItemType = ItemType> = {
  coord: string;
  row: number;
  col: number;
  item: T | null;
};

/** Called with each item on the board (empty squares are skipped) and its coord. */
export type ItemPredicate<T extends ItemType = ItemType> = (item: T, coord: string) => boolean;

export type PathOptions = {
  /** The most steps to take. Unlimited by default. */
  steps?: number;
  /** Whether a step may go onto `coord` (coming from `from`). Default: the square is empty. */
  canEnter?: (coord: string, from: string) => boolean;
  /** Also step diagonally. */
  diagonal?: boolean;
};

export default Board;

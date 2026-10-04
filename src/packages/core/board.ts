import getAvailableColumns from '../../utils/getAvailableColumns.js';
import parseCoord from '../../utils/parseCoord.js';
import Item, { ItemType, MovementType } from './item.js';

export type DistanceType = {
  x: number;
  y: number;
};

export type BoardConfig = {
  x: number;
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

export type BoardMatrixItem<T extends ItemType = ItemType> = {
  coord: string;
  item: T | null;
};

class Board<T extends ItemType = ItemType> {
  config: BoardConfig;

  board: BoardType<T> = {};

  constructor(config: BoardConfig) {
    const board = Board.createBoard<T>(config);

    this.config = config;
    this.board = board;

    return this;
  }

  static createBoard = <T extends ItemType = ItemType>(
    config: BoardConfig
  ): BoardType<T> => {
    const { x, y } = config;
    const board: BoardType<T> = {};

    for (let rowIndex = 0; rowIndex < x; rowIndex += 1) {
      for (let colIndex = 0; colIndex < y; colIndex += 1) {
        board[`${rowIndex}|${colIndex}`] = { item: null };
      }
    }

    return board;
  };

  updateBoard = (board: BoardType<T>) => {
    this.board = board;
    return this;
  };

  updateBoardWithMatrix = (matrix: (T | null)[][]) => {
    const newBoard: BoardType<T> = {};

    matrix.forEach((row, rowIndex) => {
      row.forEach((item, colIndex) => {
        newBoard[`${rowIndex}|${colIndex}`] = {
          item: item ? (new Item(item) as unknown as T) : null,
        };
      });
    });

    return this.updateBoard(newBoard);
  };

  getBoardMatrix = (): BoardMatrixItem<T>[][] => {
    const matrix: BoardMatrixItem<T>[][] = [];

    Object.entries(this.board).forEach(([coord, data]) => {
      const [rowId, colId] = parseCoord(coord);
      const item = { coord, ...data };

      if (matrix[rowId]) {
        matrix[rowId][colId] = item;
      } else {
        matrix[rowId] = [item];
      }
    });

    return matrix;
  };

  getItem = (coord: string): T | null => {
    const isExistCoord = this.isExistCoord(coord);

    if (!isExistCoord) return null;

    return this.board[coord].item;
  };

  setItem = (coord: string, item: T | null): void => {
    const isExistCoord = this.isExistCoord(coord);

    if (!isExistCoord) return;

    this.board[coord].item = item;
  };

  removeItem = (coord: string): void => {
    const isExistCoord = this.isExistCoord(coord);

    if (!isExistCoord) return;

    this.board[coord].item = null;
  };

  moveItem = (fromCoord: string, toCoord: string): void => {
    const isExistFromCoord = this.isExistCoord(fromCoord);
    const isExistToCoord = this.isExistCoord(toCoord);

    if (!isExistFromCoord || !isExistToCoord) return;

    const { item } = this.board[fromCoord];
    this.board[fromCoord].item = null;
    this.board[toCoord].item = item;
  };

  switchItem = (fromCoord: string, toCoord: string): void => {
    const isExistFromCoord = this.isExistCoord(fromCoord);
    const isExistToCoord = this.isExistCoord(toCoord);

    if (!isExistFromCoord || !isExistToCoord) return;

    const { item: fromItem } = this.board[fromCoord];
    const { item: toItem } = this.board[toCoord];

    this.board[fromCoord].item = toItem;
    this.board[toCoord].item = fromItem;
  };

  selectItem = (coord: string): void => {
    const isExistCoord = this.isExistCoord(coord);

    if (!isExistCoord) return;

    const { item } = this.board[coord];

    if (item) {
      item.selected = true;
    }
  };

  deselectItem = (coord: string): void => {
    const isExistCoord = this.isExistCoord(coord);

    if (!isExistCoord) return;

    const { item } = this.board[coord];

    if (item) {
      item.selected = false;
    }
  };

  deselectAllItems = (): void => {
    Object.keys(this.board).forEach((coord) => {
      const { item } = this.board[coord];
      if (item) {
        item.selected = false;
      }
    });
  };

  // Returns undefined for a coord that is not on the board.
  isEmpty = (coord: string): boolean | undefined => {
    const isExistCoord = this.isExistCoord(coord);

    if (!isExistCoord) return;

    return !this.board[coord].item;
  };

  isExistCoord = (coord: string): boolean => !!this.board[coord];

  getDistanceBetweenTwoCoords = (
    fromCoord: string,
    toCoord: string
  ): DistanceType | undefined => {
    const isExistFromCoord = this.isExistCoord(fromCoord);
    const isExistToCoord = this.isExistCoord(toCoord);

    if (!isExistFromCoord || !isExistToCoord) return;

    const [fromRowId, fromColId] = parseCoord(fromCoord);
    const [toRowId, toColId] = parseCoord(toCoord);

    return { y: toRowId - fromRowId, x: toColId - fromColId };
  };

  getDirection = (
    fromCoord: string,
    toCoord: string
  ): Direction | null | undefined => {
    const isExistFromCoord = this.isExistCoord(fromCoord);
    const isExistToCoord = this.isExistCoord(toCoord);

    if (!isExistFromCoord || !isExistToCoord) return;

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
  };

  getAvailableColumns = (
    coord: string,
    movement: MovementType,
    columnsObj?: boolean
  ): string[] | { [key: string]: string[] } => {
    const columns = getAvailableColumns(coord, movement);

    if (columnsObj) return columns;

    return Object.values(columns).flat().filter(this.isExistCoord);
  };
}

export default Board;

import useCoord from "./utils/useCoord";
import { ItemType } from "./item";

export type BoardConfig = {
  x: number;
  y: number;
};

export type ColumnType = {
  item: ItemType;
};

export type BoardType = {
  [key: string]: ColumnType;
};

class Board {
  config: BoardConfig;

  board: BoardType = {};

  constructor(config: BoardConfig) {
    const board = Board.createBoard(config);

    this.config = config;
    this.board = board;

    return this;
  }

  static createBoard = (config: BoardConfig): BoardType => {
    const { x, y } = config;
    const board: BoardType = {};

    for (let rowIndex = 0; rowIndex < x; rowIndex += 1) {
      for (let colIndex = 0; colIndex < y; colIndex += 1) {
        board[`${rowIndex}|${colIndex}`] = { item: null };
      }
    }

    return board;
  };

  getBoardMatrix = () => {
    const matrix = [];
    Object.entries(this.board).forEach(([id, data]) => {
      const [rowId, colId] = useCoord(id);
      if (matrix[rowId]) {
        matrix[rowId][colId] = { id, item: data.item };
      } else {
        matrix[rowId] = [{ id, item: data.item }];
      }
    });

    return matrix;
  };

  setItemToCoord = (id: string, item: ItemType) => {
    const isExistCoord = this.isExistCoord(id);

    if (!isExistCoord) return;

    this.board[id].item = item;
  };

  isExistCoord = (id: string): boolean => {
    return !!this.board[id];
  };
}

export default Board;

import useCoord from "./utils/useCoord";
import { ItemType } from "./item";

export type BoardConfig = {
  x: number;
  y: number;
};

export type ColumnType = {
  id: string;
  item: object;
};

export type RowType = ColumnType[];

export type BoardType = RowType[];

class Board {
  config: BoardConfig;

  board: BoardType = [];

  constructor(config: BoardConfig) {
    const board = Board.createBoard(config);

    this.config = config;
    this.board = board;

    return this;
  }

  static createBoard = (config: BoardConfig): BoardType => {
    const { x, y } = config;
    const board: BoardType = [];

    for (let rowIndex = 0; rowIndex < x; rowIndex += 1) {
      const row = [];
      for (let colIndex = 0; colIndex < y; colIndex += 1) {
        row.push({ id: `${rowIndex}|${colIndex}`, item: null });
      }
      board.push(row);
    }

    return board;
  };

  setItemToCoord = (id: string, item: ItemType) => {
    const isExistCoord = this.isExistCoord(id);

    if (!isExistCoord) return;

    const [rowId, colId] = useCoord(id);
    this.board[rowId][colId].item = item;
  };

  isExistCoord = (id: string): boolean => {
    const { x, y } = this.config;
    const [rowId, colId] = useCoord(id);

    return rowId >= 0 && rowId < x && colId >= 0 && colId < y;
  };
}

export default Board;

import useCoord from "./utils/useCoord";

export type BoardConfig = {
  x: number;
  y: number;
};

export type ColumnType = {
  id: string;
  value: object;
};

export type RowType = ColumnType[];

export type BoardType = RowType[];

class Board {
  config: BoardConfig;

  board: BoardType = [];

  init(config: BoardConfig): Board {
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
        row.push({ id: `${rowIndex}|${colIndex}`, value: null });
      }
      board.push(row);
    }

    return board;
  };

  isExistCoord = (id: string): boolean => {
    const { x, y } = this.config;
    const [rowId, colId] = useCoord(id);

    return rowId >= 0 && rowId < x && colId >= 0 && colId < y;
  };
}

export default Board;

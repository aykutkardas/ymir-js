export type BoardConfig = {
  x: number;
  y: number;
};

export type ColumnType = {
  id: string;
  value: object;
};

export type RowType = {
  [index: number]: ColumnType;
};

class Board {
  config: BoardConfig;

  board: RowType[] = [];

  constructor(config: BoardConfig) {
    this.config = { ...config };
  }

  create(): RowType[] {
    const { x, y } = this.config;

    for (let rowIndex = 0; rowIndex < x; rowIndex += 1) {
      const row = [];
      for (let columnIndex = 0; columnIndex < y; columnIndex += 1) {
        row.push({ id: `${rowIndex}_${columnIndex}`, value: null });
      }
      this.board.push(row);
    }

    return this.board;
  }
}

export default Board;

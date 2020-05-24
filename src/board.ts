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

export type PositionsType = {
  ET: string[];
  EL: string[];
  EB: string[];
  ER: string[];
  C: string[];
  CTL: string[];
  CTR: string[];
  CBR: string[];
  CBL: string[];
};

class Board {
  config: BoardConfig;

  board: BoardType = [];

  positions: PositionsType = {
    ET: [],
    EL: [],
    EB: [],
    ER: [],
    C: [],
    CTL: [],
    CTR: [],
    CBR: [],
    CBL: [],
  };

  init(config: BoardConfig): Board {
    const board = Board.createBoard(config);
    const positions = Board.createPosition(board);

    this.config = config;
    this.board = board;
    this.positions = positions;

    return this;
  }

  static createBoard = (config: BoardConfig): BoardType => {
    const { x, y } = config;
    const board: BoardType = [];

    for (let rowIndex = 0; rowIndex < x; rowIndex += 1) {
      const row = [];
      for (let columnIndex = 0; columnIndex < y; columnIndex += 1) {
        row.push({ id: `${rowIndex}|${columnIndex}`, value: null });
      }
      board.push(row);
    }

    return board;
  };

  static createPosition = (board: BoardType): PositionsType => {
    const positions: PositionsType = {
      ET: [],
      EL: [],
      EB: [],
      ER: [],
      C: [],
      CTL: [],
      CTR: [],
      CBR: [],
      CBL: [],
    };

    // [TODO]: Find a way to write shorter.
    board.forEach((row, rowId) => {
      row.forEach((column, columnId) => {
        const isFirstRow = rowId === 0;
        const isFirstColumn = columnId === 0;
        const isLastRow = rowId === board.length - 1;
        const isLastColumn = columnId === row.length - 1;

        if (isFirstRow) {
          if (isFirstColumn) {
            positions.CTL.push(column.id);
          } else if (isLastColumn) {
            positions.CTR.push(column.id);
          } else if (isFirstRow) {
            positions.ET.push(column.id);
          }
        } else if (!isFirstRow && !isLastRow) {
          if (isFirstColumn) {
            positions.EL.push(column.id);
          } else if (isLastColumn) {
            positions.ER.push(column.id);
          } else {
            positions.C.push(column.id);
          }
        } else if (isLastRow) {
          if (isFirstColumn) {
            positions.CBL.push(column.id);
          } else if (isLastColumn) {
            positions.CBR.push(column.id);
          } else {
            positions.EB.push(column.id);
          }
        }
      });
    });

    return positions;
  };
}

export default Board;

import useCoord from './utils/useCoord';

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
      for (let colIndex = 0; colIndex < y; colIndex += 1) {
        row.push({ id: `${rowIndex}|${colIndex}`, value: null });
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
      row.forEach((col, colId) => {
        const isFirstRow = rowId === 0;
        const isFirstCol = colId === 0;
        const isLastRow = rowId === board.length - 1;
        const isLastCol = colId === row.length - 1;

        if (isFirstRow) {
          if (isFirstCol) {
            positions.CTL.push(col.id);
          } else if (isLastCol) {
            positions.CTR.push(col.id);
          } else if (isFirstRow) {
            positions.ET.push(col.id);
          }
        } else if (!isFirstRow && !isLastRow) {
          if (isFirstCol) {
            positions.EL.push(col.id);
          } else if (isLastCol) {
            positions.ER.push(col.id);
          } else {
            positions.C.push(col.id);
          }
        } else if (isLastRow) {
          if (isFirstCol) {
            positions.CBL.push(col.id);
          } else if (isLastCol) {
            positions.CBR.push(col.id);
          } else {
            positions.EB.push(col.id);
          }
        }
      });
    });

    return positions;
  };


  isExistCoord = (id: string): boolean => {
    const { x, y } = this.config;
    const [rowId, colId] = useCoord(id);

    return (rowId >= 0 && rowId < y && colId >= 0 && colId < x);
  };
}

export default Board;

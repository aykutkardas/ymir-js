import Board from "../board";
import { CheckersItemType } from "../items/checkers-item";
import useCoord from "../utils/useCoord";

class CheckersTurkishRules {
  board: Board = null;

  constructor(board: Board) {
    this.board = board;
    return this;
  }

  getAvaiblableColumns = (id: string, item: CheckersItemType): string[] => {
    const isExistCoord = this.board.isExistCoord(id);
    if (!id || !item || !isExistCoord) {
      return [];
    }

    const avaiblableColumns = [];
    const [rowId, colId] = useCoord(id);
    const { color, king } = item;
    const stepCount = king ? 7 : 1;

    if (color === "white") {
      let fullColumnCount = 0;
      for (let step = 1; step <= stepCount; step++) {
        const columnCoord = `${rowId + step}|${colId}`;
        const item = this.board.getItem(columnCoord);
        if (item) {
          fullColumnCount++;
        }

        if (fullColumnCount > 1) {
          fullColumnCount = 0;
          break;
        }

        if (item && item.color === "black") {
          const nextColumnCoord = `${rowId + (step + 1)}|${colId}`;
          const nextColumnIsEmpty = this.board.isEmpty(nextColumnCoord);

          if (nextColumnIsEmpty) {
            avaiblableColumns.push(nextColumnCoord);
          }
        } else {
          avaiblableColumns.push(columnCoord);
        }
      }
    } else if (color === "black") {
      let fullColumnCount = 0;

      for (let step = 1; step <= stepCount; step++) {
        const columnCoord = `${rowId - step}|${colId}`;
        const item = this.board.getItem(columnCoord);
        if (item) {
          fullColumnCount++;
        }

        if (fullColumnCount > 1) {
          fullColumnCount = 0;
          break;
        }
        if (item && item.color === "white") {
          const nextColumnCoord = `${rowId - (step + 1)}|${colId}`;
          const nextColumnIsEmpty = this.board.isEmpty(nextColumnCoord);

          if (nextColumnIsEmpty) {
            avaiblableColumns.push(nextColumnCoord);
          }
        } else {
          avaiblableColumns.push(columnCoord);
        }
      }
    }

    return avaiblableColumns.filter(
      (coord) => this.board.isExistCoord(coord) && this.board.isEmpty(coord)
    );
  };
}

export default CheckersTurkishRules;

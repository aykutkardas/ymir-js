import Board from "./board";
import useCoord from "../../utils/useCoord";

import { MovementType } from "./item";

class Rules {
  board: Board = null;

  constructor(board: Board) {
    this.board = board;
    return this;
  }

  getAvaiblableColumns = (id: string, movement: MovementType): string[] => {
    const [rowId, colId] = useCoord(id);

    const avaiblableColumns = [];
    const stepCount = movement?.stepCount || 1;

    for (let step = 1; step <= stepCount; step++) {
      if (movement?.top) {
        avaiblableColumns.push(`${rowId - step}|${colId}`);
      }
      if (movement?.bottom) {
        avaiblableColumns.push(`${rowId + step}|${colId}`);
      }
      if (movement?.left) {
        avaiblableColumns.push(`${rowId}|${colId - step}`);
      }
      if (movement?.right) {
        avaiblableColumns.push(`${rowId}|${colId + step}`);
      }
      if (movement?.linear) {
        avaiblableColumns.push(
          `${rowId - step}|${colId}`,
          `${rowId}|${colId - step}`,
          `${rowId}|${colId + step}`,
          `${rowId + step}|${colId}`
        );
      }
      if (movement?.angular) {
        avaiblableColumns.push(
          `${rowId - step}|${colId - step}`,
          `${rowId - step}|${colId + step}`,
          `${rowId + step}|${colId - step}`,
          `${rowId + step}|${colId + step}`
        );
      }
    }

    return avaiblableColumns.filter((coord) => this.board.isExistCoord(coord));
  };
}

export default Rules;

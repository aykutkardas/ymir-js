import Board from "../board";
import useCoord from "../utils/useCoord";

import { RulesType } from "../items/default-item";

class Rules {
  board: Board = null;

  constructor(board: Board) {
    this.board = board;
    return this;
  }

  getAvaiblableColumns = (id: string, rules: RulesType): string[] => {
    const [rowId, colId] = useCoord(id);

    const avaiblableColumns = [];
    const stepCount = rules?.movement?.stepCount || 1;
    const movementRules = rules?.movement;

    for (let step = 1; step <= stepCount; step++) {
      if (movementRules?.top) {
        avaiblableColumns.push(`${rowId - step}|${colId}`);
      }
      if (movementRules?.bottom) {
        avaiblableColumns.push(`${rowId + step}|${colId}`);
      }
      if (movementRules?.left) {
        avaiblableColumns.push(`${rowId}|${colId - step}`);
      }
      if (movementRules?.right) {
        avaiblableColumns.push(`${rowId}|${colId + step}`);
      }
      if (movementRules?.linear) {
        avaiblableColumns.push(
          `${rowId - step}|${colId}`,
          `${rowId}|${colId - step}`,
          `${rowId}|${colId + step}`,
          `${rowId + step}|${colId}`
        );
      }
      if (movementRules?.angular) {
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

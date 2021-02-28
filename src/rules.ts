import Board from "./board";
import useCoord from "./utils/useCoord";

import { RulesType } from "./item";

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

    for (let step = 1; step <= stepCount; step++) {
      if (rules?.movement?.linear) {
        avaiblableColumns.push(
          `${rowId - step}|${colId}`,
          `${rowId}|${colId - step}`,
          `${rowId}|${colId + step}`,
          `${rowId + step}|${colId}`
        );
      }
      if (rules?.movement?.angular) {
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

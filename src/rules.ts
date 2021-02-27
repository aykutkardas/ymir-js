import Board from "./board";
import useCoord from "./utils/useCoord";

import { RulesType } from "./item";

class Rules {
  board: Board = null;

  constructor(board: Board) {
    this.board = board;
    return this;
  }

  getAvaiblableColumn = (id: string, rules: RulesType): string[] => {
    const [rowId, colId] = useCoord(id);

    const avaiblableColumn = [];
    const stepCount = rules?.movement?.stepCount || 1;

    for (let step = 1; step <= stepCount; step++) {
      if (rules?.movement?.linear) {
        avaiblableColumn.push(
          `${rowId - step}|${colId}`,
          `${rowId}|${colId - step}`,
          `${rowId}|${colId + step}`,
          `${rowId + step}|${colId}`
        );
      }
      if (rules?.movement?.angular) {
        avaiblableColumn.push(
          `${rowId - step}|${colId - step}`,
          `${rowId - step}|${colId + step}`,
          `${rowId + step}|${colId - step}`,
          `${rowId + step}|${colId + step}`
        );
      }
    }

    return avaiblableColumn.filter((coord) => this.board.isExistCoord(coord));
  };
}

export default Rules;

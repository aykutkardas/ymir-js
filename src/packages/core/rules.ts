import Board from "./board";
import useCoord from "../../utils/useCoord";

import { MovementType } from "./item";

class Rules {
  board: Board = null;

  constructor(board: Board) {
    this.board = board;
    return this;
  }

  getAvailableColumns = (
    id: string,
    movement: MovementType,
    columnsObj?: boolean
  ): string[] | { [key: string]: string[] } => {
    const [rowId, colId] = useCoord(id);

    const avaiblableColumns = [];
    const columns = {
      tops: [],
      bottoms: [],
      lefts: [],
      rights: [],
      topLefts: [],
      topRights: [],
      bottomLefts: [],
      bottomRights: [],
    };

    const stepCount = movement?.stepCount || 1;

    for (let step = 1; step <= stepCount; step++) {
      if (movement?.top) {
        columns.tops.push(`${rowId - step}|${colId}`);
      }
      if (movement?.bottom) {
        columns.bottoms.push(`${rowId + step}|${colId}`);
      }
      if (movement?.left) {
        columns.lefts.push(`${rowId}|${colId - step}`);
      }
      if (movement?.right) {
        columns.rights.push(`${rowId}|${colId + step}`);
      }
      if (movement?.linear) {
        columns.tops.push(`${rowId - step}|${colId}`);
        columns.bottoms.push(`${rowId + step}|${colId}`);
        columns.lefts.push(`${rowId}|${colId - step}`);
        columns.rights.push(`${rowId}|${colId + step}`);
      }
      if (movement?.angular) {
        columns.topLefts.push(`${rowId - step}|${colId - step}`);
        columns.topRights.push(`${rowId - step}|${colId + step}`);
        columns.bottomLefts.push(`${rowId + step}|${colId - step}`);
        columns.bottomRights.push(`${rowId + step}|${colId + step}`);
      }
    }

    if (columnsObj) {
      return columns;
    }

    return avaiblableColumns
      .concat(
        columns.tops,
        columns.bottoms,
        columns.lefts,
        columns.rights,
        columns.topLefts,
        columns.topRights,
        columns.bottomLefts,
        columns.bottomRights
      )
      .filter((coord) => this.board.isExistCoord(coord));
  };
}

export default Rules;

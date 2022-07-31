import Board from './board';
import useCoord from '../../utils/useCoord';

import { MovementType } from './item';

class Rules {
  board: Board = null;

  constructor(board: Board) {
    this.board = board;
    return this;
  }

  getAvailableColumns = (
    coord: string,
    movement: MovementType,
    columnsObj?: boolean
  ): string[] | { [key: string]: string[] } => {
    const [rowId, colId] = useCoord(coord);

    const avaiblableColumns = [];
    const columns = {
      top: [],
      bottom: [],
      left: [],
      right: [],
      topLeft: [],
      topRight: [],
      bottomLeft: [],
      bottomRight: [],
    };

    const stepCount = movement?.stepCount || 1;

    for (let step = 1; step <= stepCount; step += 1) {
      if (movement?.top) {
        columns.top.push(`${rowId - step}|${colId}`);
      }
      if (movement?.bottom) {
        columns.bottom.push(`${rowId + step}|${colId}`);
      }
      if (movement?.left) {
        columns.left.push(`${rowId}|${colId - step}`);
      }
      if (movement?.right) {
        columns.right.push(`${rowId}|${colId + step}`);
      }
      if (movement?.topRight) {
        columns.topRight.push(`${rowId - step}|${colId + step}`);
      }
      if (movement?.topLeft) {
        columns.topLeft.push(`${rowId - step}|${colId - step}`);
      }
      if (movement?.bottomRight) {
        columns.bottomRight.push(`${rowId + step}|${colId + step}`);
      }
      if (movement?.bottomLeft) {
        columns.bottomLeft.push(`${rowId + step}|${colId - step}`);
      }
      if (movement?.linear) {
        columns.top.push(`${rowId - step}|${colId}`);
        columns.bottom.push(`${rowId + step}|${colId}`);
        columns.left.push(`${rowId}|${colId - step}`);
        columns.right.push(`${rowId}|${colId + step}`);
      }
      if (movement?.angular) {
        columns.topLeft.push(`${rowId - step}|${colId - step}`);
        columns.topRight.push(`${rowId - step}|${colId + step}`);
        columns.bottomLeft.push(`${rowId + step}|${colId - step}`);
        columns.bottomRight.push(`${rowId + step}|${colId + step}`);
      }
    }

    if (columnsObj) {
      return columns;
    }

    return avaiblableColumns
      .concat(...Object.values(columns))
      .filter(this.board.isExistCoord);
  };
}

export default Rules;

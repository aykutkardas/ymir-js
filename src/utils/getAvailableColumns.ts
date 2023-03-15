import { MovementType } from '../packages/core/item';
import parseCoord from './parseCoord';

const getAvailableColumns = (
  coord: string,
  movement: MovementType
): { [key: string]: string[] } => {
  const [rowId, colId] = parseCoord(coord);

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

  return columns;
};

export default getAvailableColumns;

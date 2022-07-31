import Board from '../core/board';
import Rules from '../core/rules';
import { MovementType } from '../core/item';

class CheckersTurkishRules extends Rules {
  rules: Rules;

  constructor(board: Board) {
    super(board);
    this.rules = new Rules(board);
  }

  // TODO: Write Test
  getItemsBetweenTwoCoords(fromCoord: string, toCoord: string): string[] {
    const direction = this.board.getDirection(fromCoord, toCoord);
    const distance = this.board.getDistanceBetweenTwoCoords(fromCoord, toCoord);
    const convertDirection = {
      top: 'y',
      bottom: 'y',
      left: 'x',
      right: 'x',
    };
    const stepCount = Math.abs(distance[convertDirection[direction]]) || 1;
    const movement = { stepCount };

    movement[direction] = true;

    const betweenCoords = this.rules.getAvailableColumns(fromCoord, movement);

    return (betweenCoords as string[]).filter(
      (coord) => !this.board.isEmpty(coord)
    );
  }

  // TODO: Write Test
  getAvailableColumns = (coord: string, movement: MovementType): string[] => {
    const columns = this.rules.getAvailableColumns(coord, movement, true);

    const item = this.board.getItem(coord);

    const availableColumns = {};
    const captureAvailableColumns = {};

    Object.keys(columns).forEach((key) => {
      availableColumns[key] = [];

      let isFoundCapture = false;
      for (let i = 0; i < columns[key].length; i += 1) {
        const currentCoord = columns[key][i];

        if (this.board.isEmpty(currentCoord)) {
          availableColumns[key].push(currentCoord);
          continue;
        } else if (isFoundCapture) {
          break;
        }

        const nextCoordItem = this.board.getItem(currentCoord);

        if (nextCoordItem?.color === item.color) {
          break;
        } else if (
          !isFoundCapture &&
          nextCoordItem &&
          nextCoordItem.color !== item.color
        ) {
          const direction = this.board.getDirection(coord, currentCoord);
          const movementRule = {
            stepCount: 1,
            [direction]: true,
          };
          const [toCoord] = this.rules.getAvailableColumns(
            currentCoord,
            movementRule
          ) as string[];

          if (this.board.isEmpty(toCoord)) {
            availableColumns[key] = [toCoord];
            captureAvailableColumns[key] = true;
            isFoundCapture = true;
          } else {
            break;
          }
        }
      }
    });

    const isFoundAnySuccessDirection = Object.values(
      captureAvailableColumns
    ).some((direction) => direction);

    const newAvailableColumns = [];

    if (isFoundAnySuccessDirection) {
      Object.keys(captureAvailableColumns).forEach((direction) => {
        if (captureAvailableColumns[direction]) {
          newAvailableColumns.push(...availableColumns[direction]);
        }
      });
    } else {
      Object.keys(availableColumns).forEach((key) => {
        newAvailableColumns.push(...availableColumns[key]);
      });
    }

    return newAvailableColumns.filter(this.board.isEmpty);
  };
}

export default CheckersTurkishRules;

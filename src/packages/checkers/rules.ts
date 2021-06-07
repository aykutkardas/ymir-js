import Board from "../core/board";
import Rules from "../core/rules";
import { MovementType } from "../core/item";

class CheckersTurkishRules extends Rules {
  rules: Rules;

  constructor(board: Board) {
    super(board);
    this.rules = new Rules(board);
  }

  // TODO: Write Test
  getItemsBetweenTwoCoords = (fromCoord: string, toCoord: string) => {
    const direction = this.board.getDirection(fromCoord, toCoord);
    const distance = this.board.getDistanceBetweenTwoCoords(fromCoord, toCoord);
    const convertDirection = { top: "y", bottom: "y", left: "x", right: "x" };
    const stepCount = Math.abs(distance[convertDirection[direction]]) || 1;
    const movement = { stepCount };

    movement[direction] = true;

    const betweenCoords = this.rules.getAvailableColumns(fromCoord, movement);

    return (<string[]>betweenCoords).filter(
      (coord) => !this.board.isEmpty(coord)
    );
  };

  // TODO: Write Test
  getAvailableColumns = (coord: string, movement: MovementType) => {
    const columns = this.rules.getAvailableColumns(coord, movement, true);

    const item = this.board.getItem(coord);

    const availableColumns = {};
    const captureAvailableColumns = {};

    Object.keys(columns).forEach((key) => {
      availableColumns[key] = [];

      let isFoundCapture = false;
      for (let i = 0; i < columns[key].length; i++) {
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
          const movement = {
            stepCount: 1,
            [direction]: true,
          };
          const [toCoord] = <string[]>(
            this.rules.getAvailableColumns(currentCoord, movement)
          );

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

    let newAvailableColumns = [];

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

    return newAvailableColumns.filter(
      (coord) => !!coord && this.board.isEmpty(coord)
    );
  };
}

export default CheckersTurkishRules;

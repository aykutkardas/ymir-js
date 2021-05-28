import Board from "../../core/board";
import Rules from "../../core/rules";
import { MovementType } from "../../core/item";

class CheckersTurkishRules extends Rules {
  rules: Rules;

  constructor(board: Board) {
    super(board);
    this.rules = new Rules(board);
  }

  // TODO: Write Test
  getItemsBetweenTwoCoords = (fromId: string, toId: string) => {
    const direction = this.board.getDirection(fromId, toId);
    const distance = this.board.getDistanceBetweenTwoCoords(fromId, toId);
    const convertDirection = { top: "y", bottom: "y", left: "x", right: "x" };
    const stepCount = Math.abs(distance[convertDirection[direction]]) || 1;
    const movement = { stepCount };

    movement[direction] = true;

    const betweenCoords = this.rules.getAvaiblableColumns(fromId, movement);

    return (<string[]>betweenCoords).filter(
      (coord) => !this.board.isEmpty(coord)
    );
  };

  // TODO: Write Test
  getAvailableColumns = (id: string, movement: MovementType) => {
    const columns = this.rules.getAvaiblableColumns(id, movement, true);

    const item = this.board.getItem(id);

    const avaiblableColumns = [];

    Object.keys(columns).forEach((key) => {
      for (let i = 0; i < columns[key].length; i++) {
        const currentId = columns[key][i];
        const nextCoordItem = this.board.getItem(currentId);

        if (this.board.isEmpty(currentId)) {
          avaiblableColumns.push(currentId);
        }

        if (nextCoordItem?.color === item.color) {
          break;
        } else if (nextCoordItem && nextCoordItem.color !== item.color) {
          const direction = this.board.getDirection(id, currentId);
          const movement = { stepCount: 1, [direction]: true };
          const [toCoord] = <string[]>(
            this.rules.getAvaiblableColumns(currentId, movement)
          );
          avaiblableColumns.push(toCoord);
        }
      }
    });
    return avaiblableColumns.filter(
      (coord) => !!coord && this.board.isEmpty(coord)
    );
  };
}

export default CheckersTurkishRules;

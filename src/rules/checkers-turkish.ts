import Board from "../board";
import Rules from "../rules/default-rules";
import { MovementType } from "../items/default-item";

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

    return betweenCoords.filter((coord) => !this.board.isEmpty(coord));
  };

  // TODO: Write Test
  getAvailableColumns = (id: string, movement: MovementType) => {
    const availableColumns = this.rules.getAvaiblableColumns(id, movement);
    const item = this.board.getItem(id);

    return availableColumns
      .map((coord) => {
        if (this.board.isEmpty(coord)) {
          return coord;
        } else {
          const nextItem = this.board.getItem(coord);

          if (nextItem.color === item.color) {
            return null;
          }

          const direction = this.board.getDirection(id, coord);
          const movement = { stepCount: 1 };

          movement[direction] = true;

          const [toCoord] = this.rules.getAvaiblableColumns(coord, movement);

          return toCoord;
        }
      })
      .filter((coord) => !!coord && this.board.isEmpty(coord));
  };
}

export default CheckersTurkishRules;

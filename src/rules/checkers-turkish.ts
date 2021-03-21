import Board from "../board";
import Rules from "../rules/default-rules";
import { MovementType } from "../items/default-item";

class CheckersTurkishRules extends Rules {
  rules: Rules;

  constructor(board: Board) {
    super(board);
    this.rules = new Rules(board);
  }

  getAvailableColumns = (id: string, movement: MovementType) => {
    const avaiblableColumns = this.rules.getAvaiblableColumns(id, movement);
    return avaiblableColumns
      .map((coord) => {
        if (this.board.isEmpty(coord)) {
          return coord;
        } else {
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

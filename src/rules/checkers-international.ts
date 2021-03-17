import Board from "../board";
import { CheckersItemType } from "../items/checkers-item";

class CheckersInternationalRules {
  board: Board = null;

  constructor(board: Board) {
    this.board = board;
    return this;
  }

  // TODO
  getAvaiblableColumns = (id: string, item: CheckersItemType): string[] => {
    return [];
  };
}

export default CheckersInternationalRules;

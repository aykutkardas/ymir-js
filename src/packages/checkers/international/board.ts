import Board from "../../core/board";
import Item from "./item";

export type BoardConfig = {
  x: number;
  y: number;
};

class InternationalCheckersBoard extends Board {
  constructor(config: BoardConfig = { x: 10, y: 10 }) {
    super(config);

    return this;
  }

  init() {
    const whiteItemCoords =
      "0|1 0|3 0|5 0|7 0|9 1|0 1|2 1|4 1|6 1|8 2|1 2|3 2|5 2|7 2|9 3|0 3|2 3|4 3|6 3|8";
    const blackItemCoords =
      "6|1 6|3 6|5 6|7 6|9 7|0 7|2 7|4 7|6 7|8 8|1 8|3 8|5 8|7 8|9 9|0 9|2 9|4 9|6 9|8";

    whiteItemCoords.split(" ").forEach((coord) => {
      this.setItem(coord, new Item({ color: "white" }));
    });

    blackItemCoords.split(" ").forEach((coord) => {
      this.setItem(coord, new Item({ color: "black" }));
    });
  }

  // TODO: Write test
  reset() {
    Object.keys(this.board).forEach((coord) => {
      this.board[coord].item = null;
    });

    this.init();
  }
}

export default InternationalCheckersBoard;

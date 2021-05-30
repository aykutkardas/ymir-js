import { expect } from "chai";
import "mocha";

import CheckersBoard from "./board";
import Item from "./item";

describe("Checkers Board Tests", () => {
  it("Default Checkers Board Config", () => {
    const board = new CheckersBoard();

    expect(board.config).to.deep.equal({
      x: 8,
      y: 8,
    });
  });
});

import { expect } from "chai";
import "mocha";

import Board from "../src/board";
import Rules from "../src/rules";

describe("Rules Tests", () => {
  it('getAvaiblableColumn for "0|0" on 3x3 Board', () => {
    const board = new Board({ x: 3, y: 3 });
    const availableColumn = new Rules(board).getAvaiblableColumn("0|0", {
      movement: {
        stepCount: 1,
        linear: true,
        angular: false,
      },
    });

    expect(availableColumn).to.deep.equal(["0|1", "1|0"]);
  });

  it('getAvaiblableColumn for "1|1" on 3x3 Board', () => {
    const board = new Board({ x: 3, y: 3 });
    const availableColumn = new Rules(board).getAvaiblableColumn("1|1", {
      movement: {
        stepCount: 1,
        linear: true,
        angular: false,
      },
    });

    expect(availableColumn).to.deep.equal(["0|1", "1|0", "1|2", "2|1"]);
  });
});

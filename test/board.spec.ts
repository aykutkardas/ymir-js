import { expect } from "chai";
import "mocha";

import Board from "../src/board";
import Item from "../src/item";

describe("Board Tests", () => {
  it("Square Board 3x3", () => {
    const board = new Board({ x: 3, y: 3 }).board;

    expect(board).to.deep.equal({
      "0|0": { item: null },
      "0|1": { item: null },
      "0|2": { item: null },
      "1|0": { item: null },
      "1|1": { item: null },
      "1|2": { item: null },
      "2|0": { item: null },
      "2|1": { item: null },
      "2|2": { item: null },
    });
  });

  it("Rectangle Board 3x5", () => {
    const board = new Board({ x: 3, y: 5 }).board;

    expect(board).to.deep.equal({
      "0|0": { item: null },
      "0|1": { item: null },
      "0|2": { item: null },
      "0|3": { item: null },
      "0|4": { item: null },
      "1|0": { item: null },
      "1|1": { item: null },
      "1|2": { item: null },
      "1|3": { item: null },
      "1|4": { item: null },
      "2|0": { item: null },
      "2|1": { item: null },
      "2|2": { item: null },
      "2|3": { item: null },
      "2|4": { item: null },
    });
  });

  it("Rectangle Board 5x3", () => {
    const board = new Board({ x: 5, y: 3 }).board;

    expect(board).to.deep.equal({
      "0|0": { item: null },
      "0|1": { item: null },
      "0|2": { item: null },
      "1|0": { item: null },
      "1|1": { item: null },
      "1|2": { item: null },
      "2|0": { item: null },
      "2|1": { item: null },
      "2|2": { item: null },
      "3|0": { item: null },
      "3|1": { item: null },
      "3|2": { item: null },
      "4|0": { item: null },
      "4|1": { item: null },
      "4|2": { item: null },
    });
  });

  it("setItem Method", () => {
    const board = new Board({ x: 3, y: 3 });
    const item = new Item({
      rules: {
        movement: {
          angular: true,
          linear: true,
          stepCount: 4,
        },
      },
    });

    board.setItem("0|1", item);

    expect(board.board).to.deep.equal({
      "0|0": { item: null },
      "0|1": { item: item },
      "0|2": { item: null },
      "1|0": { item: null },
      "1|1": { item: null },
      "1|2": { item: null },
      "2|0": { item: null },
      "2|1": { item: null },
      "2|2": { item: null },
    });
  });

  it("moveItem Method", () => {
    const board = new Board({ x: 3, y: 3 });
    const item = new Item({
      rules: {
        movement: {
          angular: true,
          linear: true,
          stepCount: 4,
        },
      },
    });

    board.setItem("0|1", item);
    board.moveItem("0|1", "1|1");

    expect(board.board).to.deep.equal({
      "0|0": { item: null },
      "0|1": { item: null },
      "0|2": { item: null },
      "1|0": { item: null },
      "1|1": { item: item },
      "1|2": { item: null },
      "2|0": { item: null },
      "2|1": { item: null },
      "2|2": { item: null },
    });
  });

  it("switchItem Method", () => {
    const board = new Board({ x: 3, y: 3 });
    const firstItem = new Item({
      data: {
        color: "black",
      },
      rules: {
        movement: {
          angular: true,
          linear: true,
          stepCount: 4,
        },
      },
    });

    const secondItem = new Item({
      data: {
        color: "white",
      },
      rules: {
        movement: {
          angular: true,
          linear: true,
          stepCount: 4,
        },
      },
    });

    board.setItem("0|1", firstItem);
    board.setItem("1|1", secondItem);
    board.switchItem("0|1", "1|1");

    expect(board.board).to.deep.equal({
      "0|0": { item: null },
      "0|1": { item: secondItem },
      "0|2": { item: null },
      "1|0": { item: null },
      "1|1": { item: firstItem },
      "1|2": { item: null },
      "2|0": { item: null },
      "2|1": { item: null },
      "2|2": { item: null },
    });
  });

  it("getDistanceBetweenTwoCoords Method", () => {
    const board = new Board({ x: 3, y: 3 });
    const distance = board.getDistanceBetweenTwoCoords("0|0", "1|1");

    expect(distance).to.deep.equal({ x: 1, y: 1 });
  });

  it("selectItem Method", () => {
    const board = new Board({ x: 3, y: 3 });
    const item = new Item({
      rules: {
        movement: {
          angular: true,
          linear: true,
          stepCount: 4,
        },
      },
    });

    board.setItem("0|1", { ...item });
    board.selectItem("0|1");

    expect(board.board).to.deep.equal({
      "0|0": { item: null },
      "0|1": { item: { ...item, selected: true } },
      "0|2": { item: null },
      "1|0": { item: null },
      "1|1": { item: null },
      "1|2": { item: null },
      "2|0": { item: null },
      "2|1": { item: null },
      "2|2": { item: null },
    });
  });

  it("deselectItem Method", () => {
    const board = new Board({ x: 3, y: 3 });
    const item = new Item({
      rules: {
        movement: {
          angular: true,
          linear: true,
          stepCount: 4,
        },
      },
    });

    board.setItem("0|1", { ...item });
    board.selectItem("0|1");
    board.deselectItem("0|1");

    expect(board.board).to.deep.equal({
      "0|0": { item: null },
      "0|1": { item: { ...item, selected: false } },
      "0|2": { item: null },
      "1|0": { item: null },
      "1|1": { item: null },
      "1|2": { item: null },
      "2|0": { item: null },
      "2|1": { item: null },
      "2|2": { item: null },
    });
  });

  it("deselectAllItems Method", () => {
    const board = new Board({ x: 3, y: 3 });
    const item = new Item({
      rules: {
        movement: {
          angular: true,
          linear: true,
          stepCount: 4,
        },
      },
    });

    board.setItem("0|1", { ...item });
    board.selectItem("0|1");
    board.deselectAllItems();

    expect(board.board).to.deep.equal({
      "0|0": { item: null },
      "0|1": { item: { ...item } },
      "0|2": { item: null },
      "1|0": { item: null },
      "1|1": { item: null },
      "1|2": { item: null },
      "2|0": { item: null },
      "2|1": { item: null },
      "2|2": { item: null },
    });
  });
});

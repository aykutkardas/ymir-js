const Board = require("../dist/board").default;
const Rules = require("../dist/rules").default;
const Item = require("../dist/item").default;

const board = new Board({
  x: 9,
  y: 9,
});

const item = new Item({
  rules: {
    movement: {
      angular: true,
      linear: true,
      stepCount: 4,
    },
  },
});

board.setItemToCoord("4|4", item);

const rules = new Rules(board);

// For Debug
window.board = board;
window.rules = rules;
// -

function createBoard() {
  const boardElement = document.createElement("div");
  boardElement.setAttribute("class", "board");

  const appElement = document.querySelector(".app");
  appElement.innerHTML = "";
  appElement.append(boardElement);

  board.getBoardMatrix().forEach((row) => {
    const rowElement = document.createElement("div");
    rowElement.setAttribute("class", "row");
    boardElement.append(rowElement);

    row.forEach((col) => {
      const colElement = document.createElement("div");
      colElement.setAttribute("class", "column");
      colElement.setAttribute("data-coord", col.id);

      colElement.addEventListener("click", function ({ target }) {
        const toId = target.dataset.coord;
        const itemElement = document.querySelector(".item");
        if (target.classList.contains("available")) {
          board.moveItemToCoord(itemElement.dataset.coord, toId);
          update();
        }
      });

      if (col.item) {
        const itemElement = document.createElement("div");
        itemElement.setAttribute("class", "item");
        itemElement.setAttribute("data-coord", col.id);
        itemElement._props = item;

        colElement.append(itemElement);
      }

      rowElement.append(colElement);
    });
  });
}

createBoard();

function showAvailableCoords() {
  const itemElement = document.querySelector(".item");
  const colElements = document.querySelectorAll(".column");

  for (colElement of colElements) {
    colElement.classList.remove("available");
  }

  const coord = itemElement.dataset.coord;
  const availableColumns = rules.getAvaiblableColumns(
    coord,
    itemElement._props.rules
  );

  availableColumns.forEach((coord) => {
    const availableColumn = document.querySelector(
      '.column[data-coord="' + coord + '"]'
    );

    availableColumn.classList.add("available");
  });
}

function update() {
  createBoard();
  const directionAngularEl = document.querySelector("#direction_angular");
  const directionLinearEl = document.querySelector("#direction_linear");
  const stepCountEl = document.querySelector("#step_count");

  const isAngular = directionAngularEl.checked;
  const isLinear = directionLinearEl.checked;
  const stepCount = parseInt(stepCountEl.value);

  const itemElement = document.querySelector(".item");

  const item = new Item({
    rules: {
      movement: {
        angular: isAngular,
        linear: isLinear,
        stepCount: stepCount,
      },
    },
  });

  itemElement._props = item;

  showAvailableCoords();
}

document.querySelector("#direction_angular").addEventListener("change", update);
document.querySelector("#direction_linear").addEventListener("change", update);
document.querySelector("#step_count").addEventListener("change", update);

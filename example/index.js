const Board = require("../dist/board").default;
const Rules = require("../dist/rules").default;
const Item = require("../dist/item").default;
const anime = require("animejs").default;
console.log(anime);

const board = new Board({
  x: 9,
  y: 9,
});

const whiteItem = new Item({
  data: {
    color: "white",
  },
  rules: {
    movement: {
      angular: true,
      linear: true,
      stepCount: 1,
    },
  },
});

const blackItem = new Item({
  data: {
    color: "black",
  },
  rules: {
    movement: {
      angular: true,
      linear: true,
      stepCount: 1,
    },
  },
});

board.setItem("2|2", whiteItem);
board.setItem("4|4", blackItem);

const rules = new Rules(board);

function createBoard() {
  const boardEl = document.createElement("div");
  boardEl.setAttribute("class", "board");

  const appEl = document.querySelector(".app");
  appEl.innerHTML = "";
  appEl.append(boardEl);

  board.getBoardMatrix().forEach((row) => {
    const rowEl = document.createElement("div");
    rowEl.setAttribute("class", "row");
    boardEl.append(rowEl);

    row.forEach((col) => {
      const colEl = document.createElement("div");
      colEl.setAttribute("class", "column");
      colEl.setAttribute("data-coord", col.id);

      colEl.addEventListener("click", function ({ target }) {
        const toId = target.dataset.coord;
        const itemEl = document.querySelector(".item[data-color='black']");
        if (target.classList.contains("available")) {
          const distance = board.getDistanceBetweenTwoCoords(
            itemEl.dataset.coord,
            toId
          );

          const positions = {};
          if (!!distance.x) {
            positions.left = `calc(${distance.x * 54}px + 50%)`;
          }
          if (!!distance.y) {
            positions.top = `calc(${distance.y * 54}px + 50%)`;
          }

          const moveAnimation = anime({
            targets: itemEl,
            ...positions,
            easing: "easeInOutQuad",
            duration: 350,
          });

          board.moveItem(itemEl.dataset.coord, toId);
          moveAnimation.finished.then(update);
        }
      });

      if (col.item) {
        const itemEl = document.createElement("div");
        itemEl.classList.add("item");
        itemEl.style.background = col.item.data.color;
        itemEl.setAttribute("data-color", col.item.data.color);
        itemEl.setAttribute("data-coord", col.id);
        itemEl._props = col.item;

        colEl.append(itemEl);
      }

      rowEl.append(colEl);
    });
  });
}

createBoard();

function showAvailableCoords() {
  const itemEl = document.querySelector(".item[data-color='black']");
  const colEls = document.querySelectorAll(".column");

  for (colEl of colEls) {
    colEl.classList.remove("available");
  }

  const coord = itemEl.dataset.coord;
  const availableColumns = rules.getAvaiblableColumns(
    coord,
    itemEl._props.rules
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

  const itemEl = document.querySelector(".item");

  const item = new Item({
    rules: {
      movement: {
        angular: isAngular,
        linear: isLinear,
        stepCount: stepCount,
      },
    },
  });

  itemEl._props = item;

  showAvailableCoords();
}

// For Debug
window.board = board;
window.rules = rules;
window.update = update;
window.anime = anime;
// -

document.querySelector("#direction_angular").addEventListener("change", update);
document.querySelector("#direction_linear").addEventListener("change", update);
document.querySelector("#step_count").addEventListener("change", update);

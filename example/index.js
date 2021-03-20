const Board = require("../dist/board").default;
const Rules = require("../dist/rules/default-rules").default;
const CheckersItem = require("../dist/items/checkers-item").default;
const anime = require("animejs").default;

const board = new Board({
  x: 8,
  y: 8,
});

const whiteItem = new CheckersItem({
  color: "white",
});

const blackItem = new CheckersItem({
  color: "black",
});

const items = {
  "1|0": { ...whiteItem },
  "1|1": { ...whiteItem },
  "1|2": { ...whiteItem },
  "1|3": { ...whiteItem },
  "1|4": { ...whiteItem },
  "1|5": { ...whiteItem },
  "1|6": { ...whiteItem },
  "1|7": { ...whiteItem },
  "2|0": { ...whiteItem, king: true },
  "2|1": { ...whiteItem },
  "2|2": { ...whiteItem },
  "2|3": { ...whiteItem },
  "2|4": { ...whiteItem },
  "2|5": { ...whiteItem },
  "2|6": { ...whiteItem },
  "2|7": { ...whiteItem },
  "5|0": { ...blackItem, king: true },
  "5|1": { ...blackItem },
  "5|2": { ...blackItem },
  "5|3": { ...blackItem },
  "5|4": { ...blackItem },
  "5|5": { ...blackItem },
  "5|6": { ...blackItem },
  "5|7": { ...blackItem },
  "6|0": { ...blackItem },
  "6|1": { ...blackItem },
  "6|2": { ...blackItem },
  "6|3": { ...blackItem },
  "6|4": { ...blackItem },
  "6|5": { ...blackItem },
  "6|6": { ...blackItem },
  "6|7": { ...blackItem },
};

Object.keys(items).forEach((coord) => board.setItem(coord, items[coord]));

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
        const itemEl = document.querySelector(".item[data-selected='true']");
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

          anime({
            ...positions,
            targets: itemEl,
            easing: "easeInOutQuad",
            duration: 350,
          });

          const switchDistance = board.getDistanceBetweenTwoCoords(
            toId,
            itemEl.dataset.coord
          );

          const switchPositions = {};
          if (!!switchDistance.x) {
            switchPositions.left = `calc(${switchDistance.x * 54}px + 50%)`;
          }
          if (!!switchDistance.y) {
            switchPositions.top = `calc(${switchDistance.y * 54}px + 50%)`;
          }

          const switchMoveAnimation = anime({
            ...switchPositions,
            targets: document.querySelector('.item[data-coord="' + toId + '"]'),
            easing: "easeInOutQuad",
            duration: 350,
          });

          board.switchItem(itemEl.dataset.coord, toId);
          switchMoveAnimation.finished.then(update);
        }
      });

      if (col.item) {
        const itemEl = document.createElement("div");
        itemEl.classList.add("item");
        itemEl.style.background = col.item.color;
        itemEl.setAttribute("data-color", col.item.color);
        itemEl.setAttribute("data-coord", col.id);
        itemEl.setAttribute("data-selected", col.item.selected);
        itemEl._props = col.item;

        itemEl.addEventListener("click", (e) => {
          console.log(e.target.dataset.coord);
          board.deselectAllItems();
          board.selectItem(e.target.dataset.coord);
          update();
        });

        colEl.append(itemEl);
      }

      rowEl.append(colEl);
    });
  });
}

createBoard();

function showAvailableCoords() {
  const itemEl = document.querySelector(".item[data-selected='true']");
  const colEls = document.querySelectorAll(".column");

  for (colEl of colEls) {
    colEl.classList.remove("available");
  }

  const coord = itemEl.dataset.coord;
  const availableColumns = rules.getAvaiblableColumns(coord, itemEl._props.movement);

  availableColumns.forEach((coord) => {
    const availableColumn = document.querySelector(
      '.column[data-coord="' + coord + '"]'
    );

    availableColumn.classList.add("available");
  });
}

function update() {
  createBoard();
  showAvailableCoords();
}

// For Debug
window.board = board;
window.rules = rules;
window.update = update;
window.anime = anime;
// -

const Board = require("../dist/board").default;
const Rules = require("../dist/rules").default;
const CheckersItem = require("../dist/items/checkers-item").default;
const anime = require("animejs").default;

const board = new Board({
  x: 8,
  y: 8,
});

const whiteItem = new CheckersItem({
  color: "white",
  checkersType: "turkish",
});

const blackItem = new CheckersItem({
  color: "black",
  checkersType: "turkish",
});

const items = {
  "3|3": { ...blackItem },
  "3|4": { ...blackItem },
  "3|5": { ...whiteItem },
  "4|3": { ...blackItem, selected: true },
  "4|4": { ...whiteItem },
  "4|5": { ...whiteItem },
  "5|3": { ...whiteItem },
  "5|4": { ...blackItem },
  "5|5": { ...blackItem },
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
  showAvailableCoords();
}

// For Debug
window.board = board;
window.rules = rules;
window.update = update;
window.anime = anime;
// -

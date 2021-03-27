const Board = require("../dist/board").default;
const Rules = require("../dist/rules/checkers-turkish").default;
const CheckersItem = require("../dist/items/checkers-item").default;
const useCoord = require("../dist/utils/useCoord").default;
const anime = require("animejs").default;

const board = new Board({
  x: 8,
  y: 8,
});

const items = {
  "1|0": { color: "white" },
  "1|1": { color: "white" },
  "1|2": { color: "white" },
  "1|3": { color: "white" },
  "1|4": { color: "white" },
  "1|5": { color: "white" },
  "1|6": { color: "white" },
  "1|7": { color: "white" },
  "2|0": { color: "white" },
  "2|1": { color: "white" },
  "2|2": { color: "white" },
  "2|3": { color: "white" },
  "2|4": { color: "white" },
  "2|5": { color: "white" },
  "2|6": { color: "white" },
  "2|7": { color: "white" },
  "5|0": { color: "black" },
  "5|1": { color: "black" },
  "5|2": { color: "black" },
  "5|3": { color: "black" },
  "5|4": { color: "black" },
  "5|5": { color: "black" },
  "5|6": { color: "black" },
  "5|7": { color: "black" },
  "6|0": { color: "black" },
  "6|1": { color: "black" },
  "6|2": { color: "black" },
  "6|3": { color: "black" },
  "6|4": { color: "black" },
  "6|5": { color: "black" },
  "6|6": { color: "black" },
  "6|7": { color: "black" },
};

Object.keys(items).forEach((coord) =>
  board.setItem(coord, new CheckersItem(items[coord]))
);

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
      colEl.addEventListener("click", moveItem);

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

function moveItem({ target }) {
  const toId = target.dataset.coord;
  const [toRowId] = useCoord(toId);
  const itemEl = document.querySelector(".item[data-selected='true']");

  if (toRowId === 0 || toRowId === 7) {
    itemEl._props.setKing();
  }
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

    const coordsOfDestoryItems = rules.getItemsBetweenTwoCoords(
      itemEl.dataset.coord,
      toId
    );

    coordsOfDestoryItems.forEach((coord) => {
      const destoryAniamtion = anime({
        opacity: 0,
        targets: document.querySelector('.item[data-coord="' + coord + '"]'),
        easing: "easeInOutQuad",
        duration: 350,
      });
      destoryAniamtion.finished.then(board.removeItem(coord));
    });
    board.moveItem(itemEl.dataset.coord, toId);
    switchMoveAnimation.finished.then(update);
  }
}

function showAvailableCoords() {
  const itemEl = document.querySelector(".item[data-selected='true']");
  const colEls = document.querySelectorAll(".column");

  for (colEl of colEls) {
    colEl.classList.remove("available");
  }

  const coord = itemEl.dataset.coord;
  const { movement } = itemEl._props;
  const availableColumns = rules.getAvailableColumns(coord, movement);

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

createBoard();

// For Debug
window.board = board;
window.rules = rules;
window.update = update;
window.CheckersItem = CheckersItem;
window.anime = anime;
// -

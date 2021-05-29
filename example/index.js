const CheckersBoard = require("../dist/packages/checkers/board").default;
const Rules = require("../dist/packages/checkers/rules/turkish").default;
const CheckersItem = require("../dist/packages/checkers/item").default;
const useCoord = require("../dist/utils/useCoord").default;
const anime = require("animejs").default;

const board = new CheckersBoard({ x: 8, y: 8 });
const rules = new Rules(board);

board.resetBoard();

function renderBoard() {
  const boardEl = document.createElement("div");
  boardEl.setAttribute("class", "board");

  const appEl = document.querySelector(".app");
  appEl.querySelector(".board")?.remove();
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
        itemEl.dataset.color = col.item.color;
        itemEl.dataset.coord = col.id;
        itemEl.dataset.selected = col.item.selected;
        itemEl.dataset.king = col.item.king;
        itemEl._props = col.item;

        itemEl.addEventListener("click", (e) => {
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
    itemEl.dataset.king = true;
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

    const animation = anime({
      ...positions,
      targets: itemEl,
      easing: "easeInOutQuad",
      duration: 350,
    });

    const coordsOfDestoryItems = rules.getItemsBetweenTwoCoords(
      itemEl.dataset.coord,
      toId
    );

    coordsOfDestoryItems
      .filter((coord) => board.getItem(coord)?.color !== itemEl._props.color)
      .forEach((coord) => {
        const destoryAniamtion = anime({
          opacity: 0,
          targets: document.querySelector('.item[data-coord="' + coord + '"]'),
          easing: "easeInOutQuad",
          duration: 350,
        });

        destoryAniamtion.finished.then(board.removeItem(coord));
      });

    board.moveItem(itemEl.dataset.coord, toId);

    animation.finished.then(update);
  }
}

function showAvailableCoords() {
  const itemEl = document.querySelector(".item[data-selected='true']");
  const colEls = document.querySelectorAll(".column");
  const coord = itemEl.dataset.coord;
  const { movement } = itemEl._props;
  const availableColumns = rules.getAvailableColumns(coord, movement);

  for (colEl of colEls) {
    colEl.classList.remove("available");
    if (availableColumns.includes(colEl.dataset.coord)) {
      colEl.classList.add("available");
    }
  }
}

function update() {
  renderBoard();
  showAvailableCoords();
}

renderBoard();

// For Debug
window.board = board;
window.rules = rules;
window.update = update;
window.CheckersItem = CheckersItem;
window.anime = anime;
// -

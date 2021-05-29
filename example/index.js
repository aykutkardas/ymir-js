const CheckersBoard = require("../dist/packages/checkers/board").default;
const CheckersRules =
  require("../dist/packages/checkers/rules/turkish").default;
const useCoord = require("../dist/utils/useCoord").default;
const anime = require("animejs").default;

function toBoolean(val) {
  return val === "true";
}

const App = {
  data() {
    const board = new CheckersBoard({ x: 8, y: 8 });
    const rules = new CheckersRules(board);

    board.resetBoard();

    return {
      board,
      rules,
      activeItem: null,
      activeCoord: null,
      boardMatrix: board.getBoardMatrix(),
      movePending: false,
    };
  },
  watch: {
    activeCoord() {
      this.boardMatrix = this.board.getBoardMatrix();
    },
  },
  computed: {
    availableColumns() {
      if (!this.activeItem || !this.activeCoord) return [];
      const { movement } = this.activeItem;
      return this.rules.getAvailableColumns(this.activeCoord, movement);
    },
  },
  methods: {
    selectItem({ target }) {
      const { coord } = target.dataset;
      const activeItem = this.board.getItem(coord);
      this.board.deselectAllItems();
      this.board.selectItem(coord);
      this.activeItem = activeItem;
      this.activeCoord = coord;
    },
    moveItem({ target }) {
      const { coord, available } = target.dataset;
      this.movePending = true;

      if (!toBoolean(available)) return;

      const [toRowId] = useCoord(coord);

      if (toRowId === 0 || toRowId === 7) {
        this.activeItem.setKing();
        this.activeItem.king = true;
      }

      const distance = this.board.getDistanceBetweenTwoCoords(
        this.activeCoord,
        coord
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
        targets: document.querySelector(
          '.item[data-coord="' + this.activeCoord + '"]'
        ),
        easing: "easeInOutQuad",
        duration: 350,
      });

      animation.finished.then(() => {
        this.board.moveItem(this.activeCoord, coord);
        this.activeCoord = coord;
      });

      const coordsOfDestoryItems = this.rules.getItemsBetweenTwoCoords(
        this.activeCoord,
        coord
      );

      coordsOfDestoryItems.forEach((coord) => {
        const destoryAniamtion = anime({
          opacity: 0,
          targets: document.querySelector('.item[data-coord="' + coord + '"]'),
          easing: "easeInOutQuad",
          duration: 350,
        });

        destoryAniamtion.finished.then(() => {
          this.board.removeItem(coord);
        });
      });
    },
  },
};

Vue.createApp(App).mount("#app");

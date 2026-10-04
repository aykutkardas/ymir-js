import { Checkers, Utils } from "ymir-js";

const { International } = Checkers;
const { Board, Rules } = International;

const { useCoord } = Utils;

const anime = require("animejs").default;

function toBoolean(val) {
  return val === "true";
}

function animate(coord, options = {}) {
  return anime({
    ...options,
    targets: document.querySelector(`.item[data-coord="${coord}"]`),
    easing: "easeInOutQuad",
    duration: 350,
  });
}

const App = {
  data() {
    const board = new Board();
    const rules = new Rules(board);

    board.init();

    return {
      board,
      rules,
      activeItem: null,
      activeCoord: null,
      boardMatrix: board.getBoardMatrix(),
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
      this.activeCoord = coord;

      const activeItem = this.board.getItem(coord);
      this.activeItem = activeItem;

      this.board.deselectAllItems();
      this.board.selectItem(coord);
    },
    moveItem({ target }) {
      const { coord, available } = target.dataset;

      if (!toBoolean(available)) return;

      const [toRowId] = useCoord(coord);

      if (toRowId === 0 || toRowId === 9) {
        this.activeItem.setKing();
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

      const animation = animate(this.activeCoord, positions);

      animation.finished.then(() => {
        this.board.moveItem(this.activeCoord, coord);
        this.activeCoord = coord;
      });

      const coordsOfDestoryItems = this.rules.getItemsBetweenTwoCoords(
        this.activeCoord,
        coord
      );

      coordsOfDestoryItems.forEach((coord) => {
        const destoryAniamtion = animate(coord, { opacity: 0 });

        destoryAniamtion.finished.then(() => {
          this.board.removeItem(coord);
        });
      });
    },
  },
};

Vue.createApp(App).mount("#app");

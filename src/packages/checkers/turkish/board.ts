import Board from '../../core/board';
import Item from './item';

export type BoardConfig = {
  x: number;
  y: number;
};

class TurkishCheckersBoard extends Board {
  constructor(config: BoardConfig = { x: 8, y: 8 }) {
    super(config);

    return this;
  }

  init(): void {
    const whiteItemCoords =
      '1|0 1|1 1|2 1|3 1|4 1|5 1|6 1|7 2|0 2|1 2|2 2|3 2|4 2|5 2|6 2|7';
    const blackItemCoords =
      '5|0 5|1 5|2 5|3 5|4 5|5 5|6 5|7 6|0 6|1 6|2 6|3 6|4 6|5 6|6 6|7';

    whiteItemCoords.split(' ').forEach((coord) => {
      this.setItem(coord, new Item({ color: 'white' }));
    });

    blackItemCoords.split(' ').forEach((coord) => {
      this.setItem(coord, new Item({ color: 'black' }));
    });
  }

  // TODO: Write test
  reset(): void {
    Object.keys(this.board).forEach((coord) => {
      this.board[coord].item = null;
    });

    this.init();
  }
}

export default TurkishCheckersBoard;

import getAvailableColumns from '../../../utils/getAvailableColumns';
import Board from '../../core/board';
import Item, { CheckersColorType, CheckersItemType } from './item';

export type BoardConfig = {
  x: number;
  y: number;
};

export type AttactCoord = { coord: string; destroyItemCoord: string };

export type DefendCoord = { coord: string; inDangerItemCoord: string };

class InternationalCheckersBoard extends Board {
  constructor(config: BoardConfig = { x: 10, y: 10 }) {
    super(config);

    return this;
  }

  init(): void {
    const whiteItemCoords =
      '0|1 0|3 0|5 0|7 0|9 1|0 1|2 1|4 1|6 1|8 2|1 2|3 2|5 2|7 2|9 3|0 3|2 3|4 3|6 3|8';
    const blackItemCoords =
      '6|1 6|3 6|5 6|7 6|9 7|0 7|2 7|4 7|6 7|8 8|1 8|3 8|5 8|7 8|9 9|0 9|2 9|4 9|6 9|8';

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

  getItemsBetweenTwoCoords(fromCoord: string, toCoord: string): string[] {
    const direction = this.getDirection(fromCoord, toCoord);
    const distance = this.getDistanceBetweenTwoCoords(fromCoord, toCoord);
    const convertDirection = {
      top: 'y',
      bottom: 'y',
      left: 'x',
      right: 'x',
    };
    const stepCount = Math.abs(distance[convertDirection[direction]]) || 1;
    const movement = { stepCount };

    movement[direction] = true;

    const betweenCoords = [];

    return betweenCoords
      .concat(...Object.values(getAvailableColumns(fromCoord, movement)))
      .filter((coord) => !this.isEmpty(coord));
  }

  getAvailableCoordsByColor = (
    color: CheckersColorType
  ): Record<string, string[]> => {
    const currentItems = [];
    const availableCoords = {};

    Object.entries(this.board).forEach(([coord, col]) => {
      if (col.item && col.item.color === color) {
        currentItems.push(coord);
      }
    });

    currentItems.forEach((coord) => {
      const item = this.getItem(coord);
      const currentAvailableCoords = this.getAvailableColumns(
        coord,
        item.movement
      );

      if (currentAvailableCoords.length) {
        availableCoords[coord] = currentAvailableCoords;
      }
    });

    return availableCoords;
  };

  getAttackCoordsByColor = (
    color: CheckersColorType
  ): { [coord: string]: AttactCoord[] } => {
    const availableCoords = this.getAvailableCoordsByColor(color);
    const attackCoords = {};

    Object.entries(availableCoords).forEach(
      ([coord, currentAvailableCoords]) => {
        currentAvailableCoords.forEach((currentAvailableCoord) => {
          const [destroyItemCoord] = this.getItemsBetweenTwoCoords(
            coord,
            currentAvailableCoord
          );

          if (destroyItemCoord) {
            if (attackCoords[coord]) {
              attackCoords[coord].push({
                coord: currentAvailableCoord,
                destroyItemCoord,
              });
            } else {
              attackCoords[coord] = [
                { coord: currentAvailableCoord, destroyItemCoord },
              ];
            }
          }
        });
      }
    );

    return attackCoords;
  };

  getItemsByColor = (color: CheckersColorType): CheckersItemType[] => {
    // @ts-expect-error
    return Object.values(this.board)
      .filter(({ item }) => item?.color === color)
      .map(({ item }) => item);
  };
}

export default InternationalCheckersBoard;

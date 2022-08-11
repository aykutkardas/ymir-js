import getAvailableColumns from '../../../utils/getAvailableColumns';
import Board from '../../core/board';
import { MovementType } from '../../core/item';
import Item, { CheckersColorType } from './item';

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
    Object.keys(this).forEach((coord) => {
      this[coord].item = null;
    });

    this.init();
  }

  // TODO: Write Test
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

  // TODO: Write Test
  getAvailableColumns = (coord: string, movement: MovementType): string[] => {
    const columns = getAvailableColumns(coord, movement);

    const item = this.getItem(coord);

    const availableColumns = {};
    const captureAvailableColumns = {};

    Object.keys(columns).forEach((key) => {
      availableColumns[key] = [];

      let isFoundCapture = false;
      for (let i = 0; i < columns[key].length; i += 1) {
        const currentCoord = columns[key][i];

        if (this.isEmpty(currentCoord)) {
          availableColumns[key].push(currentCoord);
          continue;
        } else if (isFoundCapture) {
          break;
        }

        const nextCoordItem = this.getItem(currentCoord);

        if (nextCoordItem?.color === item.color) {
          break;
        } else if (
          !isFoundCapture &&
          nextCoordItem &&
          nextCoordItem.color !== item.color
        ) {
          const direction = this.getDirection(coord, currentCoord);
          const movementRule = {
            stepCount: 1,
            [direction]: true,
          };
          const [toCoord] = this.getAvailableColumns(
            currentCoord,
            movementRule
          ) as string[];

          if (this.isEmpty(toCoord)) {
            availableColumns[key] = [toCoord];
            captureAvailableColumns[key] = true;
            isFoundCapture = true;
          } else {
            break;
          }
        }
      }
    });

    const isFoundAnySuccessDirection = Object.values(
      captureAvailableColumns
    ).some((direction) => direction);

    const newAvailableColumns = [];

    if (isFoundAnySuccessDirection) {
      Object.keys(captureAvailableColumns).forEach((direction) => {
        if (captureAvailableColumns[direction]) {
          newAvailableColumns.push(...availableColumns[direction]);
        }
      });
    } else {
      Object.keys(availableColumns).forEach((key) => {
        newAvailableColumns.push(...availableColumns[key]);
      });
    }

    return newAvailableColumns.filter(this.isEmpty);
  };

  analyzeBoardForAvailableSuccessMoves = (
    color: CheckersColorType
  ): string[] => {
    const availableSuccessMoves = [];
    const coords = [];

    this.getBoardMatrix().forEach((row) => {
      row.forEach((col) => {
        if (col.item && col.item.color === color) {
          coords.push(col.coord);
        }
      });
    });

    coords.forEach((coord) => {
      const item = this.getItem(coord);
      const availableColumns = this.getAvailableColumns(coord, item.movement);

      availableColumns.forEach((availableColumn) => {
        const betweenItems = this.getItemsBetweenTwoCoords(
          coord,
          availableColumn
        );
        if (betweenItems.length) {
          availableSuccessMoves.push(coord);
        }
      });
    });

    return availableSuccessMoves;
  };
}

export default TurkishCheckersBoard;

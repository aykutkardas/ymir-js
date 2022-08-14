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
    Object.keys(this.board).forEach(this.removeItem);

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
  ): Record<string, string[]> => {
    const availableCoords = this.getAvailableCoordsByColor(color);
    const attackCoords = {};

    Object.entries(availableCoords).forEach(
      ([coord, currentAvailableCoords]) => {
        currentAvailableCoords.forEach((currentAvailableCoord) => {
          const itemWillDestroyList = this.getItemsBetweenTwoCoords(
            coord,
            currentAvailableCoord
          );

          if (itemWillDestroyList.length) {
            if (attackCoords[coord]) {
              attackCoords[coord].push(currentAvailableCoord);
            } else {
              attackCoords[coord] = [currentAvailableCoord];
            }
          }
        });
      }
    );

    return attackCoords;
  };

  getDefendCoordsByColor = (
    color: CheckersColorType
  ): Record<string, string[]> => {
    const defendCoords = {};

    const enemyColor = color === 'white' ? 'black' : 'white';
    const availableCoords = this.getAvailableCoordsByColor(color);
    const enemyAttackCoords = this.getAttackCoordsByColor(enemyColor);

    Object.entries(enemyAttackCoords).forEach(([, enemyAttackCoords]) => {
      Object.entries(availableCoords).forEach(
        ([originn, currentAvailableCoords]) => {
          currentAvailableCoords.forEach((currentAvailableCoord) => {
            if (enemyAttackCoords.includes(currentAvailableCoord)) {
              if (defendCoords[originn]) {
                defendCoords[originn].push(currentAvailableCoord);
              } else {
                defendCoords[originn] = [currentAvailableCoord];
              }
            }
          });
        }
      );
    });

    return defendCoords;
  };

  // TODO: Write Test
  getAvailableColumns = (coord: string, movement: MovementType): string[] => {
    const columns = getAvailableColumns(coord, movement);

    if (this.isEmpty(coord)) return [];

    const item = this.getItem(coord);

    const emptyColumns = [];
    let enemyColumns = [];

    Object.values(columns)
      .flat()
      .forEach((columnCoord) => {
        if (this.isEmpty(columnCoord)) emptyColumns.push(columnCoord);
        const columnItem = this.getItem(columnCoord);
        if (columnItem && columnItem.color !== item.color)
          enemyColumns.push(columnCoord);
      });

    enemyColumns = enemyColumns
      .map((enemyCoord) => {
        const direction = this.getDirection(coord, enemyCoord);
        const movementRule = {
          stepCount: 1,
          [direction]: true,
        };
        const [toCoord] = Object.values(
          getAvailableColumns(enemyCoord, movementRule)
        ).flat();

        return this.isEmpty(toCoord) ? toCoord : false;
      })
      .filter(Boolean);

    return enemyColumns.length ? enemyColumns : emptyColumns;
  };

  analyzeAvailableAttack = (
    color: CheckersColorType
  ): Record<string, string[]> => {
    const availableAttack = {};
    const coords = [];

    Object.entries(this.board).forEach(([coord, col]) => {
      if (col.item && col.item.color === color) {
        coords.push(coord);
      }
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
          if (availableAttack[coord]) {
            availableAttack[coord].push(availableColumn);
          } else {
            availableAttack[coord] = [availableColumn];
          }
        }
      });
    });

    return availableAttack;
  };

  autoPlay = (color: CheckersColorType, { onSelect, onMove }): void => {
    // AVAILABLE SUCCESS MOVES
    const availableAttacks = this.getAttackCoordsByColor(color);
    const availableAttacksOriginn = Object.keys(availableAttacks);

    if (availableAttacksOriginn.length) {
      const [attackOriginn] = availableAttacksOriginn;
      const [availableAttackColumn] = availableAttacks[attackOriginn];

      onSelect?.(attackOriginn);
      onMove?.(attackOriginn, availableAttackColumn);
      return;
    }

    // AVAILABLE DEFEND MOVES
    const availableDefends = this.getDefendCoordsByColor(color);
    const availableDefendsOriginn = Object.keys(availableDefends);

    if (availableDefendsOriginn.length) {
      const [defendOriginn] = availableDefendsOriginn;
      const [availableDefendColumn] = availableDefends[defendOriginn];

      onSelect?.(defendOriginn);
      onMove?.(defendOriginn, availableDefendColumn);
      return;
    }

    // AVAILABLE NORMAL MOVES
    const availableNormalMoves = this.getAvailableCoordsByColor(color);
    const availableCoords = Object.keys(availableNormalMoves);

    const availableEnemyNormalMoves = Object.values(
      this.getAvailableCoordsByColor(color === 'white' ? 'black' : 'white')
    ).flat();

    const safeMoves = {};

    Object.values(availableNormalMoves).filter((moves, index) => {
      moves.forEach((move) => {
        if (!availableEnemyNormalMoves.includes(move)) {
          if (safeMoves[move]) {
            safeMoves[availableCoords[index]].push(move);
          } else {
            safeMoves[availableCoords[index]] = [move];
          }
        }
      });
    });

    const safeCoords = Object.keys(safeMoves);

    let currentCoords = availableCoords;
    let currentMoves = availableNormalMoves;

    if (safeCoords.length) {
      currentCoords = safeCoords;
      currentMoves = safeMoves;
    }

    const randomIndex = Math.floor(Math.random() * currentCoords.length);
    const selectedCoord = currentCoords[randomIndex];

    onSelect?.(selectedCoord);
    onMove?.(selectedCoord, currentMoves[selectedCoord][0]);
  };
}

export default TurkishCheckersBoard;

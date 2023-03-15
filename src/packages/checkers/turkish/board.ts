import * as _ from 'lodash';

import getAvailableColumns from '../../../utils/getAvailableColumns';
import parseCoord from '../../../utils/parseCoord';
import Board from '../../core/board';
import { MovementType } from '../../core/item';
import Item, { CheckersColorType, CheckersItemType } from './item';

export type BoardConfig = {
  x: number;
  y: number;
};

export type CheckersBoardType = { [key: string]: { item: CheckersItemType } };

export type AttactCoord = { coord: string; destroyItemCoord: string };

export type DefendCoord = { coord: string; inDangerItemCoord: string };

class TurkishCheckersBoard extends Board {
  board: CheckersBoardType;

  constructor(config: BoardConfig = { x: 8, y: 8 }) {
    super(config);

    return this;
  }

  init() {
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

    return this;
  }

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

  getDefendCoordsByColor = (
    color: CheckersColorType
  ): { [coord: string]: DefendCoord[] } => {
    const defendCoords = {};

    const enemyColor = color === 'white' ? 'black' : 'white';
    const availableCoords = this.getAvailableCoordsByColor(color);
    const enemyAttackCoords = this.getAttackCoordsByColor(enemyColor);

    Object.entries(enemyAttackCoords).forEach(([, enemyAttack]) => {
      Object.values(enemyAttack).forEach((enemyAttackCoord) => {
        Object.keys(availableCoords).forEach((availableItemOrigin) => {
          const availableColumnCoords = availableCoords[availableItemOrigin];

          if (
            availableColumnCoords.includes(enemyAttackCoord.coord) &&
            availableItemOrigin !== enemyAttackCoord.destroyItemCoord
          ) {
            const defendCoordItem = {
              coord: enemyAttackCoord.coord,
              inDangerCoord: enemyAttackCoord.destroyItemCoord,
            };

            if (defendCoords[availableItemOrigin]) {
              defendCoords[availableItemOrigin].push(defendCoordItem);
            } else {
              defendCoords[availableItemOrigin] = [defendCoordItem];
            }
          }
        });
      });
    });

    return defendCoords;
  };

  getItemsByColor = (color: CheckersColorType): CheckersItemType[] => {
    return Object.values(this.board)
      .filter(({ item }) => item?.color === color)
      .map(({ item }) => item);
  };

  getAvailableColumns = (coord: string, movement: MovementType): string[] => {
    if (this.isEmpty(coord)) return [];

    const columns = getAvailableColumns(coord, movement);
    const availableColumns: Record<string, string[]> = {};
    const captureAvailableColumns = {};
    const item = this.getItem(coord);

    Object.keys(columns).forEach((key) => {
      availableColumns[key] = [];
      let isFoundCapture = false;

      for (let i = 0; i < columns[key].length; i += 1) {
        const currentCoord = columns[key][i];

        if (!this.isExistCoord(currentCoord)) continue;
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

          const [afterCoord] = Object.values(
            getAvailableColumns(currentCoord, movementRule)
          )
            .filter((arr) => arr.length)
            .flat();

          const afterItem = this.getItem(afterCoord);

          if (afterItem) break;

          if (this.isEmpty(afterCoord)) {
            availableColumns[key] = [afterCoord];
            captureAvailableColumns[key] = true;
            isFoundCapture = true;
          } else {
            break;
          }
        }
      }
    });

    const resultCoords: Record<string, string[]> = {};

    const isFoundAnySuccessDirection = Object.values(
      captureAvailableColumns
    ).some((direction) => direction);

    Object.keys(availableColumns).forEach((key) => {
      if (!isFoundAnySuccessDirection) {
        resultCoords[key] = _.uniq(availableColumns[key]);
      } else if (captureAvailableColumns[key]) {
        resultCoords[key] = _.uniq(availableColumns[key]);
      }
    });

    return Object.values(resultCoords).flat();
  };

  autoPlay = (color: CheckersColorType, { onSelect, onMove }): void => {
    // AVAILABLE SUCCESS MOVES
    const availableAttacks = this.getAttackCoordsByColor(color);
    const availableAttacksOriginn = Object.keys(availableAttacks);

    if (availableAttacksOriginn.length) {
      const [attackOriginn] = availableAttacksOriginn;
      const [availableAttackColumn] = availableAttacks[attackOriginn];

      onSelect?.(attackOriginn);
      onMove?.(attackOriginn, availableAttackColumn.coord);
      return;
    }

    // AVAILABLE DEFEND MOVES
    const potentialDefendsMoves = this.getDefendCoordsByColor(color);
    const potentialDefendsItem = Object.keys(potentialDefendsMoves);

    if (potentialDefendsItem.length) {
      const [defendOriginn] = potentialDefendsItem;
      const [availableDefendColumn] = potentialDefendsMoves[defendOriginn].map(
        (item) => item.coord
      );

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
          if (safeMoves[availableCoords[index]]) {
            safeMoves[availableCoords[index]].push(move);
          } else {
            safeMoves[availableCoords[index]] = [move];
          }
        }
      });
    });

    let currentCoords = availableCoords;
    let currentMoves = availableNormalMoves;

    // KING POTENTIAL
    const kingRowId = color === 'white' ? 7 : 0;
    let potentialKingItemCoord;
    let potentialAvailableCoord;

    Object.keys(currentMoves).forEach((coord) => {
      const availableColumns = currentMoves[coord];

      availableColumns.forEach((columnCoord) => {
        const [rowId] = parseCoord(coord);
        const [moveRowId] = parseCoord(columnCoord);
        if (rowId !== moveRowId && moveRowId === kingRowId) {
          potentialKingItemCoord = coord;
          potentialAvailableCoord = columnCoord;
        }
      });
    });

    if (potentialKingItemCoord && potentialAvailableCoord) {
      onSelect?.(potentialKingItemCoord);
      onMove?.(potentialKingItemCoord, potentialAvailableCoord);
      return;
    }

    const safeCoords = Object.keys(safeMoves);

    if (safeCoords.length) {
      currentCoords = safeCoords;
      currentMoves = safeMoves;
    }

    // RISK ESTIMATION
    currentCoords.forEach((currentCoord) => {
      currentMoves[currentCoord].forEach((move) => {
        const riskEstimationBoard = new TurkishCheckersBoard().updateBoard(
          JSON.parse(JSON.stringify(this.board))
        );

        riskEstimationBoard.moveItem(currentCoord, move);

        const potentialDefendColumns =
          riskEstimationBoard.getDefendCoordsByColor(color);

        if (Object.values(potentialDefendColumns).flat().length) {
          currentMoves[currentCoord] = currentMoves[currentCoord].filter(
            (mv) => mv !== move
          );
        }
      });

      if (!currentMoves[currentCoord].length) {
        currentCoords = currentCoords.filter((c) => c !== currentCoord);
        delete currentMoves[currentCoord];
      }
    });

    // PROPENSITY TO MOVE FORWARD
    currentCoords.forEach((currentCoord) => {
      currentMoves[currentCoord].sort((first, second) => {
        const [firstRowId] = parseCoord(first);
        const [secondRowId] = parseCoord(second);

        if (firstRowId > secondRowId) {
          return -1;
        } else if (firstRowId < secondRowId) {
          return 1;
        } else {
          return 0;
        }
      });
    });

    // [TODO]: No random, use foward move
    const randomIndex = Math.floor(Math.random() * currentCoords.length);
    const selectedCoord = currentCoords[randomIndex];

    const moveCoord = currentMoves[selectedCoord]?.[0];

    onSelect?.(selectedCoord);
    onMove?.(selectedCoord, moveCoord);
  };
}

export default TurkishCheckersBoard;

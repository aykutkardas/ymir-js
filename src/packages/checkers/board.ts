import getAvailableColumns from '../../utils/getAvailableColumns.js';
import parseCoord from '../../utils/parseCoord.js';
import Board, { BoardConfig, BoardType, Direction } from '../core/board.js';
import { ItemType, MovementType } from '../core/item.js';
import { CHECKERS_BLACK, CHECKERS_WHITE } from './constant.js';

export type CheckersColorType = typeof CHECKERS_BLACK | typeof CHECKERS_WHITE;

export interface CheckersItemType extends ItemType {
  color: CheckersColorType;
  king: boolean;
  setKing(): void;
}

export type CheckersBoardType = BoardType<CheckersItemType>;

export type AttackCoord = { coord: string; destroyItemCoord: string };

/** @deprecated Misspelled; use `AttackCoord`. */
export type AttactCoord = AttackCoord;

export type DefendCoord = { coord: string; inDangerCoord: string };

export type AutoPlayCallbacks = {
  onSelect?: (coord: string) => void;
  onMove?: (fromCoord: string, toCoord: string) => void;
};

const getEnemyColor = (color: CheckersColorType): CheckersColorType =>
  color === CHECKERS_WHITE ? CHECKERS_BLACK : CHECKERS_WHITE;

const pushTo = <T>(target: Record<string, T[]>, key: string, value: T) => {
  if (target[key]) {
    target[key].push(value);
  } else {
    target[key] = [value];
  }
};

/**
 * Rules shared by every checkers variant. Variants provide the starting
 * position and how a piece is created; movement comes from the piece itself.
 */
abstract class CheckersBoard extends Board<CheckersItemType> {
  protected abstract readonly whiteItemCoords: string[];

  protected abstract readonly blackItemCoords: string[];

  protected abstract createItem(item: {
    color: CheckersColorType;
    king?: boolean;
  }): CheckersItemType;

  constructor(config: BoardConfig) {
    super(config);
  }

  init() {
    this.whiteItemCoords.forEach((coord) => {
      this.setItem(coord, this.createItem({ color: CHECKERS_WHITE }));
    });

    this.blackItemCoords.forEach((coord) => {
      this.setItem(coord, this.createItem({ color: CHECKERS_BLACK }));
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

    if (!direction || !distance) return [];

    // Straight and diagonal lines both cover max(|x|, |y|) squares.
    const stepCount = Math.max(Math.abs(distance.x), Math.abs(distance.y));
    const movement: MovementType = { stepCount, [direction]: true };

    return Object.values(getAvailableColumns(fromCoord, movement))
      .flat()
      .filter((coord) => this.isExistCoord(coord) && !this.isEmpty(coord));
  }

  getAvailableCoordsByColor = (
    color: CheckersColorType
  ): Record<string, string[]> => {
    const availableCoords: Record<string, string[]> = {};

    Object.entries(this.board).forEach(([coord, { item }]) => {
      if (item?.color !== color) return;

      const coords = this.getAvailableColumns(coord, item.movement);

      if (coords.length) {
        availableCoords[coord] = coords;
      }
    });

    return availableCoords;
  };

  getAttackCoordsByColor = (
    color: CheckersColorType
  ): Record<string, AttackCoord[]> => {
    const attackCoords: Record<string, AttackCoord[]> = {};

    Object.entries(this.getAvailableCoordsByColor(color)).forEach(
      ([coord, availableCoords]) => {
        availableCoords.forEach((availableCoord) => {
          const [destroyItemCoord] = this.getItemsBetweenTwoCoords(
            coord,
            availableCoord
          );

          if (destroyItemCoord) {
            pushTo(attackCoords, coord, {
              coord: availableCoord,
              destroyItemCoord,
            });
          }
        });
      }
    );

    return attackCoords;
  };

  getDefendCoordsByColor = (
    color: CheckersColorType
  ): Record<string, DefendCoord[]> => {
    const defendCoords: Record<string, DefendCoord[]> = {};

    const availableCoords = this.getAvailableCoordsByColor(color);
    const enemyAttackCoords = this.getAttackCoordsByColor(getEnemyColor(color));

    Object.values(enemyAttackCoords)
      .flat()
      .forEach((enemyAttack) => {
        Object.entries(availableCoords).forEach(([origin, coords]) => {
          if (
            coords.includes(enemyAttack.coord) &&
            origin !== enemyAttack.destroyItemCoord
          ) {
            pushTo(defendCoords, origin, {
              coord: enemyAttack.coord,
              inDangerCoord: enemyAttack.destroyItemCoord,
            });
          }
        });
      });

    return defendCoords;
  };

  getItemsByColor = (color: CheckersColorType): CheckersItemType[] =>
    Object.values(this.board)
      .map(({ item }) => item)
      .filter((item): item is CheckersItemType => item?.color === color);

  getAvailableColumns = (coord: string, movement: MovementType): string[] => {
    const item = this.getItem(coord);

    if (!item) return [];

    const columns = getAvailableColumns(coord, movement);
    const availableColumns: Record<string, string[]> = {};
    const captureDirections = new Set<string>();

    Object.entries(columns).forEach(([key, coords]) => {
      availableColumns[key] = [];

      for (const currentCoord of coords) {
        if (!this.isExistCoord(currentCoord)) continue;

        // Empty squares before a capture are plain moves; after a capture
        // they are further landing squares for a king.
        if (this.isEmpty(currentCoord)) {
          availableColumns[key].push(currentCoord);
          continue;
        }

        if (captureDirections.has(key)) break;

        const nextItem = this.getItem(currentCoord);

        if (!nextItem || nextItem.color === item.color) break;

        // An enemy piece: it can be captured if the next square is empty.
        const direction = this.getDirection(coord, currentCoord) as Direction;
        const [afterCoord] = Object.values(
          getAvailableColumns(currentCoord, { stepCount: 1, [direction]: true })
        ).flat();

        if (!this.isExistCoord(afterCoord) || !this.isEmpty(afterCoord)) break;

        availableColumns[key] = [afterCoord];
        captureDirections.add(key);
      }
    });

    // A capture, when available, is the only legal move for this piece.
    const keys = captureDirections.size
      ? [...captureDirections]
      : Object.keys(availableColumns);

    return [...new Set(keys.flatMap((key) => availableColumns[key]))];
  };

  autoPlay = (
    color: CheckersColorType,
    { onSelect, onMove }: AutoPlayCallbacks = {}
  ): void => {
    const play = (fromCoord: string, toCoord: string) => {
      onSelect?.(fromCoord);
      onMove?.(fromCoord, toCoord);
    };

    // 1. Capture.
    const [attack] = Object.entries(this.getAttackCoordsByColor(color));

    if (attack) {
      const [origin, [{ coord }]] = attack;
      return play(origin, coord);
    }

    // 2. Defend a piece that is about to be captured.
    const [defend] = Object.entries(this.getDefendCoordsByColor(color));

    if (defend) {
      const [origin, [{ coord }]] = defend;
      return play(origin, coord);
    }

    const normalMoves = this.getAvailableCoordsByColor(color);
    const enemyMoves = Object.values(
      this.getAvailableCoordsByColor(getEnemyColor(color))
    ).flat();

    // 3. Promote a piece.
    const kingRowId = color === CHECKERS_WHITE ? this.config.x - 1 : 0;

    for (const [origin, moves] of Object.entries(normalMoves)) {
      const [rowId] = parseCoord(origin);
      const promotion = moves.find((move) => {
        const [moveRowId] = parseCoord(move);
        return rowId !== moveRowId && moveRowId === kingRowId;
      });

      if (promotion) return play(origin, promotion);
    }

    // 4. Prefer squares the enemy cannot reach, then drop moves that leave
    //    a piece open to capture.
    const safeMoves: Record<string, string[]> = {};

    Object.entries(normalMoves).forEach(([origin, moves]) => {
      moves
        .filter((move) => !enemyMoves.includes(move))
        .forEach((move) => pushTo(safeMoves, origin, move));
    });

    const candidates = Object.keys(safeMoves).length ? safeMoves : normalMoves;
    const lowRiskMoves: Record<string, string[]> = {};

    Object.entries(candidates).forEach(([origin, moves]) => {
      moves.forEach((move) => {
        const nextBoard = this.clone();
        nextBoard.moveItem(origin, move);

        const defends = Object.values(nextBoard.getDefendCoordsByColor(color));

        if (!defends.flat().length) pushTo(lowRiskMoves, origin, move);
      });
    });

    // 5. Pick a piece at random and move it as far forward as possible.
    //    White moves down the board (rows increase), black moves up.
    const moves = Object.keys(lowRiskMoves).length ? lowRiskMoves : candidates;
    const forward = color === CHECKERS_WHITE ? -1 : 1;

    Object.values(moves).forEach((list) =>
      list.sort((a, b) => forward * (parseCoord(a)[0] - parseCoord(b)[0]))
    );

    const origins = Object.keys(moves);
    const origin = origins[Math.floor(Math.random() * origins.length)];

    if (origin) play(origin, moves[origin][0]);
  };

  /** A copy of this board with the same variant and position. */
  clone(): this {
    const Variant = this.constructor as new (config: BoardConfig) => this;
    const copy = new Variant(this.config);

    Object.entries(this.board).forEach(([coord, { item }]) => {
      copy.board[coord].item = item
        ? this.createItem(JSON.parse(JSON.stringify(item)))
        : null;
    });

    return copy;
  }
}

export default CheckersBoard;

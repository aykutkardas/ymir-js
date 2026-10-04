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
  /** Called once per step; a capture chain calls it for every jump. */
  onMove?: (fromCoord: string, toCoord: string) => void;
};

export type CheckersMove = {
  from: string;
  /** Squares the piece lands on, in order; the last one is where it ends. */
  path: string[];
  /** Captured pieces, in the order they are jumped. Empty for a plain move. */
  captured: string[];
};

const DELTAS: Record<Direction, [number, number]> = {
  top: [-1, 0],
  bottom: [1, 0],
  left: [0, -1],
  right: [0, 1],
  topLeft: [-1, -1],
  topRight: [-1, 1],
  bottomLeft: [1, -1],
  bottomRight: [1, 1],
};

const OPPOSITE: Record<Direction, Direction> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
  topLeft: 'bottomRight',
  topRight: 'bottomLeft',
  bottomLeft: 'topRight',
  bottomRight: 'topLeft',
};

const LINEAR: Direction[] = ['top', 'bottom', 'left', 'right'];
const ANGULAR: Direction[] = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];

const step = (coord: string, [dRow, dCol]: [number, number]) => {
  const [rowId, colId] = parseCoord(coord);
  return `${rowId + dRow}|${colId + dCol}`;
};

const getEnemyColor = (color: CheckersColorType): CheckersColorType =>
  color === CHECKERS_WHITE ? CHECKERS_BLACK : CHECKERS_WHITE;

const pushTo = <T>(target: Record<string, T[]>, key: string, value: T) => {
  (target[key] ??= []).push(value);
};

const unique = (values: string[]) => [...new Set(values)];

/**
 * Rules shared by every checkers variant. Variants provide the starting
 * position and how a piece is created; movement comes from the piece itself.
 *
 * All rules live in `getCaptureSequences` and `getPlainMoves`. Everything
 * else, including the older single-step methods, is built on top of them.
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

  /** Directions a piece may capture in. By default, the ones it moves in. */
  protected getCaptureDirections(item: CheckersItemType): Direction[] {
    return this.getMoveDirections(item.movement);
  }

  /**
   * Whether captured pieces leave the board as soon as they are jumped
   * (Turkish) or only once the whole move is over (International). When
   * they stay, they block the way and cannot be jumped twice.
   */
  protected removesCapturedImmediately(): boolean {
    return false;
  }

  private getMoveDirections(movement: MovementType): Direction[] {
    const directions = new Set<Direction>(
      (Object.keys(DELTAS) as Direction[]).filter((d) => movement[d])
    );

    if (movement.linear) LINEAR.forEach((d) => directions.add(d));
    if (movement.angular) ANGULAR.forEach((d) => directions.add(d));

    return [...directions];
  }

  /** Row a piece of this color is promoted on. */
  getKingRowId(color: CheckersColorType): number {
    return color === CHECKERS_WHITE ? this.config.rows - 1 : 0;
  }

  init(): this {
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

  getItemsByColor(color: CheckersColorType): CheckersItemType[] {
    return Object.values(this.board)
      .map(({ item }) => item)
      .filter((item): item is CheckersItemType => item?.color === color);
  }

  private getCoordsByColor(color: CheckersColorType): string[] {
    return Object.keys(this.board).filter(
      (coord) => this.getItem(coord)?.color === color
    );
  }

  /**
   * Squares the piece on `coord` can move to without capturing: empty
   * squares along each of its directions, up to its step count.
   */
  getPlainMoves(
    coord: string,
    movement: MovementType | undefined = this.getItem(coord)?.movement
  ): string[] {
    if (!this.getItem(coord) || !movement) return [];

    const columns = this.getColumnsByDirection(coord, movement);

    return unique(
      Object.values(columns).flatMap((squares) => {
        const reachable: string[] = [];

        for (const square of squares) {
          if (!this.isEmpty(square)) break;
          reachable.push(square);
        }

        return reachable;
      })
    );
  }

  /**
   * Every complete capture chain the piece on `coord` can make. A chain
   * goes on while another capture is possible, so each result ends on a
   * square with nothing left to take.
   */
  getCaptureSequences(coord: string): CheckersMove[] {
    const item = this.getItem(coord);

    if (!item) return [];

    const immediate = this.removesCapturedImmediately();
    const directions = this.getCaptureDirections(item);
    const sequences: CheckersMove[] = [];

    const isFree = (square: string, captured: string[]) =>
      this.isExistCoord(square) &&
      (square === coord ||
        this.isEmpty(square) ||
        (immediate && captured.includes(square)));

    const walk = (
      at: string,
      path: string[],
      captured: string[],
      lastDirection?: Direction
    ) => {
      let canContinue = false;

      for (const direction of directions) {
        // With pieces removed on the spot, a king could otherwise jump
        // back over the square it just cleared.
        if (immediate && lastDirection === OPPOSITE[direction]) continue;

        const delta = DELTAS[direction];
        let target = step(at, delta);

        // A king may capture from a distance; a man only next to it.
        while (item.king && isFree(target, captured)) {
          target = step(target, delta);
        }

        const targetItem = this.getItem(target);

        if (
          !targetItem ||
          targetItem.color === item.color ||
          captured.includes(target)
        ) {
          continue;
        }

        let landing = step(target, delta);

        while (isFree(landing, captured)) {
          canContinue = true;
          walk(landing, [...path, landing], [...captured, target], direction);

          if (!item.king) break;
          landing = step(landing, delta);
        }
      }

      if (!canContinue && captured.length) {
        sequences.push({ from: coord, path, captured });
      }
    };

    walk(coord, [], []);

    return sequences;
  }

  /**
   * Legal moves for a color. Capturing is mandatory, and among captures
   * only the chains that take the most pieces are allowed. Pass
   * `fromCoord` to get the moves of a single piece under the same rules.
   */
  getLegalMoves(color: CheckersColorType, fromCoord?: string): CheckersMove[] {
    const origins = this.getCoordsByColor(color);
    const captures = origins.flatMap(this.getCaptureSequences);

    if (captures.length) {
      const most = Math.max(...captures.map((move) => move.captured.length));

      return captures.filter(
        (move) =>
          move.captured.length === most &&
          (!fromCoord || move.from === fromCoord)
      );
    }

    return origins
      .filter((origin) => !fromCoord || origin === fromCoord)
      .flatMap((origin) =>
        this.getPlainMoves(origin).map((to) => ({
          from: origin,
          path: [to],
          captured: [],
        }))
      );
  }

  /**
   * Plays a whole move: the piece ends on the last square of the path,
   * captured pieces are removed and a man that ends on its king row is
   * promoted.
   */
  playMove(move: CheckersMove): this {
    const item = this.getItem(move.from);
    const to = move.path[move.path.length - 1];

    if (!item || !to) return this;

    this.moveItem(move.from, to);
    move.captured.forEach(this.removeItem);

    if (!item.king && parseCoord(to)[0] === this.getKingRowId(item.color)) {
      item.setKing();
    }

    return this;
  }

  // Single-step API. These answer "where can this piece go next?" one jump
  // at a time and are kept for UIs that move piece by piece.

  /**
   * Next squares for the piece on `coord`: the first landing squares of
   * its captures if it has any, otherwise its plain moves. Unlike
   * `getLegalMoves`, this does not apply the maximum-capture rule.
   */
  getAvailableColumns(coord: string, movement?: MovementType): string[];
  /** @deprecated Use `getColumnsByDirection(coord, movement)`. */
  getAvailableColumns(
    coord: string,
    movement: MovementType,
    columnsObj: true
  ): Record<Direction, string[]>;
  getAvailableColumns(
    coord: string,
    movement?: MovementType,
    columnsObj?: boolean
  ): string[] | Record<Direction, string[]> {
    if (columnsObj && movement) {
      return this.getColumnsByDirection(coord, movement);
    }

    const captures = this.getCaptureSequences(coord);

    if (captures.length) return unique(captures.map((move) => move.path[0]));

    return this.getPlainMoves(coord, movement);
  }

  getAvailableCoordsByColor(color: CheckersColorType): Record<string, string[]> {
    const availableCoords: Record<string, string[]> = {};

    this.getCoordsByColor(color).forEach((coord) => {
      const coords = this.getAvailableColumns(coord);

      if (coords.length) availableCoords[coord] = coords;
    });

    return availableCoords;
  }

  /** First jumps of every capture a color can make, by piece. */
  getAttackCoordsByColor(color: CheckersColorType): Record<string, AttackCoord[]> {
    const attackCoords: Record<string, AttackCoord[]> = {};
    const seen = new Set<string>();

    this.getCoordsByColor(color).forEach((origin) => {
      this.getCaptureSequences(origin).forEach(({ path, captured }) => {
        const key = `${origin}>${path[0]}`;

        if (seen.has(key)) return;
        seen.add(key);

        pushTo(attackCoords, origin, {
          coord: path[0],
          destroyItemCoord: captured[0],
        });
      });
    });

    return attackCoords;
  }

  /**
   * Pieces of `color` that can move onto the landing square of an enemy
   * capture, blocking it.
   */
  getDefendCoordsByColor(color: CheckersColorType): Record<string, DefendCoord[]> {
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
  }

  /**
   * Squares between two coords on a straight or diagonal line that have a
   * piece on them, up to and including `toCoord`.
   */
  getItemsBetweenTwoCoords(fromCoord: string, toCoord: string): string[] {
    const direction = this.getDirection(fromCoord, toCoord);
    const distance = this.getDistanceBetweenTwoCoords(fromCoord, toCoord);

    if (!direction || !distance) return [];

    const items: string[] = [];
    const stepCount = Math.max(Math.abs(distance.x), Math.abs(distance.y));
    let square = fromCoord;

    for (let i = 0; i < stepCount; i += 1) {
      square = step(square, DELTAS[direction]);
      if (this.isExistCoord(square) && !this.isEmpty(square)) items.push(square);
    }

    return items;
  }

  /**
   * A simple computer player: capture as much as the rules require, then
   * block threats, promote, avoid danger and move forward. Calls `onMove`
   * once per jump.
   */
  autoPlay(
    color: CheckersColorType,
    { onSelect, onMove }: AutoPlayCallbacks = {}
  ): void {
    const legalMoves = this.getLegalMoves(color);
    const play = ({ from, path }: CheckersMove) => {
      onSelect?.(from);
      [from, ...path].reduce((prev, next) => {
        onMove?.(prev, next);
        return next;
      });
    };

    if (!legalMoves.length) return;

    // 1. Capture, taking as many pieces as the rules require.
    const [capture] = legalMoves.filter((move) => move.captured.length);

    if (capture) return play(capture);

    // From here on every move is a single step.
    const isMove = (from: string, to: string) => (move: CheckersMove) =>
      move.from === from && move.path[0] === to;

    // 2. Block an enemy capture.
    const defends = Object.entries(this.getDefendCoordsByColor(color));

    for (const [origin, [{ coord }]] of defends) {
      const move = legalMoves.find(isMove(origin, coord));
      if (move) return play(move);
    }

    // 3. Promote a piece.
    const kingRowId = this.getKingRowId(color);
    const promotion = legalMoves.find((move) => {
      const [fromRowId] = parseCoord(move.from);
      const [toRowId] = parseCoord(move.path[0]);
      return fromRowId !== toRowId && toRowId === kingRowId;
    });

    if (promotion) return play(promotion);

    // 4. Prefer squares the enemy cannot reach, then drop moves that leave
    //    a piece open to capture.
    const enemyReach = new Set(
      this.getLegalMoves(getEnemyColor(color)).map((move) => move.path[0])
    );
    const safe = legalMoves.filter((move) => !enemyReach.has(move.path[0]));
    const candidates = safe.length ? safe : legalMoves;

    const lowRisk = candidates.filter((move) => {
      const next = this.clone().playMove(move);
      return !Object.keys(next.getDefendCoordsByColor(color)).length;
    });

    // 5. Pick a piece at random and move it as far forward as possible.
    //    White moves down the board (rows increase), black moves up.
    const moves = lowRisk.length ? lowRisk : candidates;
    const origins = unique(moves.map((move) => move.from));
    const origin = origins[Math.floor(Math.random() * origins.length)];
    const forward = color === CHECKERS_WHITE ? -1 : 1;

    const [best] = moves
      .filter((move) => move.from === origin)
      .sort(
        (a, b) =>
          forward * (parseCoord(a.path[0])[0] - parseCoord(b.path[0])[0])
      );

    play(best);
  }

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

import { Board, Item, ItemType, parseCoord } from '@ymir-js/core';

export type GoColor = 'black' | 'white';

export type GoStoneType = ItemType & { color: GoColor };

export class GoStone extends Item implements GoStoneType {
  color: GoColor;

  constructor({ color }: { color: GoColor }) {
    super({ name: color });
    this.color = color;
  }
}

export type GoGroup = {
  color: GoColor;
  stones: string[];
  liberties: string[];
};

/** Every stone on the board, by coord: `b` for black, `w` for white. */
export type GoPosition = Record<string, 'b' | 'w'>;

export type GoScoringRules = 'area' | 'territory';

export type GoScore = {
  black: number;
  white: number;
  /** Points of empty board each side surrounds. */
  territory: { black: string[]; white: string[] };
  /** Empty points that touch both colours, or none. */
  neutral: string[];
  /** Positive when black is ahead, negative when white is. */
  margin: number;
  winner: GoColor | null;
};

export const otherColor = (color: GoColor): GoColor =>
  color === 'black' ? 'white' : 'black';

const GTP_LETTERS = 'ABCDEFGHJKLMNOPQRST'; // GTP skips "I"

/**
 * A Go board: stones, groups, liberties and captures. Ko and turns belong to
 * the game (`GoGame`), since they depend on the moves played before.
 */
class GoBoard extends Board<GoStone> {
  readonly size: number;

  constructor(size = 19) {
    if (!Number.isInteger(size) || size < 2 || size > 25) {
      throw new Error(`A Go board is 2 to 25 lines wide, got ${size}`);
    }

    super({ rows: size, cols: size });
    this.size = size;
  }

  getColor(coord: string): GoColor | null {
    return this.getItem(coord)?.color ?? null;
  }

  /** The group of connected stones on `coord`, with its liberties. */
  getGroup(coord: string): GoGroup | null {
    const color = this.getColor(coord);

    if (!color) return null;

    const stones = new Set([coord]);
    const liberties = new Set<string>();
    const queue = [coord];

    while (queue.length) {
      for (const next of this.getNeighbors(queue.pop()!)) {
        const nextColor = this.getColor(next);

        if (!nextColor) {
          liberties.add(next);
        } else if (nextColor === color && !stones.has(next)) {
          stones.add(next);
          queue.push(next);
        }
      }
    }

    return { color, stones: [...stones], liberties: [...liberties] };
  }

  /** Every group of stones on the board. */
  getGroups(): GoGroup[] {
    const seen = new Set<string>();
    const groups: GoGroup[] = [];

    Object.keys(this.board).forEach((coord) => {
      if (seen.has(coord) || !this.getColor(coord)) return;

      const group = this.getGroup(coord)!;
      group.stones.forEach((stone) => seen.add(stone));
      groups.push(group);
    });

    return groups;
  }

  /**
   * What placing a stone would do, without placing it: the stones it
   * captures, or why it is not allowed. Ko is checked by the game.
   */
  checkMove(
    color: GoColor,
    coord: string
  ): { legal: true; captured: string[] } | { legal: false; reason: 'occupied' | 'suicide' | 'off-board' } {
    if (!this.isExistCoord(coord)) return { legal: false, reason: 'off-board' };
    if (this.getColor(coord)) return { legal: false, reason: 'occupied' };

    this.setItem(coord, new GoStone({ color }));

    const captured = new Set<string>();

    for (const next of this.getNeighbors(coord)) {
      const group = this.getGroup(next);

      if (group && group.color !== color && !group.liberties.length) {
        group.stones.forEach((stone) => captured.add(stone));
      }
    }

    const suicide = !captured.size && !this.getGroup(coord)!.liberties.length;

    this.removeItem(coord);

    if (suicide) return { legal: false, reason: 'suicide' };

    return { legal: true, captured: [...captured] };
  }

  /**
   * Places a stone and removes the stones it captures. Returns the
   * captured coords, or null if the move is not allowed.
   */
  placeStone(color: GoColor, coord: string): string[] | null {
    const result = this.checkMove(color, coord);

    if (!result.legal) return null;

    this.setItem(coord, new GoStone({ color }));
    result.captured.forEach(this.removeItem);

    return result.captured;
  }

  getPosition(): GoPosition {
    const position: GoPosition = {};

    Object.entries(this.board).forEach(([coord, { item }]) => {
      if (item) position[coord] = item.color === 'black' ? 'b' : 'w';
    });

    return position;
  }

  setPosition(position: GoPosition): this {
    Object.keys(this.board).forEach(this.removeItem);

    Object.entries(position).forEach(([coord, code]) => {
      if (!this.isExistCoord(coord)) {
        throw new Error(`Point ${coord} is not on the board`);
      }
      this.setItem(coord, new GoStone({ color: code === 'b' ? 'black' : 'white' }));
    });

    return this;
  }

  /**
   * Scores the board. Stones in `dead` are taken off first and counted as
   * prisoners for the other side.
   *
   * - `area` (Chinese): stones on the board + surrounded empty points.
   * - `territory` (Japanese): surrounded empty points + prisoners
   *   (`captures` made during the game, plus dead stones).
   *
   * `komi` is added to white.
   */
  score({
    rules = 'area',
    komi = rules === 'area' ? 7.5 : 6.5,
    dead = [],
    captures = { black: 0, white: 0 },
  }: {
    rules?: GoScoringRules;
    komi?: number;
    dead?: string[];
    captures?: Record<GoColor, number>;
  } = {}): GoScore {
    const deadSet = new Set(dead);
    const colorAt = (coord: string) =>
      deadSet.has(coord) ? null : this.getColor(coord);

    const territory: GoScore['territory'] = { black: [], white: [] };
    const neutral: string[] = [];
    const seen = new Set<string>();

    Object.keys(this.board).forEach((start) => {
      if (seen.has(start) || colorAt(start)) return;

      const region = [start];
      const borders = new Set<GoColor>();
      seen.add(start);

      for (let i = 0; i < region.length; i += 1) {
        for (const next of this.getNeighbors(region[i])) {
          const color = colorAt(next);

          if (color) {
            borders.add(color);
          } else if (!seen.has(next)) {
            seen.add(next);
            region.push(next);
          }
        }
      }

      if (borders.size === 1) {
        territory[[...borders][0]].push(...region);
      } else {
        neutral.push(...region);
      }
    });

    const prisoners = { black: captures.black, white: captures.white };
    const stones = { black: 0, white: 0 };

    Object.keys(this.board).forEach((coord) => {
      const color = this.getColor(coord);
      if (!color) return;

      if (deadSet.has(coord)) {
        prisoners[otherColor(color)] += 1;
      } else {
        stones[color] += 1;
      }
    });

    const total = (color: GoColor) =>
      territory[color].length +
      (rules === 'area' ? stones[color] : prisoners[color]);

    const black = total('black');
    const white = total('white') + komi;
    const margin = black - white;

    return {
      black,
      white,
      territory,
      neutral,
      margin,
      winner: margin > 0 ? 'black' : margin < 0 ? 'white' : null,
    };
  }

  /** A coord in GTP notation, e.g. `D4` (columns skip I; row 1 is the bottom). */
  toGTP(coord: string): string {
    const [r, c] = parseCoord(coord);
    return `${GTP_LETTERS[c]}${this.size - r}`;
  }

  /** The coord of a GTP vertex such as `D4` or `q16`. */
  fromGTP(vertex: string): string {
    const match = /^([A-HJ-Z])(\d{1,2})$/i.exec(vertex.trim());
    const c = match ? GTP_LETTERS.indexOf(match[1].toUpperCase()) : -1;
    const r = match ? this.size - Number(match[2]) : -1;
    const coord = `${r}|${c}`;

    if (c < 0 || !this.isExistCoord(coord)) {
      throw new Error(`"${vertex}" is not a point on a ${this.size}x${this.size} board`);
    }

    return coord;
  }
}

export default GoBoard;

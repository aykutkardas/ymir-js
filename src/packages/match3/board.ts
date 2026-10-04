import parseCoord from '../../utils/parseCoord.js';
import Board, { BoardSize } from '../core/board.js';
import Item, { ItemType } from '../core/item.js';

export type Match3ItemType = ItemType & {
  /** Which kind of gem this is, e.g. 'red'. Gems of the same kind match. */
  kind: string;
};

export class Match3Item extends Item implements Match3ItemType {
  kind: string;

  constructor({ kind }: { kind: string }) {
    super({ name: kind });
    this.kind = kind;
  }
}

export type Match3Options = Partial<BoardSize> & {
  /** Gem kinds to draw from. At least 3. */
  kinds?: string[];
  /** Random source in [0, 1). Pass a seeded one for repeatable boards. */
  random?: () => number;
  /** Points per cleared gem. Each cascade step multiplies it: 1x, 2x, 3x, ... */
  pointsPerGem?: number;
};

export type Swap = { from: string; to: string };

/** One round of clearing: matches found, gems fallen and new gems added. */
export type CascadeStep = {
  /** Each run of three or more of a kind, as coords. */
  matches: string[][];
  /** Coords cleared in this step (every match, without duplicates). */
  cleared: string[];
  /** Gems that fell down to fill the gaps. */
  fallen: { from: string; to: string }[];
  /** New gems dropped in at the top. */
  spawned: { coord: string; kind: string }[];
  points: number;
};

export type SwapResult = {
  /** False when the swap made no match; the board is left unchanged. */
  valid: boolean;
  steps: CascadeStep[];
  points: number;
  /** True when no move was left after the cascade and the board was shuffled. */
  shuffled: boolean;
};

const DEFAULT_KINDS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];

/**
 * A match-3 board: swap two neighbouring gems to line up three or more of a
 * kind. Matches clear, gems above fall, new ones drop in, and the cascade
 * repeats until nothing matches.
 */
class Match3Board extends Board<Match3Item> {
  readonly kinds: string[];

  readonly pointsPerGem: number;

  private readonly random: () => number;

  constructor({
    rows = 8,
    cols = 8,
    kinds = DEFAULT_KINDS,
    random = Math.random,
    pointsPerGem = 10,
  }: Match3Options = {}) {
    super({ rows, cols });

    if (kinds.length < 3) throw new Error('A match-3 board needs at least 3 kinds');

    this.kinds = kinds;
    this.random = random;
    this.pointsPerGem = pointsPerGem;
  }

  /** Fills the board with gems: no ready-made matches, at least one move. */
  init(): this {
    do {
      this.forEachCoord((coord) => this.setItem(coord, null));
      this.forEachCoord((coord) =>
        this.setItem(coord, new Match3Item({ kind: this.pickKind(coord) }))
      );
    } while (!this.getPossibleMoves().length);

    return this;
  }

  /** Sets up gems from rows of kinds, e.g. `[['red', 'blue'], ...]`. */
  setKinds(rows: (string | null)[][]): this {
    rows.forEach((row, rowId) =>
      row.forEach((kind, colId) =>
        this.setItem(
          `${rowId}|${colId}`,
          kind ? new Match3Item({ kind }) : null
        )
      )
    );

    return this;
  }

  /** The kind on every square, row by row. */
  getKinds(): (string | null)[][] {
    return this.getBoardMatrix().map((row) =>
      row.map(({ item }) => item?.kind ?? null)
    );
  }

  isAdjacent(from: string, to: string): boolean {
    const [r1, c1] = parseCoord(from);
    const [r2, c2] = parseCoord(to);

    return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
  }

  /** Every run of three or more of the same kind, in rows and columns. */
  findMatches(): string[][] {
    const { rows, cols } = this.config;
    const matches: string[][] = [];

    const scan = (line: string[]) => {
      let run: string[] = [];

      const flush = () => {
        if (run.length >= 3) matches.push(run);
        run = [];
      };

      for (const coord of line) {
        const kind = this.getItem(coord)?.kind;

        if (kind && run.length && this.getItem(run[0])?.kind === kind) {
          run.push(coord);
        } else {
          flush();
          if (kind) run = [coord];
        }
      }

      flush();
    };

    for (let r = 0; r < rows; r += 1) {
      scan(Array.from({ length: cols }, (_, c) => `${r}|${c}`));
    }
    for (let c = 0; c < cols; c += 1) {
      scan(Array.from({ length: rows }, (_, r) => `${r}|${c}`));
    }

    return matches;
  }

  /** Whether swapping these two gems would make a match. */
  canSwap(from: string, to: string): boolean {
    if (!this.isAdjacent(from, to) || !this.getItem(from) || !this.getItem(to)) {
      return false;
    }

    this.switchItem(from, to);
    const matches = this.findMatches().length > 0;
    this.switchItem(from, to);

    return matches;
  }

  /** Every swap that makes a match. Empty means the board is stuck. */
  getPossibleMoves(): Swap[] {
    const moves: Swap[] = [];

    this.forEachCoord((from) => {
      const [r, c] = parseCoord(from);

      for (const to of [`${r}|${c + 1}`, `${r + 1}|${c}`]) {
        if (this.isExistCoord(to) && this.canSwap(from, to)) {
          moves.push({ from, to });
        }
      }
    });

    return moves;
  }

  /**
   * Swaps two neighbouring gems and resolves the cascade. If the swap makes
   * no match, nothing changes and `valid` is false.
   */
  swap(from: string, to: string): SwapResult {
    if (!this.canSwap(from, to)) {
      return { valid: false, steps: [], points: 0, shuffled: false };
    }

    this.switchItem(from, to);

    const steps: CascadeStep[] = [];

    for (let chain = 1; ; chain += 1) {
      const step = this.resolveStep(chain);
      if (!step) break;
      steps.push(step);
    }

    const shuffled = !this.getPossibleMoves().length;
    if (shuffled) this.shuffle();

    return {
      valid: true,
      steps,
      points: steps.reduce((sum, step) => sum + step.points, 0),
      shuffled,
    };
  }

  /**
   * Rearranges the gems on the board until there is no match and at least
   * one move. Falls back to new gems if the current ones cannot get there.
   */
  shuffle(): this {
    const kinds = this.getKinds().flat().filter((k): k is string => !!k);

    for (let attempt = 0; attempt < 100; attempt += 1) {
      const pool = [...kinds];

      for (let i = pool.length - 1; i > 0; i -= 1) {
        const j = Math.floor(this.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }

      this.forEachCoord((coord) =>
        this.setItem(coord, new Match3Item({ kind: pool.pop()! }))
      );

      if (!this.findMatches().length && this.getPossibleMoves().length) {
        return this;
      }
    }

    return this.init();
  }

  private resolveStep(chain: number): CascadeStep | null {
    const matches = this.findMatches();

    if (!matches.length) return null;

    const cleared = [...new Set(matches.flat())];
    cleared.forEach(this.removeItem);

    const { fallen, spawned } = this.collapse();

    return {
      matches,
      cleared,
      fallen,
      spawned,
      points: cleared.length * this.pointsPerGem * chain,
    };
  }

  /** Drops gems into the gaps below them and fills the top with new ones. */
  private collapse() {
    const { rows, cols } = this.config;
    const fallen: CascadeStep['fallen'] = [];
    const spawned: CascadeStep['spawned'] = [];

    for (let c = 0; c < cols; c += 1) {
      let target = rows - 1;

      for (let r = rows - 1; r >= 0; r -= 1) {
        const from = `${r}|${c}`;

        if (!this.getItem(from)) continue;

        const to = `${target}|${c}`;

        if (from !== to) {
          this.moveItem(from, to);
          fallen.push({ from, to });
        }

        target -= 1;
      }

      for (let r = target; r >= 0; r -= 1) {
        const coord = `${r}|${c}`;
        const kind = this.kinds[Math.floor(this.random() * this.kinds.length)];

        this.setItem(coord, new Match3Item({ kind }));
        spawned.push({ coord, kind });
      }
    }

    return { fallen, spawned };
  }

  /** A kind for `coord` that does not complete a run with the two gems to its left or above. */
  private pickKind(coord: string): string {
    const [r, c] = parseCoord(coord);
    const kindAt = (row: number, col: number) => this.getItem(`${row}|${col}`)?.kind;
    const banned = new Set<string>();

    if (c >= 2 && kindAt(r, c - 1) && kindAt(r, c - 1) === kindAt(r, c - 2)) {
      banned.add(kindAt(r, c - 1)!);
    }
    if (r >= 2 && kindAt(r - 1, c) && kindAt(r - 1, c) === kindAt(r - 2, c)) {
      banned.add(kindAt(r - 1, c)!);
    }

    const allowed = this.kinds.filter((kind) => !banned.has(kind));

    return allowed[Math.floor(this.random() * allowed.length)];
  }

  private forEachCoord(callback: (coord: string) => void) {
    Object.keys(this.board).forEach(callback);
  }
}

export default Match3Board;

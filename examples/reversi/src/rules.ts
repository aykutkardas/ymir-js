// Reversi, written on top of ymir-js's core Board and Item. A disc is an item;
// the eight lines out of a square come from the core's ray.
import { Board, DIRECTIONS, Item } from 'ymir-js';

export type Color = 'black' | 'white';

export type Move = { coord: string; flips: string[] };

export type Status =
  | { state: 'playing' }
  | { state: 'over'; winner: Color | null; black: number; white: number };

export const SIZE = 8;

export const other = (color: Color): Color => (color === 'black' ? 'white' : 'black');

export class Disc extends Item {
  color: Color;

  constructor(color: Color) {
    super({ name: color });
    this.color = color;
  }
}

/** The board: discs, and which discs a move would flip. */
export class ReversiBoard extends Board<Disc> {
  constructor() {
    super({ rows: SIZE, cols: SIZE });
  }

  /** The standard start: two discs of each colour in the centre, crossed. */
  setup(): this {
    return this.load(['', '', '', '...wb', '...bw']);
  }

  /**
   * The discs `color` would flip by playing on `coord`: along each of the
   * eight lines, a run of the other colour closed by one of ours.
   */
  flipsFor(coord: string, color: Color): string[] {
    if (!this.isEmpty(coord)) return [];

    const flips: string[] = [];

    for (const direction of DIRECTIONS) {
      const run: string[] = [];

      for (const square of this.ray(coord, direction)) {
        const disc = this.getItem(square);
        if (!disc) break; // an empty square or the edge: nothing closes the run
        if (disc.color === color) {
          flips.push(...run);
          break;
        }
        run.push(square);
      }
    }

    return flips;
  }

  /** Every square `color` may play on, with what it flips. */
  movesFor(color: Color): Move[] {
    return Object.keys(this.board)
      .map((coord) => ({ coord, flips: this.flipsFor(coord, color) }))
      .filter((move) => move.flips.length > 0);
  }

  /** Places a disc and flips the bracketed ones. Assumes the move is legal. */
  play(color: Color, { coord, flips }: Move) {
    this.setItem(coord, new Disc(color));
    flips.forEach((square) => (this.getItem(square)!.color = color));
  }

  count(color: Color): number {
    return this.countItems((disc) => disc.color === color);
  }

  /** The position as rows of b / w / . */
  toString(): string {
    return this.toRows((disc) => (disc ? disc.color[0] : '.')).join('\n');
  }

  /** Sets up a position from rows of b / w / . */
  load(rows: string[]): this {
    return this.loadRows(rows, (ch) => (ch === 'b' ? new Disc('black') : ch === 'w' ? new Disc('white') : null));
  }
}

/** A game: turns, passing when you cannot move, undo and the result. */
export class ReversiGame {
  readonly board: ReversiBoard;

  turn: Color = 'black';

  /** Moves played; `null` is a pass. */
  history: { color: Color; move: Move | null; before: string }[] = [];

  constructor(rows?: string[]) {
    this.board = rows ? new ReversiBoard().load(rows) : new ReversiBoard().setup();
  }

  legalMoves(): Move[] {
    return this.board.movesFor(this.turn);
  }

  getStatus(): Status {
    if (this.legalMoves().length || this.board.movesFor(other(this.turn)).length) {
      return { state: 'playing' };
    }

    const black = this.board.count('black');
    const white = this.board.count('white');
    return { state: 'over', winner: black > white ? 'black' : white > black ? 'white' : null, black, white };
  }

  /** Plays on `coord` for the side to move. Throws if it flips nothing. */
  play(coord: string): Move {
    const move = this.legalMoves().find((m) => m.coord === coord);
    if (!move) throw new Error(`${this.turn} cannot play on ${coord}`);

    this.history.push({ color: this.turn, move, before: this.board.toString() });
    this.board.play(this.turn, move);
    this.turn = other(this.turn);
    this.passIfStuck();
    return move;
  }

  /** Takes back the last move (and a pass that followed it). */
  undo(): boolean {
    const last = this.history.pop();
    if (!last) return false;

    this.board.load(last.before.split('\n'));
    this.turn = last.color;
    // A pass on its own is not something to take back; undo the move before it too.
    if (last.move === null) return this.undo();
    return true;
  }

  /** When the side to move has no move but the other side does, it passes. */
  private passIfStuck() {
    if (!this.legalMoves().length && this.board.movesFor(other(this.turn)).length) {
      this.history.push({ color: this.turn, move: null, before: this.board.toString() });
      this.turn = other(this.turn);
    }
  }

  /** Whether the last thing that happened was a pass. */
  get lastWasPass(): boolean {
    return this.history[this.history.length - 1]?.move === null;
  }
}

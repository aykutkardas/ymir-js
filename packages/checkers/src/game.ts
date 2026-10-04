import type CheckersBoard from './board.js';
import type {
  CheckersColorType,
  CheckersMove,
  CheckersPosition,
  CheckersVariant,
} from './board.js';
import { CHECKERS_BLACK, CHECKERS_WHITE } from './constant.js';
import InternationalCheckersBoard from './international/board.js';
import TurkishCheckersBoard from './turkish/board.js';

export type DrawRules = {
  /** Draw when the same position, with the same side to move, occurs this many times. */
  repetition: number | false;
  /**
   * Draw after this many moves in a row (counting both sides) in which only
   * kings moved and nothing was captured.
   */
  kingMoves: number | false;
  /**
   * FMJD endgame rule. One side has a single king; the other has three
   * pieces including a king (draw after 16 moves each), or two pieces or
   * fewer including a king (draw after 5 moves each). Counting starts when
   * that material first appears and restarts when a piece is captured.
   */
  loneKing: boolean;
  /** Turkish "gayyım": draw as soon as each side has a single piece. */
  onePieceEach: boolean;
};

export type DrawReason =
  | 'repetition'
  | 'king-moves'
  | 'lone-king'
  | 'one-piece-each';

export type GameStatus =
  | { state: 'playing' }
  | { state: 'won'; winner: CheckersColorType; reason: 'no-moves' }
  | { state: 'draw'; reason: DrawReason };

export type GameOptions = {
  /** Side to move first. Both variants start with white. */
  turn?: CheckersColorType;
  drawRules?: Partial<DrawRules>;
};

/** Everything needed to restore a game: start position and moves played. */
export type SavedGame = {
  variant: CheckersVariant;
  start: { position: CheckersPosition; turn: CheckersColorType };
  moves: CheckersMove[];
  drawRules: DrawRules;
};

type Snapshot = {
  position: CheckersPosition;
  turn: CheckersColorType;
  kingMoves: number;
  loneKingMoves: number;
};

const DEFAULT_DRAW_RULES: Record<CheckersVariant, DrawRules> = {
  // FMJD: threefold repetition, 25 moves each with only kings and no
  // captures, and the 16- and 5-move endgame rules.
  international: {
    repetition: 3,
    kingMoves: 50,
    loneKing: true,
    onePieceEach: false,
  },
  // Threefold repetition, and a draw once each side has one piece left.
  turkish: {
    repetition: 3,
    kingMoves: false,
    loneKing: false,
    onePieceEach: true,
  },
};

/**
 * Moves (both sides counted) after which the FMJD lone-king rule draws the
 * position, or null if the rule does not apply to it.
 */
const loneKingLimit = (position: CheckersPosition): number | null => {
  const pieces = Object.values(position);
  const sides = (['w', 'b'] as const).map((color) => {
    const own = pieces.filter((code) => code.toLowerCase() === color);
    return { count: own.length, kings: own.filter((c) => c !== color).length };
  });

  for (const [lone, other] of [sides, [...sides].reverse()]) {
    if (lone.count !== 1 || lone.kings !== 1 || other.kings < 1) continue;
    if (other.count === 3) return 32;
    if (other.count <= 2) return 10;
  }

  return null;
};

const other = (color: CheckersColorType): CheckersColorType =>
  color === CHECKERS_WHITE ? CHECKERS_BLACK : CHECKERS_WHITE;

const positionKey = (position: CheckersPosition, turn: CheckersColorType) =>
  `${turn}:${Object.entries(position)
    .map(([coord, code]) => `${coord}${code}`)
    .sort()
    .join(',')}`;

const createBoard = (variant: CheckersVariant): CheckersBoard =>
  variant === 'turkish'
    ? new TurkishCheckersBoard()
    : new InternationalCheckersBoard();

/**
 * A game of checkers: whose turn it is, the moves played, undo/redo, and
 * whether the game is over. The board holds the position; the game is the
 * only thing that should change it while a game is in progress.
 */
class CheckersGame<B extends CheckersBoard = CheckersBoard> {
  readonly board: B;

  readonly drawRules: DrawRules;

  turn: CheckersColorType;

  private readonly start: Snapshot;

  private past: { move: CheckersMove; before: Snapshot }[] = [];

  private future: CheckersMove[] = [];

  private kingMoves = 0;

  private loneKingMoves = 0;

  private seen = new Map<string, number>();

  /** Starts a game from the board's current position. */
  constructor(board: B, options: GameOptions = {}) {
    this.board = board;
    this.turn = options.turn ?? CHECKERS_WHITE;
    this.drawRules = {
      ...DEFAULT_DRAW_RULES[board.variant],
      ...options.drawRules,
    };
    this.start = this.snapshot();
    this.countPosition(1);
  }

  /** A new game in the starting position of `variant`. */
  static create(
    variant: CheckersVariant,
    options?: GameOptions
  ): CheckersGame {
    return new CheckersGame(createBoard(variant).init(), options);
  }

  /** Restores a game saved with `toJSON`, replaying its moves. */
  static fromJSON(saved: SavedGame): CheckersGame {
    const board = createBoard(saved.variant).setPosition(saved.start.position);
    const game = new CheckersGame(board, {
      turn: saved.start.turn,
      drawRules: saved.drawRules,
    });

    saved.moves.forEach((move) => game.play(move));

    return game;
  }

  get moves(): CheckersMove[] {
    return this.past.map(({ move }) => move);
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  /** Legal moves for the side to move; none once the game is over. */
  getLegalMoves(fromCoord?: string): CheckersMove[] {
    if (this.getStatus().state !== 'playing') return [];

    return this.board.getLegalMoves(this.turn, fromCoord);
  }

  getStatus(): GameStatus {
    const { repetition, kingMoves, loneKing, onePieceEach } = this.drawRules;
    const position = this.board.getPosition();
    const pieces = Object.values(position);

    if (
      onePieceEach &&
      pieces.filter((code) => code.toLowerCase() === 'w').length === 1 &&
      pieces.filter((code) => code.toLowerCase() === 'b').length === 1
    ) {
      return { state: 'draw', reason: 'one-piece-each' };
    }

    if (!this.board.getLegalMoves(this.turn).length) {
      return { state: 'won', winner: other(this.turn), reason: 'no-moves' };
    }

    if (repetition && this.timesSeen() >= repetition) {
      return { state: 'draw', reason: 'repetition' };
    }

    if (kingMoves && this.kingMoves >= kingMoves) {
      return { state: 'draw', reason: 'king-moves' };
    }

    const limit = loneKing ? loneKingLimit(position) : null;

    if (limit !== null && this.loneKingMoves >= limit) {
      return { state: 'draw', reason: 'lone-king' };
    }

    return { state: 'playing' };
  }

  /**
   * Plays a legal move for the side to move. `captured` can be left out;
   * the move is matched by `from` and `path`. Throws if the move is not
   * legal or the game is over.
   */
  play(move: Pick<CheckersMove, 'from' | 'path'>): CheckersMove {
    const legal = this.getLegalMoves(move.from).find(
      (candidate) => candidate.path.join() === move.path.join()
    );

    if (!legal) {
      throw new Error(
        `Illegal move for ${this.turn}: ${[move.from, ...move.path].join(' > ')}`
      );
    }

    this.apply(legal);
    this.future = [];

    return legal;
  }

  /** Takes back the last move. Returns it, or null if there is none. */
  undo(): CheckersMove | null {
    const last = this.past.pop();

    if (!last) return null;

    this.countPosition(-1);
    this.restore(last.before);
    this.future.push(last.move);

    return last.move;
  }

  /** Plays the last undone move again. Returns it, or null if there is none. */
  redo(): CheckersMove | null {
    const move = this.future.pop();

    if (!move) return null;

    this.apply(move);

    return move;
  }

  /** Back to the starting position, with no history. */
  reset(): void {
    this.past = [];
    this.future = [];
    this.seen.clear();
    this.restore(this.start);
    this.countPosition(1);
  }

  toJSON(): SavedGame {
    return {
      variant: this.board.variant,
      start: { position: this.start.position, turn: this.start.turn },
      moves: this.moves,
      drawRules: this.drawRules,
    };
  }

  private apply(move: CheckersMove) {
    const before = this.snapshot();
    const item = this.board.getItem(move.from);
    const quietKingMove = !!item?.king && !move.captured.length;

    const inLoneKingEnding = loneKingLimit(before.position) !== null;

    this.board.playMove(move);
    this.past.push({ move, before });
    this.turn = other(this.turn);
    this.kingMoves = quietKingMove ? this.kingMoves + 1 : 0;
    // Count moves inside a lone-king ending; a capture starts a new count.
    this.loneKingMoves =
      inLoneKingEnding && !move.captured.length ? this.loneKingMoves + 1 : 0;
    this.countPosition(1);
  }

  private snapshot(): Snapshot {
    return {
      position: this.board.getPosition(),
      turn: this.turn,
      kingMoves: this.kingMoves,
      loneKingMoves: this.loneKingMoves,
    };
  }

  private restore({ position, turn, kingMoves, loneKingMoves }: Snapshot) {
    this.board.setPosition(position);
    this.turn = turn;
    this.kingMoves = kingMoves;
    this.loneKingMoves = loneKingMoves;
  }

  private timesSeen(): number {
    return this.seen.get(positionKey(this.board.getPosition(), this.turn)) ?? 0;
  }

  private countPosition(delta: 1 | -1) {
    const key = positionKey(this.board.getPosition(), this.turn);
    const count = (this.seen.get(key) ?? 0) + delta;

    if (count > 0) {
      this.seen.set(key, count);
    } else {
      this.seen.delete(key);
    }
  }
}

export default CheckersGame;

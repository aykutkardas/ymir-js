import GoBoard, {
  GoColor,
  GoPosition,
  GoScore,
  GoScoringRules,
  otherColor,
} from './board.js';

export type GoMove =
  | { type: 'play'; color: GoColor; coord: string; captured: string[] }
  | { type: 'pass'; color: GoColor };

export type GoKoRule =
  /** A move may not recreate the position from just before the opponent's last move. */
  | 'simple'
  /** A move may not recreate any earlier position. */
  | 'positional';

export type GoGameOptions = {
  size?: number;
  rules?: GoScoringRules;
  komi?: number;
  ko?: GoKoRule;
  /** Stones placed before the first move (e.g. handicap). Black then gives white the first move. */
  setup?: GoPosition;
  turn?: GoColor;
};

export type GoStatus =
  | { state: 'playing' }
  /** Both players passed. Mark dead stones, then read `getScore()`. */
  | { state: 'scoring' }
  | { state: 'resigned'; winner: GoColor };

export type GoIllegalReason = 'occupied' | 'suicide' | 'off-board' | 'ko' | 'game-over';

export type SavedGoGame = {
  size: number;
  rules: GoScoringRules;
  komi: number;
  ko: GoKoRule;
  setup: GoPosition;
  turn: GoColor;
  moves: ({ type: 'play'; coord: string } | { type: 'pass' } | { type: 'resign' })[];
  dead: string[];
};

const positionKey = (position: GoPosition) =>
  Object.entries(position)
    .map(([coord, color]) => `${coord}${color}`)
    .sort()
    .join(',');

/**
 * A game of Go: turns, captures, ko, passing, resigning, dead stones and
 * the score.
 */
class GoGame {
  readonly board: GoBoard;

  readonly rules: GoScoringRules;

  readonly komi: number;

  readonly ko: GoKoRule;

  turn: GoColor;

  /** Stones each colour has captured. */
  captures: Record<GoColor, number> = { black: 0, white: 0 };

  private readonly setup: GoPosition;

  private readonly firstTurn: GoColor;

  private history: { move: GoMove; before: GoPosition }[] = [];

  private resignedBy: GoColor | null = null;

  private dead = new Set<string>();

  constructor({
    size = 19,
    rules = 'area',
    komi = rules === 'area' ? 7.5 : 6.5,
    ko = 'simple',
    setup = {},
    turn,
  }: GoGameOptions = {}) {
    this.board = new GoBoard(size).setPosition(setup);
    this.rules = rules;
    this.komi = komi;
    this.ko = ko;
    this.setup = setup;
    this.firstTurn = turn ?? (Object.keys(setup).length ? 'white' : 'black');
    this.turn = this.firstTurn;
  }

  static fromJSON(saved: SavedGoGame): GoGame {
    const game = new GoGame(saved);

    saved.moves.forEach((move) => {
      if (move.type === 'play') game.play(move.coord);
      else if (move.type === 'pass') game.pass();
      else game.resign();
    });
    saved.dead.forEach((coord) => game.toggleDead(coord));

    return game;
  }

  get moves(): GoMove[] {
    return this.history.map(({ move }) => move);
  }

  /** The point a simple-ko rule forbids right now, if any. */
  get koPoint(): string | null {
    const last = this.history[this.history.length - 1]?.move;

    if (last?.type !== 'play' || last.captured.length !== 1) return null;

    const [point] = last.captured;
    const check = this.checkPlay(point);

    return !check.legal && check.reason === 'ko' ? point : null;
  }

  getStatus(): GoStatus {
    if (this.resignedBy) return { state: 'resigned', winner: otherColor(this.resignedBy) };

    const [a, b] = this.history.slice(-2).map(({ move }) => move.type);

    return a === 'pass' && b === 'pass' ? { state: 'scoring' } : { state: 'playing' };
  }

  /** Whether the side to move may play on `coord`, and why not if not. */
  checkPlay(
    coord: string
  ): { legal: true; captured: string[] } | { legal: false; reason: GoIllegalReason } {
    if (this.getStatus().state !== 'playing') return { legal: false, reason: 'game-over' };

    const result = this.board.checkMove(this.turn, coord);

    if (!result.legal) return result;

    // Try the move to see the position it would make.
    const before = this.board.getPosition();
    this.board.placeStone(this.turn, coord);
    const after = positionKey(this.board.getPosition());
    this.board.setPosition(before);

    const forbidden =
      this.ko === 'simple'
        ? this.history.length
          ? [positionKey(this.history[this.history.length - 1].before)]
          : []
        : [positionKey(this.setup), ...this.history.map(({ before: b }) => positionKey(b))];

    if (forbidden.includes(after)) return { legal: false, reason: 'ko' };

    return result;
  }

  /** Every point the side to move may play on. */
  getLegalMoves(): string[] {
    return Object.keys(this.board.board).filter(
      (coord) => this.checkPlay(coord).legal
    );
  }

  /** Plays a stone for the side to move. Throws if it is not allowed. */
  play(coord: string): GoMove {
    const check = this.checkPlay(coord);

    if (!check.legal) {
      throw new Error(`Illegal move for ${this.turn} at ${coord}: ${check.reason}`);
    }

    const before = this.board.getPosition();
    const captured = this.board.placeStone(this.turn, coord)!;
    const move: GoMove = { type: 'play', color: this.turn, coord, captured };

    this.captures[this.turn] += captured.length;
    this.history.push({ move, before });
    this.turn = otherColor(this.turn);

    return move;
  }

  pass(): GoMove {
    if (this.getStatus().state !== 'playing') throw new Error('The game is over');

    const move: GoMove = { type: 'pass', color: this.turn };

    this.history.push({ move, before: this.board.getPosition() });
    this.turn = otherColor(this.turn);

    return move;
  }

  /** The side to move resigns. */
  resign(): void {
    if (this.getStatus().state !== 'playing') throw new Error('The game is over');
    this.resignedBy = this.turn;
  }

  /** Takes back the last move (or a resignation). Dead-stone marks are cleared. */
  undo(): GoMove | null {
    this.dead.clear();

    if (this.resignedBy) {
      this.resignedBy = null;
      return null;
    }

    const last = this.history.pop();

    if (!last) return null;

    this.board.setPosition(last.before);
    this.turn = last.move.color;
    if (last.move.type === 'play') this.captures[last.move.color] -= last.move.captured.length;

    return last.move;
  }

  /** Marks or unmarks the whole group on `coord` as dead, for scoring. */
  toggleDead(coord: string): void {
    const group = this.board.getGroup(coord);

    if (!group) return;

    const isDead = this.dead.has(coord);
    group.stones.forEach((stone) =>
      isDead ? this.dead.delete(stone) : this.dead.add(stone)
    );
  }

  getDeadStones(): string[] {
    return [...this.dead];
  }

  /** The score with the current dead-stone marks. */
  getScore(): GoScore {
    return this.board.score({
      rules: this.rules,
      komi: this.komi,
      dead: [...this.dead],
      captures: this.captures,
    });
  }

  toJSON(): SavedGoGame {
    return {
      size: this.board.size,
      rules: this.rules,
      komi: this.komi,
      ko: this.ko,
      setup: this.setup,
      turn: this.firstTurn,
      moves: [
        ...this.history.map(({ move }) =>
          move.type === 'play'
            ? { type: 'play' as const, coord: move.coord }
            : { type: 'pass' as const }
        ),
        ...(this.resignedBy ? [{ type: 'resign' as const }] : []),
      ],
      dead: [...this.dead],
    };
  }
}

export default GoGame;

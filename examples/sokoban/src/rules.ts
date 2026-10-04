// Sokoban, written on top of ymir-js's core Board and Item. Walls, boxes and
// the player are items on the board; goals are marks on the floor.
import { Board, Item, type Direction } from 'ymir-js';

export type Kind = 'wall' | 'box' | 'player';
export type Move = 'top' | 'bottom' | 'left' | 'right';

export type Level = {
  name: string;
  /**
   * The usual Sokoban text format: `#` wall, `@` player, `$` box, `.` goal,
   * `*` box on a goal, `+` player on a goal, space floor.
   */
  map: string[];
};

export class Tile extends Item {
  kind: Kind;

  constructor(kind: Kind) {
    super({ name: kind });
    this.kind = kind;
  }
}

/** The board and its rules: the player walks, and pushes one box at a time. */
export class SokobanBoard extends Board<Tile> {
  readonly goals: Set<string>;

  /** Squares inside the walls, where the player could ever be. */
  readonly floor: Set<string>;

  constructor(level: Level) {
    const rows = level.map.length;
    const cols = Math.max(...level.map.map((line) => line.length));
    super({ rows, cols });

    this.goals = new Set();
    level.map.forEach((line, r) =>
      [...line].forEach((ch, c) => {
        const coord = `${r}|${c}`;
        if (ch === '#') this.setItem(coord, new Tile('wall'));
        if (ch === '$' || ch === '*') this.setItem(coord, new Tile('box'));
        if (ch === '@' || ch === '+') this.setItem(coord, new Tile('player'));
        if (ch === '.' || ch === '*' || ch === '+') this.goals.add(coord);
      })
    );

    this.floor = this.findFloor();
  }

  findPlayer(): string {
    return Object.keys(this.board).find((coord) => this.getItem(coord)?.kind === 'player')!;
  }

  boxes(): string[] {
    return Object.keys(this.board).filter((coord) => this.getItem(coord)?.kind === 'box');
  }

  isSolved(): boolean {
    return this.boxes().every((coord) => this.goals.has(coord));
  }

  /**
   * Tries to move the player one square. Returns 'walk', 'push', or null if
   * the way is blocked (a wall, or a box that cannot move on).
   */
  step(direction: Move): 'walk' | 'push' | null {
    const player = this.findPlayer();
    // The next square, and the one after it, in that direction.
    const [next, beyond] = this.getColumnsByDirection(player, {
      [direction]: true,
      stepCount: 2,
    })[direction as Direction];

    const blocker = this.getItem(next);

    if (!this.isExistCoord(next) || blocker?.kind === 'wall') return null;

    if (blocker?.kind === 'box') {
      if (!this.isEmpty(beyond)) return null; // a wall, another box, or the edge
      this.moveItem(next, beyond);
      this.moveItem(player, next);
      return 'push';
    }

    this.moveItem(player, next);
    return 'walk';
  }

  /** Where the player and the boxes are, as a short key. */
  key(): string {
    return `${this.findPlayer()};${this.boxes().sort().join(',')}`;
  }

  /** Puts the player and boxes back where a key says. */
  restore(key: string) {
    const [player, boxes] = key.split(';');

    Object.keys(this.board).forEach((coord) => {
      if (this.getItem(coord)?.kind !== 'wall') this.removeItem(coord);
    });
    this.setItem(player, new Tile('player'));
    boxes.split(',').filter(Boolean).forEach((coord) => this.setItem(coord, new Tile('box')));
  }

  private findFloor(): Set<string> {
    const floor = new Set<string>();
    const queue = [this.findPlayer()];

    while (queue.length) {
      const coord = queue.pop()!;
      if (floor.has(coord) || !this.isExistCoord(coord) || this.getItem(coord)?.kind === 'wall') continue;
      floor.add(coord);
      const [r, c] = coord.split('|').map(Number);
      queue.push(`${r - 1}|${c}`, `${r + 1}|${c}`, `${r}|${c - 1}`, `${r}|${c + 1}`);
    }

    return floor;
  }
}

/** A level being played: moves, pushes, undo and restart. */
export class SokobanGame {
  readonly board: SokobanBoard;

  moves = 0;

  pushes = 0;

  private readonly start: string;

  private history: { key: string; push: boolean }[] = [];

  constructor(readonly level: Level) {
    this.board = new SokobanBoard(level);
    this.start = this.board.key();
  }

  get solved(): boolean {
    return this.board.isSolved();
  }

  /** Moves the player. Returns what happened, or null if nothing did. */
  move(direction: Move): 'walk' | 'push' | null {
    if (this.solved) return null;

    const before = this.board.key();
    const result = this.board.step(direction);

    if (result) {
      this.history.push({ key: before, push: result === 'push' });
      this.moves += 1;
      if (result === 'push') this.pushes += 1;
    }

    return result;
  }

  undo(): boolean {
    const last = this.history.pop();
    if (!last) return false;

    this.board.restore(last.key);
    this.moves -= 1;
    if (last.push) this.pushes -= 1;
    return true;
  }

  restart() {
    this.board.restore(this.start);
    this.history = [];
    this.moves = 0;
    this.pushes = 0;
  }
}

const DELTA: Record<Move, [number, number]> = {
  top: [-1, 0],
  bottom: [1, 0],
  left: [0, -1],
  right: [0, 1],
};

/**
 * The shortest solution (fewest moves) from the current position, found by
 * breadth-first search, or null if there is none. Fine for small levels.
 */
export const solve = (board: SokobanBoard, limit = 200_000): Move[] | null => {
  const walls = new Set(Object.keys(board.board).filter((c) => board.getItem(c)?.kind === 'wall'));
  const goals = board.goals;
  const shift = (coord: string, move: Move) => {
    const [r, c] = coord.split('|').map(Number);
    const [dr, dc] = DELTA[move];
    return `${r + dr}|${c + dc}`;
  };
  // A box pushed into a corner that is not a goal can never move again.
  const isDeadCorner = (coord: string) => {
    if (goals.has(coord)) return false;
    const blocked = (move: Move) => walls.has(shift(coord, move));
    return (blocked('top') || blocked('bottom')) && (blocked('left') || blocked('right'));
  };

  type State = { player: string; boxes: string[]; path: Move[] };
  const keyOf = (s: State) => `${s.player};${[...s.boxes].sort().join(',')}`;
  const start: State = { player: board.findPlayer(), boxes: board.boxes(), path: [] };
  const seen = new Set([keyOf(start)]);
  const queue = [start];

  for (let i = 0; i < queue.length && seen.size < limit; i += 1) {
    const { player, boxes, path } = queue[i];

    if (boxes.every((b) => goals.has(b))) return path;

    for (const move of Object.keys(DELTA) as Move[]) {
      const next = shift(player, move);
      if (walls.has(next)) continue;

      let nextBoxes = boxes;
      if (boxes.includes(next)) {
        const beyond = shift(next, move);
        if (walls.has(beyond) || boxes.includes(beyond) || isDeadCorner(beyond)) continue;
        nextBoxes = boxes.map((b) => (b === next ? beyond : b));
      }

      const state = { player: next, boxes: nextBoxes, path: [...path, move] };
      const key = keyOf(state);
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push(state);
    }
  }

  return null;
};

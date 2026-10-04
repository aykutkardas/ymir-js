// Copenhagen Hnefatafl 11x11, written on top of ymir-js's core Board and
// Item. Nothing here comes from a ready-made game in the library: this file
// is the example of building your own game.
//
// Rules: https://aagenielsen.dk/Copenhagen_Hnefatafl_11x11.pdf
import {
  Board,
  Item,
  LINEAR_DIRECTIONS,
  parseCoord,
  stepCoord,
  toCoord,
  type BoardSnapshot,
  type Direction,
} from 'ymir-js';

export type Side = 'attackers' | 'defenders';
export type Role = 'attacker' | 'defender' | 'king';
export type Move = { from: string; to: string };

export type WinReason =
  | 'escape' // the king reached a corner
  | 'exit-fort' // the king sits in an unbreakable fort on the edge
  | 'king-captured'
  | 'encircled' // the attackers ring in every defender
  | 'no-moves' // the other side cannot move
  | 'repetition'; // perpetual repetition loses for the defenders

export type Status = { state: 'playing' } | { state: 'won'; winner: Side; reason: WinReason };

export const SIZE = 11;
const LAST = SIZE - 1;
export const THRONE = '5|5';
export const CORNERS = ['0|0', `0|${LAST}`, `${LAST}|0`, `${LAST}|${LAST}`];

export const sideOf = (role: Role): Side => (role === 'attacker' ? 'attackers' : 'defenders');
export const other = (side: Side): Side => (side === 'attackers' ? 'defenders' : 'attackers');

/** A piece moves like a rook: any distance along its row or column. */
export class Piece extends Item {
  role: Role;

  constructor(role: Role) {
    super({ name: role });
    this.role = role;
  }

  get side(): Side {
    return sideOf(this.role);
  }
}

// The Copenhagen starting position.
const ATTACKERS = [
  ...[3, 4, 5, 6, 7].flatMap((i) => [toCoord(0, i), toCoord(LAST, i), toCoord(i, 0), toCoord(i, LAST)]),
  toCoord(1, 5),
  toCoord(LAST - 1, 5),
  toCoord(5, 1),
  toCoord(5, LAST - 1),
];
const DEFENDERS = ['3|5', '4|4', '4|5', '4|6', '5|3', '5|4', '5|6', '5|7', '6|4', '6|5', '6|6', '7|5'];

/** The board: where pieces stand, how they move and what a move captures. */
export class TaflBoard extends Board<Piece> {
  constructor() {
    super({ rows: SIZE, cols: SIZE });
  }

  setup(): this {
    Object.keys(this.board).forEach(this.removeItem);
    ATTACKERS.forEach((coord) => this.setItem(coord, new Piece('attacker')));
    DEFENDERS.forEach((coord) => this.setItem(coord, new Piece('defender')));
    this.setItem(THRONE, new Piece('king'));
    return this;
  }

  /** The throne and the corners. Only the king may stop on them. */
  isRestricted(coord: string): boolean {
    return coord === THRONE || CORNERS.includes(coord);
  }

  findKing(): string | null {
    return this.findCoord((piece) => piece.role === 'king');
  }

  /**
   * Squares the piece on `coord` can move to. It slides until something is
   * in the way; it may pass over the empty throne but only the king may
   * stop on a restricted square.
   */
  movesFrom(coord: string): string[] {
    const piece = this.getItem(coord);
    if (!piece) return [];

    return LINEAR_DIRECTIONS.flatMap((direction) => {
      const reachable: string[] = [];

      for (const square of this.ray(coord, direction)) {
        if (!this.isEmpty(square)) break;
        if (piece.role === 'king' || !this.isRestricted(square)) reachable.push(square);
      }

      return reachable;
    });
  }

  movesFor(side: Side): Move[] {
    return this.findCoords((piece) => piece.side === side).flatMap((from) =>
      this.movesFrom(from).map((to) => ({ from, to }))
    );
  }

  /** Whether `square` counts as an enemy of a piece of `side` when sandwiching it. */
  private isHostileTo(square: string, side: Side): boolean {
    const piece = this.getItem(square);

    if (piece) return piece.side !== side;
    if (CORNERS.includes(square)) return true;
    // The empty throne is hostile to everyone; occupied by the king, only to attackers.
    if (square === THRONE) return true;
    return false;
  }

  /**
   * Plays a move (assumed legal) and removes what it captures. Returns the
   * captured coords.
   */
  play({ from, to }: Move): string[] {
    this.moveItem(from, to);

    const mover = this.getItem(to)!;
    const captured = new Set<string>();

    // Sandwich captures: the enemy next to `to`, with something hostile behind it.
    for (const direction of LINEAR_DIRECTIONS) {
      const target = stepCoord(to, direction);
      const victim = this.getItem(target);

      if (!victim || victim.side === mover.side || victim.role === 'king') continue;
      const behind = stepCoord(target, direction);
      if (this.isExistCoord(behind) && this.isHostileTo(behind, victim.side)) captured.add(target);
    }

    this.shieldwall(to, mover.side).forEach((coord) => captured.add(coord));
    this.lastRemoved = [...captured].map((coord) => [coord, this.getItem(coord)!.role]);
    captured.forEach(this.removeItem);

    return [...captured];
  }

  private lastRemoved: [string, Role][] = [];

  /** Plays a move and returns a function that takes it back exactly. For search. */
  playAndUndo(move: Move): () => void {
    this.play(move);
    const removed = this.lastRemoved;

    return () => {
      this.moveItem(move.to, move.from);
      removed.forEach(([coord, role]) => this.setItem(coord, new Piece(role)));
    };
  }

  /**
   * Shieldwall: a row of two or more enemies along the board edge, bracketed
   * at both ends (a corner may be one end) and each faced by one of ours from
   * the inside, is captured together. The king in such a row survives.
   */
  private shieldwall(to: string, side: Side): string[] {
    if (!this.isEdge(to)) return [];

    const [r, c] = parseCoord(to);
    const captured: string[] = [];
    const along: Direction[] = r === 0 || r === LAST ? ['left', 'right'] : ['top', 'bottom'];
    const inward: Direction = r === 0 ? 'bottom' : r === LAST ? 'top' : c === 0 ? 'right' : 'left';

    for (const direction of along) {
      // A run of two or more enemies, ended by a square on the board.
      const line = this.ray(to, direction);
      const end = line.findIndex((square) => this.getItem(square)?.side !== other(side));
      if (end < 2) continue;

      const row = line.slice(0, end);
      const closed = this.getItem(line[end])?.side === side || CORNERS.includes(line[end]);
      const faced = row.every((member) => this.getItem(stepCoord(member, inward))?.side === side);

      if (closed && faced) captured.push(...row.filter((member) => this.getItem(member)?.role !== 'king'));
    }

    return captured;
  }

  /**
   * The king is captured when attackers stand on all four sides, or on the
   * three free sides when he is next to the throne. Never on the edge.
   */
  isKingCaptured(): boolean {
    const king = this.findKing();
    if (!king) return true;
    if (this.isEdge(king)) return false;

    return LINEAR_DIRECTIONS.every((direction) => {
      const square = stepCoord(king, direction);
      return square === THRONE || this.getItem(square)?.role === 'attacker';
    });
  }

  /** Whether the attackers have closed a ring around every defender. */
  isEncircled(): boolean {
    // Everywhere the defenders could spread to without passing an attacker.
    const reach = this.getReachable(this.findCoords((piece) => piece.side === 'defenders'), {
      canEnter: (square) => this.getItem(square)?.role !== 'attacker',
    });

    return ![...reach.keys()].some(this.isEdge);
  }

  /**
   * Exit fort: the king touches the edge, can move, and sits in a pocket of
   * empty squares walled by defenders that the attackers can never break.
   * Checked statically: no attacker can reach the pocket, and every wall
   * piece has a safe side (the pocket, the board edge or another wall piece)
   * on each line, so it can never be sandwiched.
   */
  isExitFort(): boolean {
    const king = this.findKing();
    if (!king || !this.isEdge(king) || !this.movesFrom(king).length) return false;

    const pocket = new Set(this.getReachable(king).keys()); // the empty squares the king can walk to
    const wall = new Set<string>();

    for (const square of pocket) {
      for (const next of this.getNeighbors(square)) {
        const role = this.getItem(next)?.role;
        if (role === 'attacker') return false; // an attacker already touches the pocket
        if (role === 'defender') wall.add(next);
      }
    }

    const safe = (square: string) =>
      !this.isExistCoord(square) || pocket.has(square) || wall.has(square);

    return [...wall].every((piece) =>
      [
        ['top', 'bottom'],
        ['left', 'right'],
      ].every(([a, b]) => safe(stepCoord(piece, a as Direction)) || safe(stepCoord(piece, b as Direction)))
    );
  }

  /** A short key for the position, for repetition checks. */
  key(): string {
    return this.toRows((piece) => piece?.role[0] ?? '.').join('');
  }
}

/** A game: turns, history, undo and the result. Attackers move first. */
export class TaflGame {
  readonly board = new TaflBoard();

  turn: Side;

  moves: (Move & { captured: string[]; side: Side })[] = [];

  private positions: string[] = [];

  private past: { snapshot: BoardSnapshot<Piece>; turn: Side }[] = [];

  /** The standard start, or a custom `position` such as `{ '5|5': 'king' }`. */
  constructor({ position, turn = 'attackers' }: { position?: Record<string, Role>; turn?: Side } = {}) {
    if (position) {
      Object.entries(position).forEach(([coord, role]) => this.board.setItem(coord, new Piece(role)));
    } else {
      this.board.setup();
    }

    this.turn = turn;
    this.positions.push(this.positionKey());
  }

  getLegalMoves(from?: string): Move[] {
    if (this.getStatus().state !== 'playing') return [];
    return this.board.movesFor(this.turn).filter((m) => !from || m.from === from);
  }

  play(move: Move) {
    const legal = this.getLegalMoves(move.from).some((m) => m.to === move.to);
    if (!legal) throw new Error(`Illegal move ${move.from} > ${move.to}`);

    this.past.push({ snapshot: this.board.snapshot(), turn: this.turn });
    const captured = this.board.play(move);
    this.moves.push({ ...move, captured, side: this.turn });
    this.turn = other(this.turn);
    this.positions.push(this.positionKey());

    return captured;
  }

  undo() {
    const last = this.past.pop();
    if (!last) return;

    this.board.restore(last.snapshot);
    this.turn = last.turn;
    this.moves.pop();
    this.positions.pop();
  }

  getStatus(): Status {
    const { board } = this;
    const king = board.findKing();
    const justMoved = other(this.turn);

    const last = this.moves[this.moves.length - 1];

    if (king && CORNERS.includes(king)) return { state: 'won', winner: 'defenders', reason: 'escape' };
    // The trap must be closed by an attacker moving next to the king; the
    // king walking between attackers is not captured.
    if (
      king &&
      last?.side === 'attackers' &&
      board.getNeighbors(king).includes(last.to) &&
      board.isKingCaptured()
    ) {
      return { state: 'won', winner: 'attackers', reason: 'king-captured' };
    }
    if (justMoved === 'attackers' && board.isEncircled()) {
      return { state: 'won', winner: 'attackers', reason: 'encircled' };
    }
    if (justMoved === 'defenders' && board.isExitFort()) {
      return { state: 'won', winner: 'defenders', reason: 'exit-fort' };
    }

    const current = this.positions[this.positions.length - 1];
    if (this.positions.filter((p) => p === current).length >= 3) {
      return { state: 'won', winner: 'attackers', reason: 'repetition' };
    }
    if (!board.movesFor(this.turn).length) {
      return { state: 'won', winner: other(this.turn), reason: 'no-moves' };
    }

    return { state: 'playing' };
  }

  /** How many times the position after `move` has already occurred. */
  timesSeenAfter(move: Move): number {
    const undo = this.board.playAndUndo(move);
    const key = `${other(this.turn)}:${this.board.key()}`;
    undo();
    return this.positions.filter((p) => p === key).length;
  }

  private positionKey() {
    return `${this.turn}:${this.board.key()}`;
  }
}

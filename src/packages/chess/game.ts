import ChessBoard, {
  ChessColor,
  ChessPiece,
  ChessPieceType,
  fromSquare,
  toSquare,
} from './board.js';

export const START_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export type ChessMove = {
  /** Squares in algebraic notation, e.g. `'e2'`. */
  from: string;
  to: string;
  color: ChessColor;
  piece: ChessPieceType;
  captured?: ChessPieceType;
  promotion?: ChessPieceType;
  kind: 'normal' | 'double-push' | 'en-passant' | 'castle-king' | 'castle-queen';
  /** Standard algebraic notation, e.g. `'Nf3'`, `'exd5'`, `'O-O'`, `'e8=Q#'`. */
  san: string;
  /** UCI notation, e.g. `'e2e4'`, `'e7e8q'`. */
  uci: string;
};

export type ChessDrawReason =
  | 'stalemate'
  | 'repetition'
  | 'fifty-move'
  | 'insufficient-material';

export type ChessStatus =
  | { state: 'playing'; check: boolean }
  | { state: 'checkmate'; winner: ChessColor }
  | { state: 'draw'; reason: ChessDrawReason };

export type ChessDrawRules = {
  /** Draw when the same position occurs this many times. FIDE: 3 to claim, 5 automatic. */
  repetition: number | false;
  /** Draw after this many half-moves without a pawn move or capture. FIDE: 100 to claim, 150 automatic. */
  halfMoves: number | false;
  /** Draw when neither side can possibly checkmate (e.g. king and bishop against king). */
  insufficientMaterial: boolean;
};

export type SavedChessGame = {
  start: string;
  /** Moves in UCI notation. */
  moves: string[];
  drawRules: ChessDrawRules;
};

type Piece = { type: ChessPieceType; color: ChessColor };
type Square = number; // row * 8 + col; row 0 is rank 8

type Move = {
  from: Square;
  to: Square;
  piece: ChessPieceType;
  color: ChessColor;
  captured: ChessPieceType | null;
  promotion: ChessPieceType | null;
  kind: ChessMove['kind'];
};

type Castling = { K: boolean; Q: boolean; k: boolean; q: boolean };

type Undo = {
  move: Move;
  castling: Castling;
  ep: Square | null;
  halfMoves: number;
  fullMoves: number;
};

const KNIGHT: [number, number][] = [
  [-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1],
];
const DIAGONAL: [number, number][] = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const STRAIGHT: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const ALL = [...DIAGONAL, ...STRAIGHT];
const PROMOTIONS: ChessPieceType[] = ['q', 'r', 'b', 'n'];

const rowOf = (sq: Square) => sq >> 3;
const colOf = (sq: Square) => sq & 7;
const at = (row: number, col: number): Square | null =>
  row >= 0 && row < 8 && col >= 0 && col < 8 ? row * 8 + col : null;
const name = (sq: Square) => toSquare(`${rowOf(sq)}|${colOf(sq)}`);
const parse = (square: string): Square => {
  const [r, c] = fromSquare(square).split('|').map(Number);
  return r * 8 + c;
};
const other = (color: ChessColor): ChessColor => (color === 'white' ? 'black' : 'white');

// Evaluation for getBestMove: piece values and the "simplified evaluation
// function" piece-square tables (Tomasz Michniewski), from white's side with
// rank 8 first, the same order as the board.
const VALUES: Record<ChessPieceType, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

const TABLES: Record<ChessPieceType, number[]> = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10,
    5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5,
    5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
    -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15,
    15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5,
    10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30,
    -40, -50,
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5,
    0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10,
    10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20,
  ],
  r: [
    0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0,
    0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0,
    -5, 0, 0, 0, 5, 5, 0, 0, 0,
  ],
  q: [
    -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0,
    -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10,
    0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20,
  ],
  k: [
    -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40,
    -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40,
    -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20,
    20, 30, 10, 0, 0, 10, 30, 20,
  ],
};

const MATE = 100_000;

const DEFAULT_DRAW_RULES: ChessDrawRules = {
  repetition: 3,
  halfMoves: 100,
  insufficientMaterial: true,
};

/**
 * A game of chess: every rule, including castling, en passant, promotion,
 * check, checkmate, stalemate and the draw rules. Moves can be given as
 * squares (`{ from: 'e2', to: 'e4' }`), SAN (`'Nf3'`) or UCI (`'g1f3'`).
 */
class ChessGame {
  /** The pieces, readable like any other ymir board. Kept in sync by the game. */
  readonly board = new ChessBoard();

  readonly drawRules: ChessDrawRules;

  private squares: (Piece | null)[] = Array(64).fill(null);

  private turnColor: ChessColor = 'white';

  private castling: Castling = { K: false, Q: false, k: false, q: false };

  private ep: Square | null = null;

  private halfMoves = 0;

  private fullMoves = 1;

  private startFen = START_FEN;

  private stack: Undo[] = [];

  private played: ChessMove[] = [];

  private keys: string[] = [];

  constructor(fen: string = START_FEN, options: { drawRules?: Partial<ChessDrawRules> } = {}) {
    this.drawRules = { ...DEFAULT_DRAW_RULES, ...options.drawRules };
    this.load(fen);
  }

  static fromJSON(saved: SavedChessGame): ChessGame {
    const game = new ChessGame(saved.start, { drawRules: saved.drawRules });
    saved.moves.forEach((uci) => game.move(uci));
    return game;
  }

  get turn(): ChessColor {
    return this.turnColor;
  }

  /** Moves played so far. */
  get moves(): ChessMove[] {
    return [...this.played];
  }

  /** Sets up a position from FEN and clears the history. */
  load(fen: string): this {
    const fields = fen.trim().split(/\s+/);
    const [placement, turn = 'w', castling = '-', ep = '-', half = '0', full = '1'] = fields;
    const rows = placement.split('/');

    if (rows.length !== 8) throw new Error(`Invalid FEN: "${fen}"`);

    const squares: (Piece | null)[] = [];

    rows.forEach((row) => {
      let count = 0;

      for (const ch of row) {
        if (/[1-8]/.test(ch)) {
          for (let i = 0; i < Number(ch); i += 1) squares.push(null);
          count += Number(ch);
        } else if (/[pnbrqk]/i.test(ch)) {
          squares.push({
            type: ch.toLowerCase() as ChessPieceType,
            color: ch === ch.toUpperCase() ? 'white' : 'black',
          });
          count += 1;
        } else {
          throw new Error(`Invalid FEN: "${fen}"`);
        }
      }

      if (count !== 8) throw new Error(`Invalid FEN: "${fen}"`);
    });

    if (turn !== 'w' && turn !== 'b') throw new Error(`Invalid FEN: "${fen}"`);

    this.squares = squares;
    this.turnColor = turn === 'w' ? 'white' : 'black';
    this.castling = {
      K: castling.includes('K'),
      Q: castling.includes('Q'),
      k: castling.includes('k'),
      q: castling.includes('q'),
    };
    this.ep = ep === '-' ? null : parse(ep);
    this.halfMoves = Number(half) || 0;
    this.fullMoves = Number(full) || 1;
    this.startFen = this.fen();
    this.stack = [];
    this.played = [];
    this.keys = [this.positionKey()];
    this.sync();

    return this;
  }

  /** The current position as FEN. */
  fen(): string {
    const rows = [];

    for (let r = 0; r < 8; r += 1) {
      let row = '';
      let empty = 0;

      for (let c = 0; c < 8; c += 1) {
        const piece = this.squares[r * 8 + c];

        if (!piece) {
          empty += 1;
          continue;
        }

        if (empty) row += empty;
        empty = 0;
        row += piece.color === 'white' ? piece.type.toUpperCase() : piece.type;
      }

      rows.push(row + (empty || ''));
    }

    const castling =
      (['K', 'Q', 'k', 'q'] as const).filter((right) => this.castling[right]).join('') || '-';

    return [
      rows.join('/'),
      this.turnColor === 'white' ? 'w' : 'b',
      castling,
      this.ep === null ? '-' : name(this.ep),
      this.halfMoves,
      this.fullMoves,
    ].join(' ');
  }

  /** Whether the side to move is in check. */
  isCheck(): boolean {
    return this.inCheck(this.turnColor);
  }

  getStatus(): ChessStatus {
    const check = this.isCheck();

    if (!this.legal().length) {
      return check
        ? { state: 'checkmate', winner: other(this.turnColor) }
        : { state: 'draw', reason: 'stalemate' };
    }

    const { repetition, halfMoves, insufficientMaterial } = this.drawRules;
    const key = this.keys[this.keys.length - 1];

    if (repetition && this.keys.filter((k) => k === key).length >= repetition) {
      return { state: 'draw', reason: 'repetition' };
    }
    if (halfMoves && this.halfMoves >= halfMoves) {
      return { state: 'draw', reason: 'fifty-move' };
    }
    if (insufficientMaterial && this.isInsufficientMaterial()) {
      return { state: 'draw', reason: 'insufficient-material' };
    }

    return { state: 'playing', check };
  }

  /** Legal moves for the side to move, optionally only from one square. None once the game is over. */
  getLegalMoves(from?: string): ChessMove[] {
    if (this.getStatus().state !== 'playing') return [];

    const fromSq = from === undefined ? null : parse(from);

    return this.legal()
      .filter((move) => fromSq === null || move.from === fromSq)
      .map((move, _, all) => this.describe(move, all));
  }

  /**
   * Plays a move: `{ from, to, promotion? }`, SAN (`'Nf3'`, `'O-O'`,
   * `'e8=Q'`) or UCI (`'g1f3'`, `'e7e8q'`). Promotion defaults to a queen.
   * Throws if the move is not legal.
   */
  move(input: string | { from: string; to: string; promotion?: ChessPieceType }): ChessMove {
    if (this.getStatus().state !== 'playing') throw new Error('The game is over');

    const legal = this.legal();
    const found = this.find(legal, input);

    if (!found) {
      throw new Error(`Illegal move: ${typeof input === 'string' ? input : JSON.stringify(input)}`);
    }

    const described = this.describe(found, legal);

    this.make(found);
    this.played.push(described);
    this.keys.push(this.positionKey());
    this.sync();

    return described;
  }

  /** Takes back the last move. Returns it, or null if there is none. */
  undo(): ChessMove | null {
    const last = this.played.pop();

    if (!last) return null;

    this.unmake();
    this.keys.pop();
    this.sync();

    return last;
  }

  /** The moves so far in SAN, numbered, e.g. `'1. e4 e5 2. Nf3'`. */
  pgn(): string {
    const [, turn, , , , full] = this.startFen.split(' ');
    let number = Number(full);
    let white = turn === 'w';
    const parts: string[] = [];

    this.played.forEach((move, i) => {
      if (white) parts.push(`${number}.`);
      else if (i === 0) parts.push(`${number}...`);
      parts.push(move.san);
      if (!white) number += 1;
      white = !white;
    });

    return parts.join(' ');
  }

  /**
   * A move for the side to move from a small built-in engine: alpha-beta
   * search `depth` moves ahead (plus captures until the position is quiet),
   * scoring material and piece placement. Depth 3 plays a reasonable
   * casual game and answers quickly; each extra level is several times
   * slower. With `random`, equally good moves are picked at random.
   * Returns null when the game is over.
   */
  getBestMove({ depth = 3, random = Math.random }: { depth?: number; random?: () => number } = {}): ChessMove | null {
    if (this.getStatus().state !== 'playing') return null;

    const moves = this.ordered(this.legal());
    let best: Move[] = [];
    let bestScore = -Infinity;

    for (const move of moves) {
      this.make(move);
      const score = -this.search(depth - 1, -Infinity, -bestScore + 1, 1);
      this.unmake();

      if (score > bestScore) {
        bestScore = score;
        best = [move];
      } else if (score === bestScore) {
        best.push(move);
      }
    }

    const choice = best[Math.floor(random() * best.length)];

    return this.describe(choice, moves);
  }

  /** Number of positions reachable in exactly `depth` moves. For testing move generation. */
  perft(depth: number): number {
    if (depth === 0) return 1;

    const moves = this.legal();

    if (depth === 1) return moves.length;

    let nodes = 0;

    for (const move of moves) {
      this.make(move);
      nodes += this.perft(depth - 1);
      this.unmake();
    }

    return nodes;
  }

  toJSON(): SavedChessGame {
    return {
      start: this.startFen,
      moves: this.played.map((move) => move.uci),
      drawRules: this.drawRules,
    };
  }

  // Move generation

  private legal(): Move[] {
    const color = this.turnColor;

    return this.pseudoLegal(color).filter((move) => {
      this.make(move);
      const safe = !this.inCheck(color);
      this.unmake();
      return safe;
    });
  }

  private pseudoLegal(color: ChessColor): Move[] {
    const moves: Move[] = [];

    for (let sq = 0; sq < 64; sq += 1) {
      const piece = this.squares[sq];

      if (piece?.color !== color) continue;

      const r = rowOf(sq);
      const c = colOf(sq);
      const add = (to: Square, kind: Move['kind'] = 'normal', promotion: ChessPieceType | null = null) => {
        const target = kind === 'en-passant' ? { type: 'p' as const } : this.squares[to];
        moves.push({
          from: sq,
          to,
          piece: piece.type,
          color,
          captured: target?.type ?? null,
          promotion,
          kind,
        });
      };

      if (piece.type === 'p') {
        const dir = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;
        const lastRow = color === 'white' ? 0 : 7;
        const addPawn = (to: Square, kind: Move['kind'] = 'normal') => {
          if (rowOf(to) === lastRow) PROMOTIONS.forEach((p) => add(to, kind, p));
          else add(to, kind);
        };

        const one = at(r + dir, c);
        if (one !== null && !this.squares[one]) {
          addPawn(one);
          const two = at(r + 2 * dir, c);
          if (r === startRow && two !== null && !this.squares[two]) add(two, 'double-push');
        }

        for (const dc of [-1, 1]) {
          const to = at(r + dir, c + dc);
          if (to === null) continue;
          if (this.squares[to] && this.squares[to]!.color !== color) addPawn(to);
          else if (to === this.ep) add(to, 'en-passant');
        }
        continue;
      }

      if (piece.type === 'n' || piece.type === 'k') {
        for (const [dr, dc] of piece.type === 'n' ? KNIGHT : ALL) {
          const to = at(r + dr, c + dc);
          if (to !== null && this.squares[to]?.color !== color) add(to);
        }

        if (piece.type === 'k') this.addCastling(color, sq, add);
        continue;
      }

      const directions = piece.type === 'b' ? DIAGONAL : piece.type === 'r' ? STRAIGHT : ALL;

      for (const [dr, dc] of directions) {
        for (let i = 1; ; i += 1) {
          const to = at(r + dr * i, c + dc * i);
          if (to === null) break;
          const target = this.squares[to];
          if (target?.color === color) break;
          add(to);
          if (target) break;
        }
      }
    }

    return moves;
  }

  private addCastling(
    color: ChessColor,
    king: Square,
    add: (to: Square, kind: Move['kind']) => void
  ) {
    const row = color === 'white' ? 7 : 0;
    const enemy = other(color);
    const rights = color === 'white' ? { k: this.castling.K, q: this.castling.Q } : { k: this.castling.k, q: this.castling.q };
    const isRook = (sq: Square) =>
      this.squares[sq]?.type === 'r' && this.squares[sq]?.color === color;
    const empty = (...cols: number[]) => cols.every((c) => !this.squares[row * 8 + c]);
    const safe = (...cols: number[]) => cols.every((c) => !this.isAttacked(row * 8 + c, enemy));

    if (king !== row * 8 + 4) return;

    if (rights.k && isRook(row * 8 + 7) && empty(5, 6) && safe(4, 5, 6)) {
      add(row * 8 + 6, 'castle-king');
    }
    if (rights.q && isRook(row * 8) && empty(1, 2, 3) && safe(4, 3, 2)) {
      add(row * 8 + 2, 'castle-queen');
    }
  }

  private isAttacked(sq: Square, by: ChessColor): boolean {
    const r = rowOf(sq);
    const c = colOf(sq);
    const is = (target: Square | null, ...types: ChessPieceType[]) => {
      if (target === null) return false;
      const piece = this.squares[target];
      return !!piece && piece.color === by && types.includes(piece.type);
    };

    // A white pawn attacks upward, so it sits one row below the square.
    const pawnRow = by === 'white' ? r + 1 : r - 1;
    if (is(at(pawnRow, c - 1), 'p') || is(at(pawnRow, c + 1), 'p')) return true;
    if (KNIGHT.some(([dr, dc]) => is(at(r + dr, c + dc), 'n'))) return true;
    if (ALL.some(([dr, dc]) => is(at(r + dr, c + dc), 'k'))) return true;

    const slides = (directions: [number, number][], ...types: ChessPieceType[]) =>
      directions.some(([dr, dc]) => {
        for (let i = 1; ; i += 1) {
          const target = at(r + dr * i, c + dc * i);
          if (target === null) return false;
          if (this.squares[target]) return is(target, ...types);
        }
      });

    return slides(STRAIGHT, 'r', 'q') || slides(DIAGONAL, 'b', 'q');
  }

  private inCheck(color: ChessColor): boolean {
    const king = this.squares.findIndex((p) => p?.type === 'k' && p.color === color);
    return king >= 0 && this.isAttacked(king, other(color));
  }

  // Search

  private search(depth: number, alpha: number, beta: number, ply: number): number {
    if (depth <= 0) return this.quiesce(alpha, beta, 4);

    const moves = this.legal();

    if (!moves.length) return this.inCheck(this.turnColor) ? -MATE + ply : 0;

    for (const move of this.ordered(moves)) {
      this.make(move);
      const score = -this.search(depth - 1, -beta, -alpha, ply + 1);
      this.unmake();

      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }

    return alpha;
  }

  /** Keeps searching captures so the evaluation is not taken mid-exchange. */
  private quiesce(alpha: number, beta: number, depth: number): number {
    const standPat = this.evaluate();

    if (depth === 0 || standPat >= beta) return Math.max(alpha, standPat);
    if (standPat > alpha) alpha = standPat;

    const captures = this.ordered(this.legal().filter((m) => m.captured || m.promotion));

    for (const move of captures) {
      this.make(move);
      const score = -this.quiesce(-beta, -alpha, depth - 1);
      this.unmake();

      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }

    return alpha;
  }

  /** The position's value for the side to move. */
  private evaluate(): number {
    let score = 0;

    this.squares.forEach((piece, sq) => {
      if (!piece) return;

      const index = piece.color === 'white' ? sq : (7 - rowOf(sq)) * 8 + colOf(sq);
      const value = VALUES[piece.type] + TABLES[piece.type][index];

      score += piece.color === 'white' ? value : -value;
    });

    return this.turnColor === 'white' ? score : -score;
  }

  /** Captures of valuable pieces by cheap ones first, then promotions; the search prunes more. */
  private ordered(moves: Move[]): Move[] {
    const weight = (m: Move) =>
      (m.captured ? 10 * VALUES[m.captured] - VALUES[m.piece] + 1000 : 0) +
      (m.promotion ? VALUES[m.promotion] : 0);

    return [...moves].sort((a, b) => weight(b) - weight(a));
  }

  // Making and unmaking moves

  private make(move: Move) {
    this.stack.push({
      move,
      castling: { ...this.castling },
      ep: this.ep,
      halfMoves: this.halfMoves,
      fullMoves: this.fullMoves,
    });

    const { from, to, color, kind } = move;
    const piece = this.squares[from]!;
    const row = rowOf(from);

    this.squares[from] = null;
    this.squares[to] = move.promotion ? { type: move.promotion, color } : piece;

    if (kind === 'en-passant') this.squares[row * 8 + colOf(to)] = null;
    if (kind === 'castle-king') {
      this.squares[row * 8 + 5] = this.squares[row * 8 + 7];
      this.squares[row * 8 + 7] = null;
    }
    if (kind === 'castle-queen') {
      this.squares[row * 8 + 3] = this.squares[row * 8];
      this.squares[row * 8] = null;
    }

    // Moving the king or a rook, or losing a rook, ends those castling rights.
    const lose = (sq: Square) => {
      if (sq === 60) { this.castling.K = false; this.castling.Q = false; }
      if (sq === 4) { this.castling.k = false; this.castling.q = false; }
      if (sq === 63) this.castling.K = false;
      if (sq === 56) this.castling.Q = false;
      if (sq === 7) this.castling.k = false;
      if (sq === 0) this.castling.q = false;
    };
    lose(from);
    lose(to);

    this.ep = kind === 'double-push' ? (from + to) / 2 : null;
    this.halfMoves = piece.type === 'p' || move.captured ? 0 : this.halfMoves + 1;
    if (color === 'black') this.fullMoves += 1;
    this.turnColor = other(color);
  }

  private unmake() {
    const undo = this.stack.pop()!;
    const { from, to, color, kind, piece, captured } = undo.move;
    const row = rowOf(from);

    this.squares[from] = { type: piece, color };
    this.squares[to] =
      captured && kind !== 'en-passant' ? { type: captured, color: other(color) } : null;

    if (kind === 'en-passant') this.squares[row * 8 + colOf(to)] = { type: 'p', color: other(color) };
    if (kind === 'castle-king') {
      this.squares[row * 8 + 7] = this.squares[row * 8 + 5];
      this.squares[row * 8 + 5] = null;
    }
    if (kind === 'castle-queen') {
      this.squares[row * 8] = this.squares[row * 8 + 3];
      this.squares[row * 8 + 3] = null;
    }

    this.castling = undo.castling;
    this.ep = undo.ep;
    this.halfMoves = undo.halfMoves;
    this.fullMoves = undo.fullMoves;
    this.turnColor = color;
  }

  // Notation

  private find(
    legal: Move[],
    input: string | { from: string; to: string; promotion?: ChessPieceType }
  ): Move | undefined {
    if (typeof input !== 'string') {
      const from = parse(input.from);
      const to = parse(input.to);
      const candidates = legal.filter((m) => m.from === from && m.to === to);
      return (
        candidates.find((m) => m.promotion === (input.promotion ?? 'q')) ??
        candidates.find((m) => !m.promotion)
      );
    }

    const text = input.trim();
    const uci = /^([a-h][1-8])([a-h][1-8])([qrbn])?$/.exec(text);

    if (uci) {
      return this.find(legal, {
        from: uci[1],
        to: uci[2],
        promotion: uci[3] as ChessPieceType | undefined,
      });
    }

    const clean = (san: string) => san.replace(/[+#?!]/g, '').replace(/0/g, 'O');
    const wanted = clean(text);

    return legal.find((m) => clean(this.describe(m, legal).san) === wanted);
  }

  private describe(move: Move, legal: Move[]): ChessMove {
    const from = name(move.from);
    const to = name(move.to);
    let san: string;

    if (move.kind === 'castle-king') san = 'O-O';
    else if (move.kind === 'castle-queen') san = 'O-O-O';
    else if (move.piece === 'p') {
      san = (move.captured ? `${from[0]}x` : '') + to + (move.promotion ? `=${move.promotion.toUpperCase()}` : '');
    } else {
      // Add the file, rank or both when another piece of the same kind could go there too.
      const rivals = legal.filter(
        (m) => m.piece === move.piece && m.to === move.to && m.from !== move.from
      );
      let hint = '';
      if (rivals.length) {
        if (rivals.every((m) => colOf(m.from) !== colOf(move.from))) hint = from[0];
        else if (rivals.every((m) => rowOf(m.from) !== rowOf(move.from))) hint = from[1];
        else hint = from;
      }
      san = move.piece.toUpperCase() + hint + (move.captured ? 'x' : '') + to;
    }

    this.make(move);
    if (this.inCheck(this.turnColor)) san += this.legal().length ? '+' : '#';
    this.unmake();

    return {
      from,
      to,
      color: move.color,
      piece: move.piece,
      ...(move.captured ? { captured: move.captured } : {}),
      ...(move.promotion ? { promotion: move.promotion } : {}),
      kind: move.kind,
      san,
      uci: from + to + (move.promotion ?? ''),
    };
  }

  // Draw helpers

  /** Placement, side to move, castling and a capturable en passant square. */
  private positionKey(): string {
    const [placement, turn, castling] = this.fen().split(' ');
    const epCapturable =
      this.ep !== null &&
      this.pseudoLegal(this.turnColor).some((m) => m.kind === 'en-passant');

    return `${placement} ${turn} ${castling} ${epCapturable ? name(this.ep!) : '-'}`;
  }

  private isInsufficientMaterial(): boolean {
    const pieces = this.squares
      .map((piece, sq) => (piece && piece.type !== 'k' ? { ...piece, sq } : null))
      .filter((p): p is Piece & { sq: Square } => !!p);

    if (pieces.some((p) => p.type === 'p' || p.type === 'r' || p.type === 'q')) return false;
    if (pieces.length <= 1) return true;

    // Only bishops left, all on squares of one colour.
    const shade = (sq: Square) => (rowOf(sq) + colOf(sq)) % 2;
    return pieces.every((p) => p.type === 'b' && shade(p.sq) === shade(pieces[0].sq));
  }

  /** Copies the position onto `board`. */
  private sync() {
    this.squares.forEach((piece, sq) => {
      this.board.setItem(
        `${rowOf(sq)}|${colOf(sq)}`,
        piece ? new ChessPiece(piece) : null
      );
    });
  }
}

export default ChessGame;

// A small Invaders-style shooter, written on top of ymir-js's core Board and
// Item. The invaders and the shields are items on the board, and the whole
// formation marches across it one square at a time with moveItem, as in the
// arcade original. Bullets, the cannon and the mystery ship are plain values.
// Everything advances with tick(ms), and the randomness is seeded.
import { Board, Item, parseCoord, toCoord } from 'ymir-js';

export type Kind = 'squid' | 'crab' | 'octopus';
export type TileData = { kind?: Kind; hp?: number };

export class Tile extends Item<TileData> {
  type: 'invader' | 'shield';

  constructor(type: 'invader' | 'shield', data: TileData = {}) {
    super({ name: type, data });
    this.type = type;
  }
}

export type Bullet = { row: number; col: number; wait: number };
export type Ship = { col: number; dir: 1 | -1; wait: number; value: number };
export type Input = { move: -1 | 0 | 1; fire: boolean };
export type Status = { state: 'playing' } | { state: 'over'; reason: 'shot' | 'invaded' };

export const COLS = 21;
export const ROWS = 19;
/** The cannon's row; an invader reaching the row above it has landed. */
export const CANNON_ROW = ROWS - 1;
export const LANDED_ROW = CANNON_ROW - 1;
export const SHIP_ROW = 0;

export const POINTS: Record<Kind, number> = { squid: 30, crab: 20, octopus: 10 };
const ROW_KINDS: Kind[] = ['squid', 'crab', 'crab', 'octopus', 'octopus'];
const SHIELD_COLS = [3, 4, 5, 9, 10, 11, 15, 16, 17];
const SHIELD_ROWS = [14, 15];

// How fast things are, in ms per square.
const CANNON_MS = 60;
const SHOT_MS = 22;
const BOMB_MS = 70;
const SHIP_MS = 110;
/** The formation waits this long between steps when full, and 80 ms when one is left. */
const MARCH_MS = 750;
const MARCH_MIN_MS = 80;
const PAUSE_MS = 1200;

/** A small seeded random generator (Park-Miller), so games can be replayed. */
export const seeded = (seed: number) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

export class InvadersGame {
  readonly board = new Board<Tile>({ rows: ROWS, cols: COLS });

  cannon = Math.floor(COLS / 2);

  shot: Bullet | null = null;

  bombs: Bullet[] = [];

  ship: Ship | null = null;

  lives = 3;

  score = 0;

  wave = 1;

  /** The formation's direction, and which of two poses the invaders are in. */
  dir: 1 | -1 = 1;

  pose = 0;

  /** Squares that just exploded, with ms left, for the app to draw. */
  readonly blasts = new Map<string, number>();

  /** While above zero, everything waits: after the cannon is hit, or between waves. */
  pause = 0;

  /** Whether the cannon was just hit (for drawing it broken during the pause). */
  hit = false;

  private readonly random: () => number;

  private input: Input = { move: 0, fire: false };

  private total = 0;

  private march = 0;

  private cannonWait = 0;

  /** ms until the next bomb, and until the next mystery ship. */
  bombWait = 1000;

  shipWait = 15000;

  constructor({ seed = 1 }: { seed?: number } = {}) {
    this.random = seeded(seed);
    SHIELD_ROWS.forEach((r) => SHIELD_COLS.forEach((c) => this.board.setItem(toCoord(r, c), new Tile('shield', { hp: 2 }))));
    this.spawnWave();
  }

  getStatus(): Status {
    if (this.lives <= 0) return { state: 'over', reason: 'shot' };
    if (this.invaders().some((coord) => parseCoord(coord)[0] >= LANDED_ROW)) return { state: 'over', reason: 'invaded' };
    return { state: 'playing' };
  }

  setInput(input: Partial<Input>) {
    this.input = { ...this.input, ...input };
  }

  /** Where the invaders are. */
  invaders(): string[] {
    return this.board.findCoords((tile) => tile.type === 'invader');
  }

  /**
   * The invaders that may drop a bomb: those with no other invader below
   * them, found by looking down the column.
   */
  shooters(): string[] {
    return this.invaders().filter((coord) => {
      const { bottom } = this.board.getColumnsByDirection(coord, { bottom: true, stepCount: ROWS });
      return !bottom.some((square) => this.board.getItem(square)?.type === 'invader');
    });
  }

  /** How long the formation waits between steps: the fewer invaders, the faster. */
  marchMs(): number {
    return MARCH_MIN_MS + (MARCH_MS - MARCH_MIN_MS) * (this.invaders().length / this.total) * 0.92 ** (this.wave - 1);
  }

  /** Advances the game by `ms` milliseconds. */
  tick(ms: number) {
    if (this.getStatus().state !== 'playing') return;

    for (const [coord, left] of this.blasts) {
      if (left - ms <= 0) this.blasts.delete(coord);
      else this.blasts.set(coord, left - ms);
    }

    if (this.pause > 0) {
      this.pause -= ms;
      if (this.pause <= 0) {
        this.hit = false;
        if (!this.invaders().length) this.nextWave();
      }
      return;
    }

    // The cannon.
    this.cannonWait -= ms;
    if (this.input.move && this.cannonWait <= 0) {
      this.cannon = Math.max(0, Math.min(COLS - 1, this.cannon + this.input.move));
      this.cannonWait = CANNON_MS;
    }
    if (this.input.fire && !this.shot) {
      this.shot = { row: CANNON_ROW, col: this.cannon, wait: 0 };
    }

    this.moveShot(ms);
    this.moveBombs(ms);
    if (this.pause > 0) return; // the cannon was hit
    this.moveShip(ms);

    // The formation marches.
    this.march += ms;
    if (this.march >= this.marchMs()) {
      this.march = 0;
      this.step();
    }

    // Invaders drop bombs now and then.
    this.bombWait -= ms;
    const shooters = this.shooters();
    if (this.bombWait <= 0 && shooters.length && this.bombs.length < 3) {
      // Half the time from right above the cannon, if anyone is.
      const above = shooters.filter((coord) => Math.abs(parseCoord(coord)[1] - this.cannon) <= 1);
      const pool = above.length && this.random() < 0.5 ? above : shooters;
      const [row, col] = parseCoord(pool[Math.floor(this.random() * pool.length)]);
      this.bombs.push({ row, col, wait: 0 });
      this.bombWait = 500 + this.random() * 900;
    }

    if (!this.invaders().length) this.pause = PAUSE_MS;
  }

  private spawnWave() {
    // Each wave starts a little lower, down to three rows.
    const top = 2 + Math.min(this.wave - 1, 3);
    ROW_KINDS.forEach((kind, i) => {
      for (let c = 3; c <= 15; c += 2) this.board.setItem(toCoord(top + i * 2, c), new Tile('invader', { kind }));
    });
    this.total = this.invaders().length;
    this.dir = 1;
    this.march = 0;
  }

  private nextWave() {
    this.wave += 1;
    this.bombs = [];
    this.shot = null;
    this.spawnWave();
  }

  /** One step of the formation: sideways, or down and turn at an edge. */
  private step() {
    const coords = this.invaders();
    const edge = coords.some((coord) => {
      const col = parseCoord(coord)[1] + this.dir;
      return col < 0 || col >= COLS;
    });
    const [dr, dc] = edge ? [1, 0] : [0, this.dir];

    // Move the leading invaders first, so nobody steps onto a neighbour.
    coords
      .map(parseCoord)
      .sort(([ra, ca], [rb, cb]) => (dr ? rb - ra : (cb - ca) * this.dir))
      .forEach(([r, c]) => {
        const to = toCoord(r + dr, c + dc);
        // Marching through a shield wears it away.
        if (this.board.getItem(to)?.type === 'shield') this.board.removeItem(to);
        this.board.moveItem(toCoord(r, c), to);
      });

    if (edge) this.dir = this.dir === 1 ? -1 : 1;
    this.pose ^= 1;
    if (this.shot) this.hitByShot();
  }

  private moveShot(ms: number) {
    if (!this.shot) return;
    this.shot.wait += ms;
    while (this.shot && this.shot.wait >= SHOT_MS) {
      this.shot.wait -= SHOT_MS;
      this.shot.row -= 1;
      if (this.shot.row < 0) this.shot = null;
      else this.hitByShot();
    }
  }

  /** What the cannon's shot runs into on its square. */
  private hitByShot() {
    const shot = this.shot!;
    const coord = toCoord(shot.row, shot.col);
    const tile = this.board.getItem(coord);

    if (tile?.type === 'invader') {
      this.board.removeItem(coord);
      this.score += POINTS[tile.data!.kind!];
      this.boom(coord);
      this.shot = null;
    } else if (tile?.type === 'shield') {
      this.damage(coord);
      this.shot = null;
    } else if (this.ship && shot.row === SHIP_ROW && Math.abs(this.ship.col - shot.col) <= 1) {
      this.score += this.ship.value;
      this.boom(coord);
      this.ship = null;
      this.shot = null;
    } else {
      // Shots and bombs that meet cancel out.
      const bomb = this.bombs.findIndex((b) => b.col === shot.col && Math.abs(b.row - shot.row) <= 1);
      if (bomb >= 0) {
        this.bombs.splice(bomb, 1);
        this.boom(coord);
        this.shot = null;
      }
    }
  }

  private moveBombs(ms: number) {
    for (const bomb of [...this.bombs]) {
      bomb.wait += ms;
      while (bomb.wait >= BOMB_MS && this.bombs.includes(bomb)) {
        bomb.wait -= BOMB_MS;
        bomb.row += 1;
        const coord = toCoord(bomb.row, bomb.col);

        if (this.board.getItem(coord)?.type === 'shield') {
          this.damage(coord);
          this.bombs.splice(this.bombs.indexOf(bomb), 1);
        } else if (bomb.row === CANNON_ROW && bomb.col === this.cannon) {
          this.cannonHit();
        } else if (bomb.row >= ROWS) {
          this.bombs.splice(this.bombs.indexOf(bomb), 1);
        }
      }
    }
  }

  private moveShip(ms: number) {
    if (!this.ship) {
      this.shipWait -= ms;
      if (this.shipWait <= 0) {
        const dir = this.random() < 0.5 ? 1 : -1;
        const value = [50, 100, 150, 300][Math.floor(this.random() * 4)];
        this.ship = { col: dir === 1 ? -1 : COLS, dir, wait: 0, value };
        this.shipWait = 18000 + this.random() * 8000;
      }
      return;
    }

    this.ship.wait += ms;
    while (this.ship && this.ship.wait >= SHIP_MS) {
      this.ship.wait -= SHIP_MS;
      this.ship.col += this.ship.dir;
      if (this.ship.col < -1 || this.ship.col > COLS) this.ship = null;
    }
  }

  private damage(coord: string) {
    const shield = this.board.getItem(coord)!;
    shield.data!.hp! -= 1;
    if (shield.data!.hp! <= 0) this.board.removeItem(coord);
  }

  private cannonHit() {
    this.lives -= 1;
    this.hit = true;
    this.boom(toCoord(CANNON_ROW, this.cannon));
    this.bombs = [];
    this.shot = null;
    this.pause = PAUSE_MS;
  }

  private boom(coord: string) {
    this.blasts.set(coord, 250);
  }
}

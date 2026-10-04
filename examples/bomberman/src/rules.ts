// A small real-time Bomberman, written on top of ymir-js's core Board and
// Item. Walls, crates, bombs and power-ups are items on the board; the player
// and the enemies move between squares in real time, driven by tick(ms).
// Everything random comes from a seeded generator, so a game can be replayed.
import { Board, Item, stepCoord } from 'ymir-js';

export type Move = 'top' | 'bottom' | 'left' | 'right';
export type TileKind = 'wall' | 'crate' | 'bomb' | 'power';
export type Power = 'bomb' | 'fire' | 'speed';

export type TileData = {
  /** A bomb's time left, in ms. */
  timer?: number;
  /** A bomb's blast length, in squares. */
  range?: number;
  /** A power-up's kind. */
  power?: Power;
};

export class Tile extends Item<TileData> {
  kind: TileKind;

  constructor(kind: TileKind, data: TileData = {}) {
    super({ name: kind, data });
    this.kind = kind;
  }
}

export type Actor = {
  id: number;
  kind: 'player' | 'enemy';
  /** The square it is leaving (or standing on). */
  from: string;
  /** The square it is heading to; equal to `from` when standing still. */
  to: string;
  /** How far between `from` and `to`, 0 to 1. */
  progress: number;
  /** Squares per second. */
  speed: number;
  /** The way it last moved, for enemies that keep going straight. */
  facing: Move | null;
  alive: boolean;
};

export type Status = { state: 'playing' } | { state: 'won' } | { state: 'lost' };

export type Input = { move: Move | null; bomb: boolean };

export const COLS = 13;
export const ROWS = 11;
export const BOMB_MS = 2000;
export const FIRE_MS = 500;
const MOVES: Move[] = ['top', 'bottom', 'left', 'right'];
const START = '1|1';
const ENEMY_STARTS = ['9|11', '1|11', '9|1', '5|7'];

/** A small seeded random generator (Park-Miller), so games can be replayed. */
export const seeded = (seed: number) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

/** The square an actor counts as being on: whichever it is closer to. */
export const occupied = (actor: Actor) => (actor.progress < 0.5 ? actor.from : actor.to);

export class BombermanGame {
  readonly board = new Board<Tile>({ rows: ROWS, cols: COLS });

  /** Squares on fire, with ms left. */
  readonly fire = new Map<string, number>();

  readonly actors: Actor[] = [];

  maxBombs = 1;

  range = 2;

  score = 0;

  elapsed = 0;

  private readonly random: () => number;

  private input: Input = { move: null, bomb: false };

  constructor({ seed = 1, crates = 0.55 }: { seed?: number; crates?: number } = {}) {
    this.random = seeded(seed);

    // Keep the player's corner and the enemies' squares clear of crates.
    const clear = new Set([START, '1|2', '2|1']);
    ENEMY_STARTS.forEach((coord) => {
      clear.add(coord);
      this.board.getNeighbors(coord).forEach((n) => clear.add(n));
    });

    for (const { coord, row, col } of this.board.squares()) {
      if (this.board.isEdge(coord) || (row % 2 === 0 && col % 2 === 0)) this.board.setItem(coord, new Tile('wall'));
      else if (!clear.has(coord) && this.random() < crates) this.board.setItem(coord, new Tile('crate'));
    }

    this.actors.push(this.actor('player', START, 4));
    ENEMY_STARTS.forEach((coord) => this.actors.push(this.actor('enemy', coord, 2.2)));
  }

  get player(): Actor {
    return this.actors[0];
  }

  get enemies(): Actor[] {
    return this.actors.filter((a) => a.kind === 'enemy' && a.alive);
  }

  getStatus(): Status {
    if (!this.player.alive) return { state: 'lost' };
    if (!this.enemies.length) return { state: 'won' };
    return { state: 'playing' };
  }

  /** What the player wants to do: hold a direction, press for a bomb. */
  setInput(input: Partial<Input>) {
    this.input = { ...this.input, ...input };
  }

  bombsPlaced(): number {
    return this.board.countItems((tile) => tile.kind === 'bomb');
  }

  /** Whether an actor may step onto `coord`: no walls, crates or bombs. */
  isWalkable(coord: string): boolean {
    if (!this.board.isExistCoord(coord)) return false;
    const kind = this.board.getItem(coord)?.kind;
    return kind !== 'wall' && kind !== 'crate' && kind !== 'bomb';
  }

  /**
   * The squares a bomb on `coord` would set on fire: the square itself and up
   * to `range` along each line, stopping at walls, and at (and including) the
   * first crate or bomb.
   */
  blastFrom(coord: string, range: number): string[] {
    const squares = [coord];

    for (const move of MOVES) {
      for (const square of this.board.ray(coord, move, range)) {
        const kind = this.board.getItem(square)?.kind;
        if (kind === 'wall') break;
        squares.push(square);
        if (kind === 'crate' || kind === 'bomb') break;
      }
    }

    return squares;
  }

  /** Advances the game by `ms` milliseconds. */
  tick(ms: number) {
    if (this.getStatus().state !== 'playing') return;
    this.elapsed += ms;

    // 1. Bombs count down; a bomb in a blast goes off at once.
    const ready: string[] = [];
    Object.entries(this.board.board).forEach(([coord, { item }]) => {
      if (item?.kind !== 'bomb') return;
      item.data!.timer! -= ms;
      if (item.data!.timer! <= 0) ready.push(coord);
    });
    this.explode(ready);

    // 2. Fire burns out.
    for (const [coord, left] of this.fire) {
      if (left - ms <= 0) this.fire.delete(coord);
      else this.fire.set(coord, left - ms);
    }

    // 3. The player acts, then everyone moves.
    if (this.input.bomb) {
      this.placeBomb();
      this.input.bomb = false;
    }
    this.actors.filter((a) => a.alive).forEach((actor) => this.move(actor, ms));

    // 4. Pick up power-ups.
    const here = occupied(this.player);
    const tile = this.board.getItem(here);
    if (tile?.kind === 'power') {
      const power = tile.data!.power!;
      if (power === 'bomb') this.maxBombs += 1;
      if (power === 'fire') this.range += 1;
      if (power === 'speed') this.player.speed = Math.min(6.5, this.player.speed + 0.8);
      this.board.removeItem(here);
      this.score += 50;
    }

    // 5. Fire and enemies are deadly.
    for (const enemy of this.enemies) {
      if (this.fire.has(occupied(enemy))) {
        enemy.alive = false;
        this.score += 100;
      }
    }
    if (this.fire.has(here) || this.enemies.some((e) => occupied(e) === here)) {
      this.player.alive = false;
    }
  }

  private actor(kind: Actor['kind'], coord: string, speed: number): Actor {
    return { id: this.actors.length, kind, from: coord, to: coord, progress: 0, speed, facing: null, alive: true };
  }

  private placeBomb() {
    const coord = occupied(this.player);
    if (this.board.getItem(coord) || this.bombsPlaced() >= this.maxBombs) return;
    this.board.setItem(coord, new Tile('bomb', { timer: BOMB_MS, range: this.range }));
  }

  private explode(coords: string[]) {
    const queue = [...coords];
    const revealed: string[] = [];

    while (queue.length) {
      const coord = queue.shift()!;
      const bomb = this.board.getItem(coord);
      if (bomb?.kind !== 'bomb') continue;

      this.board.removeItem(coord);

      for (const square of this.blastFrom(coord, bomb.data!.range!)) {
        const item = this.board.getItem(square);
        this.fire.set(square, FIRE_MS);

        if (item?.kind === 'bomb') queue.push(square); // chain reaction
        if (item?.kind === 'power') this.board.removeItem(square);
        if (item?.kind === 'crate') {
          this.board.removeItem(square);
          this.score += 10;
          revealed.push(square);
        }
      }
    }

    // A burnt crate sometimes leaves a power-up, once the blast is over.
    for (const square of revealed) {
      if (this.random() < 0.3) {
        const power: Power = (['bomb', 'fire', 'speed'] as Power[])[Math.floor(this.random() * 3)];
        this.board.setItem(square, new Tile('power', { power }));
      }
    }
  }

  private move(actor: Actor, ms: number) {
    // Standing still: pick where to go next, and start right away.
    if (actor.from === actor.to) {
      const direction = actor.kind === 'player' ? this.input.move : this.enemyDirection(actor);
      if (!direction) return;

      const next = stepCoord(actor.from, direction);
      if (!this.isWalkable(next)) return;
      actor.to = next;
      actor.facing = direction;
    }

    actor.progress += (actor.speed * ms) / 1000;
    if (actor.progress >= 1) {
      actor.from = actor.to;
      actor.progress = 0;
    }
  }

  /** Enemies chase the player when close, otherwise wander, mostly straight. */
  private enemyDirection(enemy: Actor): Move | null {
    const open = MOVES.filter((m) => this.isWalkable(stepCoord(enemy.from, m)));
    if (!open.length) return null;

    const path = this.board.findPath(enemy.from, occupied(this.player), {
      steps: 6,
      canEnter: (coord) => this.isWalkable(coord),
    });
    if (path?.length && this.random() < 0.5) {
      return open.find((m) => stepCoord(enemy.from, m) === path[0]) ?? null;
    }

    if (enemy.facing && open.includes(enemy.facing) && this.random() < 0.75) return enemy.facing;
    return open[Math.floor(this.random() * open.length)];
  }
}

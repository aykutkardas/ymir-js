// A small turn-based tactics game, written on top of ymir-js's core Board and
// Item. Units keep their stats in the item's typed `data`; movement ranges
// come from the core's getReachable and findPath.
import { Board, Item, manhattan as distance, toCoord } from 'ymir-js';

export type Side = 'blue' | 'red';
export type UnitType = 'knight' | 'archer' | 'scout';
export type Terrain = 'grass' | 'forest' | 'rock';

export type UnitData = {
  type: UnitType;
  side: Side;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  move: number;
  /** Attack range, as the fewest and most squares away (counted along rows and columns). */
  range: [number, number];
  moved: boolean;
  acted: boolean;
};

export const STATS: Record<UnitType, Omit<UnitData, 'type' | 'side' | 'hp' | 'moved' | 'acted'>> = {
  knight: { maxHp: 14, attack: 6, defense: 2, move: 3, range: [1, 1] },
  archer: { maxHp: 9, attack: 5, defense: 0, move: 3, range: [2, 3] },
  scout: { maxHp: 10, attack: 4, defense: 1, move: 5, range: [1, 1] },
};

export class Unit extends Item<UnitData> {
  declare data: UnitData;

  constructor(type: UnitType, side: Side) {
    const stats = STATS[type];
    super({ name: type, data: { type, side, hp: stats.maxHp, moved: false, acted: false, ...stats } });
  }
}

export type AttackResult = {
  attacker: string;
  target: string;
  damage: number;
  killed: boolean;
  /** The defender's strike back, if it survived and could reach. */
  counter: { damage: number; killed: boolean } | null;
};

export type Status = { state: 'playing' } | { state: 'won'; winner: Side };

export const other = (side: Side): Side => (side === 'blue' ? 'red' : 'blue');

/** The battlefield: terrain, units, movement and combat. */
export class TacticsBoard extends Board<Unit> {
  readonly terrain: Record<string, Terrain> = {};

  /**
   * `map` rows use `.` grass, `F` forest, `R` rock; units are placed with
   * `units`, e.g. `{ '7|1': ['knight', 'blue'] }`.
   */
  constructor(map: string[], units: Record<string, [UnitType, Side]>) {
    super({ rows: map.length, cols: map[0].length });

    map.forEach((line, r) =>
      [...line].forEach((ch, c) => {
        this.terrain[toCoord(r, c)] = ch === 'F' ? 'forest' : ch === 'R' ? 'rock' : 'grass';
      })
    );
    Object.entries(units).forEach(([coord, [type, side]]) => this.setItem(coord, new Unit(type, side)));
  }

  unitsOf(side: Side): string[] {
    return this.findCoords((unit) => unit.data.side === side);
  }

  /**
   * Where the unit on `coord` can move this turn: up to its `move` steps,
   * around rocks, through its own side's units but not the enemy's, and
   * only onto a free square (or staying put). With `nextTurn`, ignores
   * whether it has already moved, to ask where it could go next turn.
   */
  movesFor(coord: string, { nextTurn = false }: { nextTurn?: boolean } = {}): Map<string, number> {
    const unit = this.getItem(coord);
    if (!unit || (unit.data.moved && !nextTurn)) return new Map([[coord, 0]]);

    const reach = this.getReachable(coord, {
      steps: unit.data.move,
      canEnter: (square) => {
        if (this.terrain[square] === 'rock') return false;
        const there = this.getItem(square);
        return !there || there.data.side === unit.data.side;
      },
    });

    for (const square of reach.keys()) {
      if (square !== coord && !this.isEmpty(square)) reach.delete(square);
    }

    return reach;
  }

  /** The route the unit would walk to `to`, for animating a move. */
  routeTo(from: string, to: string): string[] {
    const unit = this.getItem(from)!;
    return (
      this.findPath(from, to, {
        canEnter: (square) => {
          if (this.terrain[square] === 'rock') return false;
          const there = this.getItem(square);
          return !there || there.data.side === unit.data.side;
        },
      }) ?? [to]
    );
  }

  /** Enemy units a unit standing on `from` could attack. */
  targetsFrom(from: string, unit: Unit): string[] {
    const [min, max] = unit.data.range;

    return this.unitsOf(other(unit.data.side)).filter((target) => {
      const d = distance(from, target);
      return d >= min && d <= max;
    });
  }

  /** Damage from `attacker` to the unit on `target`; forest adds 1 defense. */
  damage(attacker: Unit, target: string): number {
    const defender = this.getItem(target)!;
    const cover = this.terrain[target] === 'forest' ? 1 : 0;
    return Math.max(1, attacker.data.attack - defender.data.defense - cover);
  }

  moveUnit(from: string, to: string) {
    const unit = this.getItem(from)!;
    if (from !== to) this.moveItem(from, to);
    unit.data.moved = true;
  }

  /** Attacks, then the defender strikes back if it survived and is in range. */
  attack(from: string, target: string): AttackResult {
    const attacker = this.getItem(from)!;
    const defender = this.getItem(target)!;

    const damage = this.damage(attacker, target);
    defender.data.hp = Math.max(0, defender.data.hp - damage);
    const killed = defender.data.hp === 0;
    if (killed) this.removeItem(target);

    let counter: AttackResult['counter'] = null;
    if (!killed) {
      const d = distance(from, target);
      const [min, max] = defender.data.range;
      if (d >= min && d <= max) {
        const back = this.damage(defender, from);
        attacker.data.hp = Math.max(0, attacker.data.hp - back);
        counter = { damage: back, killed: attacker.data.hp === 0 };
        if (counter.killed) this.removeItem(from);
      }
    }

    attacker.data.moved = true;
    attacker.data.acted = true;

    return { attacker: from, target, damage, killed, counter };
  }

  wait(coord: string) {
    const unit = this.getItem(coord)!;
    unit.data.moved = true;
    unit.data.acted = true;
  }

  /** Readies every unit of `side` for a new turn. */
  refresh(side: Side) {
    this.unitsOf(side).forEach((coord) => {
      const unit = this.getItem(coord)!;
      unit.data.moved = false;
      unit.data.acted = false;
    });
  }

  status(): Status {
    if (!this.unitsOf('red').length) return { state: 'won', winner: 'blue' };
    if (!this.unitsOf('blue').length) return { state: 'won', winner: 'red' };
    return { state: 'playing' };
  }
}

export const MAP = [
  '..F...R.',
  '.R..F...',
  '....R.F.',
  'F.R.....',
  '.....R.F',
  '.F.R....',
  '...F..R.',
  '.R...F..',
];

export const UNITS: Record<string, [UnitType, Side]> = {
  '0|1': ['archer', 'red'],
  '0|3': ['knight', 'red'],
  '1|6': ['scout', 'red'],
  '7|6': ['archer', 'blue'],
  '7|4': ['knight', 'blue'],
  '6|1': ['scout', 'blue'],
};

export const newBattle = () => new TacticsBoard(MAP, UNITS);

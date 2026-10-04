import { describe, expect, it } from 'vitest';

import Board from './board.js';
import Item from './item.js';
import cloneItem from './utils/cloneItem.js';

class Unit extends Item<{ hp: number; tags: string[] }> {
  side: string;

  constructor(side: string) {
    super({ name: 'unit', movement: { linear: true }, data: { hp: 10, tags: ['a'] } });
    this.side = side;
  }

  get label() {
    return `${this.side} ${this.data!.hp}`;
  }
}

class Field extends Board<Unit> {
  terrain: Record<string, string> = { '0|0': 'forest' };

  constructor(public label: string) {
    super({ rows: 2, cols: 2 });
  }

  blueCoords() {
    return this.findCoords((unit) => unit.side === 'blue');
  }
}

describe('cloneItem', () => {
  it('keeps the class and copies plain data deeply', () => {
    const unit = new Unit('blue');
    const copy = cloneItem(unit);

    copy.data!.hp = 3;
    copy.data!.tags.push('b');
    copy.movement.angular = true;

    expect(copy).toBeInstanceOf(Unit);
    expect(copy.label).toBe('blue 3');
    expect(unit.data).toEqual({ hp: 10, tags: ['a'] });
    expect(unit.movement).toEqual({ linear: true });
  });

  it('shares what is not a plain object or array', () => {
    const date = new Date(0);
    const item = new Item({ name: 'x', data: { date } });

    expect(cloneItem(item).data!.date).toBe(date);
  });
});

describe('Board clone', () => {
  it('copies the board, its class and fields, without sharing items', () => {
    const board = new Field('north');
    board.setItem('0|1', new Unit('blue'));
    const copy = board.clone();

    copy.getItem('0|1')!.data!.hp = 1;
    copy.moveItem('0|1', '1|1');

    expect(copy).toBeInstanceOf(Field);
    expect(copy.label).toBe('north');
    expect(copy.terrain).toBe(board.terrain); // other fields are shallow
    expect(copy.config).toEqual(board.config);
    expect(copy.config).not.toBe(board.config);
    expect(board.getItem('0|1')!.data!.hp).toBe(10);
    expect(board.getItem('1|1')).toBe(null);
  });

  it('binds the copy\'s methods to the copy', () => {
    const board = new Field('north');
    const copy = board.clone();
    const { setItem, blueCoords } = copy;

    setItem('1|0', new Unit('blue'));

    expect(blueCoords()).toEqual(['1|0']);
    expect(board.blueCoords()).toEqual([]);
  });
});

describe('snapshot and restore', () => {
  it('puts the items back, as many times as needed', () => {
    const board = new Field('north');
    board.setItem('0|0', new Unit('blue'));
    const snapshot = board.snapshot();

    for (let i = 0; i < 2; i += 1) {
      board.getItem('0|0')!.data!.hp = 0;
      board.moveItem('0|0', '1|1');
      board.setItem('0|1', new Unit('red'));

      board.restore(snapshot);

      expect(board.findCoords()).toEqual(['0|0']);
      expect(board.getItem('0|0')).toBeInstanceOf(Unit);
      expect(board.getItem('0|0')!.data!.hp).toBe(10);
    }
  });

  it('is not changed by later moves', () => {
    const board = new Field('north');
    board.setItem('0|0', new Unit('blue'));
    const snapshot = board.snapshot();

    board.getItem('0|0')!.data!.hp = 0;

    expect(snapshot.get('0|0')!.data!.hp).toBe(10);
    expect([...snapshot.keys()]).toEqual(['0|0']);
  });
});

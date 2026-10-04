import { describe, expect, it } from 'vitest';

import { actingOrder, planFor } from './ai';
import { TacticsBoard, newBattle, type Side, type UnitType } from './rules';

const OPEN = Array(6).fill('......');

const battle = (units: Record<string, [UnitType, Side]>, map = OPEN) => new TacticsBoard(map, units);

describe('movement', () => {
  it('moves up to the unit’s range, around rocks', () => {
    const board = battle({ '2|2': ['knight', 'blue'] }, ['......', '......', '.R.R..', '......', '......', '......']);
    const moves = board.movesFor('2|2');

    expect(moves.get('2|2')).toBe(0);
    expect(moves.has('2|1')).toBe(false); // rock
    expect(moves.has('1|0')).toBe(true); // around it: up, left, left
    expect(moves.has('2|0')).toBe(false); // behind the rock is 4 steps
    expect(moves.has('5|2')).toBe(true); // three straight down
    expect(moves.has('5|3')).toBe(false); // four steps
  });

  it('passes through allies but not enemies, and never stops on a unit', () => {
    const board = battle({ '0|0': ['knight', 'blue'], '0|1': ['scout', 'blue'], '1|0': ['knight', 'red'] });
    const moves = board.movesFor('0|0');

    expect(moves.has('0|1')).toBe(false); // the ally's own square
    expect(moves.has('0|2')).toBe(true); // through the ally
    expect(moves.has('2|0')).toBe(false); // blocked by the enemy, and too far around
  });

  it('a unit that has moved cannot move again', () => {
    const board = battle({ '0|0': ['knight', 'blue'] });
    board.moveUnit('0|0', '0|2');

    expect([...board.movesFor('0|2').keys()]).toEqual(['0|2']);
  });
});

describe('combat', () => {
  it('melee units hit next to them; archers at 2 to 3 squares, not adjacent', () => {
    const board = battle({ '2|2': ['archer', 'blue'], '2|3': ['knight', 'red'], '2|5': ['scout', 'red'] });
    const archer = board.getItem('2|2')!;

    expect(board.targetsFrom('2|2', archer)).toEqual(['2|5']);
  });

  it('damage is attack minus defence, one less in a forest, at least 1', () => {
    const board = battle({ '0|0': ['knight', 'blue'], '0|1': ['scout', 'red'], '1|0': ['knight', 'red'] }, ['.F....', ...OPEN.slice(1)]);
    const knight = board.getItem('0|0')!;

    expect(board.damage(knight, '0|1')).toBe(6 - 1 - 1); // scout in a forest
    expect(board.damage(knight, '1|0')).toBe(6 - 2);
    expect(board.damage(board.getItem('0|1')!, '1|0')).toBe(Math.max(1, 4 - 2));
  });

  it('the defender strikes back if it survives and can reach', () => {
    const board = battle({ '0|0': ['scout', 'blue'], '0|1': ['knight', 'red'] });
    const result = board.attack('0|0', '0|1');

    expect(result).toMatchObject({ damage: 4 - 2, killed: false, counter: { damage: 6 - 1, killed: false } });
    expect(board.getItem('0|0')!.data.hp).toBe(10 - 5);
    expect(board.getItem('0|0')!.data.acted).toBe(true);
  });

  it('an archer shooting from range takes no counter from a knight', () => {
    const board = battle({ '0|0': ['archer', 'blue'], '0|2': ['knight', 'red'] });

    expect(board.attack('0|0', '0|2').counter).toBe(null);
  });

  it('a unit at 0 hp is removed, and the battle is won when a side is gone', () => {
    const board = battle({ '0|0': ['knight', 'blue'], '0|1': ['archer', 'red'] });
    board.getItem('0|1')!.data.hp = 3;

    expect(board.attack('0|0', '0|1')).toMatchObject({ killed: true, counter: null });
    expect(board.getItem('0|1')).toBe(null);
    expect(board.status()).toEqual({ state: 'won', winner: 'blue' });
  });

  it('refresh readies a side for its next turn', () => {
    const board = battle({ '0|0': ['knight', 'blue'] });
    board.wait('0|0');
    board.refresh('blue');

    expect(board.getItem('0|0')!.data).toMatchObject({ moved: false, acted: false });
  });
});

describe('computer player', () => {
  it('goes for a kill it can reach', () => {
    const board = battle({ '0|0': ['knight', 'red'], '0|3': ['archer', 'blue'], '5|5': ['knight', 'blue'] });
    board.getItem('0|3')!.data.hp = 2;

    expect(planFor(board, '0|0')).toMatchObject({ target: '0|3' });
  });

  it('walks toward the enemy when nothing is in reach', () => {
    const board = battle({ '0|0': ['knight', 'red'], '5|5': ['knight', 'blue'] });
    const plan = planFor(board, '0|0');
    const [r, c] = plan.to.split('|').map(Number);

    expect(plan.target).toBe(null);
    expect(r + c).toBe(3);
  });

  it('archers act first', () => {
    const board = newBattle();

    expect(board.getItem(actingOrder(board, 'red')[0])!.data.type).toBe('archer');
  });

  it('a whole battle of computer against computer ends', () => {
    const board = newBattle();
    let side: Side = 'red';

    for (let turn = 0; turn < 80 && board.status().state === 'playing'; turn += 1) {
      for (const from of actingOrder(board, side)) {
        if (!board.getItem(from) || board.status().state !== 'playing') continue;
        const plan = planFor(board, from);
        board.moveUnit(from, plan.to);
        if (plan.target) board.attack(plan.to, plan.target);
        else board.wait(plan.to);
      }
      board.refresh(side);
      side = side === 'red' ? 'blue' : 'red';
    }

    expect(board.status().state).toBe('won');
  });
});

describe('next turn', () => {
  it('movesFor with nextTurn ignores that the unit already moved', () => {
    const board = battle({ '0|0': ['knight', 'blue'] });
    board.moveUnit('0|0', '0|1');

    expect(board.movesFor('0|1').size).toBe(1);
    expect(board.movesFor('0|1', { nextTurn: true }).size).toBeGreaterThan(1);
  });
});

import { describe, expect, it } from 'vitest';

import Board from './board.js';
import {
  ANGULAR_DIRECTIONS,
  DIRECTION_STEPS,
  DIRECTIONS,
  LINEAR_DIRECTIONS,
  manhattan,
  stepCoord,
  toCoord,
} from './coords.js';

describe('coords', () => {
  it('lists directions in the order getColumnsByDirection uses', () => {
    const board = new Board({ rows: 3, cols: 3 });

    expect(DIRECTIONS).toEqual(Object.keys(board.getColumnsByDirection('1|1', {})));
    expect(DIRECTIONS).toEqual([...LINEAR_DIRECTIONS, ...ANGULAR_DIRECTIONS]);
    expect(Object.isFrozen(DIRECTIONS)).toBe(true);
  });

  it('agrees with getColumnsByDirection on each step', () => {
    const board = new Board({ rows: 5, cols: 5 });
    const lines = board.getColumnsByDirection('2|2', { linear: true, angular: true, stepCount: 2 });

    for (const direction of DIRECTIONS) {
      expect(stepCoord('2|2', direction)).toBe(lines[direction][0]);
      expect(stepCoord('2|2', direction, 2)).toBe(lines[direction][1]);
    }
    expect(DIRECTION_STEPS.topRight).toEqual([-1, 1]);
  });

  it('builds coords and measures distance', () => {
    expect(toCoord(3, 4)).toBe('3|4');
    expect(stepCoord('0|0', 'top')).toBe('-1|0');
    expect(manhattan('0|0', '2|3')).toBe(5);
    expect(manhattan('4|1', '1|4')).toBe(6);
  });
});

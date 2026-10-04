import { describe, expect, it } from 'vitest';

import { LEVELS } from './levels';
import { SokobanBoard, SokobanGame, solve, type Level } from './rules';

const level = (...map: string[]): Level => ({ name: 'test', map });

describe('SokobanBoard', () => {
  it('reads the level format', () => {
    const board = new SokobanBoard(level('#####', '#@$.#', '#####'));

    expect(board.findPlayer()).toBe('1|1');
    expect(board.boxes()).toEqual(['1|2']);
    expect([...board.goals]).toEqual(['1|3']);
    expect(board.getItem('0|0')?.kind).toBe('wall');
  });

  it('reads boxes and the player on goals', () => {
    const board = new SokobanBoard(level('#####', '#+*$#', '#####'));

    expect(board.findPlayer()).toBe('1|1');
    expect(board.boxes()).toEqual(['1|2', '1|3']);
    expect([...board.goals].sort()).toEqual(['1|1', '1|2']);
  });

  it('knows the floor inside the walls', () => {
    const board = new SokobanBoard(level(' ### ', '##@##', '#   #', '#####'));

    expect([...board.floor].sort()).toEqual(['1|2', '2|1', '2|2', '2|3']);
  });

  it('walks, and stops at walls', () => {
    const board = new SokobanBoard(level('####', '#@ #', '####'));

    expect(board.step('right')).toBe('walk');
    expect(board.findPlayer()).toBe('1|2');
    expect(board.step('right')).toBe(null);
    expect(board.step('top')).toBe(null);
  });

  it('pushes one box, but not into a wall or another box', () => {
    const board = new SokobanBoard(level('#######', '#@$ $$#', '#######'));

    expect(board.step('right')).toBe('push');
    expect(board.boxes()).toEqual(['1|3', '1|4', '1|5']);
    expect(board.findPlayer()).toBe('1|2');

    expect(board.step('right')).toBe(null); // two boxes in a row
    expect(board.findPlayer()).toBe('1|2');
  });

  it('is solved when every box is on a goal', () => {
    const board = new SokobanBoard(level('#####', '#@$.#', '#####'));

    expect(board.isSolved()).toBe(false);
    board.step('right');
    expect(board.isSolved()).toBe(true);
  });
});

describe('SokobanGame', () => {
  it('counts moves and pushes, undoes and restarts', () => {
    const game = new SokobanGame(level('######', '#@ $.#', '######'));

    game.move('right');
    game.move('right');
    expect(game.moves).toBe(2);
    expect(game.pushes).toBe(1);
    expect(game.solved).toBe(true);
    expect(game.move('left')).toBe(null); // nothing moves once solved

    game.undo();
    expect(game.moves).toBe(1);
    expect(game.pushes).toBe(0);
    expect(game.board.boxes()).toEqual(['1|3']);

    game.restart();
    expect(game.moves).toBe(0);
    expect(game.board.findPlayer()).toBe('1|1');
  });

  it('does not count a blocked move', () => {
    const game = new SokobanGame(level('####', '#@ #', '####'));

    expect(game.move('left')).toBe(null);
    expect(game.moves).toBe(0);
    expect(game.undo()).toBe(false);
  });
});

describe('solve', () => {
  it('finds the shortest solution', () => {
    expect(solve(new SokobanBoard(level('######', '#@ $.#', '######')))).toEqual(['right', 'right']);
  });

  it('returns null when there is none', () => {
    // The box is already in a corner that is not a goal.
    expect(solve(new SokobanBoard(level('#####', '#$ .#', '# @ #', '#####')))).toBe(null);
  });
});

describe('levels', () => {
  const fewest = [14, 22, 32];

  LEVELS.forEach((lvl, i) => {
    it(`${i + 1}. ${lvl.name} is solvable in ${fewest[i]} moves`, () => {
      const game = new SokobanGame(lvl);
      const solution = solve(game.board)!;

      expect(solution).toHaveLength(fewest[i]);

      // Playing the solution through the game solves the level.
      solution.forEach((move) => expect(game.move(move)).not.toBe(null));
      expect(game.solved).toBe(true);
    });

    it(`${i + 1}. ${lvl.name} has as many goals as boxes`, () => {
      const board = new SokobanBoard(lvl);
      expect(board.goals.size).toBe(board.boxes().length);
    });
  });
});

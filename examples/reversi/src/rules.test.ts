import { describe, expect, it } from 'vitest';

import { pickMove } from './ai';
import { ReversiBoard, ReversiGame } from './rules';

const sorted = (coords: string[]) => [...coords].sort();

describe('ReversiBoard', () => {
  it('starts with two discs of each colour, crossed', () => {
    const board = new ReversiBoard().setup();

    expect(board.count('black')).toBe(2);
    expect(board.count('white')).toBe(2);
    expect(board.getItem('3|3')?.color).toBe('white');
    expect(board.getItem('3|4')?.color).toBe('black');
  });

  it('black has the four standard opening moves', () => {
    const board = new ReversiBoard().setup();

    expect(sorted(board.movesFor('black').map((m) => m.coord))).toEqual(['2|3', '3|2', '4|5', '5|4']);
  });

  it('flips a run closed by one of ours, in any of the eight directions', () => {
    const board = new ReversiBoard().load([
      'b.......',
      '.w......',
      '..w.....',
      '........',
      '........',
      '........',
      '........',
      '........',
    ]);

    expect(sorted(board.flipsFor('3|3', 'black'))).toEqual(['1|1', '2|2']);
  });

  it('flips several lines at once', () => {
    const board = new ReversiBoard().load([
      '........',
      '.b.b.b..',
      '..www...',
      '.bw.wb..',
      '..www...',
      '.b.b.b..',
      '........',
      '........',
    ]);

    expect(board.flipsFor('3|3', 'black')).toHaveLength(8);
  });

  it('does not flip a run that is not closed, or across a gap', () => {
    const board = new ReversiBoard().load([
      '.ww.b...',
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
    ]);

    // From 0|0 the whites run into the empty 0|3 before any black disc.
    expect(board.flipsFor('0|0', 'black')).toEqual([]);
    // From 0|3 the whites run off to the empty 0|0; the black on 0|4 is right next to it.
    expect(board.flipsFor('0|3', 'black')).toEqual([]);
    // An occupied square is never a move.
    expect(board.flipsFor('0|4', 'black')).toEqual([]);
  });

  it('play places a disc and turns the flipped ones', () => {
    const board = new ReversiBoard().setup();
    const [move] = board.movesFor('black').filter((m) => m.coord === '2|3');

    board.play('black', move);

    expect(board.count('black')).toBe(4);
    expect(board.count('white')).toBe(1);
    expect(board.getItem('3|3')?.color).toBe('black');
  });
});

describe('ReversiGame', () => {
  it('turns alternate, illegal moves throw, and undo goes back', () => {
    const game = new ReversiGame();

    expect(() => game.play('0|0')).toThrow();
    game.play('2|3');
    expect(game.turn).toBe('white');

    game.undo();
    expect(game.turn).toBe('black');
    expect(game.board.toString()).toBe(new ReversiGame().board.toString());
    expect(game.undo()).toBe(false);
  });

  it('the game ends when neither side can move', () => {
    // After black takes 0|2, white has no discs left, so nobody can move.
    const game = new ReversiGame([
      'bw......',
      'b.......',
      '........',
      '........',
      '........',
      '........',
      '........',
      '.......b',
    ]);
    const before = game.board.toString();

    game.play('0|2');
    expect(game.board.count('white')).toBe(0);
    expect(game.getStatus()).toMatchObject({ state: 'over', winner: 'black' });

    game.undo();
    expect(game.board.toString()).toBe(before);
  });

  it('passes and keeps playing while the other side can move', () => {
    // Found in a random game: after black plays 1|3, white has no move left,
    // but black still has one (6|0).
    const game = new ReversiGame([
      'bbbbbbbb',
      'bbw.bwbb',
      'bwbwwbbb',
      'bwwbwwbb',
      'bwwbbwwb',
      'wwwbbbbb',
      '.wbwbwbb',
      'wbbbbbbb',
    ]);

    game.play('1|3');

    expect(game.lastWasPass).toBe(true);
    expect(game.turn).toBe('black');
    expect(game.getStatus().state).toBe('playing');
    expect(game.legalMoves().map((m) => m.coord)).toEqual(['6|0']);

    // Undo takes back the pass and the move before it.
    game.undo();
    expect(game.turn).toBe('black');
    expect(game.board.getItem('1|3')).toBe(null);
  });

  it('a full game ends with every square used or nobody able to move', () => {
    const game = new ReversiGame();

    while (game.getStatus().state === 'playing') {
      game.play(pickMove(game.board, game.turn, 2)!.coord);
    }

    const status = game.getStatus();
    expect(status.state).toBe('over');
    if (status.state === 'over') {
      expect(status.black + status.white).toBeLessThanOrEqual(64);
      expect(status.black + status.white).toBeGreaterThan(20);
    }
  });
});

describe('pickMove', () => {
  it('takes a corner when it can', () => {
    const board = new ReversiBoard().load([
      '.wb.....',
      'ww......',
      'b.b.....',
      '...w....',
      '....b...',
      '........',
      '........',
      '........',
    ]);

    expect(pickMove(board, 'black', 3)?.coord).toBe('0|0');
  });

  it('gives the same move for the same position', () => {
    const board = new ReversiBoard().setup();
    expect(pickMove(board, 'black', 3)).toEqual(pickMove(board, 'black', 3));
  });
});

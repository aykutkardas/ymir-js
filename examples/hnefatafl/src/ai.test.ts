import { describe, expect, it } from 'vitest';

import { pickMove } from './ai';
import { CORNERS, TaflGame } from './rules';

describe('pickMove', () => {
  it('takes an open corner', () => {
    // Both 0|0 and 10|0 are open; either wins.
    const game = new TaflGame({ position: { '3|0': 'king', '6|6': 'attacker', '8|8': 'defender' }, turn: 'defenders' });
    const move = pickMove(game)!;

    expect(move.from).toBe('3|0');
    expect(CORNERS).toContain(move.to);
  });

  it('captures the king when it can', () => {
    const game = new TaflGame({
      position: { '3|3': 'king', '2|3': 'attacker', '4|3': 'attacker', '3|2': 'attacker', '3|8': 'attacker', '8|8': 'defender' },
    });
    expect(pickMove(game)).toEqual({ from: '3|8', to: '3|4' });
  });

  it('blocks the king from escaping', () => {
    // The king threatens 0|0 along row 0 (0|7 already covers the other way);
    // an attacker must step in between.
    const game = new TaflGame({
      position: { '0|4': 'king', '0|7': 'attacker', '2|2': 'attacker', '7|7': 'attacker', '9|9': 'defender' },
    });
    const move = pickMove(game)!;
    game.play(move);
    expect(game.board.movesFrom('0|4')).not.toContain('0|0');
  });

  it('leaves the board as it was, and is quick from the start', () => {
    const game = new TaflGame();
    const before = game.board.key();
    const started = Date.now();

    expect(game.getLegalMoves()).toContainEqual(pickMove(game));
    expect(game.board.key()).toBe(before);
    expect(Date.now() - started).toBeLessThan(3000);
  });
});

describe('repetition', () => {
  it('the defenders avoid a third repetition', () => {
    const game = new TaflGame({ position: { '2|2': 'attacker', '8|8': 'defender', '5|5': 'king', '9|1': 'defender' } });
    const shuffle = () => {
      game.play({ from: '2|2', to: '2|3' });
      game.play({ from: '8|8', to: '8|7' });
      game.play({ from: '2|3', to: '2|2' });
      game.play({ from: '8|7', to: '8|8' });
    };
    shuffle();
    game.play({ from: '2|2', to: '2|3' });
    game.play({ from: '8|8', to: '8|7' });
    game.play({ from: '2|3', to: '2|2' });

    // Moving back to 8|8 now would repeat the position a third time.
    expect(game.timesSeenAfter({ from: '8|7', to: '8|8' })).toBe(2);
    expect(pickMove(game)).not.toEqual({ from: '8|7', to: '8|8' });
  });
});

import { describe, expect, it } from 'vitest';

import { TaflBoard, TaflGame, Piece, type Role } from './rules';

const board = (position: Record<string, Role>) => {
  const b = new TaflBoard();
  Object.entries(position).forEach(([coord, role]) => b.setItem(coord, new Piece(role)));
  return b;
};

describe('set-up', () => {
  it('has 24 attackers, 12 defenders and the king on the throne', () => {
    const roles = Object.values(new TaflBoard().setup().board)
      .map(({ item }) => item?.role)
      .filter(Boolean);

    expect(roles.filter((r) => r === 'attacker')).toHaveLength(24);
    expect(roles.filter((r) => r === 'defender')).toHaveLength(12);
    expect(new TaflBoard().setup().findKing()).toBe('5|5');
    expect(new TaflGame().turn).toBe('attackers');
  });
});

describe('moving', () => {
  it('slides like a rook and stops before a piece', () => {
    const b = board({ '2|2': 'attacker', '2|6': 'defender' });

    expect(b.movesFrom('2|2')).toEqual(expect.arrayContaining(['0|2', '10|2', '2|0', '2|5']));
    expect(b.movesFrom('2|2')).not.toContain('2|6');
    expect(b.movesFrom('2|2')).not.toContain('2|7');
  });

  it('passes over the empty throne but only the king stops on it', () => {
    const b = board({ '5|2': 'attacker', '5|8': 'king' });

    expect(b.movesFrom('5|2')).toContain('5|4');
    expect(b.movesFrom('5|2')).not.toContain('5|5');
    expect(b.movesFrom('5|2')).toContain('5|6');
    expect(b.movesFrom('5|8')).toContain('5|5');
  });

  it('only the king may enter a corner', () => {
    const b = board({ '0|3': 'defender', '3|0': 'king' });

    expect(b.movesFrom('0|3')).not.toContain('0|0');
    expect(b.movesFrom('3|0')).toContain('0|0');
  });
});

describe('captures', () => {
  it('sandwiches a piece between two enemies', () => {
    const b = board({ '3|3': 'attacker', '3|4': 'defender', '2|5': 'attacker' });

    expect(b.play({ from: '2|5', to: '3|5' })).toEqual(['3|4']);
  });

  it('moving between two enemies is safe', () => {
    const b = board({ '3|3': 'attacker', '3|5': 'attacker', '0|4': 'defender' });

    expect(b.play({ from: '0|4', to: '3|4' })).toEqual([]);
    expect(b.getItem('3|4')?.role).toBe('defender');
  });

  it('corners are hostile to everyone', () => {
    const b = board({ '0|1': 'defender', '4|2': 'attacker' });

    expect(b.play({ from: '4|2', to: '0|2' })).toEqual(['0|1']);
  });

  it('the empty throne is hostile to both sides', () => {
    expect(board({ '5|4': 'defender', '8|3': 'attacker' }).play({ from: '8|3', to: '5|3' })).toEqual(['5|4']);
    expect(board({ '5|4': 'attacker', '8|3': 'defender' }).play({ from: '8|3', to: '5|3' })).toEqual(['5|4']);
  });

  it('the throne with the king on it is hostile to attackers only', () => {
    expect(
      board({ '5|5': 'king', '5|4': 'attacker', '8|3': 'defender' }).play({ from: '8|3', to: '5|3' })
    ).toEqual(['5|4']);
    expect(
      board({ '5|5': 'king', '5|4': 'defender', '8|3': 'attacker' }).play({ from: '8|3', to: '5|3' })
    ).toEqual([]);
  });

  it('the king takes part in captures', () => {
    const b = board({ '2|2': 'king', '2|3': 'attacker', '0|4': 'defender' });

    expect(b.play({ from: '0|4', to: '2|4' })).toEqual(['2|3']);
  });

  it('shieldwall: a row on the edge, faced from inside, is taken at once', () => {
    const b = board({
      '10|4': 'defender',
      '10|5': 'defender',
      '9|4': 'attacker',
      '9|5': 'attacker',
      '10|3': 'attacker',
      '7|6': 'attacker',
    });

    expect(b.play({ from: '7|6', to: '10|6' }).sort()).toEqual(['10|4', '10|5']);
  });

  it('shieldwall: the king in the row survives, and a corner can close it', () => {
    const withKing = board({
      '10|4': 'king',
      '10|5': 'defender',
      '9|4': 'attacker',
      '9|5': 'attacker',
      '10|3': 'attacker',
      '7|6': 'attacker',
    });
    expect(withKing.play({ from: '7|6', to: '10|6' })).toEqual(['10|5']);
    expect(withKing.getItem('10|4')?.role).toBe('king');

    const corner = board({
      '10|1': 'defender',
      '10|2': 'defender',
      '9|1': 'attacker',
      '9|2': 'attacker',
      '7|3': 'attacker',
    });
    expect(corner.play({ from: '7|3', to: '10|3' }).sort()).toEqual(['10|1', '10|2']);
  });
});

describe('winning', () => {
  it('the king escapes to a corner', () => {
    const game = new TaflGame({ position: { '3|0': 'king', '6|6': 'attacker' }, turn: 'defenders' });

    game.play({ from: '3|0', to: '0|0' });
    expect(game.getStatus()).toEqual({ state: 'won', winner: 'defenders', reason: 'escape' });
  });

  it('attackers capture the king on four sides', () => {
    const game = new TaflGame({
      position: { '3|3': 'king', '2|3': 'attacker', '4|3': 'attacker', '3|2': 'attacker', '3|8': 'attacker', '8|8': 'defender' },
    });

    game.play({ from: '3|8', to: '3|4' });
    expect(game.getStatus()).toEqual({ state: 'won', winner: 'attackers', reason: 'king-captured' });
  });

  it('next to the throne, three attackers are enough', () => {
    const game = new TaflGame({
      position: { '4|5': 'king', '3|5': 'attacker', '4|4': 'attacker', '4|9': 'attacker', '8|8': 'defender' },
    });

    game.play({ from: '4|9', to: '4|6' });
    expect(game.getStatus()).toMatchObject({ winner: 'attackers', reason: 'king-captured' });
  });

  it('the king cannot be captured on the edge', () => {
    const game = new TaflGame({
      position: { '0|4': 'king', '0|3': 'attacker', '1|4': 'attacker', '4|5': 'attacker', '8|8': 'defender' },
    });

    game.play({ from: '4|5', to: '0|5' });
    expect(game.getStatus().state).toBe('playing');
  });

  it('the king walking in between attackers is not captured', () => {
    const game = new TaflGame({
      position: { '5|5': 'king', '3|5': 'attacker', '4|4': 'attacker', '4|6': 'attacker', '8|8': 'attacker', '9|9': 'defender' },
      turn: 'defenders',
    });

    game.play({ from: '5|5', to: '4|5' });
    expect(game.getStatus().state).toBe('playing');
  });

  it('attackers win by encircling every defender', () => {
    const game = new TaflGame({
      position: {
        '5|5': 'king',
        '5|6': 'defender',
        '4|5': 'attacker',
        '4|6': 'attacker',
        '6|5': 'attacker',
        '6|6': 'attacker',
        '5|4': 'attacker',
        '5|9': 'attacker',
      },
    });

    game.play({ from: '5|9', to: '5|7' });
    expect(game.getStatus()).toEqual({ state: 'won', winner: 'attackers', reason: 'encircled' });
  });

  it('defenders win with an unbreakable fort on the edge', () => {
    const game = new TaflGame({
      position: { '10|5': 'king', '10|4': 'defender', '10|7': 'defender', '9|5': 'defender', '9|9': 'defender', '0|5': 'attacker' },
      turn: 'defenders',
    });

    expect(game.getStatus().state).toBe('playing');
    game.play({ from: '9|9', to: '9|6' });
    expect(game.getStatus()).toEqual({ state: 'won', winner: 'defenders', reason: 'exit-fort' });
  });

  it('a fort an attacker can break is not a win', () => {
    const game = new TaflGame({
      position: { '10|5': 'king', '10|4': 'defender', '10|7': 'defender', '9|5': 'defender', '8|6': 'defender', '0|5': 'attacker' },
      turn: 'defenders',
    });

    // 9|6 stays open, so attackers could walk into the pocket.
    game.play({ from: '8|6', to: '8|7' });
    expect(game.getStatus().state).toBe('playing');
  });

  it('a side that cannot move loses', () => {
    const game = new TaflGame({ position: { '0|1': 'attacker', '0|2': 'defender', '1|1': 'defender', '5|5': 'king' } });

    expect(game.getStatus()).toEqual({ state: 'won', winner: 'defenders', reason: 'no-moves' });
  });

  it('perpetual repetition loses for the defenders', () => {
    const game = new TaflGame({ position: { '2|2': 'attacker', '8|8': 'defender', '5|5': 'king' } });
    const shuffle = () => {
      game.play({ from: '2|2', to: '2|3' });
      game.play({ from: '8|8', to: '8|7' });
      game.play({ from: '2|3', to: '2|2' });
      game.play({ from: '8|7', to: '8|8' });
    };

    shuffle();
    expect(game.getStatus().state).toBe('playing');
    shuffle();
    expect(game.getStatus()).toEqual({ state: 'won', winner: 'attackers', reason: 'repetition' });
  });
});

describe('TaflGame', () => {
  it('rejects illegal moves and undoes captures', () => {
    const game = new TaflGame({ position: { '3|3': 'attacker', '3|4': 'defender', '2|5': 'attacker', '5|5': 'king' } });

    expect(() => game.play({ from: '3|4', to: '3|6' })).toThrow(); // not their turn
    expect(game.play({ from: '2|5', to: '3|5' })).toEqual(['3|4']);
    expect(game.turn).toBe('defenders');

    game.undo();
    expect(game.board.getItem('3|4')?.role).toBe('defender');
    expect(game.board.getItem('2|5')?.role).toBe('attacker');
    expect(game.turn).toBe('attackers');
  });

  it('random games stay legal and end', () => {
    let seed = 3;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

    for (let i = 0; i < 10; i += 1) {
      const game = new TaflGame();

      while (game.getStatus().state === 'playing' && game.moves.length < 400) {
        const moves = game.getLegalMoves();
        game.play(moves[Math.floor(random() * moves.length)]);

        const roles = Object.values(game.board.board).map(({ item }) => item?.role);
        expect(roles.filter((r) => r === 'king').length).toBeLessThanOrEqual(1);
        expect(game.board.getItem('0|0')?.role ?? 'king').toBe('king');
      }
    }
  });
});

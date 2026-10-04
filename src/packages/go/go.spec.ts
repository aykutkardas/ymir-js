import { describe, expect, it } from 'vitest';

import GoBoard, { GoPosition } from './board.js';
import GoGame from './game.js';

/** Rows of `.` (empty), `X` (black) and `O` (white) as a position. */
const position = (...rows: string[]): GoPosition => {
  const result: GoPosition = {};
  rows.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      if (ch === 'X') result[`${r}|${c}`] = 'b';
      if (ch === 'O') result[`${r}|${c}`] = 'w';
    })
  );
  return result;
};

const board = (...rows: string[]) =>
  new GoBoard(rows.length).setPosition(position(...rows));

describe('GoBoard', () => {
  it('rejects sizes outside 2-25', () => {
    expect(() => new GoBoard(1)).to.throw();
    expect(() => new GoBoard(26)).to.throw();
    expect(new GoBoard(9).size).to.equal(9);
  });

  it('finds groups and their liberties', () => {
    const b = board(
      'XX...', //
      'X.O..',
      '.....',
      '.....',
      '.....'
    );

    const group = b.getGroup('0|0')!;
    expect(group.color).to.equal('black');
    expect(group.stones.sort()).to.deep.equal(['0|0', '0|1', '1|0']);
    expect(group.liberties.sort()).to.deep.equal(['0|2', '1|1', '2|0']);
    expect(b.getGroup('2|2')).to.equal(null);
    expect(b.getGroups()).to.have.length(2);
  });

  it('a move that leaves the group a liberty captures nothing', () => {
    const b = board(
      '.XO..', //
      'XOO..',
      '.XO..',
      'X....',
      '.....'
    );

    // The white group 0|2, 1|1, 1|2, 2|2 keeps three liberties.
    expect(b.placeStone('black', '0|3')).to.deep.equal([]);
    expect(b.getGroup('1|1')!.liberties.sort()).to.deep.equal(['1|3', '2|3', '3|2']);
  });

  it('removes captured stones', () => {
    const b = board(
      '.X...', //
      'XOX..',
      '.....',
      '.....',
      '.....'
    );

    expect(b.placeStone('black', '2|1')).to.deep.equal(['1|1']);
    expect(b.getColor('1|1')).to.equal(null);
  });

  it('suicide is not allowed, unless it captures', () => {
    const b = board(
      '.X...', //
      'X.X..',
      '.X...',
      '.....',
      '.....'
    );

    expect(b.checkMove('white', '1|1')).to.deep.equal({ legal: false, reason: 'suicide' });
    expect(b.checkMove('white', '0|1')).to.deep.equal({ legal: false, reason: 'occupied' });
    expect(b.checkMove('white', '9|9')).to.deep.equal({ legal: false, reason: 'off-board' });

    // With 0|1 down to one liberty (1|1), white at 1|1 captures it.
    b.setPosition(
      position(
        'OXO..', //
        'X.X..',
        '.X...',
        '.....',
        '.....'
      )
    );
    expect(b.checkMove('white', '1|1')).to.deep.equal({ legal: true, captured: ['0|1'] });
  });

  it('converts to and from GTP vertices', () => {
    const b = new GoBoard(9);

    expect(b.toGTP('8|0')).to.equal('A1');
    expect(b.toGTP('0|8')).to.equal('J9'); // no I
    expect(b.fromGTP('a1')).to.equal('8|0');
    expect(b.fromGTP('E5')).to.equal('4|4');
    expect(() => b.fromGTP('I5')).to.throw();
    expect(() => b.fromGTP('K1')).to.throw();
  });

  it('scores area and territory, with dead stones', () => {
    const b = board(
      'O.XO.', //
      '..XO.',
      '..XO.',
      '..XO.',
      '..XO.'
    );

    // The white stone in the corner is dead: black's area is all of the
    // left side, and the stone is a prisoner for black.
    const area = b.score({ rules: 'area', komi: 0, dead: ['0|0'] });
    expect(area.black).to.equal(15); // 10 territory + 5 stones
    expect(area.white).to.equal(10); // 5 territory + 5 stones
    expect(area.margin).to.equal(5);
    expect(area.winner).to.equal('black');

    const territory = b.score({ rules: 'territory', komi: 6.5, dead: ['0|0'] });
    expect(territory.black).to.equal(11); // 10 territory + 1 prisoner
    expect(territory.white).to.equal(5 + 6.5); // komi decides it
    expect(territory.winner).to.equal('white');

    // Alive, the white stone makes the left side neutral.
    const alive = b.score({ rules: 'area', komi: 0 });
    expect(alive.territory.black).to.deep.equal([]);
    expect(alive.neutral).to.have.length(9);
  });
});

describe('GoGame', () => {
  it('black moves first and turns alternate', () => {
    const game = new GoGame({ size: 9 });

    expect(game.turn).to.equal('black');
    game.play('4|4');
    expect(game.turn).to.equal('white');
    expect(() => game.play('4|4')).to.throw(/occupied/);
  });

  it('white moves first after handicap stones', () => {
    const game = new GoGame({ size: 9, setup: { '2|2': 'b', '6|6': 'b' } });

    expect(game.turn).to.equal('white');
  });

  it('counts captures and undoes them', () => {
    const game = new GoGame({
      size: 5,
      setup: position(
        '.X...', //
        'XO...',
        '.....',
        '.....',
        '.....'
      ),
      turn: 'black',
    });

    game.play('1|2');
    game.play('4|4');
    const move = game.play('2|1');

    expect(move).to.deep.include({ captured: ['1|1'] });
    expect(game.captures.black).to.equal(1);

    game.undo();
    expect(game.captures.black).to.equal(0);
    expect(game.board.getColor('1|1')).to.equal('white');
    expect(game.turn).to.equal('black');
  });

  it('simple ko: no immediate recapture, but later is fine', () => {
    const game = new GoGame({
      size: 5,
      setup: position(
        '.XO..', //
        'XO.O.',
        '.XO..',
        '.....',
        '.....'
      ),
      turn: 'black',
    });

    expect(game.play('1|2')).to.deep.include({ captured: ['1|1'] });
    expect(game.checkPlay('1|1')).to.deep.equal({ legal: false, reason: 'ko' });
    expect(game.koPoint).to.equal('1|1');
    expect(game.getLegalMoves()).not.to.include('1|1');

    game.play('4|4'); // white plays elsewhere (a ko threat)
    game.play('4|0'); // black answers

    expect(game.koPoint).to.equal(null);
    expect(game.play('1|1')).to.deep.include({ captured: ['1|2'] });
  });

  it('positional superko forbids any earlier position', () => {
    // Found by search: on 3x3, black's last move recreates an earlier
    // position (not the one just before), which simple ko allows.
    const moves = ['1|0', '1|1', '0|1', '1|2', '0|2', '0|0'];
    const simple = new GoGame({ size: 3, ko: 'simple' });
    const superko = new GoGame({ size: 3, ko: 'positional' });

    moves.forEach((coord) => {
      simple.play(coord);
      superko.play(coord);
    });

    expect(simple.checkPlay('0|1').legal).to.equal(true);
    expect(superko.checkPlay('0|1')).to.deep.equal({ legal: false, reason: 'ko' });
  });

  it('two passes in a row end play; scoring can then mark dead stones', () => {
    const game = new GoGame({
      size: 5,
      komi: 0,
      setup: position(
        '..XO.', //
        '..XO.',
        '..XO.',
        '..XO.',
        '..XO.'
      ),
      turn: 'white',
    });

    game.play('0|0'); // a white stone that will be dead
    game.pass();
    expect(game.getStatus()).to.deep.equal({ state: 'playing' });
    game.pass();

    expect(game.getStatus()).to.deep.equal({ state: 'scoring' });
    expect(() => game.play('4|0')).to.throw(/game-over/);

    // Alive, the stone makes the left side neutral: black 5, white 6 + 5.
    expect(game.getScore()).to.deep.include({ black: 5, white: 11, winner: 'white' });
    game.toggleDead('0|0');
    expect(game.getDeadStones()).to.deep.equal(['0|0']);
    expect(game.getScore()).to.deep.include({ black: 15, white: 10, winner: 'black' });

    game.toggleDead('0|0');
    expect(game.getDeadStones()).to.deep.equal([]);
  });

  it('resigning ends the game; undo takes it back', () => {
    const game = new GoGame({ size: 9 });
    game.play('4|4');
    game.resign();

    expect(game.getStatus()).to.deep.equal({ state: 'resigned', winner: 'black' });
    expect(() => game.pass()).to.throw();

    game.undo();
    expect(game.getStatus().state).to.equal('playing');
    expect(game.turn).to.equal('white');
  });

  it('saves and restores a game', () => {
    const game = new GoGame({ size: 9, rules: 'territory' });
    ['2|2', '6|6', '2|6', 'pass', 'pass'].forEach((m) =>
      m === 'pass' ? game.pass() : game.play(m)
    );
    game.toggleDead('2|6');

    const restored = GoGame.fromJSON(JSON.parse(JSON.stringify(game.toJSON())));

    expect(restored.board.getPosition()).to.deep.equal(game.board.getPosition());
    expect(restored.getStatus()).to.deep.equal({ state: 'scoring' });
    expect(restored.getScore()).to.deep.equal(game.getScore());
    expect(restored.rules).to.equal('territory');
  });

  it('random games never leave a group without liberties', () => {
    let seed = 17;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

    for (let i = 0; i < 5; i += 1) {
      const game = new GoGame({ size: 7, ko: i % 2 ? 'positional' : 'simple' });
      let stones = 0;

      for (let turn = 0; turn < 150 && game.getStatus().state === 'playing'; turn += 1) {
        const moves = game.getLegalMoves();

        if (!moves.length) {
          game.pass();
          continue;
        }

        const move = game.play(moves[Math.floor(random() * moves.length)]);
        stones += 1 - (move.type === 'play' ? move.captured.length : 0);

        expect(Object.keys(game.board.getPosition())).to.have.length(stones);
        game.board.getGroups().forEach((group) =>
          expect(group.liberties.length).to.be.greaterThan(0)
        );
      }

      expect(game.captures.black + game.captures.white).to.equal(
        game.moves.filter((m) => m.type === 'play').length - stones
      );
    }
  }, 20_000);
});

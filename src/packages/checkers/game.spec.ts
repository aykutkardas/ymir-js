import { describe, expect, it } from 'vitest';

import CheckersGame from './game.js';
import InternationalCheckersBoard from './international/board.js';
import {
  fromFEN,
  fromSquareNumber,
  toFEN,
  toSquareNumber,
} from './international/notation.js';
import TurkishCheckersBoard from './turkish/board.js';

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i).join(',');

describe('positions', () => {
  it('getPosition and setPosition round-trip', () => {
    const board = new TurkishCheckersBoard().init();
    board.getItem('1|0')!.setKing();
    const position = board.getPosition();

    expect(position['1|0']).to.equal('W');
    expect(position['5|0']).to.equal('b');
    expect(Object.keys(position)).to.have.length(32);

    const copy = new TurkishCheckersBoard().setPosition(position);
    expect(copy.getPosition()).to.deep.equal(position);
    expect(copy.getItem('1|0')?.king).to.equal(true);
  });

  it('setPosition rejects squares that are not on the board', () => {
    expect(() => new TurkishCheckersBoard().setPosition({ '8|0': 'w' })).to.throw();
  });
});

describe('International notation', () => {
  it('numbers dark squares 1-50 with White at the bottom', () => {
    // ymir puts White at the top, so square 1 is Black's back row.
    expect(fromSquareNumber(1)).to.equal('9|8');
    expect(fromSquareNumber(50)).to.equal('0|1');
    for (let square = 1; square <= 50; square += 1) {
      expect(toSquareNumber(fromSquareNumber(square))).to.equal(square);
    }
    expect(() => toSquareNumber('0|0')).to.throw();
  });

  it('writes the starting position as standard FEN', () => {
    const board = new InternationalCheckersBoard().init();

    expect(board.toFEN('white')).to.equal(
      `W:W${range(31, 50)}:B${range(1, 20)}`
    );
  });

  it('reads FEN with ranges and kings', () => {
    const { position, turn } = fromFEN('B:W31-33,K46:B1,K2.');

    expect(turn).to.equal('black');
    expect(position[fromSquareNumber(31)]).to.equal('w');
    expect(position[fromSquareNumber(33)]).to.equal('w');
    expect(position[fromSquareNumber(46)]).to.equal('W');
    expect(position[fromSquareNumber(2)]).to.equal('B');
    expect(Object.keys(position)).to.have.length(6);
    expect(toFEN(position, turn)).to.equal('B:W31,32,33,K46:B1,K2');
  });

  it('rejects malformed FEN', () => {
    expect(() => fromFEN('X:W1:B2')).to.throw();
    expect(() => fromFEN('W:W51:B1')).to.throw();
  });

  it('writes and finds moves in PDN notation', () => {
    const board = new InternationalCheckersBoard().init();
    const move = board.findPDNMove('32-28', 'white');

    expect(move).to.deep.equal({
      from: fromSquareNumber(32),
      path: [fromSquareNumber(28)],
      captured: [],
    });
    expect(board.toPDNMove(move!)).to.equal('32-28');
    expect(board.findPDNMove('32-26', 'white')).to.equal(null);
  });

  it('finds a capture by its start and end square', () => {
    const board = new InternationalCheckersBoard();
    board.setFEN('W:W28:B23,13');

    const move = board.findPDNMove('28x8', 'white');

    expect(move?.captured).to.have.length(2);
    expect(board.toPDNMove(move!)).to.equal('28x19x8');
  });
});

describe('CheckersGame', () => {
  it('starts with white and lists its legal moves', () => {
    expect(CheckersGame.create('international').getLegalMoves()).to.have.length(9);
    expect(CheckersGame.create('turkish').getLegalMoves()).to.have.length(8);
    expect(CheckersGame.create('turkish').turn).to.equal('white');
  });

  it('plays legal moves, switches turns and rejects illegal ones', () => {
    const game = CheckersGame.create('turkish');

    expect(() => game.play({ from: '5|0', path: ['4|0'] })).to.throw(/Illegal/);

    const played = game.play({ from: '2|0', path: ['3|0'] });

    expect(played.captured).to.deep.equal([]);
    expect(game.turn).to.equal('black');
    expect(game.board.getItem('3|0')?.color).to.equal('white');
    expect(game.moves).to.deep.equal([played]);
  });

  it('undo and redo', () => {
    const game = CheckersGame.create('turkish');
    const start = game.board.getPosition();

    game.play({ from: '2|0', path: ['3|0'] });
    game.play({ from: '5|7', path: ['4|7'] });
    const afterTwo = game.board.getPosition();

    expect(game.undo()?.from).to.equal('5|7');
    expect(game.undo()?.from).to.equal('2|0');
    expect(game.undo()).to.equal(null);
    expect(game.board.getPosition()).to.deep.equal(start);
    expect(game.turn).to.equal('white');

    game.redo();
    game.redo();
    expect(game.board.getPosition()).to.deep.equal(afterTwo);
    expect(game.canRedo).to.equal(false);

    game.undo();
    game.play({ from: '5|6', path: ['4|6'] });
    expect(game.canRedo).to.equal(false);
  });

  it('a side with no legal moves loses', () => {
    const board = new TurkishCheckersBoard().setPosition({
      '3|3': 'w',
      '1|7': 'w',
      '4|3': 'b',
    });
    const game = new CheckersGame(board, { turn: 'white' });

    game.play({ from: '3|3', path: ['5|3'] });

    expect(game.getStatus()).to.deep.equal({
      state: 'won',
      winner: 'white',
      reason: 'no-moves',
    });
    expect(game.getLegalMoves()).to.deep.equal([]);
    expect(() => game.play({ from: '5|3', path: ['6|3'] })).to.throw();
  });

  it('threefold repetition is a draw', () => {
    // One piece each would already be a Turkish draw, so turn that rule off.
    const board = new TurkishCheckersBoard().setPosition({ '0|0': 'W', '7|7': 'B' });
    const game = new CheckersGame(board, { drawRules: { onePieceEach: false } });
    const shuffle = () => {
      game.play({ from: '0|0', path: ['0|1'] });
      game.play({ from: '7|7', path: ['7|6'] });
      game.play({ from: '0|1', path: ['0|0'] });
      game.play({ from: '7|6', path: ['7|7'] });
    };

    shuffle();
    expect(game.getStatus().state).to.equal('playing');
    shuffle();
    expect(game.getStatus()).to.deep.equal({ state: 'draw', reason: 'repetition' });

    game.undo();
    expect(game.getStatus().state).to.equal('playing');
  });

  it('too many king moves without a capture is a draw', () => {
    const board = new TurkishCheckersBoard().setPosition({ '0|0': 'W', '7|7': 'B' });
    const game = new CheckersGame(board, {
      drawRules: { kingMoves: 4, repetition: false, onePieceEach: false },
    });

    expect(game.drawRules).to.deep.include({ kingMoves: 4, repetition: false });

    game.play({ from: '0|0', path: ['0|1'] });
    game.play({ from: '7|7', path: ['7|6'] });
    game.play({ from: '0|1', path: ['0|2'] });
    expect(game.getStatus().state).to.equal('playing');
    game.play({ from: '7|6', path: ['7|5'] });
    expect(game.getStatus()).to.deep.equal({ state: 'draw', reason: 'king-moves' });
  });

  it('uses the FMJD draw rules for International by default', () => {
    expect(CheckersGame.create('international').drawRules).to.deep.equal({
      repetition: 3,
      kingMoves: 50,
      loneKing: true,
      onePieceEach: false,
    });
  });

  it('uses the Turkish draw rules for Turkish by default', () => {
    expect(CheckersGame.create('turkish').drawRules).to.deep.equal({
      repetition: 3,
      kingMoves: false,
      loneKing: false,
      onePieceEach: true,
    });
  });

  it('Turkish: one piece each is a draw, even king against man', () => {
    const board = new TurkishCheckersBoard().setPosition({
      '2|2': 'w',
      '1|7': 'w',
      '3|2': 'b',
      '4|6': 'B',
    });
    const game = new CheckersGame(board);

    expect(game.getStatus().state).to.equal('playing');

    game.play({ from: '2|2', path: ['4|2'] });
    expect(game.getStatus().state).to.equal('playing');

    // Black's king takes one white piece; one piece each remains.
    const [capture] = game.getLegalMoves();
    expect(capture.captured).to.have.length(1);
    game.play(capture);

    expect(game.getStatus()).to.deep.equal({
      state: 'draw',
      reason: 'one-piece-each',
    });
  });

  // White shuffles one king between 0|1 and 1|0, black its king between
  // 9|0 and 8|1. None of these squares share a diagonal, so nothing can be
  // captured and the material stays the same.
  const shuffleKings = (game: CheckersGame, max: number) => {
    const white = [{ from: '0|1', path: ['1|0'] }, { from: '1|0', path: ['0|1'] }];
    const black = [{ from: '9|0', path: ['8|1'] }, { from: '8|1', path: ['9|0'] }];
    let plies = 0;

    while (game.getStatus().state === 'playing' && plies < max) {
      const round = Math.floor(plies / 2) % 2;
      game.play(game.turn === 'white' ? white[round] : black[round]);
      plies += 1;
    }

    return plies;
  };

  it('International: a lone king against two kings draws after 5 moves each', () => {
    const board = new InternationalCheckersBoard().setPosition({
      '0|1': 'W',
      '0|3': 'W',
      '9|0': 'B',
    });
    const game = new CheckersGame(board, { drawRules: { repetition: false } });

    expect(shuffleKings(game, 40)).to.equal(10);
    expect(game.getStatus()).to.deep.equal({ state: 'draw', reason: 'lone-king' });

    game.undo();
    expect(game.getStatus().state).to.equal('playing');
  });

  it('International: a lone king against three pieces draws after 16 moves each', () => {
    const board = new InternationalCheckersBoard().setPosition({
      '0|1': 'W',
      '0|3': 'W',
      '0|5': 'w',
      '9|0': 'B',
    });
    const game = new CheckersGame(board, { drawRules: { repetition: false } });

    expect(shuffleKings(game, 60)).to.equal(32);
    expect(game.getStatus()).to.deep.equal({ state: 'draw', reason: 'lone-king' });
  });

  it('saves and restores a game', () => {
    const game = CheckersGame.create('international');
    game.play(game.getLegalMoves()[0]);
    game.play(game.getLegalMoves()[0]);

    const saved = JSON.parse(JSON.stringify(game.toJSON()));
    const restored = CheckersGame.fromJSON(saved);

    expect(restored.board.getPosition()).to.deep.equal(game.board.getPosition());
    expect(restored.turn).to.equal(game.turn);
    expect(restored.moves).to.deep.equal(game.moves);

    restored.reset();
    expect(restored.moves).to.deep.equal([]);
    expect(restored.turn).to.equal('white');
    expect(restored.board.getPosition()).to.deep.equal(
      new InternationalCheckersBoard().init().getPosition()
    );
  });
});

describe('CheckersGame on random games', () => {
  let seed = 11;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  it('every game ends, undoes back to the start and restores from JSON', () => {
    for (const variant of ['turkish', 'international'] as const) {
      for (let i = 0; i < 30; i += 1) {
        const game = CheckersGame.create(variant);
        const start = game.board.getPosition();

        while (game.getStatus().state === 'playing' && game.moves.length < 500) {
          const moves = game.getLegalMoves();
          game.play(moves[Math.floor(random() * moves.length)]);
        }

        const end = game.board.getPosition();
        const restored = CheckersGame.fromJSON(game.toJSON());

        expect(restored.board.getPosition()).to.deep.equal(end);
        expect(restored.getStatus()).to.deep.equal(game.getStatus());

        while (game.undo());

        expect(game.board.getPosition()).to.deep.equal(start);
        expect(game.turn).to.equal('white');
      }
    }
  }, 20_000);
});

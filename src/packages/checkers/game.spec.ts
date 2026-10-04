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
    const board = new TurkishCheckersBoard().setPosition({ '3|3': 'w', '4|3': 'b' });
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
    const board = new TurkishCheckersBoard().setPosition({ '0|0': 'W', '7|7': 'B' });
    const game = new CheckersGame(board);
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
      drawRules: { kingMoves: 4, repetition: false },
    });

    expect(game.drawRules).to.deep.equal({ kingMoves: 4, repetition: false });

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
    });
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
  });
});

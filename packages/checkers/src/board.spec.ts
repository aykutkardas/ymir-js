import { describe, expect, it } from 'vitest';

import InternationalCheckersBoard from './international/board.js';
import TurkishCheckersBoard from './turkish/board.js';
import TurkishItem from './turkish/item.js';

const playOnce = (board: TurkishCheckersBoard, color: 'white' | 'black') => {
  const moves: [string, string][] = [];
  board.autoPlay(color, { onMove: (from, to) => moves.push([from, to]) });
  return moves;
};

describe('Checkers autoPlay', () => {
  it('takes a capture first', () => {
    const board = new TurkishCheckersBoard();
    board.setItem('2|2', new TurkishItem({ color: 'white' }));
    board.setItem('3|2', new TurkishItem({ color: 'black' }));
    board.setItem('2|6', new TurkishItem({ color: 'white' }));

    expect(playOnce(board, 'white')).to.deep.equal([['2|2', '4|2']]);
  });

  it('promotes a piece when it can', () => {
    const board = new TurkishCheckersBoard();
    board.setItem('6|0', new TurkishItem({ color: 'white' }));
    board.setItem('2|5', new TurkishItem({ color: 'white' }));

    expect(playOnce(board, 'white')).to.deep.equal([['6|0', '7|0']]);
  });

  it('black moves forward (up the board) when it has the choice', () => {
    const board = new TurkishCheckersBoard();
    board.setItem('5|3', new TurkishItem({ color: 'black' }));

    expect(playOnce(board, 'black')).to.deep.equal([['5|3', '4|3']]);
  });

  it('still moves when every move is risky', () => {
    const board = new TurkishCheckersBoard();
    board.setItem('4|0', new TurkishItem({ color: 'white' }));
    board.setItem('6|0', new TurkishItem({ color: 'black' }));
    board.setItem('6|1', new TurkishItem({ color: 'black' }));

    const [move] = playOnce(board, 'white');

    expect(move?.[0]).to.equal('4|0');
  });

  it('works for international checkers', () => {
    const board = new InternationalCheckersBoard().init();
    const moves: [string, string][] = [];

    board.autoPlay('white', { onMove: (from, to) => moves.push([from, to]) });

    expect(moves).to.have.length(1);
    expect(board.getItem(moves[0][0])?.color).to.equal('white');
  });
});

describe('Checkers clone', () => {
  it('copies the position without sharing pieces', () => {
    const board = new TurkishCheckersBoard().init();
    const copy = board.clone();

    copy.moveItem('2|0', '3|0');
    copy.getItem('1|0')!.setKing();

    expect(copy).to.be.instanceOf(TurkishCheckersBoard);
    expect(board.getItem('2|0')?.color).to.equal('white');
    expect(board.getItem('3|0')).to.equal(null);
    expect(board.getItem('1|0')?.king).to.equal(false);
  });
});

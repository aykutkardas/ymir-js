import { describe, expect, it } from 'vitest';

import InternationalCheckersBoard from './board.js';
import CheckersItem from './item.js';

const sorted = (coords: string[]) => [...coords].sort();

describe('International Checkers Board', () => {
  it('is 10x10 by default', () => {
    const board = new InternationalCheckersBoard();

    expect(Object.keys(board.board)).to.have.length(100);
  });

  it('init places 20 pieces per side on dark squares', () => {
    const board = new InternationalCheckersBoard().init();
    const white = board.getItemsByColor('white');
    const black = board.getItemsByColor('black');

    expect(white).to.have.length(20);
    expect(black).to.have.length(20);
    expect(board.getItem('0|1')?.color).to.equal('white');
    expect(board.getItem('0|0')).to.equal(null);
    expect(board.getItem('9|0')?.color).to.equal('black');
    expect(board.getItem('9|1')).to.equal(null);
  });

  it('reset restores the starting position', () => {
    const board = new InternationalCheckersBoard().init();
    board.moveItem('3|0', '4|1');
    board.reset();

    expect(board.getItem('3|0')?.color).to.equal('white');
    expect(board.getItem('4|1')).to.equal(null);
  });

  it('men move diagonally forward', () => {
    const board = new InternationalCheckersBoard();
    const white = new CheckersItem({ color: 'white' });
    const black = new CheckersItem({ color: 'black' });

    board.setItem('4|4', white);
    board.setItem('6|4', black);

    expect(sorted(board.getAvailableColumns('4|4', white.movement))).to.deep.equal(
      ['5|3', '5|5']
    );
    expect(sorted(board.getAvailableColumns('6|4', black.movement))).to.deep.equal(
      ['5|3', '5|5']
    );
  });

  it('a capture is the only move when available', () => {
    const board = new InternationalCheckersBoard();
    const white = new CheckersItem({ color: 'white' });

    board.setItem('4|4', white);
    board.setItem('5|5', new CheckersItem({ color: 'black' }));

    expect(board.getAvailableColumns('4|4', white.movement)).to.deep.equal([
      '6|6',
    ]);
    expect(board.getAttackCoordsByColor('white')).to.deep.equal({
      '4|4': [{ coord: '6|6', destroyItemCoord: '5|5' }],
    });
  });

  it('cannot capture when the square behind is taken', () => {
    const board = new InternationalCheckersBoard();
    const white = new CheckersItem({ color: 'white' });

    board.setItem('4|4', white);
    board.setItem('5|5', new CheckersItem({ color: 'black' }));
    board.setItem('6|6', new CheckersItem({ color: 'black' }));

    expect(board.getAvailableColumns('4|4', white.movement)).to.deep.equal([
      '5|3',
    ]);
  });

  it('a king captures from a distance and may land on any empty square behind', () => {
    const board = new InternationalCheckersBoard();
    const king = new CheckersItem({ color: 'white', king: true });

    board.setItem('1|1', king);
    board.setItem('4|4', new CheckersItem({ color: 'black' }));

    expect(sorted(board.getAvailableColumns('1|1', king.movement))).to.deep.equal(
      ['5|5', '6|6', '7|7', '8|8', '9|9']
    );
    expect(board.getAttackCoordsByColor('white')['1|1']).to.deep.include({
      coord: '7|7',
      destroyItemCoord: '4|4',
    });
  });

  it('getItemsBetweenTwoCoords works on long diagonals', () => {
    const board = new InternationalCheckersBoard();

    board.setItem('1|1', new CheckersItem({ color: 'white', king: true }));
    board.setItem('4|4', new CheckersItem({ color: 'black' }));

    expect(board.getItemsBetweenTwoCoords('1|1', '6|6')).to.deep.equal(['4|4']);
    expect(board.getItemsBetweenTwoCoords('1|1', '3|3')).to.deep.equal([]);
  });

  it('getDefendCoordsByColor names the piece in danger', () => {
    const board = new InternationalCheckersBoard();

    board.setItem('4|4', new CheckersItem({ color: 'white' }));
    board.setItem('5|5', new CheckersItem({ color: 'black' }));
    // Black can take 4|4 by jumping to 3|3; white 2|4 can move there first.
    board.setItem('2|4', new CheckersItem({ color: 'white' }));

    expect(board.getDefendCoordsByColor('white')['2|4']).to.deep.equal([
      { coord: '3|3', inDangerCoord: '4|4' },
    ]);
  });
});

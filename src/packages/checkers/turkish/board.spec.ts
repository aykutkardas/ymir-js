import { expect } from 'chai';
import 'mocha';

import CheckersBoard from './board';

describe('Turkish Checkers', () => {
  it('board.config', () => {
    const board = new CheckersBoard();

    expect(board.config).to.deep.equal({
      x: 8,
      y: 8,
    });
  });

  it('reset', () => {
    const defaultBoard = new CheckersBoard();
    defaultBoard.init();

    const board = new CheckersBoard();
    board.init();
    board.moveItem('5|5', '4|5');
    board.reset();

    expect(board.board).to.deep.equal(defaultBoard.board);
  });

  it('getItemsBetweenTwoCoords', () => {
    const board = new CheckersBoard();
    board.init();

    expect(board.getItemsBetweenTwoCoords('4|4', '7|4')).to.deep.equal([
      '5|4',
      '6|4',
    ]);
  });

  it('getAvailableCoordsByColor', () => {
    const board = new CheckersBoard();
    board.init();

    expect(board.getAvailableCoordsByColor('white')).to.deep.equal({
      '2|0': ['3|0'],
      '2|1': ['3|1'],
      '2|2': ['3|2'],
      '2|3': ['3|3'],
      '2|4': ['3|4'],
      '2|5': ['3|5'],
      '2|6': ['3|6'],
      '2|7': ['3|7'],
    });
  });

  it('getAttackCoordsByColor', () => {
    const board = new CheckersBoard();
    board.init();
    board.moveItem('2|5', '3|5');
    board.moveItem('5|5', '4|5');
    board.moveItem('5|4', '3|4');

    expect(board.getAttackCoordsByColor('white')).to.deep.equal({
      '3|5': ['5|5', '3|3'],
      '2|4': ['4|4'],
    });
  });

  it('getDefendCoordsByColor', () => {
    const board = new CheckersBoard();
    board.init();
    board.moveItem('5|1', '4|1');
    board.moveItem('2|1', '3|1');

    expect(board.getDefendCoordsByColor('white')).to.deep.equal({
      '1|1': ['2|1'],
      '2|0': ['2|1'],
      '2|2': ['2|1'],
    });
  });

  it('getDefendCoordsByColor Horizontal', () => {
    const board = new CheckersBoard();
    board.init();
    board.moveItem('2|1', '3|1');
    board.moveItem('5|2', '3|2');

    expect(board.getDefendCoordsByColor('white')).to.deep.equal({
      '2|0': ['3|0'],
    });
  });
});

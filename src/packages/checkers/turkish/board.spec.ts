import { expect } from 'chai';
import 'mocha';
import CheckersItem from '../turkish/item';

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

  it('getAvailableCoordsByColor with attack', () => {
    const board = new CheckersBoard();
    board.init();
    board.moveItem('2|5', '3|5');
    board.moveItem('5|5', '4|5');

    expect(board.getAvailableCoordsByColor('white')).to.deep.equal({
      '1|5': ['2|5'],
      '2|0': ['3|0'],
      '2|1': ['3|1'],
      '2|2': ['3|2'],
      '2|3': ['3|3'],
      '2|4': ['3|4', '2|5'],
      '3|5': ['5|5'],
      '2|6': ['3|6', '2|5'],
      '2|7': ['3|7'],
    });
  });

  it('getAvailableCoordsByColor with attack 2', () => {
    const board = new CheckersBoard();
    const firstWhiteItem = new CheckersItem({ color: 'white', king: true });
    const blackItem = new CheckersItem({ color: 'black' });

    board.setItem('1|5', firstWhiteItem);
    board.setItem('2|5', blackItem);
    board.setItem('3|5', blackItem);

    expect(board.getAvailableCoordsByColor('white')).to.deep.equal({
      '1|5': ['0|5', '1|4', '1|3', '1|2', '1|1', '1|0', '1|6', '1|7'],
    });
  });

  it('getAvailableCoordsByColor with attack 3', () => {
    const board = new CheckersBoard();
    const firstWhiteItem = new CheckersItem({ color: 'white', king: true });
    const secondWhiteItem = new CheckersItem({ color: 'white' });
    const blackItem = new CheckersItem({ color: 'black' });

    board.setItem('1|5', firstWhiteItem);
    board.setItem('2|5', secondWhiteItem);
    board.setItem('6|5', blackItem);

    expect(board.getAvailableCoordsByColor('white')).to.deep.equal({
      '1|5': ['0|5', '1|4', '1|3', '1|2', '1|1', '1|0', '1|6', '1|7'],
      '2|5': ['3|5', '2|4', '2|6'],
    });
  });

  it('getAvailableCoordsByColor with attack 4', () => {
    const board = new CheckersBoard();
    const firstWhiteItem = new CheckersItem({ color: 'white' });
    const secondWhiteItem = new CheckersItem({ color: 'white' });
    const blackItem = new CheckersItem({ color: 'black', king: true });

    board.setItem('1|5', firstWhiteItem);
    board.setItem('4|5', secondWhiteItem);
    board.setItem('5|5', blackItem);
    board.getItem('5|5').setKing();

    expect(board.getAvailableCoordsByColor('black')).to.deep.equal({
      '5|5': ['3|5', '2|5'],
    });
  });

  it('getAttackCoordsByColor', () => {
    const board = new CheckersBoard();
    board.init();
    board.moveItem('2|5', '3|5');
    board.moveItem('5|5', '4|5');
    board.moveItem('5|4', '3|4');

    expect(board.getAttackCoordsByColor('white')).to.deep.equal({
      '3|5': [
        { coord: '5|5', destroyItemCoord: '4|5' },
        { coord: '3|3', destroyItemCoord: '3|4' },
      ],
      '2|4': [{ coord: '4|4', destroyItemCoord: '3|4' }],
    });
  });

  it('getDefendCoordsByColor', () => {
    const board = new CheckersBoard();
    board.init();
    board.moveItem('5|1', '4|1');
    board.moveItem('2|1', '3|1');

    expect(board.getDefendCoordsByColor('white')).to.deep.equal({
      '1|1': [{ coord: '2|1', inDangerCoord: '3|1' }],
      '2|0': [{ coord: '2|1', inDangerCoord: '3|1' }],
      '2|2': [{ coord: '2|1', inDangerCoord: '3|1' }],
    });
  });

  it('getDefendCoordsByColor Horizontal', () => {
    const board = new CheckersBoard();
    board.init();
    board.moveItem('2|1', '3|1');
    board.moveItem('5|2', '3|2');

    expect(board.getDefendCoordsByColor('white')).to.deep.equal({
      '2|0': [{ coord: '3|0', inDangerCoord: '3|1' }],
    });
  });

  it('getItemsByColor ', () => {
    const board = new CheckersBoard();
    board.init();

    expect(board.getItemsByColor('white').length).to.equal(16);
  });
});

describe('Turkish Checkers Available Columns', () => {
  it('getAvailableColumns', () => {
    const board = new CheckersBoard();
    board.init();
    board.moveItem('2|3', '3|3');
    board.moveItem('1|3', '2|3');
    board.moveItem('5|3', '4|3');

    const item = board.getItem('4|3');

    expect(board.getAvailableColumns('4|3', item.movement)).to.deep.equal([
      '4|2',
      '4|4',
    ]);
  });

  it('getAvailableColumns horizontal', () => {
    const board = new CheckersBoard();
    board.init();
    board.moveItem('2|3', '3|3');
    board.moveItem('1|3', '2|3');
    board.moveItem('5|3', '2|6');
    board.removeItem('2|4');

    const item = board.getItem('2|7');

    expect(board.getAvailableColumns('2|7', item.movement)).to.deep.equal([
      '3|7',
    ]);
  });

  it('getAvailableColumns king', () => {
    const board = new CheckersBoard();
    board.init();

    const item = board.getItem('2|7');
    item.setKing();

    expect(board.getAvailableColumns('2|7', item.movement)).to.deep.equal([
      '3|7',
      '4|7',
    ]);
  });

  it('getAvailableColumns king with attack', () => {
    const board = new CheckersBoard();
    board.init();

    board.moveItem('5|7', '3|7');

    const item = board.getItem('2|7');
    item.setKing();

    expect(board.getAvailableColumns('2|7', item.movement)).to.deep.equal([
      '4|7',
      '5|7',
    ]);
  });
});

import { expect } from 'chai';
import 'mocha';

import Board from './board';
import Item from './item';

describe('Core Board', () => {
  it('Board 3x3', () => {
    const { board } = new Board({ x: 3, y: 3 });

    expect(board).to.deep.equal({
      '0|0': { item: null },
      '0|1': { item: null },
      '0|2': { item: null },
      '1|0': { item: null },
      '1|1': { item: null },
      '1|2': { item: null },
      '2|0': { item: null },
      '2|1': { item: null },
      '2|2': { item: null },
    });
  });

  it('Board 3x5', () => {
    const { board } = new Board({ x: 3, y: 5 });

    expect(board).to.deep.equal({
      '0|0': { item: null },
      '0|1': { item: null },
      '0|2': { item: null },
      '0|3': { item: null },
      '0|4': { item: null },
      '1|0': { item: null },
      '1|1': { item: null },
      '1|2': { item: null },
      '1|3': { item: null },
      '1|4': { item: null },
      '2|0': { item: null },
      '2|1': { item: null },
      '2|2': { item: null },
      '2|3': { item: null },
      '2|4': { item: null },
    });
  });

  it('Board 5x3', () => {
    const { board } = new Board({ x: 5, y: 3 });

    expect(board).to.deep.equal({
      '0|0': { item: null },
      '0|1': { item: null },
      '0|2': { item: null },
      '1|0': { item: null },
      '1|1': { item: null },
      '1|2': { item: null },
      '2|0': { item: null },
      '2|1': { item: null },
      '2|2': { item: null },
      '3|0': { item: null },
      '3|1': { item: null },
      '3|2': { item: null },
      '4|0': { item: null },
      '4|1': { item: null },
      '4|2': { item: null },
    });
  });

  it('setItem', () => {
    const board = new Board({ x: 3, y: 3 });
    const item = new Item({
      rules: {
        movement: {
          angular: true,
          linear: true,
          stepCount: 4,
        },
      },
    });

    board.setItem('0|1', item);

    expect(board.board).to.deep.equal({
      '0|0': { item: null },
      '0|1': { item },
      '0|2': { item: null },
      '1|0': { item: null },
      '1|1': { item: null },
      '1|2': { item: null },
      '2|0': { item: null },
      '2|1': { item: null },
      '2|2': { item: null },
    });
  });

  it('getItem', () => {
    const board = new Board({ x: 3, y: 3 });
    const item = new Item({
      rules: {
        movement: {
          angular: true,
          linear: true,
          stepCount: 4,
        },
      },
    });

    board.setItem('0|1', item);
    const result = board.getItem('0|1');

    expect(result).to.deep.equal(item);
  });

  it('removeItem', () => {
    const board = new Board({ x: 3, y: 3 });
    const item = new Item({
      rules: {
        movement: {
          angular: true,
          linear: true,
          stepCount: 4,
        },
      },
    });

    board.setItem('0|1', item);
    board.removeItem('0|1');
    const result = board.getItem('0|1');

    expect(result).to.deep.equal(null);
  });

  it('moveItem', () => {
    const board = new Board({ x: 3, y: 3 });
    const item = new Item({
      rules: {
        movement: {
          angular: true,
          linear: true,
          stepCount: 4,
        },
      },
    });

    board.setItem('0|1', item);
    board.moveItem('0|1', '1|1');

    expect(board.board).to.deep.equal({
      '0|0': { item: null },
      '0|1': { item: null },
      '0|2': { item: null },
      '1|0': { item: null },
      '1|1': { item },
      '1|2': { item: null },
      '2|0': { item: null },
      '2|1': { item: null },
      '2|2': { item: null },
    });
  });

  it('switchItem', () => {
    const board = new Board({ x: 3, y: 3 });
    const firstItem = new Item({
      data: {
        color: 'black',
      },
      rules: {
        movement: {
          angular: true,
          linear: true,
          stepCount: 4,
        },
      },
    });

    const secondItem = new Item({
      data: {
        color: 'white',
      },
      rules: {
        movement: {
          angular: true,
          linear: true,
          stepCount: 4,
        },
      },
    });

    board.setItem('0|1', firstItem);
    board.setItem('1|1', secondItem);
    board.switchItem('0|1', '1|1');

    expect(board.board).to.deep.equal({
      '0|0': { item: null },
      '0|1': { item: secondItem },
      '0|2': { item: null },
      '1|0': { item: null },
      '1|1': { item: firstItem },
      '1|2': { item: null },
      '2|0': { item: null },
      '2|1': { item: null },
      '2|2': { item: null },
    });
  });

  it('selectItem', () => {
    const board = new Board({ x: 3, y: 3 });
    const item = new Item({
      rules: {
        movement: {
          angular: true,
          linear: true,
          stepCount: 4,
        },
      },
    });

    board.setItem('0|1', { ...item });
    board.selectItem('0|1');

    expect(board.board).to.deep.equal({
      '0|0': { item: null },
      '0|1': { item: { ...item, selected: true } },
      '0|2': { item: null },
      '1|0': { item: null },
      '1|1': { item: null },
      '1|2': { item: null },
      '2|0': { item: null },
      '2|1': { item: null },
      '2|2': { item: null },
    });
  });

  it('deselectItem', () => {
    const board = new Board({ x: 3, y: 3 });
    const item = new Item({
      rules: {
        movement: {
          angular: true,
          linear: true,
          stepCount: 4,
        },
      },
    });

    board.setItem('0|1', { ...item });
    board.selectItem('0|1');
    board.deselectItem('0|1');

    expect(board.board).to.deep.equal({
      '0|0': { item: null },
      '0|1': { item: { ...item, selected: false } },
      '0|2': { item: null },
      '1|0': { item: null },
      '1|1': { item: null },
      '1|2': { item: null },
      '2|0': { item: null },
      '2|1': { item: null },
      '2|2': { item: null },
    });
  });

  it('deselectAllItems', () => {
    const board = new Board({ x: 3, y: 3 });
    const item = new Item({
      rules: {
        movement: {
          angular: true,
          linear: true,
          stepCount: 4,
        },
      },
    });

    board.setItem('0|1', { ...item });
    board.selectItem('0|1');
    board.deselectAllItems();

    expect(board.board).to.deep.equal({
      '0|0': { item: null },
      '0|1': { item },
      '0|2': { item: null },
      '1|0': { item: null },
      '1|1': { item: null },
      '1|2': { item: null },
      '2|0': { item: null },
      '2|1': { item: null },
      '2|2': { item: null },
    });
  });

  it('getDistanceBetweenTwoCoords', () => {
    const board = new Board({ x: 3, y: 3 });
    const distance = board.getDistanceBetweenTwoCoords('0|0', '1|1');

    expect(distance).to.deep.equal({ x: 1, y: 1 });
  });

  it('isEmpty', () => {
    const board = new Board({ x: 3, y: 3 });
    const item = new Item({
      rules: {
        movement: {
          angular: true,
          linear: true,
          stepCount: 4,
        },
      },
    });

    board.setItem('0|1', item);

    const firstIsEmpty = board.isEmpty('0|1');
    const secondIsEmpty = board.isEmpty('1|1');

    expect(firstIsEmpty).to.equal(false);
    expect(secondIsEmpty).to.equal(true);
  });

  it('isExistCoord', () => {
    const board = new Board({ x: 3, y: 3 });

    expect(board.isExistCoord('0|0')).to.equal(true);
    expect(board.isExistCoord('4|4')).to.equal(false);
  });

  it('getDistanceBetweenTwoCoords', () => {
    const board = new Board({ x: 3, y: 3 });

    expect(board.getDistanceBetweenTwoCoords('0|0', '0|1')).to.deep.equal({
      y: 0,
      x: 1,
    });

    expect(board.getDistanceBetweenTwoCoords('0|0', '1|0')).to.deep.equal({
      y: 1,
      x: 0,
    });

    expect(board.getDistanceBetweenTwoCoords('0|0', '1|1')).to.deep.equal({
      y: 1,
      x: 1,
    });

    expect(board.getDistanceBetweenTwoCoords('1|1', '0|0')).to.deep.equal({
      y: -1,
      x: -1,
    });
  });

  it('getDirection', () => {
    const board = new Board({ x: 3, y: 3 });

    expect(board.getDirection('0|0', '0|1')).to.equal('right');

    expect(board.getDirection('0|0', '1|0')).to.equal('bottom');

    expect(board.getDirection('0|0', '1|1')).to.equal('bottomRight');

    expect(board.getDirection('1|1', '0|0')).to.equal('topLeft');
  });
});

describe('Core Board Available Columns', () => {
  it('getAvailableColumns -top for "1|1" on 3x3 Board', () => {
    const availableColumn = new Board({ x: 3, y: 3 }).getAvailableColumns(
      '1|1',
      {
        top: true,
        stepCount: 1,
      }
    );

    expect(availableColumn).to.deep.equal(['0|1']);
  });

  it('getAvailableColumns -bottom for "1|1" on 3x3 Board', () => {
    const availableColumn = new Board({ x: 3, y: 3 }).getAvailableColumns(
      '1|1',
      {
        bottom: true,
        stepCount: 1,
      }
    );

    expect(availableColumn).to.deep.equal(['2|1']);
  });

  it('getAvailableColumns -left for "1|1" on 3x3 Board', () => {
    const availableColumn = new Board({ x: 3, y: 3 }).getAvailableColumns(
      '1|1',
      {
        left: true,
        stepCount: 1,
      }
    );

    expect(availableColumn).to.deep.equal(['1|0']);
  });

  it('getAvailableColumns -right for "1|1" on 3x3 Board', () => {
    const availableColumn = new Board({ x: 3, y: 3 }).getAvailableColumns(
      '1|1',
      {
        right: true,
        stepCount: 1,
      }
    );

    expect(availableColumn).to.deep.equal(['1|2']);
  });

  it('getAvailableColumns -linear for "1|1" on 3x3 Board', () => {
    const availableColumn = new Board({ x: 3, y: 3 }).getAvailableColumns(
      '1|1',
      {
        stepCount: 1,
        linear: true,
      }
    );

    expect(availableColumn).to.deep.equal(['0|1', '2|1', '1|0', '1|2']);
  });

  it('getAvailableColumns -angular for "1|1" on 3x3 Board', () => {
    const availableColumn = new Board({ x: 3, y: 3 }).getAvailableColumns(
      '1|1',
      {
        stepCount: 1,
        angular: true,
      }
    );

    expect(availableColumn).to.deep.equal(['0|0', '0|2', '2|0', '2|2']);
  });
});

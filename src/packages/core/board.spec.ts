import { expect } from 'chai';
import 'mocha';

import Board from './board';
import Item from './item';

describe('Board Tests', () => {
  it('Square Board 3x3', () => {
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

  it('Rectangle Board 3x5', () => {
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

  it('Rectangle Board 5x3', () => {
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

  it('setItem Method', () => {
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

  it('getItem Method', () => {
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

  it('removeItem Method', () => {
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

  it('moveItem Method', () => {
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

  it('switchItem Method', () => {
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

  it('getDistanceBetweenTwoCoords Method', () => {
    const board = new Board({ x: 3, y: 3 });
    const distance = board.getDistanceBetweenTwoCoords('0|0', '1|1');

    expect(distance).to.deep.equal({ x: 1, y: 1 });
  });

  it('isEmpty Method', () => {
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

  it('selectItem Method', () => {
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

  it('deselectItem Method', () => {
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

  it('deselectAllItems Method', () => {
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
});

describe('Board Tests', () => {
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

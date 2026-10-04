import { describe, expect, it } from 'vitest';

import * as ymir from './index.js';
import {
  Board,
  Checkers,
  Core,
  InternationalBoard,
  InternationalItem,
  Item,
  TurkishBoard,
  TurkishItem,
} from './index.js';

describe('exports', () => {
  it('named exports are the same classes as the grouped ones', () => {
    expect(Board).to.equal(Core.Board);
    expect(Item).to.equal(Core.Item);
    expect(TurkishBoard).to.equal(Checkers.Turkish.Board);
    expect(TurkishItem).to.equal(Checkers.Turkish.Item);
    expect(InternationalBoard).to.equal(Checkers.International.Board);
    expect(InternationalItem).to.equal(Checkers.International.Item);
    expect(ymir.parseCoord('3|4')).to.deep.equal([3, 4]);
    expect(ymir.Utils.parseCoord).to.equal(ymir.parseCoord);
  });
});

describe('board config', () => {
  it('accepts { rows, cols }', () => {
    const board = new Board({ rows: 2, cols: 3 });

    expect(Object.keys(board.board)).to.have.length(6);
    expect(board.isExistCoord('1|2')).to.equal(true);
    expect(board.isExistCoord('2|1')).to.equal(false);
    expect(board.config).to.deep.include({ rows: 2, cols: 3 });
  });

  it('still accepts the old { x, y }, where x is rows', () => {
    const board = new Board({ x: 2, y: 3 });

    expect(board.config).to.deep.equal({ rows: 2, cols: 3, x: 2, y: 3 });
    expect(board.isExistCoord('1|2')).to.equal(true);
  });

  it('variants default to their own size', () => {
    expect(new TurkishBoard().config.rows).to.equal(8);
    expect(new InternationalBoard().config.cols).to.equal(10);
  });
});

describe('return values', () => {
  const board = new Board({ rows: 3, cols: 3 });

  it('isEmpty is false off the board', () => {
    expect(board.isEmpty('5|5')).to.equal(false);
    expect(board.isEmpty('1|1')).to.equal(true);
  });

  it('getDirection and getDistanceBetweenTwoCoords return null off the board', () => {
    expect(board.getDirection('0|0', '5|5')).to.equal(null);
    expect(board.getDirection('1|1', '1|1')).to.equal(null);
    expect(board.getDistanceBetweenTwoCoords('0|0', '5|5')).to.equal(null);
  });

  it('getItem returns null for an empty or missing square', () => {
    expect(board.getItem('1|1')).to.equal(null);
    expect(board.getItem('9|9')).to.equal(null);
  });
});

describe('methods', () => {
  it('can be passed around without losing `this`', () => {
    const board = new TurkishBoard().init();
    const { getItem, removeItem } = board;

    ['1|0', '1|1'].forEach(removeItem);

    expect(getItem('1|0')).to.equal(null);
    expect(getItem('2|0')?.color).to.equal('white');
  });

  it('can be overridden and call super', () => {
    class LoggingBoard extends TurkishBoard {
      moves: string[] = [];

      moveItem(fromCoord: string, toCoord: string) {
        this.moves.push(`${fromCoord}>${toCoord}`);
        super.moveItem(fromCoord, toCoord);
      }
    }

    const board = new LoggingBoard().init();
    board.playMove({ from: '5|0', path: ['4|0'], captured: [] });

    expect(board.moves).to.deep.equal(['5|0>4|0']);
    expect(board.getItem('4|0')?.color).to.equal('black');
  });
});

describe('getColumnsByDirection', () => {
  it('groups squares by direction', () => {
    const board = new Board({ rows: 3, cols: 3 });
    const columns = board.getColumnsByDirection('1|1', { top: true, right: true });

    expect(columns.top).to.deep.equal(['0|1']);
    expect(columns.right).to.deep.equal(['1|2']);
    expect(columns.bottom).to.deep.equal([]);
  });

  it('matches the deprecated getAvailableColumns(…, true)', () => {
    const board = new Board({ rows: 3, cols: 3 });
    const movement = { linear: true };

    expect(board.getAvailableColumns('1|1', movement, true)).to.deep.equal(
      board.getColumnsByDirection('1|1', movement)
    );
  });
});

describe('Item', () => {
  it('keeps typed data', () => {
    const item = new Item<{ hp: number }>({ name: 'knight', data: { hp: 3 } });

    expect(item.data?.hp).to.equal(3);
    expect(item.name).to.equal('knight');
  });
});

describe('checkers single-step API follows the same rules as getLegalMoves', () => {
  it('International men capture backward here too', () => {
    const board = new InternationalBoard();
    board.setItem('4|4', new InternationalItem({ color: 'white' }));
    board.setItem('3|3', new InternationalItem({ color: 'black' }));

    expect(board.getAvailableColumns('4|4')).to.deep.equal(['2|2']);
    expect(board.getAttackCoordsByColor('white')).to.deep.equal({
      '4|4': [{ coord: '2|2', destroyItemCoord: '3|3' }],
    });
  });

  it('getPlainMoves stops at the first piece in each direction', () => {
    const board = new TurkishBoard();
    board.setItem('3|3', new TurkishItem({ color: 'white', king: true }));
    board.setItem('3|5', new TurkishItem({ color: 'white' }));
    board.setItem('5|3', new TurkishItem({ color: 'black' }));

    expect(board.getPlainMoves('3|3')).to.deep.equal([
      '2|3',
      '1|3',
      '0|3',
      '4|3',
      '3|2',
      '3|1',
      '3|0',
      '3|4',
    ]);
  });
});

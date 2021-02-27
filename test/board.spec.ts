import { expect } from 'chai';
import 'mocha';

import Board from '../src/board';

describe('Board Tests', () => {
  it('Square Board 3x3', () => {
    const board = new Board().init({ x: 3, y: 3 }).board;

    expect(board).to.deep.equal([
      [{ id: '0|0', item: null }, { id: '0|1', item: null }, { id: '0|2', item: null }],
      [{ id: '1|0', item: null }, { id: '1|1', item: null }, { id: '1|2', item: null }],
      [{ id: '2|0', item: null }, { id: '2|1', item: null }, { id: '2|2', item: null }],
    ]);
  });

  it('Rectangle Board 3x5', () => {
    const board = new Board().init({ x: 3, y: 5 }).board;

    expect(board).to.deep.equal([
      [{ id: '0|0', item: null }, { id: '0|1', item: null }, { id: '0|2', item: null }, { id: '0|3', item: null }, { id: '0|4', item: null }],
      [{ id: '1|0', item: null }, { id: '1|1', item: null }, { id: '1|2', item: null }, { id: '1|3', item: null }, { id: '1|4', item: null }],
      [{ id: '2|0', item: null }, { id: '2|1', item: null }, { id: '2|2', item: null }, { id: '2|3', item: null }, { id: '2|4', item: null }],
    ]);
  });

  it('Rectangle Board 5x3', () => {
    const board = new Board().init({ x: 5, y: 3 }).board;

    expect(board).to.deep.equal([
      [{ id: '0|0', item: null }, { id: '0|1', item: null }, { id: '0|2', item: null }],
      [{ id: '1|0', item: null }, { id: '1|1', item: null }, { id: '1|2', item: null }],
      [{ id: '2|0', item: null }, { id: '2|1', item: null }, { id: '2|2', item: null }],
      [{ id: '3|0', item: null }, { id: '3|1', item: null }, { id: '3|2', item: null }],
      [{ id: '4|0', item: null }, { id: '4|1', item: null }, { id: '4|2', item: null }],
    ]);
  });
});

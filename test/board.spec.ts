import { expect } from 'chai';
import 'mocha';

import Board from '../src/board';

describe('Board Tests', () => {
  it('Square Board 3x3', () => {
    const board = new Board({ x: 3, y: 3 }).create();

    expect(board).to.deep.equal([
      [{ id: '1_1', value: null }, { id: '1_2', value: null }, { id: '1_3', value: null }],
      [{ id: '2_1', value: null }, { id: '2_2', value: null }, { id: '2_3', value: null }],
      [{ id: '3_1', value: null }, { id: '3_2', value: null }, { id: '3_3', value: null }],
    ]);
  });

  it('Rectangle Board 3x5', () => {
    const board = new Board({ x: 3, y: 5 }).create();

    expect(board).to.deep.equal([
      [{ id: '1_1', value: null }, { id: '1_2', value: null }, { id: '1_3', value: null }, { id: '1_4', value: null }, { id: '1_5', value: null }],
      [{ id: '2_1', value: null }, { id: '2_2', value: null }, { id: '2_3', value: null }, { id: '2_4', value: null }, { id: '2_5', value: null }],
      [{ id: '3_1', value: null }, { id: '3_2', value: null }, { id: '3_3', value: null }, { id: '3_4', value: null }, { id: '3_5', value: null }],
    ]);
  });

  it('Rectangle Board 5x3', () => {
    const board = new Board({ x: 5, y: 3 }).create();

    expect(board).to.deep.equal([
      [{ id: '1_1', value: null }, { id: '1_2', value: null }, { id: '1_3', value: null }],
      [{ id: '2_1', value: null }, { id: '2_2', value: null }, { id: '2_3', value: null }],
      [{ id: '3_1', value: null }, { id: '3_2', value: null }, { id: '3_3', value: null }],
      [{ id: '4_1', value: null }, { id: '4_2', value: null }, { id: '4_3', value: null }],
      [{ id: '5_1', value: null }, { id: '5_2', value: null }, { id: '5_3', value: null }],
    ]);
  });
});

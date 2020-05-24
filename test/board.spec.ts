import { expect } from 'chai';
import 'mocha';

import Board from '../src/board';

describe('Board Tests', () => {
  it('Square Board 3x3', () => {
    const board = new Board({ x: 3, y: 3 }).create();

    expect(board).to.deep.equal([
      [{ id: '0_0', value: null }, { id: '0_1', value: null }, { id: '0_2', value: null }],
      [{ id: '1_0', value: null }, { id: '1_1', value: null }, { id: '1_2', value: null }],
      [{ id: '2_0', value: null }, { id: '2_1', value: null }, { id: '2_2', value: null }],
    ]);
  });

  it('Rectangle Board 3x5', () => {
    const board = new Board({ x: 3, y: 5 }).create();

    expect(board).to.deep.equal([
      [{ id: '0_0', value: null }, { id: '0_1', value: null }, { id: '0_2', value: null }, { id: '0_3', value: null }, { id: '0_4', value: null }],
      [{ id: '1_0', value: null }, { id: '1_1', value: null }, { id: '1_2', value: null }, { id: '1_3', value: null }, { id: '1_4', value: null }],
      [{ id: '2_0', value: null }, { id: '2_1', value: null }, { id: '2_2', value: null }, { id: '2_3', value: null }, { id: '2_4', value: null }],
    ]);
  });

  it('Rectangle Board 5x3', () => {
    const board = new Board({ x: 5, y: 3 }).create();

    expect(board).to.deep.equal([
      [{ id: '0_0', value: null }, { id: '0_1', value: null }, { id: '0_2', value: null }],
      [{ id: '1_0', value: null }, { id: '1_1', value: null }, { id: '1_2', value: null }],
      [{ id: '2_0', value: null }, { id: '2_1', value: null }, { id: '2_2', value: null }],
      [{ id: '3_0', value: null }, { id: '3_1', value: null }, { id: '3_2', value: null }],
      [{ id: '4_0', value: null }, { id: '4_1', value: null }, { id: '4_2', value: null }],
    ]);
  });
});

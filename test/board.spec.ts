import { expect } from 'chai';
import 'mocha';

import Board from '../src/board';

describe('Board Tests', () => {
  it('Square Board 3x3', () => {
    const board = new Board().init({ x: 3, y: 3 }).board;

    expect(board).to.deep.equal([
      [{ id: '0|0', value: null }, { id: '0|1', value: null }, { id: '0|2', value: null }],
      [{ id: '1|0', value: null }, { id: '1|1', value: null }, { id: '1|2', value: null }],
      [{ id: '2|0', value: null }, { id: '2|1', value: null }, { id: '2|2', value: null }],
    ]);
  });

  it('Rectangle Board 3x5', () => {
    const board = new Board().init({ x: 3, y: 5 }).board;

    expect(board).to.deep.equal([
      [{ id: '0|0', value: null }, { id: '0|1', value: null }, { id: '0|2', value: null }, { id: '0|3', value: null }, { id: '0|4', value: null }],
      [{ id: '1|0', value: null }, { id: '1|1', value: null }, { id: '1|2', value: null }, { id: '1|3', value: null }, { id: '1|4', value: null }],
      [{ id: '2|0', value: null }, { id: '2|1', value: null }, { id: '2|2', value: null }, { id: '2|3', value: null }, { id: '2|4', value: null }],
    ]);
  });

  it('Rectangle Board 5x3', () => {
    const board = new Board().init({ x: 5, y: 3 }).board;

    expect(board).to.deep.equal([
      [{ id: '0|0', value: null }, { id: '0|1', value: null }, { id: '0|2', value: null }],
      [{ id: '1|0', value: null }, { id: '1|1', value: null }, { id: '1|2', value: null }],
      [{ id: '2|0', value: null }, { id: '2|1', value: null }, { id: '2|2', value: null }],
      [{ id: '3|0', value: null }, { id: '3|1', value: null }, { id: '3|2', value: null }],
      [{ id: '4|0', value: null }, { id: '4|1', value: null }, { id: '4|2', value: null }],
    ]);
  });

  it('Positions on 3x3 Board', () => {
    const positions = new Board().init({ x: 3, y: 3 }).positions;

    expect(positions).to.deep.equal({
      ET: ['0|1'],
      EL: ['1|0'],
      EB: ['2|1'],
      ER: ['1|2'],
      C: ['1|1'],
      CTL: ['0|0'],
      CTR: ['0|2'],
      CBR: ['2|2'],
      CBL: ['2|0']
    });
  });
});

import { describe, expect, it } from 'vitest';

import type { CheckersMove } from './board.js';
import InternationalCheckersBoard from './international/board.js';
import InternationalItem from './international/item.js';
import TurkishCheckersBoard from './turkish/board.js';
import TurkishItem from './turkish/item.js';

type Color = 'white' | 'black';

const turkish = (pieces: Record<string, [Color, boolean?]>) => {
  const board = new TurkishCheckersBoard();
  Object.entries(pieces).forEach(([coord, [color, king]]) =>
    board.setItem(coord, new TurkishItem({ color, king }))
  );
  return board;
};

const international = (pieces: Record<string, [Color, boolean?]>) => {
  const board = new InternationalCheckersBoard();
  Object.entries(pieces).forEach(([coord, [color, king]]) =>
    board.setItem(coord, new InternationalItem({ color, king }))
  );
  return board;
};

const byPath = (moves: CheckersMove[]) =>
  moves.map((move) => move.path.join(' ')).sort();

describe('Turkish captures', () => {
  it('a man keeps capturing in a straight line', () => {
    const board = turkish({ '2|0': ['white'], '3|0': ['black'], '5|0': ['black'] });

    expect(board.getCaptureSequences('2|0')).to.deep.equal([
      { from: '2|0', path: ['4|0', '6|0'], captured: ['3|0', '5|0'] },
    ]);
  });

  it('a man can turn sideways between captures', () => {
    const board = turkish({ '2|0': ['white'], '3|0': ['black'], '4|1': ['black'] });

    expect(board.getCaptureSequences('2|0')).to.deep.equal([
      { from: '2|0', path: ['4|0', '4|2'], captured: ['3|0', '4|1'] },
    ]);
  });

  it('a man cannot capture backward', () => {
    const board = turkish({ '4|4': ['white'], '3|4': ['black'] });

    expect(board.getCaptureSequences('4|4')).to.deep.equal([]);
  });

  it('a king captures from a distance and lands on any square behind', () => {
    const board = turkish({ '0|0': ['white', true], '0|3': ['black'] });

    expect(byPath(board.getCaptureSequences('0|0'))).to.deep.equal([
      '0|4',
      '0|5',
      '0|6',
      '0|7',
    ]);
  });

  it('a king cannot turn back 180 degrees within a chain', () => {
    const board = turkish({
      '4|3': ['white', true],
      '4|5': ['black'],
      '4|1': ['black'],
    });

    const most = Math.max(
      ...board.getCaptureSequences('4|3').map((move) => move.captured.length)
    );

    expect(most).to.equal(1);
  });

  it('the chain that captures the most pieces is mandatory', () => {
    const board = turkish({
      '2|0': ['white'],
      '3|0': ['black'],
      '5|0': ['black'],
      '2|6': ['white'],
      '3|6': ['black'],
    });

    expect(board.getLegalMoves('white')).to.deep.equal([
      { from: '2|0', path: ['4|0', '6|0'], captured: ['3|0', '5|0'] },
    ]);
    expect(board.getLegalMoves('white', '2|6')).to.deep.equal([]);
  });
});

describe('International captures', () => {
  it('a man captures backward', () => {
    const board = international({ '4|4': ['white'], '3|3': ['black'] });

    expect(board.getCaptureSequences('4|4')).to.deep.equal([
      { from: '4|4', path: ['2|2'], captured: ['3|3'] },
    ]);
  });

  it('a man can change direction between captures', () => {
    const board = international({
      '2|2': ['white'],
      '3|3': ['black'],
      '5|3': ['black'],
    });

    expect(board.getCaptureSequences('2|2')).to.deep.equal([
      { from: '2|2', path: ['4|4', '6|2'], captured: ['3|3', '5|3'] },
    ]);
  });

  it('captured pieces stay until the move ends and block the way', () => {
    // After taking 3|3 the king may not pass over it again on the way to 1|1.
    const board = international({
      '5|5': ['white', true],
      '3|3': ['black'],
      '1|3': ['black'],
    });

    const sequences = board.getCaptureSequences('5|5');

    sequences.forEach((move) => {
      expect(new Set(move.captured).size).to.equal(move.captured.length);
    });
    expect(sequences.some((move) => move.captured.length === 2)).to.equal(true);
  });

  it('only promotes a man that ends its move on the king row', () => {
    const board = international({
      '7|1': ['white'],
      '8|2': ['black'],
      '8|4': ['black'],
    });

    const [move] = board.getLegalMoves('white');

    expect(move).to.deep.equal({
      from: '7|1',
      path: ['9|3', '7|5'],
      captured: ['8|2', '8|4'],
    });

    board.playMove(move);

    expect(board.getItem('7|5')?.king).to.equal(false);
    expect(board.getItem('8|2')).to.equal(null);
    expect(board.getItem('8|4')).to.equal(null);
  });
});

describe('playMove and autoPlay', () => {
  it('playMove promotes a man that ends on the king row', () => {
    const board = turkish({ '6|3': ['white'] });

    board.playMove({ from: '6|3', path: ['7|3'], captured: [] });

    expect(board.getItem('7|3')?.king).to.equal(true);
  });

  it('getLegalMoves lists plain moves when there is nothing to capture', () => {
    const board = turkish({ '2|3': ['white'] });

    expect(byPath(board.getLegalMoves('white'))).to.deep.equal([
      '2|2',
      '2|4',
      '3|3',
    ]);
  });

  it('autoPlay plays the whole capture chain, one onMove per jump', () => {
    const board = turkish({
      '2|0': ['white'],
      '3|0': ['black'],
      '5|0': ['black'],
      '2|6': ['white'],
      '3|6': ['black'],
    });
    const moves: string[] = [];

    board.autoPlay('white', { onMove: (from, to) => moves.push(`${from}>${to}`) });

    expect(moves).to.deep.equal(['2|0>4|0', '4|0>6|0']);
  });
});

describe('capture rules on random positions', () => {
  let seed = 42;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const randomBoard = <B extends TurkishCheckersBoard | InternationalCheckersBoard>(
    board: B,
    Item: typeof TurkishItem | typeof InternationalItem
  ) => {
    Object.keys(board.board).forEach((coord) => {
      if (random() < 0.3) {
        const color = random() < 0.5 ? 'white' : 'black';
        board.setItem(coord, new Item({ color, king: random() < 0.2 }));
      }
    });
    return board;
  };

  it('chains never take a piece twice, and legal captures are all maximal', () => {
    for (let i = 0; i < 300; i += 1) {
      const boards = [
        randomBoard(new TurkishCheckersBoard(), TurkishItem),
        randomBoard(new InternationalCheckersBoard(), InternationalItem),
      ];

      boards.forEach((board) => {
        (['white', 'black'] as const).forEach((color) => {
          const legal = board.getLegalMoves(color);
          const counts = new Set(legal.map((move) => move.captured.length));

          expect(counts.size).to.be.at.most(1);
          legal.forEach((move) => {
            expect(new Set(move.captured).size).to.equal(move.captured.length);
            expect(move.path.length).to.equal(Math.max(move.captured.length, 1));
          });
        });
      });
    }
  });

  it('Turkish: a piece can start a chain exactly when it has a single capture', () => {
    for (let i = 0; i < 300; i += 1) {
      const board = randomBoard(new TurkishCheckersBoard(), TurkishItem);

      (['white', 'black'] as const).forEach((color) => {
        const attackers = Object.keys(board.getAttackCoordsByColor(color)).sort();
        const starters = [
          ...new Set(
            Object.keys(board.board).filter(
              (coord) =>
                board.getItem(coord)?.color === color &&
                board.getCaptureSequences(coord).length
            )
          ),
        ].sort();

        expect(starters).to.deep.equal(attackers);
      });
    }
  });
});

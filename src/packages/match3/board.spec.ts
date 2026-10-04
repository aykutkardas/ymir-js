import { describe, expect, it } from 'vitest';

import Match3Board from './board.js';

const seeded = (seed: number) => () =>
  (seed = (seed * 16807) % 2147483647) / 2147483647;

// Short names keep the hand-made boards readable.
const KINDS = { R: 'red', G: 'green', B: 'blue', Y: 'yellow' } as const;
const grid = (...lines: string[]) =>
  lines.map((line) =>
    [...line].map((ch) => (ch === '.' ? null : KINDS[ch as keyof typeof KINDS]))
  );

const board = (...lines: string[]) =>
  new Match3Board({
    rows: lines.length,
    cols: lines[0].length,
    kinds: Object.values(KINDS),
    random: seeded(1),
  }).setKinds(grid(...lines));

describe('Match3Board', () => {
  it('needs at least three kinds', () => {
    expect(() => new Match3Board({ kinds: ['a', 'b'] })).to.throw();
  });

  it('init fills the board with no matches and at least one move', () => {
    for (let seed = 1; seed < 50; seed += 1) {
      const b = new Match3Board({ random: seeded(seed) }).init();

      expect(b.getKinds().flat().every(Boolean)).to.equal(true);
      expect(b.findMatches()).to.deep.equal([]);
      expect(b.getPossibleMoves().length).to.be.greaterThan(0);
    }
  });

  it('init is repeatable with the same random source', () => {
    const a = new Match3Board({ random: seeded(7) }).init().getKinds();
    const b = new Match3Board({ random: seeded(7) }).init().getKinds();

    expect(a).to.deep.equal(b);
  });

  it('finds runs of three or more in rows and columns', () => {
    const b = board(
      'RRRG', //
      'BGYG',
      'YBRG',
      'BYRB'
    );

    expect(b.findMatches()).to.deep.equal([
      ['0|0', '0|1', '0|2'],
      ['0|3', '1|3', '2|3'],
    ]);
  });

  it('only swaps neighbours, and only when it makes a match', () => {
    const b = board(
      'RGRB', //
      'BRYG',
      'YBGY'
    );

    expect(b.canSwap('0|1', '1|1')).to.equal(true); // R drops into the top row
    expect(b.canSwap('0|0', '0|2')).to.equal(false); // not neighbours
    expect(b.canSwap('2|0', '2|1')).to.equal(false); // no match

    const before = b.getKinds();
    expect(b.swap('2|0', '2|1')).to.deep.equal({
      valid: false,
      steps: [],
      points: 0,
      shuffled: false,
    });
    expect(b.getKinds()).to.deep.equal(before);
  });

  it('clears the match, drops the gems above and fills the top', () => {
    const b = board(
      'GYB', //
      'BGY',
      'RBR',
      'YRB'
    );

    // Swapping 3|1 up makes R R R in row 2.
    const result = b.swap('2|1', '3|1');
    const [first] = result.steps;

    expect(result.valid).to.equal(true);
    expect(first.matches).to.deep.equal([['2|0', '2|1', '2|2']]);
    expect(first.cleared).to.have.length(3);
    // Everything above row 2 moved down by one.
    expect(first.fallen).to.deep.include({ from: '1|0', to: '2|0' });
    expect(first.fallen).to.deep.include({ from: '0|2', to: '1|2' });
    expect(first.spawned.map((s) => s.coord).sort()).to.deep.equal([
      '0|0',
      '0|1',
      '0|2',
    ]);
    expect(first.points).to.equal(30);

    const kinds = b.getKinds();
    expect(kinds[2][0]).to.equal('blue'); // was at 1|0
    expect(kinds[1][2]).to.equal('blue'); // was at 0|2
    expect(kinds[3][1]).to.equal('blue'); // swapped down from 2|1
    expect(kinds.flat().every(Boolean)).to.equal(true);
  });

  it('cascades score more per step', () => {
    // Clearing row 3 drops the blues in column 0 onto the blue below them.
    const b = board(
      'GYG', //
      'BGY',
      'BYG',
      'RBR',
      'BRY'
    );

    const result = b.swap('3|1', '4|1');

    expect(result.steps.length).to.be.at.least(2);
    expect(result.steps[0].points).to.equal(30);
    expect(result.steps[1].matches).to.deep.include(['2|0', '3|0', '4|0']);
    expect(result.steps[1].points).to.equal(result.steps[1].cleared.length * 10 * 2);
    expect(result.points).to.equal(
      result.steps.reduce((sum, step) => sum + step.points, 0)
    );
  });

  it('getPossibleMoves lists every swap that matches', () => {
    const b = board(
      'RGRB', //
      'BRYG',
      'YBGY'
    );

    const moves = b.getPossibleMoves();

    expect(moves).to.deep.include({ from: '0|1', to: '1|1' });
    moves.forEach(({ from, to }) => expect(b.canSwap(from, to)).to.equal(true));
  });

  it('shuffle keeps the same gems and leaves a playable board', () => {
    const b = new Match3Board({ random: seeded(3) }).init();
    const count = (kinds: (string | null)[][]) =>
      kinds.flat().sort().join();
    const before = count(b.getKinds());

    b.shuffle();

    expect(count(b.getKinds())).to.equal(before);
    expect(b.findMatches()).to.deep.equal([]);
    expect(b.getPossibleMoves().length).to.be.greaterThan(0);
  });

  it('stays full, settled and playable through many random swaps', () => {
    const random = seeded(99);
    const b = new Match3Board({ random }).init();

    for (let turn = 0; turn < 300; turn += 1) {
      const moves = b.getPossibleMoves();
      const { from, to } = moves[Math.floor(random() * moves.length)];
      const result = b.swap(from, to);

      expect(result.valid).to.equal(true);
      result.steps.forEach((step) =>
        expect(step.spawned.length).to.equal(step.cleared.length)
      );
      expect(b.getKinds().flat().every(Boolean)).to.equal(true);
      expect(b.findMatches()).to.deep.equal([]);
      expect(b.getPossibleMoves().length).to.be.greaterThan(0);
    }
  });
});

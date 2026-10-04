import { describe, expect, it } from 'vitest';

import { CANNON_ROW, COLS, InvadersGame, LANDED_ROW, Tile } from './rules';

/** A game with no bombs or ships coming, to set up each case by hand. */
const quiet = () => {
  const game = new InvadersGame();
  game.bombWait = game.shipWait = Infinity;
  return game;
};

/** Removes every invader but the ones given. */
const only = (game: InvadersGame, coords: string[]) => {
  game.invaders().forEach((coord) => game.board.removeItem(coord));
  coords.forEach((coord) => game.board.setItem(coord, new Tile('invader', { kind: 'octopus' })));
};

/** Advances time in small steps, like the app's frame loop. */
const run = (game: InvadersGame, ms: number) => {
  for (let t = 0; t < ms; t += 20) game.tick(20);
};

describe('the formation', () => {
  it('starts as five rows of seven, and shields', () => {
    const game = quiet();
    expect(game.invaders()).toHaveLength(35);
    expect(game.board.getItem('2|3')?.data?.kind).toBe('squid');
    expect(game.board.getItem('10|15')?.data?.kind).toBe('octopus');
    expect(game.board.getItem('14|3')?.type).toBe('shield');
  });

  it('marches sideways, then steps down and turns at the edge', () => {
    const game = quiet();
    only(game, ['5|18']);

    // A lone invader marches fast: a step every 100 ms.
    run(game, 100);
    expect(game.invaders()).toEqual(['5|19']);
    run(game, 100);
    expect(game.invaders()).toEqual(['5|20']);
    run(game, 100);
    expect(game.invaders()).toEqual(['6|20']); // down at the edge
    run(game, 100);
    expect(game.invaders()).toEqual(['6|19']); // and back
  });

  it('speeds up as invaders fall', () => {
    const game = quiet();
    const full = game.marchMs();
    only(game, ['2|3', '2|5']);
    expect(game.marchMs()).toBeLessThan(full / 5);
  });

  it('only the lowest invader in a column drops bombs', () => {
    const game = quiet();
    only(game, ['2|3', '4|3', '2|7']);
    expect(game.shooters().sort()).toEqual(['2|7', '4|3']);
  });

  it('landing ends the game', () => {
    const game = quiet();
    only(game, [`${LANDED_ROW - 1}|20`]);
    run(game, 300);
    expect(game.getStatus()).toEqual({ state: 'over', reason: 'invaded' });
  });
});

describe('the cannon', () => {
  it('moves while held, not off the board', () => {
    const game = quiet();
    game.setInput({ move: 1 });
    run(game, 3000);
    expect(game.cannon).toBe(COLS - 1);
  });

  it('shoots one shot at a time, and the shot kills an invader for points', () => {
    const game = quiet();
    game.cannon = 7; // between two shields, under a column of invaders
    game.setInput({ fire: true });
    game.tick(20);
    const shot = game.shot;
    game.tick(20);
    expect(game.shot).toBe(shot); // still the same one

    run(game, 200);
    expect(game.board.getItem('10|7')).toBe(null);
    expect(game.score).toBe(10);
  });

  it('a shield takes two hits', () => {
    const game = quiet();
    only(game, ['2|1']);
    game.cannon = 4; // under a shield
    game.setInput({ fire: true });
    run(game, 100);
    expect(game.board.getItem('15|4')?.data?.hp).toBe(1);
    run(game, 100);
    expect(game.board.getItem('15|4')).toBe(null);
  });
});

describe('bombs', () => {
  it('a bomb that hits the cannon costs a life, and three end the game', () => {
    const game = quiet();
    only(game, ['2|1']);
    game.cannon = 7; // no shield above
    for (let life = 3; life > 0; life -= 1) {
      game.bombs.push({ row: CANNON_ROW - 2, col: 7, wait: 0 });
      run(game, 1500);
      expect(game.lives).toBe(life - 1);
    }
    expect(game.getStatus()).toEqual({ state: 'over', reason: 'shot' });
  });

  it('invaders drop bombs on their own', () => {
    const game = new InvadersGame({ seed: 3 });
    game.shipWait = Infinity;
    run(game, 1100);
    expect(game.bombs.length).toBeGreaterThan(0);
  });

  it('a shot and a bomb that meet cancel out', () => {
    const game = quiet();
    only(game, ['2|1']);
    game.cannon = 7;
    game.bombs.push({ row: 8, col: 7, wait: 0 });
    game.setInput({ fire: true });
    game.tick(20);
    game.setInput({ fire: false });
    run(game, 300);
    expect(game.bombs).toHaveLength(0);
    expect(game.lives).toBe(3);
  });
});

describe('waves and the mystery ship', () => {
  it('clearing a wave brings the next, a row lower', () => {
    const game = quiet();
    game.cannon = 7;
    only(game, ['16|7']);
    game.setInput({ fire: true });
    run(game, 80);
    game.setInput({ fire: false });
    expect(game.invaders()).toHaveLength(0);

    run(game, 1500);
    expect(game.wave).toBe(2);
    expect(game.invaders()).toHaveLength(35);
    expect(game.board.getItem('3|3')?.type).toBe('invader');
  });

  it('the mystery ship flies across and is worth a bonus', () => {
    const game = quiet();
    only(game, ['10|1']);
    game.shipWait = 20;
    game.tick(20);
    expect(game.ship).not.toBe(null);
    const ship = game.ship!;

    // Wait until it is right above the cannon, then fire.
    for (let t = 0; t < 4000 && game.ship && game.ship.col !== game.cannon; t += 20) game.tick(20);
    game.cannon += ship.dir * 2; // lead the target: the shot takes ~400 ms
    game.setInput({ fire: true });
    run(game, 500);
    expect(game.ship).toBe(null);
    expect(game.score).toBe(ship.value);
  });
});

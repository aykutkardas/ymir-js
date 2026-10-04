import { describe, expect, it } from 'vitest';

import { BOMB_MS, BombermanGame, FIRE_MS, Tile, occupied } from './rules';

/**
 * A game with no crates, to set up each case by hand. One enemy stays, frozen
 * in the far corner, so the game is still being played.
 */
const empty = () => {
  const game = new BombermanGame({ crates: 0 });
  game.enemies.slice(1).forEach((enemy) => (enemy.alive = false));
  game.enemies[0].speed = 0;
  return game;
};

/** Advances time in small steps, like the app's frame loop. */
const run = (game: BombermanGame, ms: number) => {
  for (let t = 0; t < ms; t += 20) game.tick(20);
};

/** Holds a direction until the player stands on `target` (or a second passes), then lets go. */
const walkTo = (game: BombermanGame, move: 'top' | 'bottom' | 'left' | 'right', target: string) => {
  game.setInput({ move });
  for (let t = 0; t < 1000 && !(game.player.from === target && game.player.to === target); t += 20) game.tick(20);
  game.setInput({ move: null });
};

describe('the map', () => {
  it('has walls around the edge and on every other square inside', () => {
    const game = new BombermanGame({ crates: 0 });

    expect(game.board.getItem('0|0')?.kind).toBe('wall');
    expect(game.board.getItem('2|2')?.kind).toBe('wall');
    expect(game.board.getItem('1|1')).toBe(null);
    expect(game.board.getItem('1|2')).toBe(null);
  });

  it('never puts crates on the player’s corner or around the enemies', () => {
    for (let seed = 1; seed < 20; seed += 1) {
      const game = new BombermanGame({ seed });
      for (const coord of ['1|1', '1|2', '2|1', ...game.enemies.map(occupied)]) {
        expect(game.board.getItem(coord)?.kind).not.toBe('crate');
      }
    }
  });

  it('is the same for the same seed', () => {
    const a = new BombermanGame({ seed: 7 });
    const b = new BombermanGame({ seed: 7 });
    const crates = (g: BombermanGame) =>
      Object.keys(g.board.board).filter((c) => g.board.getItem(c)?.kind === 'crate');

    expect(crates(a)).toEqual(crates(b));
  });
});

describe('moving', () => {
  it('walks one square at its speed, and not into walls', () => {
    const game = empty();

    game.setInput({ move: 'right' });
    run(game, 260); // 4 squares a second: one square in 250 ms
    expect(game.player.from).toBe('1|2');

    game.setInput({ move: 'top' });
    game.tick(20); // let it reach 1|2 and stop
    run(game, 300);
    expect(occupied(game.player)).toBe('1|2'); // wall above
  });

  it('can step off its own bomb but not onto one', () => {
    const game = empty();

    game.setInput({ bomb: true });
    game.tick(20);
    expect(game.board.getItem('1|1')?.kind).toBe('bomb');

    walkTo(game, 'right', '1|2');
    expect(game.player.from).toBe('1|2');

    game.setInput({ move: 'left' });
    run(game, 300);
    expect(occupied(game.player)).toBe('1|2'); // the bomb is in the way now
  });
});

describe('bombs', () => {
  it('go off after two seconds in a cross, stopping at walls', () => {
    const game = empty();
    game.board.setItem('5|5', new Tile('bomb', { timer: BOMB_MS, range: 2 }));

    run(game, BOMB_MS - 40);
    expect(game.fire.size).toBe(0);

    run(game, 60);
    // Walls stand on 4|4, 4|6, 6|4 and 6|6; the lines through 5|5 are open.
    expect(game.fire.has('5|5')).toBe(true);
    expect(game.fire.has('3|5')).toBe(true);
    expect(game.fire.has('5|7')).toBe(true);
    expect(game.fire.has('4|4')).toBe(false); // walls never burn
  });

  it('a blast stops at the first crate and burns it', () => {
    const game = empty();
    game.board.setItem('1|4', new Tile('crate'));
    game.board.setItem('1|5', new Tile('crate'));
    game.board.setItem('1|3', new Tile('bomb', { timer: 20, range: 3 }));

    game.tick(20);

    expect(game.board.getItem('1|4')?.kind).not.toBe('crate');
    expect(game.board.getItem('1|5')?.kind).toBe('crate');
    expect(game.score).toBe(10);
  });

  it('a blast sets off another bomb (chain reaction)', () => {
    const game = empty();
    game.board.setItem('1|3', new Tile('bomb', { timer: 20, range: 2 }));
    game.board.setItem('1|5', new Tile('bomb', { timer: BOMB_MS, range: 2 }));

    game.tick(20);

    expect(game.board.getItem('1|5')).toBe(null);
    expect(game.fire.has('1|7')).toBe(true);
  });

  it('fire burns out', () => {
    const game = empty();
    game.board.setItem('1|3', new Tile('bomb', { timer: 20, range: 1 }));

    game.tick(20);
    expect(game.fire.size).toBeGreaterThan(0);
    run(game, FIRE_MS + 20);
    expect(game.fire.size).toBe(0);
  });

  it('only as many bombs as the player is allowed', () => {
    const game = empty();

    game.setInput({ bomb: true });
    game.tick(20);
    walkTo(game, 'right', '1|2');
    game.setInput({ bomb: true });
    game.tick(20);

    expect(game.bombsPlaced()).toBe(1);
  });
});

describe('winning and losing', () => {
  it('the player in a blast loses', () => {
    const game = empty();
    game.board.setItem('1|2', new Tile('bomb', { timer: 20, range: 1 }));

    game.tick(20);
    expect(game.getStatus()).toEqual({ state: 'lost' });
  });

  it('an enemy in a blast dies; when none are left, the player wins', () => {
    const game = new BombermanGame({ crates: 0 });
    game.enemies.slice(1).forEach((enemy) => (enemy.alive = false));
    const [enemy] = game.enemies;
    enemy.speed = 0; // keep it still
    const [r, c] = occupied(enemy).split('|').map(Number);
    game.board.setItem(`${r}|${c - 1}`, new Tile('bomb', { timer: 20, range: 1 }));

    game.tick(20);

    expect(enemy.alive).toBe(false);
    expect(game.score).toBe(100);
    expect(game.getStatus()).toEqual({ state: 'won' });
  });

  it('touching an enemy loses', () => {
    const game = new BombermanGame({ crates: 0 });
    game.enemies.slice(1).forEach((enemy) => (enemy.alive = false));
    const [enemy] = game.enemies;
    enemy.from = enemy.to = '1|1'; // on the player's square
    enemy.speed = 0;

    game.tick(20);
    expect(game.getStatus()).toEqual({ state: 'lost' });
  });
});

describe('power-ups', () => {
  it('more bombs, longer blasts and more speed', () => {
    const game = empty();
    game.board.setItem('1|2', new Tile('power', { power: 'bomb' }));
    game.board.setItem('1|3', new Tile('power', { power: 'fire' }));
    game.board.setItem('1|4', new Tile('power', { power: 'speed' }));

    game.setInput({ move: 'right' });
    run(game, 1000);

    expect(game.maxBombs).toBe(2);
    expect(game.range).toBe(3);
    expect(game.player.speed).toBeGreaterThan(4);
    expect(game.score).toBe(150);
  });
});

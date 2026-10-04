import { test } from 'vitest';

import Board from './board.js';
import Item from './item.js';
import parseCoord from './utils/parseCoord.js';

const queen = { linear: true, angular: true, stepCount: 7 };

const chess = new Board({ rows: 8, cols: 8 });
const go = new Board({ rows: 19, cols: 19 });
const field = new Board({ rows: 50, cols: 50 });

// A wall down the middle of the field with one gap, so paths have to bend.
for (let r = 0; r < 49; r += 1) field.setItem(`${r}|25`, new Item({ name: 'wall' }));

test('core', async ({ bench }) => {
  await bench('new Board 19x19', () => {
    new Board({ rows: 19, cols: 19 });
  }).run();

  await bench('parseCoord', () => {
    parseCoord('12|7');
  }).run();

  await bench('getAvailableColumns (queen, 8x8)', () => {
    chess.getAvailableColumns('3|4', queen);
  }).run();

  await bench('getDirection + getDistanceBetweenTwoCoords', () => {
    go.getDirection('3|3', '15|15');
    go.getDistanceBetweenTwoCoords('3|3', '15|15');
  }).run();

  await bench('getBoardMatrix 19x19', () => {
    go.getBoardMatrix();
  }).run();

  await bench('getReachable 19x19', () => {
    go.getReachable('9|9');
  }).run();

  await bench('findPath 50x50 around a wall', () => {
    field.findPath('0|0', '0|49');
  }).run();
});

# @ymir-js/core

The core of [ymir-js](https://github.com/aykutkardas/ymir-js): a typed board of `"row|col"` squares holding items, with movement patterns, directions and pathfinding. Every ymir-js game is built on it, and so can yours.

```sh
npm install @ymir-js/core
```

```js
import { Board, Item } from '@ymir-js/core';

const board = new Board({ rows: 8, cols: 8 });
board.setItem('7|0', new Item({ name: 'knight', data: { hp: 10 } }));

board.getReachable('7|0', { steps: 3 }); // Map of square → steps
board.findPath('7|0', '0|7'); // the shortest route
board.getColumnsByDirection('7|0', { linear: true, stepCount: 7 }); // rook-like lines
board.findCoord((item) => item.name === 'knight'); // '7|0'
board.squares(); // every square as { coord, row, col, item }, for rendering
```

Docs: [Building your own game](https://github.com/aykutkardas/ymir-js#building-your-own-game) · Games built only on the core: [Hnefatafl](https://aykutkardas.github.io/ymir-js/examples/hnefatafl/), [Sokoban](https://aykutkardas.github.io/ymir-js/examples/sokoban/), [Tactics](https://aykutkardas.github.io/ymir-js/examples/tactics/)

All of ymir-js is also available as one package: `npm install ymir-js`.

MIT License

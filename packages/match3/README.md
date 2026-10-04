# @ymir-js/match3

Match-3 for [ymir-js](https://github.com/aykutkardas/ymir-js): swaps, matches, gravity, refills and chain reactions, with every cascade step reported so you can animate it.

```sh
npm install @ymir-js/match3
```

```js
import { Match3Board } from '@ymir-js/match3';

const board = new Match3Board({ rows: 8, cols: 8 }).init();
const [hint] = board.getPossibleMoves();
board.swap(hint.from, hint.to); // { valid, points, steps: [...] }
```

Docs: [Match 3](https://github.com/aykutkardas/ymir-js#match-3) · [Play the demo](https://aykutkardas.github.io/ymir-js/examples/match3/)

All of ymir-js is also available as one package: `npm install ymir-js`.

MIT License

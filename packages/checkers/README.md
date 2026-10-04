# @ymir-js/checkers

Turkish and International checkers for [ymir-js](https://github.com/aykutkardas/ymir-js): mandatory and maximum capture, capture chains, flying kings, FMJD and Turkish draw rules, undo, save/load and PDN notation.

```sh
npm install @ymir-js/checkers
```

```js
import { CheckersGame } from '@ymir-js/checkers';

const game = CheckersGame.create('turkish'); // or 'international'
game.play(game.getLegalMoves()[0]);
game.getStatus(); // { state: 'playing' }
```

Docs: [Checkers](https://github.com/aykutkardas/ymir-js#checkers) · [Play the demo](https://aykutkardas.github.io/ymir-js/examples/checkers/)

All of ymir-js is also available as one package: `npm install ymir-js`.

MIT License

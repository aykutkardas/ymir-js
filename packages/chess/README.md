# @ymir-js/chess

Chess for [ymir-js](https://github.com/aykutkardas/ymir-js): every rule (castling, en passant, promotion, mate, stalemate, draws), FEN / SAN / UCI / PGN, move generation verified with perft, and a small built-in engine.

```sh
npm install @ymir-js/chess
```

```js
import { ChessGame } from '@ymir-js/chess';

const game = new ChessGame();
game.move('e4');
game.getBestMove({ depth: 3 }); // the engine's reply
game.fen();
```

Docs: [Chess](https://github.com/aykutkardas/ymir-js#chess) · [Play the demo](https://aykutkardas.github.io/ymir-js/examples/chess/)

All ymir-js packages: [`@ymir-js/core`](https://www.npmjs.com/package/@ymir-js/core), [`@ymir-js/checkers`](https://www.npmjs.com/package/@ymir-js/checkers), [`@ymir-js/chess`](https://www.npmjs.com/package/@ymir-js/chess), [`@ymir-js/go`](https://www.npmjs.com/package/@ymir-js/go) and [`@ymir-js/match3`](https://www.npmjs.com/package/@ymir-js/match3).

MIT License

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

All of ymir-js is also available as one package: `npm install ymir-js`.

MIT License

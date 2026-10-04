# @ymir-js/go

Go for [ymir-js](https://github.com/aykutkardas/ymir-js): captures, suicide, simple ko and positional superko, pass and resign, dead stones, area or territory scoring, GTP coordinates.

```sh
npm install @ymir-js/go
```

```js
import { GoGame } from '@ymir-js/go';

const game = new GoGame({ size: 19 });
game.play('3|3');
game.pass();
game.pass();
game.getScore(); // { black, white, margin, winner, ... }
```

Docs: [Go](https://github.com/aykutkardas/ymir-js#go) · [Play the demo](https://aykutkardas.github.io/ymir-js/examples/go/)

All ymir-js packages: [`@ymir-js/core`](https://www.npmjs.com/package/@ymir-js/core), [`@ymir-js/checkers`](https://www.npmjs.com/package/@ymir-js/checkers), [`@ymir-js/chess`](https://www.npmjs.com/package/@ymir-js/chess), [`@ymir-js/go`](https://www.npmjs.com/package/@ymir-js/go) and [`@ymir-js/match3`](https://www.npmjs.com/package/@ymir-js/match3).

MIT License

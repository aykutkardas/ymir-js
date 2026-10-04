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

All of ymir-js is also available as one package: `npm install ymir-js`.

MIT License

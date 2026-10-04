# ymir-js

This toolkit is created to make it easier for you to develop games like chess, checkers, go, match 3 puzzle and more. It is still under development.

### Install

```sh
npm install ymir-js
```

ymir-js is published as an ES module and needs Node.js 20.19+ or 22.12+.

```js
import { Core, Checkers } from 'ymir-js';

const { Board, Item } = Core;
const turkish = new Checkers.Turkish.Board().init();
```

### Create Board

```js
const board = new Board({ x: 3, y: 3 });
```

### Set Item

```js
const item = new Item({ name: 'myFirstItem' });
board.setItem('0|0', item);
```

### Get Item

```js
board.getItem('0|0');
// => { name: 'myFirstItem', ... }
```

### Move Item

```js
board.moveItem('0|0', '1|1');
```

### Remove Item

```js
board.removeItem('1|1');
```

### Switch Item

```js
const firstItem = new Item({ name: 'myFirstItem' });
const secondItem = new Item({ name: 'mySecondItem' });

board.setItem('0|0', firstItem);
board.setItem('1|1', secondItem);

board.switchItem('0|0', '1|1');

board.getItem('0|0');
// => { name: 'mySecondItem', ... }

board.getItem('1|1');
// => { name: 'myFirstItem', ... }
```

### Empty Control

```js
board.isEmpty('2|2');
// => true
```

### Exist Control

```js
const board = new Board({ x: 3, y: 3 });

board.isExistCoord('5|5');
// => false
```

### Get Matrix

```js
board.getBoardMatrix();

/* => 
[
  [{ item }, { item }, { item }], 
  [{ item }, { item }, { item }], 
  [{ item }, { item }, { item }]
]
*/
```

---

## Checkers

`Checkers.Turkish.Board` and `Checkers.International.Board` know the rules of each game: mandatory capture, capture chains, taking the most pieces, flying kings and promotion.

```js
import { Checkers } from 'ymir-js';

const board = new Checkers.Turkish.Board().init();

// Legal moves for a color. If a capture is possible, only the chains that
// take the most pieces are returned.
const moves = board.getLegalMoves('black');
// => [{ from: '5|0', path: ['4|0'], captured: [] }, ...]

// Plays a whole move: removes captured pieces and promotes at the end.
board.playMove(moves[0]);

// Every capture chain one piece can make.
board.getCaptureSequences('4|0');

// Moves of one piece, under the same rules (e.g. to continue a chain).
board.getLegalMoves('white', '2|3');

// A simple computer player. onMove is called once per jump.
board.autoPlay('white', { onSelect, onMove });
```

| Rule                          | Turkish                  | International             |
| ----------------------------- | ------------------------ | ------------------------- |
| Board                         | 8x8, 16 pieces each      | 10x10, 20 pieces each     |
| Men move                      | forward and sideways     | diagonally forward        |
| Men capture                   | forward and sideways     | diagonally, also backward |
| Kings                         | fly along rows/columns   | fly along diagonals       |
| Captured pieces are removed   | one by one, during a jump | after the whole move     |
| Taking the most pieces        | mandatory                | mandatory                 |

---

## Examples

Games built with ymir-js live in [`examples/`](examples):

- [Turkish Checkers](examples/turkish-checkers) ([play](https://turkish-checkers.pages.dev/))
- [International Checkers](examples/international-checkers) ([play](https://international-checkers-demo.surge.sh/))

Each example keeps its own `package.json` and pins the ymir-js version it was built with.

---

## Roadmap

| Name                   | Status | Link                                                            |
| ---------------------- | ------ | --------------------------------------------------------------- |
| Turkish Checkers       | WIP    | [Source](examples/turkish-checkers)       |
| International Checkers | WIP    | [Source](examples/international-checkers) |
| Chess                  | -      | -                                                               |
| Match 3 Puzzle         | -      | -                                                               |
| Go                     | -      | -                                                               |

---

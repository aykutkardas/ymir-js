# ymir-js

This toolkit is created to make it easier for you to develop games like chess, checkers, go, match 3 puzzle and more. It is still under development.

### Install

```sh
npm install ymir-js
```

ymir-js is published as an ES module and needs Node.js 20.19+ or 22.12+.

```js
import { Board, Item, TurkishBoard, InternationalBoard } from 'ymir-js';

const turkish = new TurkishBoard().init();
```

The grouped imports from earlier versions (`Core.Board`, `Checkers.Turkish.Board`, `Utils.parseCoord`) still work.

### Create Board

```js
const board = new Board({ rows: 3, cols: 3 });
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

### Off-board squares

Methods that take a coord are safe to call with one that is not on the board: `getItem` returns `null`, `isEmpty` returns `false`, and `getDirection` / `getDistanceBetweenTwoCoords` return `null`.

### Exist Control

```js
const board = new Board({ rows: 3, cols: 3 });

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

## Deprecated in 0.11

These still work and will be removed in 1.0:

| Deprecated                                   | Use instead                                   |
| -------------------------------------------- | --------------------------------------------- |
| `new Board({ x, y })` (`x` = rows)           | `new Board({ rows, cols })`                   |
| `board.config.x`, `board.config.y`           | `board.config.rows`, `board.config.cols`      |
| `getAvailableColumns(coord, movement, true)` | `getColumnsByDirection(coord, movement)`      |
| `selectItem`, `deselectItem`, `deselectAllItems`, `item.selected`, `item.lock` | Keep selection in your app's state |
| `AttactCoord` type                           | `AttackCoord`                                 |

---

## Examples

[`examples/checkers`](examples/checkers) is a small game built on the API above: Turkish and International checkers against the computer, in one app.

```sh
cd examples/checkers
pnpm install --ignore-workspace
pnpm dev
```

---

## Roadmap

| Name                   | Status | Link                                                            |
| ---------------------- | ------ | --------------------------------------------------------------- |
| Turkish Checkers       | Done   | [Source](examples/checkers)               |
| International Checkers | Done   | [Source](examples/checkers)               |
| Chess                  | -      | -                                                               |
| Match 3 Puzzle         | -      | -                                                               |
| Go                     | -      | -                                                               |

---

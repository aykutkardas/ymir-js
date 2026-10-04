# ymir-js

This toolkit is created to make it easier for you to develop games like chess, checkers, go, match 3 puzzle and more. It is still under development.

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

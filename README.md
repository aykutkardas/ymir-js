# ymir-js

A toolkit for board games in TypeScript: checkers (Turkish and International), chess, Go and match-3, each with its full rules, on top of a small board and item core you can build your own games on.

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

### Playing a game

`CheckersGame` keeps track of whose turn it is, the moves played and whether the game is over.

```js
import { CheckersGame } from 'ymir-js';

const game = CheckersGame.create('international'); // white moves first

game.getLegalMoves();               // moves for the side to move
game.play({ from: '3|6', path: ['4|5'] }); // throws if the move is not legal
game.turn;                          // 'black'

game.undo();
game.redo();

game.getStatus();
// { state: 'playing' }
// { state: 'won', winner: 'white', reason: 'no-moves' }
// { state: 'draw', reason: 'repetition' | 'king-moves' | 'lone-king' | 'one-piece-each' }

const saved = game.toJSON();        // plain JSON: start position + moves
CheckersGame.fromJSON(saved);       // replays the moves
```

To start from a custom position, set up a board and pass it in: `new CheckersGame(board, { turn: 'black' })`. Positions can be read and written as `{ coord: 'w' | 'b' | 'W' | 'B' }` with `board.getPosition()` and `board.setPosition()`.

**Draw rules** can be changed with `new CheckersGame(board, { drawRules })`:

| Rule                                                                 | International (FMJD) | Turkish |
| -------------------------------------------------------------------- | -------------------- | ------- |
| `repetition`: same position, same side to move, this many times      | 3                    | 3       |
| `kingMoves`: moves in a row with only kings and no capture           | 50 (25 each)         | off     |
| `loneKing`: a lone king against 3 pieces incl. a king draws after 16 moves each; against 2 or fewer incl. a king, after 5 each | on | off |
| `onePieceEach`: draw as soon as each side has one piece ("gayyım")   | off                  | on      |

### International notation

International boards read and write standard PDN: squares 1–50 with White at the bottom (ymir draws White at the top, so coords are rotated).

```js
board.toFEN('white');              // 'W:W31,32,...,50:B1,2,...,20'
const turn = board.setFEN('W:W28:B23,13');
const move = board.findPDNMove('28x8', 'white'); // or '28x19x8'
board.toPDNMove(move);             // '28x19x8'
```

| Rule                          | Turkish                  | International             |
| ----------------------------- | ------------------------ | ------------------------- |
| Board                         | 8x8, 16 pieces each      | 10x10, 20 pieces each     |
| Men move                      | forward and sideways     | diagonally forward        |
| Men capture                   | forward and sideways     | diagonally, also backward |
| Kings                         | fly along rows/columns   | fly along diagonals       |
| Captured pieces are removed   | one by one, during a jump | after the whole move     |
| Taking the most pieces        | mandatory                | mandatory                 |
| Man reaching the far row mid-capture | keeps capturing as a man; crowned if the move ends there | same |

---

## Match 3

`Match3Board` handles swapping, matching, gravity, refills and cascades.

```js
import { Match3Board } from 'ymir-js';

const board = new Match3Board({ rows: 8, cols: 8 }).init(); // no ready-made matches, at least one move

board.getPossibleMoves();      // [{ from: '3|4', to: '3|5' }, ...] — use one as a hint
const result = board.swap('3|4', '3|5');
// {
//   valid: true,
//   points: 90,
//   steps: [{ matches, cleared, fallen, spawned, points }, ...], // one per cascade
//   shuffled: false,                                               // true if it ran out of moves
// }
```

- A swap that makes no match returns `valid: false` and changes nothing.
- Each cascade step scores `cleared × pointsPerGem × step` (1×, 2×, 3×, …).
- `steps` has everything needed to animate: which runs matched, which gems fell where, and what dropped in.
- Pass `random` for repeatable boards, `kinds` for your own gem set, and `setKinds(rows)` / `getKinds()` to set up or read a board.

---

## Go

`GoGame` plays a full game of Go: captures, suicide, ko, passing, resigning, dead stones and scoring. `GoBoard` underneath handles stones, groups and liberties.

```js
import { GoGame } from 'ymir-js';

const game = new GoGame({ size: 19, rules: 'area', komi: 7.5, ko: 'simple' });

game.play('3|3');              // black; throws if not allowed
game.checkPlay('3|3');         // { legal: false, reason: 'occupied' | 'suicide' | 'ko' | ... }
game.getLegalMoves();          // every point the side to move may play
game.koPoint;                  // the point simple ko forbids right now, or null
game.captures;                 // { black: 0, white: 0 }

game.pass();
game.pass();
game.getStatus();              // { state: 'scoring' } after two passes
game.toggleDead('3|3');        // mark a dead group
game.getScore();               // { black, white, territory, neutral, margin, winner }

game.undo();
game.resign();                 // { state: 'resigned', winner }
GoGame.fromJSON(game.toJSON());
```

| Option  | Values                                                                     | Default            |
| ------- | -------------------------------------------------------------------------- | ------------------ |
| `size`  | 2–25                                                                       | 19                 |
| `rules` | `'area'` (stones + territory) or `'territory'` (territory + prisoners)     | `'area'`           |
| `komi`  | points added to white                                                      | 7.5 area, 6.5 territory |
| `ko`    | `'simple'` (no immediate recapture) or `'positional'` (no earlier position) | `'simple'`         |
| `setup` | stones placed first, e.g. handicap; white then moves first                 | none               |

`game.board.toGTP('3|3')` and `fromGTP('D16')` convert to and from GTP vertices.

---

## Chess

`ChessGame` knows every rule of chess: castling, en passant, promotion, check, checkmate, stalemate and the draw rules. Its move generator matches the standard [perft](https://www.chessprogramming.org/Perft_Results) counts.

```js
import { ChessGame } from 'ymir-js';

const game = new ChessGame(); // or new ChessGame(fen)

game.move('e4');                        // SAN
game.move('e7e5');                      // UCI
game.move({ from: 'g1', to: 'f3' });    // squares; promotion: 'q' | 'r' | 'b' | 'n'

game.getLegalMoves('b8');               // [{ from: 'b8', to: 'c6', san: 'Nc6', uci: 'b8c6', ... }, ...]
game.getStatus();
// { state: 'playing', check: false }
// { state: 'checkmate', winner: 'white' }
// { state: 'draw', reason: 'stalemate' | 'repetition' | 'fifty-move' | 'insufficient-material' }

game.fen();                             // current position as FEN
game.pgn();                             // '1. e4 e5 2. Nf3'
game.undo();
game.getBestMove({ depth: 3 });         // a move from the small built-in engine
ChessGame.fromJSON(game.toJSON());

game.board.getPiece('e4');              // { type: 'p', color: 'white' }
```

- `drawRules` (`repetition`, `halfMoves`, `insufficientMaterial`) default to the usual engine behaviour: draw at threefold repetition and at fifty moves. FIDE lets a player *claim* those, and makes them automatic at fivefold and seventy-five moves; pass `{ repetition: 5, halfMoves: 150 }` for that.
- `getBestMove` searches with alpha-beta plus captures until quiet, and scores material and piece placement. Depth 3 answers in tens of milliseconds and plays a reasonable casual game.
- `game.board` is a regular ymir board (`ChessBoard`), row 0 being rank 8. `toSquare('6|4')` is `'e2'`, `fromSquare('e2')` is `'6|4'`.

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

- [`examples/checkers`](examples/checkers): Turkish and International checkers against the computer, with undo.
- [`examples/match3`](examples/match3): a 20-move match-3 puzzle with cascades, hints and auto-shuffle.
- [`examples/go`](examples/go): Go on 9×9, 13×13 or 19×19, against a simple computer player or a friend, with scoring.
- [`examples/chess`](examples/chess): chess against the built-in engine (three levels) or a friend, as white or black.

Each one runs on its own:

```sh
cd examples/checkers   # or examples/match3, examples/go, examples/chess
pnpm install --ignore-workspace
pnpm dev
```

---

## Releasing

Bump the version and push the tag; GitHub Actions publishes to npm (with provenance) and creates a GitHub release.

```sh
npm version minor
git push --follow-tags
```

---

## Roadmap

| Name                   | Status | Link                                                            |
| ---------------------- | ------ | --------------------------------------------------------------- |
| Turkish Checkers       | Done   | [Source](examples/checkers)               |
| International Checkers | Done   | [Source](examples/checkers)               |
| Chess                  | Done   | [Source](examples/chess)                  |
| Match 3 Puzzle         | Done   | [Source](examples/match3)                 |
| Go                     | Done   | [Source](examples/go)                     |

---

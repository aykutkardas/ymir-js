# ymir-js

[![npm](https://img.shields.io/npm/v/ymir-js)](https://www.npmjs.com/package/ymir-js)
[![Test](https://github.com/aykutkardas/ymir-js/actions/workflows/test.yml/badge.svg)](https://github.com/aykutkardas/ymir-js/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

A TypeScript toolkit for board games. Checkers, chess, Go and match-3 come with their full rules; underneath is a small board core you can use for your own games.

**[Play the examples →](https://aykutkardas.github.io/ymir-js/)** · **[Learn the core in puzzles →](https://aykutkardas.github.io/ymir-js/#puzzles)** · **[For agents →](https://aykutkardas.github.io/ymir-js/#agents)**

<table>
  <tr>
    <td align="center" width="25%"><a href="https://aykutkardas.github.io/ymir-js/examples/checkers/"><img src="https://raw.githubusercontent.com/aykutkardas/ymir-js/main/docs/media/checkers.gif" width="170" alt="Turkish checkers: a capture chain and a new king" /></a><br /><b>Checkers</b><br /><sub>in the library</sub></td>
    <td align="center" width="25%"><a href="https://aykutkardas.github.io/ymir-js/examples/chess/"><img src="https://raw.githubusercontent.com/aykutkardas/ymir-js/main/docs/media/chess.gif" width="170" alt="Chess: Morphy's Opera Game, ending in checkmate" /></a><br /><b>Chess</b><br /><sub>in the library</sub></td>
    <td align="center" width="25%"><a href="https://aykutkardas.github.io/ymir-js/examples/go/"><img src="https://raw.githubusercontent.com/aykutkardas/ymir-js/main/docs/media/go.gif" width="170" alt="Go on 9x9, ending with the score" /></a><br /><b>Go</b><br /><sub>in the library</sub></td>
    <td align="center" width="25%"><a href="https://aykutkardas.github.io/ymir-js/examples/match3/"><img src="https://raw.githubusercontent.com/aykutkardas/ymir-js/main/docs/media/match3.gif" width="170" alt="Match 3: swaps and cascades" /></a><br /><b>Match 3</b><br /><sub>in the library</sub></td>
  </tr>
  <tr>
    <td align="center" width="25%"><a href="https://aykutkardas.github.io/ymir-js/examples/hnefatafl/"><img src="https://raw.githubusercontent.com/aykutkardas/ymir-js/main/docs/media/hnefatafl.gif" width="170" alt="Hnefatafl: the attackers close in and the king escapes to a corner" /></a><br /><b>Hnefatafl</b><br /><sub><a href="#custom-games">custom game</a></sub></td>
    <td align="center" width="25%"><a href="https://aykutkardas.github.io/ymir-js/examples/reversi/"><img src="https://raw.githubusercontent.com/aykutkardas/ymir-js/main/docs/media/reversi.gif" width="170" alt="Reversi: a whole game, discs flipping, ending on a full board" /></a><br /><b>Reversi</b><br /><sub><a href="#custom-games">custom game</a></sub></td>
    <td align="center" width="25%"><a href="https://aykutkardas.github.io/ymir-js/examples/sokoban/"><img src="https://raw.githubusercontent.com/aykutkardas/ymir-js/main/docs/media/sokoban.gif" width="170" alt="Sokoban: the Storeroom level, solved" /></a><br /><b>Sokoban</b><br /><sub><a href="#custom-games">custom game</a></sub></td>
    <td align="center" width="25%"><a href="https://aykutkardas.github.io/ymir-js/examples/tactics/"><img src="https://raw.githubusercontent.com/aykutkardas/ymir-js/main/docs/media/tactics.gif" width="170" alt="Tactics: blue and red units move, attack and strike back; blue wins" /></a><br /><b>Tactics</b><br /><sub><a href="#custom-games">custom game</a></sub></td>
  </tr>
  <tr>
    <td align="center" width="25%"><a href="https://aykutkardas.github.io/ymir-js/examples/bomberman/"><img src="https://raw.githubusercontent.com/aykutkardas/ymir-js/main/docs/media/bomberman.gif" width="170" alt="Bomberman: bombs burning crates, power-ups, every enemy blown up" /></a><br /><b>Bomberman</b><br /><sub><a href="#custom-games">custom game</a></sub></td>
    <td align="center" width="25%"><a href="https://aykutkardas.github.io/ymir-js/examples/invaders/"><img src="https://raw.githubusercontent.com/aykutkardas/ymir-js/main/docs/media/invaders.gif" width="170" alt="Invaders: the first wave shot down, then the next one marching in" /></a><br /><b>Invaders</b><br /><sub><a href="#custom-games">custom game</a></sub></td>
  </tr>
</table>

- **Rules you can trust.** Each game follows its official rules and is tested against them: chess move generation matches the standard perft counts, checkers follows FMJD and Turkish draughts rules.
- **Plain classes, any UI.** No framework, no rendering. Read the state, call a method, draw it however you like.
- **Typed, zero dependencies.** Written in TypeScript and published as an ES module with types.

## Install

```sh
npm install ymir-js
```

`ymir-js` has everything. Each part is also its own package, if you only need one game or just the core:

| Package | What's in it |
| --- | --- |
| [`@ymir-js/core`](packages/core) | `Board`, `Item`, movement, directions, pathfinding: the base for your own games |
| [`@ymir-js/checkers`](packages/checkers) | Turkish and International checkers |
| [`@ymir-js/chess`](packages/chess) | Chess and its engine |
| [`@ymir-js/go`](packages/go) | Go |
| [`@ymir-js/match3`](packages/match3) | Match-3 |

The names are the same in every package (`import { ChessGame } from '@ymir-js/chess'` or `from 'ymir-js'`), and they are the same classes. Needs Node.js 20.19+ or 22.12+, or any modern bundler.

## Quick start

```js
import { ChessGame } from 'ymir-js';

const game = new ChessGame();

game.move('e4');
game.getLegalMoves().length; // 20
game.getBestMove({ depth: 3 }); // the built-in engine's reply

game.getStatus(); // { state: 'playing', check: false }
```

Every game works the same way: a **game** object owns the turn, the history and the result; you ask it for legal moves, play one, and read the board to draw it. Illegal moves throw, so ask first.

| Game | Main class | Highlights | Demo |
| --- | --- | --- | --- |
| [Checkers](#checkers) | `CheckersGame` | Turkish and International, capture chains, flying kings, undo, PDN | [Play](https://aykutkardas.github.io/ymir-js/examples/checkers/) |
| [Chess](#chess) | `ChessGame` | Every rule, FEN / SAN / UCI / PGN, built-in engine | [Play](https://aykutkardas.github.io/ymir-js/examples/chess/) |
| [Go](#go) | `GoGame` | Ko and superko, pass and resign, dead stones, area or territory scoring | [Play](https://aykutkardas.github.io/ymir-js/examples/go/) |
| [Match 3](#match-3) | `Match3Board` | Swaps, cascades reported step by step, hints, auto-shuffle | [Play](https://aykutkardas.github.io/ymir-js/examples/match3/) |

**Coordinates** are `"row|col"` strings, zero-based, row 0 at the top: `"0|0"` is the top-left square. Chess also takes squares like `"e4"`, and Go converts to GTP vertices like `"D4"`.

---

## Checkers

Turkish and International checkers, each with its own rules:

| Rule | Turkish | International |
| --- | --- | --- |
| Board | 8×8, 16 pieces each | 10×10, 20 pieces each |
| Men move | forward and sideways | diagonally forward |
| Men capture | forward and sideways | diagonally, also backward |
| Kings | fly along rows and columns | fly along diagonals |
| Captured pieces are removed | one by one, during the move | when the move ends |
| Capturing | mandatory, and the chain that takes the most pieces | same |
| A man reaching the far row mid-capture | keeps capturing as a man; crowned if the move ends there | same |

### Playing a game

`CheckersGame` keeps the turn, the moves played and the result.

```js
import { CheckersGame } from 'ymir-js';

const game = CheckersGame.create('international'); // or 'turkish'; white moves first

game.getLegalMoves(); // [{ from: '3|0', path: ['4|1'], captured: [] }, ...]
game.play({ from: '3|6', path: ['4|5'] }); // throws if the move is not legal
game.turn; // 'black'

game.undo();
game.redo();

game.getStatus();
// { state: 'playing' }
// { state: 'won', winner: 'white', reason: 'no-moves' }
// { state: 'draw', reason: 'repetition' | 'king-moves' | 'lone-king' | 'one-piece-each' }

const saved = game.toJSON(); // start position + moves, plain JSON
CheckersGame.fromJSON(saved);
```

A move is `{ from, path, captured }`: `path` lists every square the piece lands on, so a capture chain is one move.

To start from your own position, set up a board and pass it in:

```js
import { CheckersGame, TurkishBoard } from 'ymir-js';

const board = new TurkishBoard().setPosition({ '2|3': 'w', '5|3': 'B' }); // w/b men, W/B kings
const game = new CheckersGame(board, { turn: 'black' });
```

**Draw rules** follow each variant's rules by default, and can be changed with `new CheckersGame(board, { drawRules })`:

| Rule | International (FMJD) | Turkish |
| --- | --- | --- |
| `repetition`: the same position, same side to move, this many times | 3 | 3 |
| `kingMoves`: moves in a row with only kings moving and no capture | 50 (25 each) | off |
| `loneKing`: a lone king against 3 pieces incl. a king draws after 16 moves each; against 2 or fewer incl. a king, after 5 each | on | off |
| `onePieceEach`: a draw as soon as each side has one piece left ("gayyım") | off | on |

### Boards and the computer player

`TurkishBoard` and `InternationalBoard` hold the rules, and can be used without a game:

```js
import { TurkishBoard } from 'ymir-js';

const board = new TurkishBoard().init();

const [move] = board.getLegalMoves('black'); // mandatory and maximum capture applied
board.playMove(move); // moves, removes captured pieces, promotes at the end

board.getLegalMoves('white', '2|3'); // one piece only, e.g. to continue a chain
board.getCaptureSequences('2|3'); // every capture chain of one piece

// A simple computer player. onMove is called once per jump.
board.autoPlay('white', { onSelect, onMove });
```

### International notation

International boards read and write standard PDN, numbering the dark squares 1–50 with White at the bottom (ymir draws White at the top, so coords are rotated for you).

```js
import { InternationalBoard } from 'ymir-js';

const board = new InternationalBoard().init();

board.toFEN('white'); // 'W:W31,32,...,50:B1,2,...,20'
const turn = board.setFEN('W:W28:B23,13');
const move = board.findPDNMove('28x8', turn); // or '28x19x8'
board.toPDNMove(move); // '28x19x8'
```

---

## Chess

`ChessGame` knows every rule: castling, en passant, promotion, check, checkmate, stalemate and the draw rules. Its move generator matches the standard [perft](https://www.chessprogramming.org/Perft_Results) counts.

```js
import { ChessGame } from 'ymir-js';

const game = new ChessGame(); // or new ChessGame(fen)

game.move('e4'); // SAN
game.move('e7e5'); // UCI
game.move({ from: 'g1', to: 'f3' }); // squares; add promotion: 'q' | 'r' | 'b' | 'n'

game.getLegalMoves('b8'); // [{ from: 'b8', to: 'c6', san: 'Nc6', uci: 'b8c6', ... }, ...]

game.getStatus();
// { state: 'playing', check: false }
// { state: 'checkmate', winner: 'white' }
// { state: 'draw', reason: 'stalemate' | 'repetition' | 'fifty-move' | 'insufficient-material' }

game.fen(); // the position as FEN
game.pgn(); // '1. e4 e5 2. Nf3'
game.undo();
ChessGame.fromJSON(game.toJSON());

game.board.getPiece('e4'); // { type: 'p', color: 'white' }
```

- **Built-in engine.** `game.getBestMove({ depth })` searches with alpha-beta (and keeps looking at captures until the position is quiet), scoring material and piece placement. Depth 3 answers in tens of milliseconds and plays a reasonable casual game; each extra level is several times slower.
- **Draw rules.** By default a game is drawn at threefold repetition and after fifty moves without a pawn move or capture, as most engines do. Under FIDE rules a player may *claim* those, and they become automatic at fivefold repetition and seventy-five moves; use `new ChessGame(fen, { drawRules: { repetition: 5, halfMoves: 150 } })` for that.
- **Squares.** `game.board` is a regular ymir board, row 0 being rank 8. `toSquare('6|4')` gives `'e2'`, `fromSquare('e2')` gives `'6|4'`.

---

## Go

`GoGame` plays a full game: captures, suicide, ko, passing, resigning, dead stones and scoring.

```js
import { GoGame } from 'ymir-js';

const game = new GoGame({ size: 19 }); // black moves first

game.play('3|3'); // throws if not allowed
game.checkPlay('3|3'); // { legal: false, reason: 'occupied' | 'suicide' | 'ko' | ... }
game.getLegalMoves(); // every point the side to move may play
game.koPoint; // the point simple ko forbids right now, or null
game.captures; // { black: 0, white: 0 }

game.pass();
game.pass();
game.getStatus(); // { state: 'scoring' } after two passes
game.toggleDead('3|3'); // mark a group dead (or alive again)
game.getScore(); // { black, white, territory, neutral, margin, winner }

game.undo();
game.resign(); // getStatus() → { state: 'resigned', winner }
GoGame.fromJSON(game.toJSON());
```

| Option | Values | Default |
| --- | --- | --- |
| `size` | 2–25 | 19 |
| `rules` | `'area'` (stones + territory) or `'territory'` (territory + prisoners) | `'area'` |
| `komi` | points added to white | 7.5 for area, 6.5 for territory |
| `ko` | `'simple'` (no immediate recapture) or `'positional'` (no earlier position may repeat) | `'simple'` |
| `setup` | stones placed before the first move, e.g. handicap; white then moves first | none |

`game.board` is a `GoBoard` with groups and liberties (`getGroup`, `getGroups`), and `toGTP('3|3')` / `fromGTP('D16')` for GTP vertices.

---

## Match 3

`Match3Board` handles swapping, matching, falling gems, refills and chain reactions.

```js
import { Match3Board } from 'ymir-js';

const board = new Match3Board({ rows: 8, cols: 8 }).init(); // no ready-made matches, at least one move

const [hint] = board.getPossibleMoves(); // { from: '3|4', to: '3|5' }
const result = board.swap(hint.from, hint.to);
// {
//   valid: true,
//   points: 90,
//   steps: [{ matches, cleared, fallen, spawned, points }, ...], // one per cascade
//   shuffled: false, // true if no move was left and the board was reshuffled
// }
```

- A swap that makes no match returns `valid: false` and changes nothing.
- Each cascade step scores `cleared × pointsPerGem × step`, so chain reactions are worth 1×, 2×, 3×, …
- `steps` has everything needed to animate: which runs matched, which gems fell where and what dropped in.
- Pass `random` for repeatable boards and `kinds` for your own gem set; `setKinds(rows)` and `getKinds()` set up or read a board.

---

## Custom games

The games above ship with the library. These don't: each one is an example app that writes its own rules on top of the core `Board` and `Item`, to show how far the core takes you. Read their `rules.ts` as a tutorial.

| Game | What it shows | Code |
| --- | --- | --- |
| [Bomberman](https://aykutkardas.github.io/ymir-js/examples/bomberman/) | A real-time game: bombs, crates and power-ups as items, blasts along `getColumnsByDirection`, enemies chasing with `findPath`, time advanced by `tick(ms)` | [Source](examples/bomberman) |
| [Hnefatafl](https://aykutkardas.github.io/ymir-js/examples/hnefatafl/) (Viking chess) | Rook-like movement with `getColumnsByDirection`, sandwich captures, special squares, an asymmetric goal, a computer player | [Source](examples/hnefatafl) |
| [Invaders](https://aykutkardas.github.io/ymir-js/examples/invaders/) | A real-time shooter: a formation that marches with `moveItem`, shooters picked by looking down each column with `getColumnsByDirection`, shields that wear away | [Source](examples/invaders) |
| [Reversi](https://aykutkardas.github.io/ymir-js/examples/reversi/) | Flipping along all eight lines with one `getColumnsByDirection` call, passing, a computer player | [Source](examples/reversi) |
| [Sokoban](https://aykutkardas.github.io/ymir-js/examples/sokoban/) | Pushing boxes with `getColumnsByDirection`, levels in the classic text format, undo, a solver | [Source](examples/sokoban) |
| [Tactics](https://aykutkardas.github.io/ymir-js/examples/tactics/) | Units with typed stats in `item.data`, movement ranges with `getReachable`, paths with `findPath`, a computer player | [Source](examples/tactics) |

### Hnefatafl

Hnefatafl is the Vikings' board game, played in Scandinavia before chess arrived, and a fitting one for a library named after a Norse giant. The attackers lay siege; the king must reach a corner. The example follows the [Copenhagen rules](https://aagenielsen.dk/Copenhagen_Hnefatafl_11x11.pdf), including shieldwalls, exit forts and encirclement, in about 400 lines.

The core does the board work. A piece is an `Item` with a movement pattern:

```ts
class Piece extends Item {
  constructor(role: Role) {
    super({ name: role, movement: { linear: true, stepCount: 10 } }); // like a rook
    this.role = role;
  }
}
```

and the board asks the core for the squares along each line, then applies the game's own rules:

```ts
movesFrom(coord: string): string[] {
  const piece = this.getItem(coord);
  const lines = this.getColumnsByDirection(coord, piece.movement);

  return ['top', 'bottom', 'left', 'right'].flatMap((direction) => {
    const reachable = [];
    for (const square of lines[direction]) {
      if (!this.isEmpty(square)) break; // blocked by a piece
      if (piece.role === 'king' || !this.isRestricted(square)) reachable.push(square);
    }
    return reachable;
  });
}
```

Captures, the king's capture, forts and encirclement are a few more methods on the same board, and `TaflGame` adds turns, undo and the result. A small alpha-beta player (`ai.ts`) plays either side. The rules have their own tests (`rules.test.ts`, `ai.test.ts`), which CI runs.

### Sokoban

Push every box onto a goal. Three small levels made for the demo, each checked by a solver that also powers the app's *Show solution* button and its "best" score.

Walls, boxes and the player are all items on the board, so a push is two `moveItem` calls. The core finds the next square and the one after it:

```ts
step(direction: Move) {
  const player = this.findPlayer();
  const [next, beyond] = this.getColumnsByDirection(player, {
    [direction]: true,
    stepCount: 2,
  })[direction];

  const blocker = this.getItem(next);
  if (!this.isExistCoord(next) || blocker?.kind === 'wall') return null;

  if (blocker?.kind === 'box') {
    if (!this.isEmpty(beyond)) return null; // a wall or another box
    this.moveItem(next, beyond);
    this.moveItem(player, next);
    return 'push';
  }

  this.moveItem(player, next);
  return 'walk';
}
```

Levels use the usual Sokoban text format (`#` wall, `@` player, `$` box, `.` goal), so you can add your own in `levels.ts`.

### Tactics

A small turn-based battle: knights, archers and scouts on a field with forests and rocks. Each unit moves, then attacks or waits; a unit that survives strikes back if it can reach. The red side is played by a simple AI.

Units keep their stats in the item's typed `data`:

```ts
class Unit extends Item<UnitData> {
  constructor(type: UnitType, side: Side) {
    super({ name: type, data: { type, side, hp: STATS[type].maxHp, ...STATS[type] } });
  }
}
```

and where a unit can go comes from the core's `getReachable`, with the game deciding what can be walked through:

```ts
const reach = this.getReachable(coord, {
  steps: unit.data.move,
  canEnter: (square) => {
    if (this.terrain[square] === 'rock') return false;
    const there = this.getItem(square);
    return !there || there.data.side === unit.data.side; // through allies, not enemies
  },
});
```

`findPath` gives the route a unit walks, for the animation. Both were added to the core for this game.

### Reversi

Trap a line of the other colour between your new disc and one of yours, and every trapped disc flips. If you cannot move you pass; when neither side can, the most discs wins. Play against the computer (three levels) or a friend.

The whole flipping rule is the eight lines out of a square, which one core call gives:

```ts
flipsFor(coord: string, color: Color): string[] {
  if (!this.isEmpty(coord)) return [];

  const lines = this.getColumnsByDirection(coord, { linear: true, angular: true, stepCount: 7 });
  const flips = [];

  for (const direction of DIRECTIONS) {
    const run = [];
    for (const square of lines[direction]) {
      const disc = this.getItem(square);
      if (!disc) break; // empty or off the board: the run is not closed
      if (disc.color === color) {
        flips.push(...run);
        break;
      }
      run.push(square);
    }
  }

  return flips;
}
```

A legal move is any square where that list isn't empty. The computer player (`ai.ts`) searches a few moves ahead with the usual Reversi evaluation: corners are gold, the squares next to an empty corner are traps, and having more moves than the opponent helps.

### Bomberman

Drop bombs, burn crates, pick up power-ups (more bombs, a longer blast, more speed) and blow up every enemy. Arrow keys or WASD and Space; buttons on a phone.

The only real-time game here, and the board doesn't mind: walls, crates, bombs and power-ups are items, and the player and enemies are plain objects walking between squares. The game advances with `tick(ms)`, which the app calls in fixed 20 ms steps from `requestAnimationFrame` and the tests call directly. A blast is the bomb's four lines, cut at the first thing in the way:

```ts
blastFrom(coord: string, range: number): string[] {
  const squares = [coord];
  const lines = this.board.getColumnsByDirection(coord, { linear: true, stepCount: range });

  for (const move of ['top', 'bottom', 'left', 'right']) {
    for (const square of lines[move]) {
      const kind = this.board.getItem(square)?.kind;
      if (kind === 'wall') break;
      squares.push(square);
      if (kind === 'crate' || kind === 'bomb') break; // it burns, and stops the fire
    }
  }

  return squares;
}
```

A bomb caught in a blast goes off too, so chain reactions come free. Enemies wander, and when you are close they chase you with `findPath(enemy, you, { steps: 6, canEnter })`. Everything random comes from a seeded generator: add `?seed=42` to the URL to play the same map again. The GIF is a planned play-through, replayed on the browser's fake clock tick for tick.

### Invaders

Five rows of invaders march across, step down at each edge and speed up as you thin them out. Shoot them before they land; shields soak up hits from both sides, and a mystery ship crosses the top now and then. ← → and Space; buttons on a phone.

The invaders and the shields are items, so the formation's march is the arcade's own: every invader moves one square with `moveItem`, the leading ones first so nobody lands on a neighbour, and the whole group steps down and turns when one reaches an edge. Only an invader with nobody below it may drop a bomb, which is one look down its column:

```ts
shooters(): string[] {
  return this.invaders().filter((coord) => {
    const { bottom } = this.board.getColumnsByDirection(coord, { bottom: true, stepCount: ROWS });
    return !bottom.some((square) => this.board.getItem(square)?.type === 'invader');
  });
}
```

Shots, bombs, the cannon and the ship are plain values; like Bomberman, the game advances with `tick(ms)` and is seeded, and the GIF is a planned game replayed tick for tick.

## Building your own game

Every game here is built on the same `Board` and `Item`. Use them for a game of your own:

```js
import { Board, Item } from 'ymir-js';

const board = new Board({ rows: 3, cols: 3 });

board.setItem('0|0', new Item({ name: 'knight', data: { hp: 3 } }));
board.getItem('0|0'); // Item { name: 'knight', data: { hp: 3 }, ... }
board.moveItem('0|0', '1|1');
board.switchItem('1|1', '2|2');
board.removeItem('2|2');

board.isEmpty('1|1'); // true
board.isExistCoord('5|5'); // false
board.getDirection('0|0', '2|2'); // 'bottomRight'
board.getDistanceBetweenTwoCoords('0|0', '2|1'); // { x: 1, y: 2 }
board.getColumnsByDirection('1|1', { linear: true }); // { top: ['0|1'], bottom: ['2|1'], ... }
board.getNeighbors('1|1'); // ['0|1', '2|1', '1|0', '1|2']; { diagonal: true } for eight
board.getReachable('0|0', { steps: 2 }); // Map { '0|0' => 0, '1|0' => 1, ... } — empty squares within 2 steps
board.findPath('0|0', '2|2'); // ['1|0', '2|0', '2|1', '2|2'] — the shortest route
board.getBoardMatrix(); // rows of { coord, item }
board.squares(); // [{ coord: '0|0', row: 0, col: 0, item }, ...] — handy for rendering
board.isEdge('0|1'); // true — on the outer ring
board.ray('0|0', 'right'); // ['0|1', '0|2'] — a line up to the edge; ray('0|0', 'right', 1) for one step

// Positions as text, e.g. for levels and tests.
board.loadRows(['...', '.k.', 'p.p'], (char) =>
  char === 'k' ? new Item({ name: 'king' }) : char === 'p' ? new Item({ name: 'pawn' }) : null
);
board.toRows((item) => item?.name[0] ?? '.'); // ['...', '.k.', 'p.p']

// Find items without walking the board yourself.
board.findCoord((item) => item.name === 'king'); // '1|1', or null
board.findCoords((item) => item.name === 'pawn'); // ['2|0', '2|2']; every item without a predicate
board.countItems((item) => item.name === 'pawn'); // 2

// Copies, for undo and for trying moves out.
const saved = board.snapshot(); // copies of the items, by coord
board.removeItem('1|1');
board.restore(saved); // the king is back; a snapshot can be restored again and again
const next = board.clone(); // a whole new board of the same class, sharing nothing
```

Coords are plain strings, and a few helpers work on them:

```js
import { DIRECTIONS, LINEAR_DIRECTIONS, manhattan, parseCoord, stepCoord, toCoord } from 'ymir-js';

toCoord(2, 3); // '2|3'
parseCoord('2|3'); // [2, 3]
stepCoord('2|3', 'top'); // '1|3'; stepCoord('2|3', 'right', 2) → '2|5'
manhattan('0|0', '2|3'); // 5
LINEAR_DIRECTIONS; // ['top', 'bottom', 'left', 'right']; ANGULAR_DIRECTIONS for the diagonals, DIRECTIONS for all eight
```

- Off-board coords are safe: `getItem` returns `null`, `isEmpty` returns `false`, and `getDirection` / `getDistanceBetweenTwoCoords` return `null`.
- Methods are bound to the board, so they can be passed as callbacks: `coords.forEach(board.removeItem)`.
- `getReachable` and `findPath` step onto empty squares by default; pass `canEnter(square, from)` to decide yourself (walk through allies, avoid water…), and `diagonal: true` for eight directions. `getReachable` also takes several starts and counts from the nearest: `getReachable(enemies)` is a distance map to the closest enemy, and a flood fill from a group of pieces.
- Subclass `Board` and override any method; `super` works. `CheckersBoard` is a full example.
- `clone`, `snapshot` and `restore` copy items with `cloneItem`: the item keeps its class, and its plain objects and arrays (`data`, `movement`) are copied deeply; anything else (a `Date`, a class instance in `data`) is shared. `clone` doesn't run the constructor and copies a subclass's other fields shallowly; override it and call `super.clone()` if one must not be shared.

---

## For LLMs and coding agents

[llms.txt](https://aykutkardas.github.io/ymir-js/llms.txt) sums up the library, its conventions and where each API lives. [llms-full.txt](https://aykutkardas.github.io/ymir-js/llms-full.txt) has this README and every public type declaration in one plain-text file, rebuilt on every release.

## Examples

Each game, including the [custom games](#custom-games), has an example app in [`examples/`](examples), also [playable online](https://aykutkardas.github.io/ymir-js/). They import the library from the package sources in `packages/`, so they always run against the code in the repo:

```sh
cd examples/chess   # or checkers, go, match3, hnefatafl, sokoban, tactics, reversi, bomberman, invaders
pnpm install --ignore-workspace
pnpm dev
```

## Upgrading

Grouped imports from earlier versions (`Core.Board`, `Checkers.Turkish.Board`, `Utils.parseCoord`, …) still work. These were deprecated in 0.11 and will be removed in 1.0:

| Deprecated | Use instead |
| --- | --- |
| `new Board({ x, y })` (`x` = rows) | `new Board({ rows, cols })` |
| `board.config.x`, `board.config.y` | `board.config.rows`, `board.config.cols` |
| `getAvailableColumns(coord, movement, true)` | `getColumnsByDirection(coord, movement)` |
| `selectItem`, `deselectItem`, `deselectAllItems`, `item.selected`, `item.lock` | keep selection in your app's state |
| `AttactCoord` type | `AttackCoord` |

## Contributing

This is a pnpm workspace: the packages are in [`packages/`](packages), the example apps in [`examples/`](examples).

```sh
pnpm install
pnpm test        # vitest, against the sources
pnpm typecheck
pnpm build       # every package, core first
```

The GIFs above are recorded from the example apps with `pnpm build && node scripts/build-site.mjs`, then `pnpm record` in [`scripts/media`](scripts/media) (uses an installed Edge or Chrome).

Releases are published from CI. All packages share one version: bump it and push the tag, and GitHub Actions publishes every package that changed version to npm (with provenance) and creates a GitHub release.

```sh
node scripts/version.mjs minor
git push --follow-tags
```

## License

[MIT](LICENSE) © Aykut Kardaş

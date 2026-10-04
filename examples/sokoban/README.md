# Sokoban

Push every box onto a goal. Three small levels made for this demo.

This game is **not** part of ymir-js. It is written on the library's core `Board` and `Item`, as an example of building your own game:

- `src/rules.ts`: walls, boxes and the player as items, the push rule, undo and restart, and a breadth-first `solve` (the shortest solution)
- `src/levels.ts`: the levels, in the usual Sokoban text format (`#` wall, `@` player, `$` box, `.` goal, `*` box on a goal, `+` player on a goal)
- `src/rules.test.ts`: the rules, and that every level is solvable in its stated number of moves

```sh
pnpm install --ignore-workspace
pnpm test
pnpm dev
```

Arrow keys or WASD to move, Z to undo, R to restart; swipe on touch screens.

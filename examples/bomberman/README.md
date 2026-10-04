# Bomberman

Drop bombs, burn crates, collect power-ups and blow up every enemy, in real time. Arrow keys or WASD to move, Space for a bomb; on a phone, the buttons under the board.

This game is **not** part of ymir-js. It is written on the library's core `Board` and `Item`, as an example of building your own game, and the first one that runs in real time:

- `src/rules.ts`: walls, crates, bombs and power-ups as items; blasts along the lines `getColumnsByDirection` gives; enemies that chase you with `findPath`; everything advanced by `tick(ms)` and seeded, so a game can be replayed
- `src/App.tsx`: a fixed-step loop on `requestAnimationFrame`, keyboard and touch input, actors drawn between squares
- `src/rules.test.ts`: the rules, tested by ticking time forward

```sh
pnpm install --ignore-workspace
pnpm test
pnpm dev
```

Add `?seed=42` to the URL to play the same map again.

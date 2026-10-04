# Invaders

An Invaders-style shooter: the formation marches across and steps down at each edge, faster as you thin it out. Shoot them before they land, hide behind the shields, and catch the mystery ship for a bonus. ← → or A D to move, Space to fire; on a phone, the buttons under the board.

This game is **not** part of ymir-js. It is written on the library's core `Board` and `Item`, as an example of building your own game:

- `src/rules.ts`: invaders and shields as items; the formation moves square by square with `moveItem`; only the lowest invader in a column may shoot, found with `getColumnsByDirection`; everything advanced by `tick(ms)` and seeded
- `src/App.tsx`: a fixed-step loop on `requestAnimationFrame`, keyboard and touch input, pixel sprites as SVG paths
- `src/rules.test.ts`: the rules, tested by ticking time forward

```sh
pnpm install --ignore-workspace
pnpm test
pnpm dev
```

Add `?seed=42` to the URL to replay the same game.

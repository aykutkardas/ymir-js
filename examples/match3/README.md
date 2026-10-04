# Match 3

A 20-move match-3 puzzle built with ymir-js.

All game rules come from `Match3Board`: `swap` checks the move, clears matches, drops gems, refills and repeats until the board settles, and reports each step so the app can animate it. `getPossibleMoves` powers the hint, and the board shuffles itself when no move is left.

```sh
pnpm install --ignore-workspace
pnpm dev
```

The app imports ymir-js from `../../src` (see `vite.config.ts`), so it always runs against the code in this repo.

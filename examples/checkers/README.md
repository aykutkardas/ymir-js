# Checkers

Turkish and International checkers against the computer, built with ymir-js.

The game itself is a thin UI over the library:

- `board.getLegalMoves(color)` decides which pieces may move and where, including mandatory and maximum captures.
- `board.playMove(move)` plays a whole move, removes captured pieces and promotes kings.
- `board.autoPlay(color, …)` picks the computer's move.

The app imports ymir-js from the package sources in `../../packages` (see `vite.config.ts`), so it always runs against the code in this repo.

```sh
pnpm install --ignore-workspace
pnpm dev
```

`pnpm build` type-checks the app and writes a static site to `dist/`.

These games used to live in their own repos: [turkish-checkers](https://github.com/aykutkardas/turkish-checkers) and [international-checkers](https://github.com/aykutkardas/international-checkers).

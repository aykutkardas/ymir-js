# Chess

Chess against the small engine built into ymir-js (easy, medium, hard) or with a friend on one device, as white or black.

Every rule comes from `ChessGame`: legal moves, castling, en passant, promotion (with a piece picker), check, checkmate and the draw rules. The computer's moves come from `game.getBestMove({ depth })`.

```sh
pnpm install --ignore-workspace
pnpm dev
```

The app imports ymir-js from `../../src` (see `vite.config.ts`), so it always runs against the code in this repo.

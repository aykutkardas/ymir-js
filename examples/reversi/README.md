# Reversi

Trap a line of the other colour between your new disc and one of yours, and every trapped disc flips. Play against the computer (Easy, Medium, Hard) or a friend.

This game is **not** part of ymir-js. It is written on the library's core `Board` and `Item`, as an example of building your own game:

- `src/rules.ts`: discs as items, the flips for a square from the eight lines `getColumnsByDirection` gives, passing, game end and undo
- `src/ai.ts`: alpha-beta search with the usual Reversi evaluation (corners, risky squares next to them, mobility), no randomness
- `src/rules.test.ts`: the rules and the AI, tested

```sh
pnpm install --ignore-workspace
pnpm test
pnpm dev
```

# Hnefatafl

Viking chess on an 11×11 board, following the [Copenhagen rules](https://aagenielsen.dk/Copenhagen_Hnefatafl_11x11.pdf). Play the king or the attackers against the computer, or two players on one device.

This game is **not** part of ymir-js. It is written on the library's core `Board` and `Item`, as an example of building your own game:

- `src/rules.ts`: the pieces, moves, captures (including shieldwalls), the king's capture, exit forts, encirclement, repetition, and `TaflGame` with turns and undo
- `src/ai.ts`: a small alpha-beta player for either side
- `src/rules.test.ts`, `src/ai.test.ts`: the rules, tested

```sh
pnpm install --ignore-workspace
pnpm test
pnpm dev
```

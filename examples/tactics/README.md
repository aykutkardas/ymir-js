# Tactics

A small turn-based battle: your blue knight, archer and scout against red's. Each unit moves, then attacks or waits; a unit that survives strikes back if the attacker is in its range. Forests give +1 defense, rocks block the way.

This game is **not** part of ymir-js. It is written on the library's core `Board` and `Item`, as an example of building your own game:

- `src/rules.ts`: units as `Item<UnitData>` with typed stats, movement ranges with the core's `getReachable` (through allies, around rocks), walking routes with `findPath`, combat and counter-attacks
- `src/ai.ts`: the red side's computer player
- `src/rules.test.ts`: the rules and the AI, tested, including a whole AI-against-AI battle

```sh
pnpm install --ignore-workspace
pnpm test
pnpm dev
```

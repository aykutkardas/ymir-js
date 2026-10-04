# Go

Go on 9×9, 13×13 or 19×19, built with ymir-js. Play against a simple computer player (it plays white) or with a friend on one device.

The rules all come from `GoGame`: legal moves, captures, ko, passing, resigning, marking dead stones and area scoring with komi 7.5. The computer player in `src/ai.ts` is deliberately simple: it captures, saves stones in atari, avoids self-atari and never fills its own eyes.

```sh
pnpm install --ignore-workspace
pnpm dev
```

The app imports ymir-js from the package sources in `../../packages` (see `vite.config.ts`), so it always runs against the code in this repo.

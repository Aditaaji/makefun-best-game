# makefun-best-game

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/Aditaaji/makefun-best-game/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/Aditaaji/makefun-best-game/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

VOIDBLOOM — an original arena shooter. Pilot the seed-ship Bloom through a dying void-garden, harvest petals, chain combos, and clear all 10 waves to reignite the garden. Five enemy kinds, boss Thornhearts on waves 3, 6 and 10, power-ups, procedural sound, and a full loop: title, play, pause, game over, victory.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — move with WASD or arrow keys, aim with the mouse, hold click or Space to fire. P pauses, M mutes, R restarts.

## How it is built

Plain static files under `game/` (no build step, no network request): `index.html` plus one ES module per job under `game/src/` — config, seeded random, procedural WebAudio, input, entities, wave director, rendering, screens and HUD, screenshot scenes. `main.ts` at the root hands the game in by copying `game/` and `screenshots/` to `/output` with a `dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=m1dr84q9&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>

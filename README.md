# Moonlit Spell Barrage

A browser-based 2D bullet-hell shooting prototype built with TypeScript, Vite, and PixiJS.

## Run

```powershell
npm.cmd install
npm.cmd run dev
```

Open the local Vite URL shown in the terminal, usually `http://127.0.0.1:5173/`.

## Controls

- Select difficulty on title: Left/Right or 1/2/3
- Move: Arrow keys or WASD
- Focus / slow movement: Shift
- Shoot: Z or Space
- Bomb: X
- Mute sound: M
- Pause menu: Esc to pause/resume, R to retry, Z/Space to title
- Retry from result: R

## Current Scope

- Short stage approach with mixed enemy waves, including fan, cross, snipe, wheel, dive, and arc patterns
- HP boss battle with three spell phases: petal ring, starfall spiral, and butterfly storm
- Casual, Normal, and Lunatic difficulty presets that scale enemy HP, boss HP, bullet speed, firing delay, and score
- Player shots, focused movement, hitbox display, lives, bombs, score, pause, clear, and game over states
- Graze scoring for near-misses against enemy bullets
- Collectible score and bomb items dropped by defeated enemies, with score items building Lv1-Lv4 shot power and an upper-screen auto-collect line
- Per-difficulty local high scores saved in browser storage with clear/game over result summaries
- Stage progress bar, boss phase markers, warning banner, screen-shake feedback, and lightweight WebAudio sound effects with mute toggle
- Code-drawn fantasy placeholder visuals centralized in `src/systems/VisualFactory.ts` for later sprite replacement

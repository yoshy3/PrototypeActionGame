# Moonlit Spell Barrage

A browser-based 2D bullet-hell shooting game built with TypeScript, Vite, and PixiJS. Remaster 1.0.0 introduces a responsive 16:9 presentation and English/Japanese language support.
Its stage flow, dense spell patterns, grazing, and boss-focused structure are inspired by Touhou Project.

![Moonlit Spell Barrage title art](src/assets/images/title.png)

## Play Online

Try the latest version at https://yoshy3.github.io/PrototypeActionGame/!
Tagged releases also include `PrototypeActionGame-pages.zip`, with `index.html` at the archive root and the same static files deployed to GitHub Pages.

## Run Locally

```powershell
npm.cmd install
npm.cmd run dev
```

Open the local Vite URL shown in the terminal, usually `http://127.0.0.1:5173/`.

## Build

```powershell
npm.cmd run build
npm.cmd run preview
```

## Controls

- Start / confirm: Z, Space, Enter, mouse or touch on the boot screen, or gamepad confirm
- Select difficulty after Start: Up/Down, Left/Right, WASD, D-pad, or 1/2/3/4; confirm with Z/Space/Enter or gamepad A; cancel with Esc or gamepad B. The selection is remembered
- Move: Arrow keys, WASD, D-pad, or left stick
- Focus / slow movement: Shift or gamepad RB
- Shoot: Z, Space, or gamepad A
- Bomb: X or gamepad X
- Virtual gamepad: use the PAD toggle to show or hide touch controls; swipe from anywhere on the left side to move, and use Shoot to confirm menus and result screens
- Mute sound: M
- Language: L, gamepad Y, or the language button on the title screen only (English / 日本語)
- Pause: Esc or gamepad Start
- Pause menu: Esc/Start to resume, R to retry, hold Z/Space to return to title
- Result screens: R to retry, Z/Space/Enter to continue or return to title

Development builds also expose quick-start debug keys on the title screen for boss, later-stage, and ending checks.

## Remaster 1.0.0

- The full 1920×1080 presentation scales uniformly to fit the browser viewport. The original 720×960 playfield stays centered, preserving movement and collision coordinates; other aspect ratios have margins.
- Left HUD: lives, bombs, shot level, power progress, controls, sound, and language. Right HUD: score, best score, graze, difficulty, score needed for the next life, and stage/boss progress.
- All interface text, stage names, spell names, and credit roles support English and Japanese. The initial language follows the browser, and the selected language is saved locally. Original artwork and proper product names remain unchanged.
- Breakable enemy bullets now have **8 HP** for both enemies and bosses on every difficulty. Three Lv1 main-shot hits destroy one; shots do not penetrate them.
- The third boss's breakable volleys have a minimum interval of 1.4 seconds multiplied by the difficulty firing interval, providing windows for shots to reach the boss.
- Casual and Normal retain their multipliers. Lunatic now uses enemy/boss HP ×1.10, bullet speed ×1.08, firing interval ×1.30, and score ×1.20. Normal's firing interval remains ×1.50, making Lunatic fire approximately 15% more frequently.
- Remaster scores use a separate per-difficulty local record. Previous version scores are preserved but are not imported into the new record.

## Tests

```powershell
npx.cmd playwright install chromium
npm.cmd test
```

Browser tests cover viewport fitting, both languages, screen transitions, storage availability, score isolation, breakable-bullet collisions, and all four bosses. The balance simulation uses invincibility and boss tracking to measure whether sustained Lv1 fire reaches enemies; it does not measure human clear rates. Screenshots and simulation results are written to `test-results/`.

## Current Scope

- Four-stage vertical bullet-hell run: Moonlit shrine approach, Starlight crystal corridor, Asteroid spell belt, and Fire storm
- Four boss encounters: Lunar Witch, Starlight Oracle, Cosmic Sorcerer, and Salamander
- Pre-boss warning cut-ins with boss standing artwork, subtitles, stage-specific voice clips, music ducking, skip input, and battlefield cleanup before combat resumes
- Five-phase boss spell patterns with petals, stars, split bullets, breakable shells, warning lasers, asteroid pressure, magma gates, cinder rain, flame wheels, and firestorm barrages
- Enemy waves with moth, crystal, astral familiar, dragon, and fire familiar sprites using fan, cross, snipe, wheel, laser, split-fan, breakable-wall, flame, and homing-flame patterns
- Beginner, Casual, Normal, and Lunatic difficulty presets that scale enemy HP, boss HP, bullet speed, firing delay, and score rewards
- Player movement, focused hitbox display, multi-level shots, lives, bombs, invincibility after damage, extends, score, pause, clear, game over, ending, and credit roll states
- Graze scoring for near-misses against enemy bullets and lasers
- Collectible score and bomb items, Lv1-Lv4 shot power, and an upper-screen auto-collect line
- Per-difficulty local high scores saved in browser storage, with clear and game-over result summaries
- Stage progress bar, boss HP and phase markers, warning banners, screen shake, bomb flash, floating score text, and clear-result effects
- Animated sprite sheets for player, enemies, bosses, asteroids, fire familiars, and fire projectiles, plus title, boss cut-in, and ending artwork
- MP3 background music for title, each stage, regular boss battles, final boss, clear, game over, and ending, with WAV sound effects, voiced boss cues, a mute toggle, and pause-aware audio levels

## Tech Notes

- Runtime: PixiJS 8 canvas renderer through Vite
- Source entry point: `src/main.ts`
- Core game orchestration: `src/systems/GameScene.ts`
- Stage scripting: `src/systems/StageScript.ts`
- Boss phase behavior and spell patterns: `src/systems/Boss.ts`
- Character and bullet visuals: `src/systems/VisualFactory.ts`
- Keyboard, pointer, touch, and gamepad input: `src/systems/Input.ts`
- Audio playback, asset-backed SFX, voice clips, music ducking, and fallback synthesized SFX: `src/systems/AudioSystem.ts`
- Generated images and audio live under `src/assets/**`; see `NOTICE` before reusing them outside this project

## License And Credits

See `LICENSE` and `NOTICE` for license details and asset/tool attribution.

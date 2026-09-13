# Feedback Round 1 — Implementation Report

## Item 1 — Bump render resolution + explicit 60fps config

- `src/config/constants.js`: `SCREEN.WIDTH` 960 → 1280, `SCREEN.HEIGHT` 540 → 720.
- `src/main.js`: added `fps: { target: 60, min: 30 }` as a top-level key in the Phaser game config, alongside `width`/`height`/`backgroundColor`.
- `src/scenes/UIScene.js`: scaled every hardcoded HUD pixel value by 4/3 to keep the HUD visually the same size on screen at the new resolution:
  - `healthBarBg`: (20, 20, 200, 18) → (27, 27, 267, 24)
  - `healthBarFill`: (22, 20, 196, 14) → (29, 27, 261, 19)
  - `dashPip`: (20, 46, r=8) → (27, 61, r=11)
  - `update()` fill-width calc: `196 * ratio` → `261 * ratio` (matches new fill width)

## Item 2 — More zombies in Level 1

- `src/config/levels.js`: added 2 new zombie entries to `LEVELS[0].enemies` (now 4 total), placed in the previously-empty stretches:
  - `{ type: 'zombie', x: 450, rangeStart: 420, rangeEnd: 600 }`
  - `{ type: 'zombie', x: 2450, rangeStart: 2420, rangeEnd: 2600 }`
  - Existing 2 zombies (x=900 and x=1800) left untouched.
- Confirmed `src/scenes/LevelScene.js` already sizes `enemyPool` via `config.enemies.length` — no code change needed there.

## Item 3 — Level background images with graceful fallback

- `src/scenes/LevelScene.js`:
  - Added `preload()`: loads `${config.key}-bg` from `/backgrounds/${config.key}.jpg`. Missing file → Phaser's loader simply doesn't register the texture key (confirmed live: `textures.exists('level1-bg')` is `false` with no file present, `true` would be the case if a file loaded).
  - `create()`: `skyLayer` now picks `${config.key}-bg` if `this.textures.exists()` is true, else falls back to the procedural `${config.key}-sky` (unchanged generation call). `midLayer`/`nearLayer` untouched.
  - `shutdown()`: added a guarded `textures.remove()` for the `-bg` key (guarded because, unlike the procedural textures, it may never have existed).
- Created `/public/backgrounds/` (empty) with a `.gitkeep` so the directory is tracked and ready for dropped-in images. `.gitignore` doesn't touch `public/`.

## Item 4 — Subtitles for the title/intro cutscene

- `src/scenes/TitleScene.js`: renamed the lore array to `LORE_LINES`, derived `LORE_TEXT` from it via `.join('\n')` for the existing fallback text (no duplicated content). Passed `LORE_LINES` as the third arg to `cutsceneManager.play('intro', () => {}, LORE_LINES)`.
- `src/systems/CutsceneManager.js`:
  - `play(slotKey, onComplete, subtitleLines = null)` — captures `probe.duration` into a local var right before `cleanup()` in the metadata-found handler, then passes `subtitleLines` and `duration` through to `_playOverlay`.
  - `_playOverlay(src, onComplete, subtitleLines, duration)` — when `subtitleLines` is a non-empty array and `duration` is a positive number, creates an absolutely-positioned subtitle `<div>` (bottom: 64px, centered via left:50%/translateX(-50%), maxWidth 80%, semi-transparent dark background, white text, zIndex 11) and a `timeupdate` listener on the overlay video. Line display time is weighted by `line.length || 1` (so empty pause lines get a minimum weight of 1); cumulative thresholds are computed across total `duration`. The handler updates `textContent` only when the active line index changes.
  - Subtitle div + handler are stored as `this._subtitleEl` / `this._subtitleHandler`, matching the existing `_overlay`/`_skipBtn` pattern, and torn down in both `finish()` (normal end/skip/error) and `cancel()` (scene-shutdown mid-playback).
  - When `subtitleLines` is null/empty or `duration` isn't usable, no subtitle DOM is created at all — zero behavior change for other future `play()` callers.

## Verification

1. **`npm run build`** — succeeds (pre-existing >500kB chunk-size warning only, unrelated to this work).
2. **`npm test`** — 9/9 passing (2 files: `HealthSystem.test.js`, `InputController.test.js`), unaffected by these changes as expected.
3. **Browser verification** (via claude-in-chrome, dev server on `localhost:5174`):
   - The automated tab was `document.visibilityState === "hidden"`, throttling rAF. Temporarily added `window.__DEBUG_GAME__ = new Phaser.Game(config);` in `main.js`, drove the game with `game.loop.step(performance.now())` using real incrementing timestamps, then reverted the line afterward (confirmed via `grep -rn "__DEBUG_GAME__" src` → no matches after revert; build/tests re-run clean post-revert).
   - Title screen: renders lore fallback text + `[ Start ]` button correctly, no console errors on load.
   - Level 1 boots at 1280×720 internal resolution; HUD health bar and dash pip render at a visually reasonable size relative to the new canvas (screenshot confirmed proportional to before — health bar width is ~20.9% of screen width now vs ~20.8% before, i.e. visually identical scale, just crisper).
   - Confirmed via live JS introspection: `level.enemyPool.getChildren()` returns 4 active zombies at x ≈ 469, 919, 1819, 2469 (matches config, accounting for slight physics settling), all resting near ground level (y ≈ 657, not falling through the world).
   - Confirmed `level.textures.exists('level1-bg')` is `false` (no file present) and `level.textures.exists('level1-sky'/'mid'/'near')` are all `true` — procedural gradient sky renders correctly as fallback (screenshot shows the expected navy gradient + silhouette layers, panned across the level with no broken/pink textures).
   - Read the `CutsceneManager.play()` code path directly: the `onMissing` handler (fired when the metadata probe's `error` event fires for a nonexistent `/videos/intro.mp4`) calls `cleanup()` then `onComplete()` directly — it never reaches `_playOverlay`, so none of the new subtitle code executes when no video file exists. Live-verified no console errors on the title screen with `LORE_LINES` now being passed through.

## Files changed

- `src/config/constants.js`
- `src/config/levels.js`
- `src/main.js`
- `src/scenes/LevelScene.js`
- `src/scenes/TitleScene.js`
- `src/scenes/UIScene.js`
- `src/systems/CutsceneManager.js`
- `public/backgrounds/.gitkeep` (new, empty directory placeholder)

## Concerns

- **Expected console.error from Phaser's own loader for the missing background image.** Phaser's `File.js` (`onProcessError`) unconditionally does `console.error('Failed to process file: %s "%s"', this.type, this.key)` whenever a preloaded image 404s — this fires regardless of whether an explicit error listener is attached, and is core Phaser behavior (verified in `node_modules/phaser/src/loader/filetypes/ImageFile.js` and `File.js`). It is **not** a crash and does **not** block the fallback (confirmed the procedural sky renders correctly and `textures.exists()` correctly reports `false`), but it is a console message that will appear in the browser console for every level until its background jpg is dropped in. There's no clean way to suppress it without either pre-checking file existence with a separate fetch/HEAD request before calling `this.load.image()` (extra complexity, not requested) or monkeypatching Phaser's console output (not appropriate). Flagging this since the task's verification step asked to "confirm no console errors/warnings about a missing texture" — the *texture* system itself has no error state, but Phaser's loader does log at the console level for the underlying missing file. This is purely cosmetic/dev-console noise and disappears automatically once each level's jpg exists.
- No other concerns — HUD scaling numbers match the spec exactly (not approximated), zombie count/placement follows the existing object shape and design intent (README's "sparse" Level 1 density), and subtitle teardown is wired into both `finish()` and `cancel()`.

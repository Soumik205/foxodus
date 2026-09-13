# CLAUDE.md — Foxodus Project Guide

Living project doc. Kept current at the end of every milestone. For *why* decisions were made,
see `decisions.md`. For the full game design, see `README.md` and
`docs/superpowers/specs/2026-09-13-foxodus-design.md`.

## What this is

Foxodus: a 2D parallax platformer (Phaser 3 + Vite). A fox runs/jumps/dashes through 5 levels
of an AI-ruled dystopia back to the forest, eating stolen chickens as a combined
health/score/progression mechanic. All visuals are procedurally generated (no image assets);
audio is procedural SFX + curated CC0 music; the title/ending/level-transition moments use
Sora-generated video cutscenes with procedural fallbacks.

## Status

Tracked here as each milestone completes. See `TODO` list in-session for live granular tasks.

- [x] Milestone 1 — Scaffold & deploy skeleton
- [x] Milestone 2 — Core movement + camera
- [x] Milestone 3 — Chicken health system + first enemy (+ chicken wing-flap anim, fox
      hit-flash feedback, added post-review per user request)
- [x] Milestone 4 — Level 1 end-to-end + lore intro + cutscene system
- [ ] Milestone 5 — Levels 2–5 via config ← **next up**
- [ ] Milestone 6 — Audio arc + SFX
- [ ] Milestone 7 — Mobile touch controls
- [ ] Milestone 8 — Buffer / bug triage / final polish

## Handoff / continuity (read this first if picking up mid-session)

This project is being built under a ~3-hour time budget via subagent-driven development
(implementer subagent → code-review subagent → controller resolves findings, per milestone).
If you're a different AI session/tool picking this up:

- **Plan file:** `docs/superpowers/plans/2026-09-13-foxodus-core-slice.md` — covers Milestones
  1–4 in full task-by-task detail (exact code, file lists, verification steps). Read this before
  writing any new code for Milestone 4 — it's already fully specified, including fixes made
  during review (texture-cleanup guards, Phaser `shutdown()` event wiring — see below).
- **Design spec:** `docs/superpowers/specs/2026-09-13-foxodus-design.md` — audio/cutscene
  architecture and delivery process, additive to `README.md`.
- **Decision history:** `decisions.md` — read this for *why*, especially the entries on Phaser's
  `shutdown()` gotcha and the debugging session below.
- **Ledger of everything done so far, task by task, with every review finding and ruling:**
  `.superpowers/sdd/2026-09-13-foxodus-core-slice/progress.md` (git-ignored — if this file is
  missing in your checkout, ask the user for it or reconstruct from `git log`).
- **What's built:** run `npm install && npm run dev`. Boots to `TitleScene` (lore scroll +
  Start button, with a `CutsceneManager`-driven video-or-fallback intro slot). Start loads Level 1
  (`config/levels.js`, config-driven `LevelScene`) with a controllable fox, 6 bobbing/flapping
  chickens, 2 patrolling zombies with contact damage, and a live HUD (`UIScene`: health bar +
  dash-cooldown pip). Reaching `levelEndX` triggers `WinScene`; dying triggers `GameOverScene`
  with a working Retry that restarts Level 1 fresh (full health, no duplicate-texture warnings —
  verified via manual browser playthrough including the restart path).
- **Known non-blocking gaps** (real, deferred with rulings in the ledger, not bugs to "fix
  blind"): `ObjectPool.despawn()` doesn't auto-call `onDespawn()` (manual at each call site,
  fragile for future pooled types); pool-exhaustion fallback spawns skip the ground collider
  (never triggered by any current level config). Both are documented, low-risk, and intentionally
  deferred to Plan B (Milestones 5–8, not yet planned as of this writing).
- **Gotcha for anyone testing in a headless/automated browser tab:** if `document.visibilityState`
  is `"hidden"` (common in browser-automation tooling), Chrome throttles `requestAnimationFrame`
  to near-zero and Phaser's game loop won't advance on its own. Work around it by temporarily
  adding `window.__DEBUG_GAME__ = new Phaser.Game(config);` in `src/main.js`, then drive frames
  manually from the console/devtools with `game.loop.step(performance.now())` in a loop — always
  pass a real timestamp, `game.loop.step()` with no argument corrupts the loop's internal time to
  `NaN`. **Always revert the `window.__DEBUG_GAME__` line before committing** — grep for it if
  unsure (`grep -rn DEBUG_GAME src/`).
- **Gotcha:** navigating a browser-automation tab to the *same* URL it's already on can silently
  no-op instead of reloading (stale JS state, e.g. health not resetting to 100). Use
  `location.reload()` via the JS-exec tool instead when you need a guaranteed-fresh page state.

## Commands

```
npm install      # install dependencies (Phaser, Vite, Vitest)
npm run dev      # local dev server, hot reload
npm run build    # production static build
npm run preview  # preview the production build locally
npm test         # Vitest — pure-logic unit tests only (HealthSystem, InputController)
```

## Architecture map

```
/src
  /scenes        BootScene, TitleScene, LevelScene, UIScene, GameOverScene, WinScene (built)
  /entities      Fox, Chicken, Enemy (base), ZombiePatrol (built) — Turret is stretch-only
  /systems       InputController, HealthSystem, ObjectPool, CutsceneManager (built) —
                 AudioManager, SaveManager (later milestones, planned)
  /graphics      FoxGraphics, BackgroundLayers, ChickenGraphics, EnemyGraphics (built)
  /config        constants.js, levels.js (built) — LEVELS[0] populated, [1..4] planned for
                 Milestone 5
  main.js
/public
  videos/        Sora-generated cutscene clips (late-bound, optional per slot) — not created
                 yet, prompts are in docs/cutscene-prompts.md
```

Key architectural rules to preserve (see README §8–10 for full detail):
- **Data-driven levels.** One `LevelScene`, five config entries in `config/levels.js`. Never
  hand-build a second scene file per level.
- **Object pooling everywhere spawned/destroyed repeatedly** (enemies, chickens, particles).
  `ObjectPool` (`src/systems/ObjectPool.js`) is the generic wrapper — reuse it, don't re-invent.
- **No per-frame allocation inside `update()`.**
- **Explicit scene-shutdown cleanup**: input listeners, `time.removeAllEvents()`,
  `tweens.killAll()`, unused generated textures removed. **Important:** a method literally named
  `shutdown()` on a Scene subclass is NOT auto-invoked by Phaser — it must be explicitly bound
  with `this.events.once('shutdown', this.shutdown, this);` as the first line of `create()`, or
  it silently never runs. This was found during Task 3's review and fixed pre-emptively in the
  Milestone 4 plan; apply the same pattern to any new scene you add.
- **Regenerating a texture with a key that already exists** logs a Phaser warning but doesn't
  throw — guard repeated `generateTexture` calls (e.g. on scene restart) with
  `if (!this.textures.exists(key)) generate...(this);` for textures meant to be reused across
  restarts/levels (character art), and explicitly `this.textures.remove(key)` in `shutdown()` for
  textures that are genuinely per-level and won't be reused (parallax backgrounds).
- **Cutscenes are optional.** Every video slot (`CutsceneManager`) must have a procedural/text
  fallback so missing video files never block a playable build.
- **No `eval`/`Function()`/`innerHTML` with dynamic strings** anywhere, per security requirements.
- **Hit/damage feedback needs to be visible without relying on the HUD alone** — `Fox.takeHit()`
  triggers a red tint + alpha-flicker tween for the invulnerability window
  (`src/entities/Fox.js`). Follow this pattern for any other feedback-needing event.

## Conventions

- Plain JavaScript (no TypeScript), npm, Phaser 3 + Vite.
- One commit per completed milestone, after the user has visually verified it via
  `npm run dev`.
- New non-obvious decisions go in `decisions.md`, not buried in commit messages.

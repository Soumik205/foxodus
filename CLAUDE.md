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

- [ ] Milestone 1 — Scaffold & deploy skeleton
- [ ] Milestone 2 — Core movement + camera
- [ ] Milestone 3 — Chicken health system + first enemy
- [ ] Milestone 4 — Level 1 end-to-end + lore intro + cutscene system
- [ ] Milestone 5 — Levels 2–5 via config
- [ ] Milestone 6 — Audio arc + SFX
- [ ] Milestone 7 — Mobile touch controls
- [ ] Milestone 8 — Buffer / bug triage / final polish

## Commands

```
npm run dev      # local dev server, hot reload
npm run build    # production static build
npm run preview  # preview the production build locally
```

(Populated once `package.json` exists in Milestone 1.)

## Architecture map

```
/src
  /scenes        BootScene, TitleScene, LevelScene, UIScene, GameOverScene, WinScene
  /entities      Fox, Enemy (base), ZombiePatrol, Turret (stretch), Chicken
  /systems       InputController, AudioManager, ObjectPool, SaveManager, CutsceneManager
  /graphics      FoxGraphics, BackgroundLayers, EnemyGraphics
  /config        levels.js, constants.js
  main.js
/public
  videos/        Sora-generated cutscene clips (late-bound, optional per slot)
```

Key architectural rules to preserve (see README §8–10 for full detail):
- **Data-driven levels.** One `LevelScene`, five config entries in `config/levels.js`. Never
  hand-build a second scene file per level.
- **Object pooling everywhere spawned/destroyed repeatedly** (enemies, chickens, particles).
- **No per-frame allocation inside `update()`.**
- **Explicit scene-shutdown cleanup**: input listeners, `time.removeAllEvents()`,
  `tweens.killAll()`, unused generated textures removed.
- **Cutscenes are optional.** Every video slot (`CutsceneManager`) must have a procedural/text
  fallback so missing video files never block a playable build.
- **No `eval`/`Function()`/`innerHTML` with dynamic strings** anywhere, per security requirements.

## Conventions

- Plain JavaScript (no TypeScript), npm, Phaser 3 + Vite.
- One commit per completed milestone, after the user has visually verified it via
  `npm run dev`.
- New non-obvious decisions go in `decisions.md`, not buried in commit messages.

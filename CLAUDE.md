# CLAUDE.md — Foxodus Project Guide

Living project doc. Kept current at the end of every milestone. For *why* decisions were made,
see `decisions.md`. For the full game design, see `README.md` and
`docs/superpowers/specs/2026-09-13-foxodus-design.md`.

## What this is

Foxodus: a 2D parallax platformer (Phaser 3 + Vite). A fox runs/jumps/dashes through 5 levels
of an AI-ruled dystopia back to the forest, eating stolen chickens as a combined
health/score/progression mechanic. Character/creature art is 100% procedural (Canvas shapes
baked into textures, no image files); level backgrounds are AI-generated images with a
procedural fallback when a level's image doesn't exist yet (see decisions.md — this is a
deliberate, discussed exception to "no external art"); all audio (SFX + music) is generated in
code via the Web Audio API, no sound files at all; title/level-intro/ending moments use
AI-generated video cutscenes (Sora) with procedural/text fallbacks.

## Status

Tracked here as each milestone/session completes. As of 2026-09-14, Milestone 7 (mobile touch
controls) is next up and not yet started — the 2026-09-14 session so far has only been cutscene
asset wiring (see "Also outstanding" below), no code changes.

- [x] Milestone 1 — Scaffold & deploy skeleton
- [x] Milestone 2 — Core movement + camera
- [x] Milestone 3 — Chicken health system + first enemy (+ chicken wing-flap anim, fox
      hit-flash feedback, added post-review per user request)
- [x] Milestone 4 — Level 1 end-to-end + lore intro + cutscene system
- [x] Milestone 5 — Levels 2–5 wired via config (done ad hoc during a time-crunched session, not
      through the formal plan process — **only Level 1 has had a real playthrough pass**; 2–5
      exist and build/run but haven't been walked start-to-finish yet)
- [x] Milestone 6 — Audio: procedural SFX (jump/dash/pickup/hit/level-complete/game-over) +
      generative ambient music per level, all via Web Audio API in `AudioManager.js`, no sound
      files. Cutscene videos play unmuted (their own embedded audio), gated behind the Start
      button click so the browser's autoplay-audio policy doesn't silently mute them.
- [ ] Milestone 7 — Mobile touch controls ← **next up.** Currently keyboard-only; on-screen
      d-pad/jump/dash overlay for touch is a locked requirement (README §3) not yet started.
- [ ] Milestone 8 — Buffer / bug triage / final polish / deploy. No memory profiling done yet,
      no full playthrough of Levels 2–5, not deployed anywhere.

**Also outstanding, not tied to a milestone number:**
- 2 more cutscene videos (`level5.mp4`, `ending.mp4` — prompts in `docs/cutscene-prompts.md`).
  `level2.mp4`–`level4.mp4` landed 2026-09-14 as `.mov` exports and were remuxed to `.mp4`
  (stream copy, already H.264/AAC — no re-encode needed) since `CutsceneManager.js` only ever
  probes the `.mp4` filename; the `.mov` originals are still sitting in `/public/videos/` as
  backups. Any remaining background images beyond what's already in `/public/backgrounds/` are
  also outstanding — user is generating these; wire in whichever land, no code changes needed
  per the fallback pattern.
- Stretch goals (README §13): 2nd enemy type/turret, checkpoint respawn, mute button, best-time
  tracking, particle effects — only worth attempting once 7–8 are done.

## Handoff / continuity (read this first if picking up mid-session or as a different AI tool)

Milestones 1–4 were built via full subagent-driven development (implementer subagent →
code-review subagent → controller resolves findings, per task) under an initial ~3-hour budget.
Once that budget was consumed, everything from Milestone 5 onward (levels 2–5, all bug-fix
rounds, audio) was done via **direct fast iteration** — reading/editing files and verifying live
in a browser myself, without the subagent-review ceremony — because the user needed speed over
process rigor at that point. Both are legitimate for this project; don't assume everything after
the core-slice plan went through a formal review.

- **Plan file:** `docs/superpowers/plans/2026-09-13-foxodus-core-slice.md` — Milestones 1–4 in
  full task-by-task detail (exact code, file lists, verification steps), all implemented and
  since extended by direct edits. Good as a reference for conventions/patterns, not as a
  to-do list (it's finished).
- **Design spec:** `docs/superpowers/specs/2026-09-13-foxodus-design.md` — original audio/
  cutscene architecture plan. Note: the audio *sourcing* decision in it (curated CC0 music) was
  later superseded — see `decisions.md`'s "Audio: fully procedural" entry. Everything else in
  the spec still holds.
- **Decision history — read `decisions.md` in full before making any non-trivial change.** It's
  long but every entry is a real gotcha or reasoning trail encountered while building this exact
  codebase (Phaser's `shutdown()` not auto-invoking, a CSP bug that looked like a broken image,
  why chicken heights needed empirical measurement not formula math, why cutscene audio needs a
  user gesture, audio gain tuning after an "it's hurting my ears" report, etc.). Skipping this
  and re-deriving from scratch will waste time rediscovering things already solved.
- **No active SDD ledger exists right now** — Plan A's ledger was migrated into `decisions.md`
  and its workspace deleted once that plan finished cleanly. If a future formal plan (e.g. a
  proper Milestone 7/8 plan) gets written and executed via subagent-driven-development, a new
  ledger will appear under `.superpowers/sdd/<plan-name>/` (git-ignored).
- **What's built / how to check it:** `npm install && npm run dev`. Boots to `TitleScene` (lore
  text + Start button; clicking Start plays the intro cutscene *with audio* if
  `/public/videos/intro.mp4` exists, then loads Level 1). Levels use `config/levels.js`
  (all 5 populated), 1280×720 internal resolution, a live HUD (health bar + dash-cooldown pip),
  per-level background image if `/public/backgrounds/<key>.jpg` exists (procedural gradient
  fallback otherwise, and the procedural mid/near "silhouette" parallax layers are hidden
  whenever a real image is present — they look bad layered over real art), a per-level intro
  cutscene (video-or-instant-skip) before that level's gameplay unlocks, procedural SFX +
  generative background music, and progression through all 5 levels to a real ending (`WinScene`)
  or `GameOverScene` + Retry on death.
- **Known non-blocking gaps** (real, low-risk, deliberately deferred — see `decisions.md`'s
  "Plan A complete — deferred items for Plan B" entry for the full reasoning): `ObjectPool`
  doesn't auto-call `onDespawn()`; pool-exhaustion fallback skips the ground collider (currently
  unreachable since every pool is sized exactly to its spawn count); `levels.js`'s
  `enemies[].type` field is unread (only one enemy type exists so far).
- **Gotcha for anyone testing in a headless/automated browser tab:** if `document.visibilityState`
  is `"hidden"` (common in browser-automation tooling), Chrome throttles `requestAnimationFrame`
  to near-zero and Phaser's game loop won't advance on its own, AND large `<video>`/image loads
  can take several real seconds to resolve even though nothing is visibly happening. Work around
  the frame-throttling by temporarily adding `window.__DEBUG_GAME__ = new Phaser.Game(config);`
  in `src/main.js`, then drive frames manually with `game.loop.step(performance.now())` in a
  loop — always pass a real timestamp, a no-arg call corrupts the loop's internal time to `NaN`.
  **Always revert the `window.__DEBUG_GAME__` line before committing** — grep for it if unsure
  (`grep -rn DEBUG_GAME src/`).
- **Gotcha:** navigating a browser-automation tab to the *same* URL it's already on can silently
  no-op instead of reloading (stale JS state). Use `location.reload()` via the JS-exec tool when
  you need a guaranteed-fresh page state.
- **Gotcha:** clicking a Phaser UI element via screen-pixel coordinates in browser automation is
  unreliable (viewport/canvas scaling varies between screenshot calls). More reliable: get a
  `window.__DEBUG_GAME__` handle and either call `scene.children.list.find(...)` for the target
  text object and `.emit('pointerdown')` directly, or drive gameplay via direct state
  manipulation (`scene.fox.setPosition(...)`, etc.) instead of simulated clicks/keys.
- **Gotcha:** browsers block unmuted `<video>`/audio autoplay before any real user gesture has
  occurred on the page. Anything that should play *with sound* automatically must be triggered
  from inside a click handler (see how `TitleScene`'s Start button gates both `AudioManager.init()`
  and the intro cutscene) — never from a scene's bare `create()`.

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
  /systems       InputController, HealthSystem, ObjectPool, CutsceneManager, AudioManager
                 (built) — SaveManager (stretch goal, not planned unless time allows)
  /graphics      FoxGraphics, BackgroundLayers, ChickenGraphics, EnemyGraphics (built)
  /config        constants.js, levels.js (built) — all 5 LEVELS populated, but only Level 1 is
                 well-playtested; 2-5 need a playthrough pass
  main.js
/public
  videos/        intro.mp4, level1-4.mp4 present. level5.mp4 + ending.mp4 still missing (fall
                 back to instant-skip) — prompts in docs/cutscene-prompts.md. CutsceneManager
                 only probes the exact `<slot>.mp4` filename — any other extension (e.g. a
                 raw .mov export) is silently treated as missing and falls back instantly.
  backgrounds/   level1-5.jpg ALL present (all 5 levels have real AI backgrounds now) —
                 prompts in docs/background-prompts.md, in case any need regenerating
/tests           HealthSystem.test.js, InputController.test.js — Vitest, pure-logic only
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
- **Audio is a module singleton, not a per-scene object.** `import audioManager from
  '.../AudioManager.js'` returns the SAME instance everywhere (plain JS module caching — no
  Phaser registry needed). Its `AudioContext` is created lazily via `.init()`, which must be
  called from inside a real user-gesture handler (a click), never at module load or in a
  scene's bare `create()` — see the autoplay-policy gotchas above and in `decisions.md`.

## Conventions

- Plain JavaScript (no TypeScript), npm, Phaser 3 + Vite.
- One commit per completed milestone, after the user has visually verified it via
  `npm run dev`.
- New non-obvious decisions go in `decisions.md`, not buried in commit messages.

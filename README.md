# FOXODUS
### A 2D parallax platformer with 3D-style depth — one fox, an AI-ruled dystopia, and a long run home

**Tagline:** *One fox. A pocketful of stolen chickens. A world that forgot how to be alive.*

---

## 0. Working Title Options

| Name | Why it works |
|---|---|
| **Foxodus** *(recommended)* | Fox + Exodus — a large-scale flight to freedom is literally the plot. Short, easy to say once during a judging pitch, doesn't need explaining. |
| Reynard's Run | Reynard is the medieval folklore trickster fox famous for outsmarting farmers and stealing exactly this kind of poultry — a nice hidden layer for anyone who catches the reference. |
| Fowl Play | Leans hardest into the comedic chicken-thief angle. Punchier and funnier, slightly less tied to the dystopia half of the story. |
| Clawdown | Fox claws + lockdown/countdown — leans more action/dystopia-forward, less humor. |

This document uses **Foxodus** throughout. Swap freely.

---

## 1. Elevator Pitch

A 2D side-scrolling platformer where a lone fox — the last free creature left in an AI-controlled dystopia — has to run, dash, and steal his way out of the ruined city and back to the forest. Chickens are both the joke and the mechanic: eating them is what keeps him alive.

---

## 2. Story / Lore

> **2079.** Artificial intelligence took over. The cities became silent, the people became something else — slow, mindless, wandering shells patrolled by machines that used to protect them. Somewhere outside the last farm fence, one fox and a handful of chickens are the only living things left with anywhere to run to.
>
> He doesn't want to save the world. He just wants to get back to the forest — and he's not above stealing a chicken or twelve on the way.

Tone: darkly funny, not grim. The dystopia is the backdrop; the fox's personality (small, sly, hungry, unbothered by the apocalypse) is the joke.

**Narrative arc across the 5 levels:** city rooftops → streets → farmland outskirts → military wasteland checkpoint → forest edge. Harsh industrial world softening into nature as the fox gets closer to home — this arc also drives the visual palette and music (see sections 5 and 6).

---

## 3. Design Pillars (locked — do not violate without discussion)

1. **Simple mechanics.** Movement + jump + exactly one action button. No combo systems, no menus mid-run.
2. **Unique concept.** Not a reskin of an existing runner/platformer. The chicken-as-health mechanic and the tone (funny lore, dystopian setting) are the differentiators — protect them.
3. **Fun and addictive.** Short, replayable levels. Tight controls over complex ones.
4. **Reward + progression.** Chickens = health = score = progression, all one mechanic, not three separate systems. 5 levels with a visible difficulty and tone curve.
5. **Cross-platform.** Must run correctly in both a desktop browser (keyboard) and a mobile browser (touch) from day one — not bolted on at the end.

---

## 4. Core Gameplay Mechanics

| Input | Effect |
|---|---|
| Left / Right (arrow keys / A-D / touch d-pad) | Run |
| Up / Space / touch jump button | Jump |
| **One action button** (Shift / touch button) | **Dash** — short burst of forward speed with a brief invulnerability window. Doubles as traversal (cross gaps, outrun chase moments) and defense (dash through/past a zombie or turret line instead of a separate attack button) |

**Health / Hunger system:**
- Health bar drains slowly over time (creates urgency — this is what makes the game "addictive" rather than a passive walk).
- Chickens scattered through each level restore health when picked up.
- Getting hit by an enemy costs a larger chunk of health directly.
- Health hitting zero = level restart (keep restarts instant, no loading screen, no punishment beyond replaying the level).

**Progression:**
- 5 MVP levels, increasing enemy density and hazard placement — not increasing mechanical complexity.
- No separate "score" system. Chickens collected *are* the score and *are* the health, doing double duty deliberately — this keeps scope small without feeling incomplete.

---

## 5. Visual Direction

**No hand-drawn art. No external sprite/asset packs.** Everything is generated procedurally in code — vector shapes (SVG or Canvas primitives: circles, polygons, gradients) drawn and cached as textures (`generateTexture`), not imported image files.

This isn't a shortcut hack — it's the actual technique behind the reference look. Leo's Fortune's visual identity comes from flat silhouette characters against colorful gradient-lit backdrops, not detailed pixel animation. A fox silhouette built from a handful of overlapping shapes (body, head, ear triangles, tail curve) with a 2–3 keyframe tween for the run cycle will read as intentional and stylish, and it can be built and iterated on entirely in code with zero asset-sourcing time.

**Parallax depth:** 2–3 background layers scrolling at different speeds per level is what actually sells the "3D-like" depth — it is not real 3D, it's classic parallax, and it's cheap.

**Palette arc (matches the story arc):**

| Level | Setting | Palette direction |
|---|---|---|
| 1 | City rooftops | Cold industrial grays/blues, harsh silhouettes |
| 2 | Streets / checkpoint | Grays shifting toward rust orange (decay) |
| 3 | Farmland outskirts | Warmer ochres and greens creeping in |
| 4 | Wasteland / military checkpoint | Darkest/most hostile palette — tension peak before the release |
| 5 | Forest edge | Soft greens, warm gold light — visual relief mirroring the story's relief |

---

## 6. Audio Direction

**Music arc:** transitions from harsh industrial synth (level 1) to calm acoustic/ambient (level 5), mirroring the visual and narrative arc. Crossfade between level tracks rather than hard-cutting.

**SFX list (minimum viable set):**
- Jump
- Dash
- Chicken pickup (satisfying, slightly comedic — this is a core reward moment, don't skimp on it)
- Hit / damage taken
- Level complete
- Game over / restart

---

## 7. Level Design (MVP = 5 levels)

| # | Setting | Enemy density | Focus |
|---|---|---|---|
| 1 | City rooftops | Sparse, 1 zombie type | Tutorial — teach movement, jump, dash, chicken pickup in low-risk space |
| 2 | Streets / checkpoint | Medium zombie density | First real difficulty step, same enemy type |
| 3 | Farmland outskirts | Medium, chicken-dense | Reward-heavy level — leans into the "steal chickens" joke |
| 4 | Military wasteland checkpoint | Highest density, optional 2nd enemy type (stationary turret) | Difficulty peak |
| 5 | Forest edge | Minimal/none | Release valve — short, calm, celebratory; ends with the fox reaching the forest |

Difficulty should come from **density and placement of the same 1–2 enemy types**, not from adding new enemy varieties per level — this is the single biggest scope-control decision in this document. Do not add a 3rd enemy type unless every earlier milestone is done early.

---

## 8. Technical Architecture

**Stack:** Phaser 3 + Vite. Deploy target: Vercel or Netlify.

**Deploy from minute one** — push an empty scene to production immediately so the deploy pipeline is proven before it's needed under time pressure later.

**Suggested folder structure:**

```
/src
  /scenes
    BootScene.js
    TitleScene.js       // lore scroll + start button
    LevelScene.js        // generic, driven by level config data
    UIScene.js           // HUD: health bar, dash cooldown indicator — runs in parallel
    GameOverScene.js
    WinScene.js
  /entities
    Fox.js
    Enemy.js             // base class
    ZombiePatrol.js
    Turret.js             // optional, level 4+ only if ahead of schedule
    Chicken.js
  /systems
    InputController.js   // abstracts keyboard + touch into one interface
    AudioManager.js       // handles music crossfade + SFX playback
    ObjectPool.js         // reusable pool for enemies/chickens/particles
    SaveManager.js        // localStorage wrapper, defensive parsing
  /graphics
    FoxGraphics.js        // procedural silhouette draw calls -> generateTexture
    BackgroundLayers.js   // procedural parallax gradient generation
    EnemyGraphics.js
  /config
    levels.js             // array of level configs: enemy density, palette, music track
    constants.js           // physics values, dash cooldown/duration, health values
  main.js
/public
  favicon, manifest only — no binary art assets, since art is procedural
index.html
vite.config.js
package.json
README.md               // this file
```

**Key architecture decision:** levels are **data-driven**. One `LevelScene` class reads a config object (enemy count/positions, palette, music key, chicken placements) rather than five hand-built scene files. This is what makes 5 levels affordable in the time budget — levels 2–5 become configuration, not new code.

---

## 9. Build Milestones (suggested order of operations)

Work in this order. Each milestone should be independently testable and deployable before moving to the next — don't let broken work pile up across milestones.

1. **Scaffold & deploy skeleton** — Vite + Phaser init, empty scene, GitHub push, empty production deploy live.
2. **Core movement + camera** — run, jump, dash (with cooldown + i-frames), parallax camera follow.
3. **Chicken health system + first enemy** — pickup restores health, health drains over time, one zombie patrol type with contact damage.
4. **Level 1 end-to-end + lore intro** — title/lore scroll screen through a fully playable, exitable level 1. Deploy checkpoint here.
5. **Levels 2–5 via level config** — reuse tileset/enemy, vary density and palette per config entry. Add turret only if ahead of schedule.
6. **Audio arc + SFX** — music crossfade system, full SFX list wired in.
7. **Mobile touch controls** — on-screen d-pad/jump/dash overlay, tested on an actual phone browser, not just a resized desktop window.
8. **Buffer / bug triage / final deploy.**

---

## 10. Performance, Memory & Resource Usage Requirements — MANDATORY

This is a client-only browser game with no backend, but it must run smoothly on modest hardware (including phones) for the full length of a play session. Treat the following as hard requirements, not nice-to-haves:

**Memory management / leak prevention:**
- Use object pooling (a `Phaser.GameObjects.Group` or custom pool) for anything spawned/destroyed repeatedly — enemies, chickens, particles. Do not repeatedly call `new` + `.destroy()` per instance; reuse objects instead.
- On every scene shutdown/transition, explicitly clean up: remove input listeners, call `this.time.removeAllEvents()`, call `this.tweens.killAll()`, and remove any per-level generated textures that won't be reused (`this.textures.remove(key)`).
- Prefer `once` over `on` for one-shot events (level complete, single-trigger dialogue) so handlers don't silently accumulate across restarts.
- Do not allocate new objects, arrays, or closures inside `update()`. Predefine reusable variables/vectors outside the loop — per-frame allocation causes GC pauses that show up as stutter.
- Keep all UI **inside Phaser as GameObjects** rather than separate DOM overlays where possible, so there is a single lifecycle to manage instead of two (Phaser scene lifecycle + manual DOM listener cleanup).
- Audio: reuse a single sound/music instance and crossfade volume rather than instantiating a new audio object per level. Mobile Safari in particular leaks audio nodes aggressively if instances aren't properly stopped and destroyed.
- Any `localStorage` read/write (save progress, best time) must be wrapped in try/catch with schema validation before use — never trust stored JSON blindly.
- Attach global listeners (e.g. window resize) exactly once at bootstrap, never per-scene-load.

**Verification (do this before calling any milestone "done"):**
- Profile with Chrome DevTools Performance and Memory tabs.
- Take heap snapshots before and after two full playthroughs of all 5 levels; memory should return close to baseline after each level transition, not climb continuously.
- Confirm FPS stays stable (no accumulating frame drops) on a mid-range phone browser, not just desktop Chrome.

---

## 11. Security Requirements — MANDATORY

Scope is appropriately light for a client-only hackathon game with no backend, but these still apply:

- Never use `eval()`, the `Function()` constructor, or `innerHTML` with any dynamic or unsanitized string — including lore/UI text. Build all text via Phaser's Text objects or safe DOM APIs, never string-concatenated HTML.
- If a name-entry or leaderboard feature is added, sanitize and length-cap any user-entered text before displaying or storing it, to prevent stored/reflected XSS.
- Keep dependencies minimal and pin versions in `package.json` (Phaser, Vite, and an audio library if one is used) — avoid pulling in unaudited third-party plugins under time pressure.
- No API keys or secrets of any kind in client-side code. If analytics or a leaderboard backend is added later, keys belong server-side only, never in the bundled JS.
- Serve exclusively over HTTPS (default on Vercel/Netlify). Add a basic Content-Security-Policy meta tag restricting `script-src` to self.
- If any script is loaded from a CDN rather than bundled via npm, use Subresource Integrity (SRI) hashes — prefer bundling via npm instead wherever possible.

---

## 12. Definition of Done / QA Checklist

- [ ] All 5 levels are completable start to finish with no soft-locks
- [ ] Health drains over time; chicken pickups restore it; enemy contact costs a larger chunk
- [ ] Dash has a visible cooldown indicator in the HUD
- [ ] Fully playable on desktop (keyboard) and mobile browser (touch overlay) without code branching per platform beyond the input layer
- [ ] No errors in the browser console during a full playthrough
- [ ] Memory profiling shows no continuous growth across two full playthroughs (see section 10)
- [ ] Lore intro screen and a distinct win/ending screen both exist
- [ ] Production build is deployed and the URL is confirmed working from a phone, not just localhost

---

## 13. Stretch Goals (only attempt if every milestone above is already done with time remaining)

- Second enemy type (turret) beyond level 4
- Checkpoint/mid-level respawn instead of full level restart
- Mute/settings button
- Local best-time or best-chickens-collected tracking via `localStorage`
- Simple particle burst on chicken pickup and dash

---

## 14. Explicit Non-Goals for MVP

To keep scope inside the time budget, the following are deliberately **out of scope** and should not be added without a conscious decision to cut something else:

- No multiplayer or networking of any kind
- No backend/server, database, or user accounts
- No monetization or ads
- No hand-drawn or externally-sourced art/sprite assets
- No more than 5 levels
- No more than 2 enemy types total
- No second action button or combo inputs

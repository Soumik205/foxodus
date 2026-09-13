# Foxodus — Design Spec

Date: 2026-09-13
Status: Approved by user, entering implementation planning.

This spec adopts the project `README.md` in full (game design, pillars, mechanics, level
design, technical architecture, performance/security requirements, and QA checklist are all
locked as written there) and adds the decisions made during brainstorming that the README left
open. See `decisions.md` for the reasoning behind each. This document exists to give the
implementation plan a single, unambiguous source to build from.

## 1. Scope of this spec

Additive to the README, not a replacement. Covers:
1. Audio system architecture (procedural SFX + curated music).
2. Cutscene system architecture (Sora-generated video, 7 slots, with fallbacks).
3. Documentation process (`CLAUDE.md`, `decisions.md`).
4. Delivery process (milestone-by-milestone, subagent-driven, visually checkpointed).

## 2. Audio System

**Owner module:** `src/systems/AudioManager.js`, instantiated once at boot, persisted across
scene transitions (not recreated per scene) to satisfy the README's no-leak/reuse mandate.

**SFX (procedural, Web Audio API):**
- `jump`, `dash`, `chickenPickup`, `hit`, `levelComplete`, `gameOver` — six minimum-viable
  effects per README §6.
- Each is a small synthesis recipe (oscillator type + frequency envelope + gain envelope +
  optional noise burst), authored as a data object in `AudioManager`, not as audio files.
  Example shape: `chickenPickup` = quick upward-pitched two-note blip (comedic, rewarding);
  `hit` = short noise burst + low thud (readable as damage, not punishing); `dash` = fast
  pitch-sweep whoosh.
- Synthesis nodes are created per-trigger and disconnected/GC'd immediately after their
  envelope completes (they're cheap, short-lived `OscillatorNode`s — this is the one exception
  to "reuse objects," since Web Audio nodes are single-use by spec and the alternative, node
  pooling, adds complexity Web Audio doesn't reward).

**Music (curated CC0 tracks, crossfaded):**
- One royalty-free/CC0 track per level (5 total), matching the arc: harsh industrial synth
  (L1) → calm acoustic/ambient (L5).
- Loaded as a single reusable `AudioBufferSourceNode` per active track; level transitions
  crossfade via `GainNode` ramps (`linearRampToValueAtTime`) rather than hard cuts or
  instantiating new `Audio()` objects — required by README §10's Mobile Safari leak warning.
- Track sourcing: user/dev sources specific CC0 tracks during Milestone 6; `AudioManager` is
  built against a config-driven track list (`config/levels.js` gains a `musicKey` field) so
  swapping tracks later is a config change, not a code change.

**Mute/volume:** a single master gain node gates both SFX and music, wired to the stretch-goal
mute button if/when it's built; defaults to unmuted, respects a `localStorage`-persisted
preference if present (validated per README §10's schema-check mandate).

## 3. Cutscene System

**Owner module:** `src/systems/CutsceneManager.js`.

**7 slots**, all optional at build time:
1. Title/intro (lore, before Level 1)
2. Level 1 intro card (city rooftops)
3. Level 2 intro card (streets/checkpoint)
4. Level 3 intro card (farmland outskirts)
5. Level 4 intro card (military wasteland checkpoint)
6. Level 5 intro card (forest edge)
7. Win/ending (after Level 5 complete)

Each level intro card plays right before that level loads (including Level 1 — distinct from
and in addition to the title/lore slot, which plays once at game start).

**Playback mechanism:** an HTML5 `<video>` element in a DOM overlay positioned above the
Phaser canvas (not a Phaser Video GameObject / WebGL texture upload) — cutscenes only play
during non-gameplay moments (title, transitions, win), so there's no frame-budget conflict with
the game loop, and DOM video decode is cheaper on mobile than pushing video frames through a
Phaser texture. The overlay is created on demand and fully torn down (element removed,
`src` cleared, listeners removed) when the cutscene ends — no persistent DOM node sitting
alongside the Phaser canvas during gameplay, keeping the "one lifecycle to manage" spirit of
README §10 intact for the parts of the app that matter most (in-level performance).

**Fallback (mandatory, not stretch):** every slot checks whether its video file exists
(`/public/videos/<slot>.mp4`) before attempting playback. If missing (during development, or
permanently if a clip is skipped), the slot renders the existing procedural design instead —
a gradient card (matching that level's palette per README §5) plus the lore/transition text.
This means the game is fully playable and demo-able at every milestone regardless of cutscene
production status.

**Controls:** every cutscene is skippable (tap/click or a visible skip button) and capped at a
short duration (target 5–8s per clip) so a slow-loading or long clip never blocks play. Video
loads `preload="auto"` only when its slot is about to play, not all 7 upfront — keeps initial
load light per README §10.

**Video specs handed to the user for Sora generation:** short (5–8s), muted-compatible (no
reliance on audio track — mobile autoplay requires muted anyway; VO/score if any is a bonus,
not load-bearing), landscape orientation matching the game's aspect ratio, exported as
H.264 MP4 for broad browser support. Concrete prompts for all 7 clips are delivered separately
as `docs/cutscene-prompts.md` once this spec is approved, so video generation can happen in
parallel with early gameplay milestones.

## 4. Documentation Process

- `CLAUDE.md` (repo root): living architecture/status doc, updated at the end of every
  milestone — not before, so it always reflects what's actually built rather than what's
  planned.
- `decisions.md` (repo root): dated append-only log of non-obvious decisions with reasoning.
  Every time a judgment call gets made during implementation (not just during this
  brainstorming phase), it gets an entry here.
- Both are committed alongside the code changes for the milestone they describe.

## 5. Delivery Process

- Implementation plan (next step, via the writing-plans skill) is broken into the 8 milestones
  from README §9, each sized so it ends in something runnable via `npm run dev`.
- Each milestone is executed via subagent-driven development — dispatching focused subagents
  per task — and **stops for the user's visual check in-browser before the next milestone
  starts.** The user may request changes to a completed milestone before we proceed.
- One git commit per completed-and-approved milestone.
- Milestone 4 (Level 1 end-to-end + lore intro) is where the generic `CutsceneManager` and
  title/lore screen are built, wired to the Level 1 intro card slot (with fallback) — the
  natural point in the README's own ordering, since it's already the "lore intro" milestone.
  The remaining four level-intro-card slots and the win/ending slot activate in Milestone 5
  (config-driven, same manager) and at WinScene completion, respectively — no new system code,
  just additional config/slot wiring.

## 6. Open items deliberately deferred (not blocking implementation start)

- Exact CC0 music track selection — happens at Milestone 6, config-driven so it's a late
  binding.
- Deploy hosting account (Vercel/Netlify) — deferred per user request; static build stays
  deploy-ready throughout.
- Mute/settings button, checkpoint respawn, second enemy type — stretch goals per README §13,
  only attempted if all 8 milestones finish early.

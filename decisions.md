# Decisions Log

Dated record of every non-obvious decision made during development, with reasoning.
Newest entries at the top. Cross-reference the design spec at
`docs/superpowers/specs/2026-09-13-foxodus-design.md` for the full picture.

---

## 2026-09-13 — "Zombie contact does nothing" was a feedback gap, not a bug — added hit-flash + chicken wings

**Decision:** After user reported chicken visuals looking "funny" and zombie contact "doesn't do
anything," investigated live in a real browser session before touching any code. Confirmed via
direct instrumentation (temporary console.log in the overlap callback, and a temporary
`window.__DEBUG_GAME__` handle to step Phaser's loop manually) that the damage mechanic was
**already working correctly**: the overlap fired every frame while touching, `takeHit()` applied
~30 damage, and the invulnerability window correctly gated repeat hits. The actual problem was
that nothing was *visible* — Milestone 3 has no HUD yet (that's Milestone 4), and there was no
hit-reaction on the Fox sprite itself, so a real damage event looked identical to no damage event
at all.

**Why this matters for continuity:** don't re-debug this from scratch if it comes up again —
the mechanic is sound. Added `Fox._playHitFeedback()` (red tint + alpha-flicker tween for the
invulnerability window) so damage is visible independent of the HUD. Also gave the chicken actual
wings and a 2-frame flap animation (`chicken-wing-up`/`chicken-wing-down`, `ChickenGraphics.js`)
combined with its existing bob tween, so it reads as hovering/flying rather than a static blob —
this was a legitimate visual gap, not a misdiagnosis.

**How to apply:** When a user reports "X doesn't do anything" for a mechanic that unit
tests/prior review already verified, check for a *feedback* gap before assuming a *logic* bug —
verify the underlying state change is actually happening (health/flags/etc.) before rewriting
game logic. See `CLAUDE.md`'s Handoff section for the debugging technique used (manual
`game.loop.step()` driving, since browser-automation tabs are usually `document.visibilityState
=== "hidden"` and throttle `requestAnimationFrame` to near-zero).

---

## 2026-09-13 — Phaser scene `shutdown()` is not framework-invoked — must bind to the event explicitly

**Decision:** Every scene's `shutdown()` cleanup method (input listener teardown, texture
removal, etc.) must be explicitly wired via `this.events.once('shutdown', this.shutdown, this);`
at the top of `create()`. A method merely *named* `shutdown()` on a `Phaser.Scene` subclass is
never called by the framework on its own.

**Why:** Discovered during Task 3's code review (verified against
`node_modules/phaser/src/scene/SceneManager.js` — only `init`/`preload`/`create`/`update` are
framework-invoked by name). It was rated a Minor at the time because Phaser's own internal
systems (Clock, TweenManager, DisplayList) independently self-register on the scene's shutdown
event and happen to cover most of what our `shutdown()` methods were doing by accident — but the
plan's Milestone 4 texture-cleanup fix (see the entry below on cutscene/texture management)
genuinely depends on `shutdown()` running, since texture removal isn't a Phaser-internal system.

**How to apply:** Every new Scene subclass that defines a `shutdown()` method must bind it via
`this.events.once('shutdown', this.shutdown, this);` as the first line of `create()`. Already
applied to `LevelScene`, `UIScene`, and `TitleScene` in the Milestone 4 plan
(`docs/superpowers/plans/2026-09-13-foxodus-core-slice.md`).

---

## 2026-09-13 — Cutscene scope: intro + ending + per-level transition cards

**Decision:** 7 total Sora-generated video cutscenes — title/lore intro, 5 level-transition
cards (one per level), and a win/ending cutscene.

**Why:** User wants the full narrative arc supported visually, not just the title screen, and
is generating the clips personally via Gemini Sora, so cost is time not budget. This is the
largest of the three offered options.

**How to apply:** Cutscene playback must be architected as an *optional enhancement layer* —
every cutscene slot needs a graceful procedural/text fallback (gradient card + lore text) so
development and testing never blocks on video assets existing yet. Videos are late-bound
static files dropped into `/public/videos/` as they're generated. See spec for the playback
system design (DOM overlay, not Phaser video GameObject, for perf reasons).

---

## 2026-09-13 — Audio sourcing: procedural SFX + curated CC0 music

**Decision:** All SFX (jump, dash, chicken pickup, hit, level complete, game over) are
synthesized at runtime via the Web Audio API. Music is a small set of curated CC0/royalty-free
tracks, one per level, crossfaded per the industrial→acoustic arc.

**Why:** The README bans external *art* assets to keep the procedural-generation identity, but
is silent on audio. Pure-procedural music (synthesized) is a much bigger, riskier lift to make
sound intentional rather than random, whereas SFX are short enough that synthesis gives precise
creative control (the "satisfying, slightly comedic" chicken pickup needs hand-tuned envelopes,
not a stock sample). Curated tracks solve the harder problem (a musical arc) cheaply and
reliably.

**How to apply:** `AudioManager.js` owns both: a small synthesis library for SFX envelopes, and
a single reusable `<audio>`/WebAudio buffer source per track with gain-node crossfading between
levels (per the README's memory-management mandate — no per-level `new Audio()`).

---

## 2026-09-13 — Deploy setup deferred

**Decision:** Skip wiring up Vercel/Netlify hosting for now. Keep the Vite build
deploy-ready (static output, no server dependency) but don't connect a hosting account yet.

**Why:** User chose to focus dev time on gameplay milestones first; deploy account setup can
happen once there's more to show.

**How to apply:** Milestone 1 still produces a clean `npm run build` static bundle and confirms
it runs, satisfying the "prove the pipeline early" spirit of the README without requiring
external account access mid-session.

---

## 2026-09-13 — Git repository initialized locally

**Decision:** `git init` in the project root, default branch renamed to `main`. No remote/
GitHub push configured yet.

**Why:** User wants commit history per milestone for review checkpoints. No request yet to
push anywhere, so keeping it local avoids taking any action on shared/remote state without
explicit ask.

**How to apply:** Commit at the end of each milestone once the user has visually verified it
via `npm run dev`.

---

## 2026-09-13 — Plain JavaScript, npm, Phaser 3 + Vite (per README, confirmed not TypeScript)

**Decision:** Follow the README's suggested folder structure literally — plain `.js` files, no
TypeScript, npm as the package manager.

**Why:** The README's file tree already specifies `.js` extensions throughout; introducing
TypeScript would add build complexity and a type-authoring pass not requested anywhere in the
plan, for a hackathon-scoped project prioritizing speed of iteration.

**How to apply:** No `tsconfig`, no `.ts`/`.tsx` files. Keep it plain per the existing spec.

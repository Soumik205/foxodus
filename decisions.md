# Decisions Log

Dated record of every non-obvious decision made during development, with reasoning.
Newest entries at the top. Cross-reference the design spec at
`docs/superpowers/specs/2026-09-13-foxodus-design.md` for the full picture.

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

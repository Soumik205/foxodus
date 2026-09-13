# Foxodus — Sora Cutscene Prompts

7 clips total, per `docs/superpowers/specs/2026-09-13-foxodus-design.md` §3. Generate in any
order — the game runs with procedural fallbacks for any slot not yet filled, so there's no
blocking dependency on development.

**Where files go once generated:** drop each exported `.mp4` into `/public/videos/` using the
exact filename listed under each prompt (the `CutsceneManager` looks for these by name; get the
folder from me once Milestone 1 scaffolding exists — it doesn't yet on disk).

**Export settings for every clip:** landscape 16:9, H.264 MP4, 5–8 seconds, **no baked-in
dialogue captions, subtitles, logos, or watermarks** — all lore/level text is rendered by the
game engine on top of the video, so text baked into the footage would double up or clash.
Keep clips music/dialogue-optional — assume they'll play muted (mobile browser autoplay
requires it), so lean on visual storytelling over anything audio-dependent.

---

## Shared style & character bible

Paste this block into every prompt below (already included) to keep the fox and the visual
language consistent across all 7 generations, since Sora has no memory between separate runs.

> **Style:** Cinematic 2D-flat / graphic-novel animation aesthetic — flat silhouette shapes
> against richly gradient-lit backdrops, strong rim lighting, minimal fine detail, high
> contrast, in the visual tradition of *Leo's Fortune* and *Limbo*. Painterly parallax
> backgrounds, smooth camera moves, moody atmospheric lighting. Not photorealistic, not
> 3D-rendered — graphic, poster-like, illustrative.
>
> **Character — the fox:** A small, sly red fox with a cream-white chest and belly, alert
> triangular ears, a long curved tail. Moves with a light, quick, mischievous gait — always
> looks slightly unbothered/amused even in danger. Reads as a survivor with personality, not a
> generic animal.

---

## 1. Title / Lore Intro

**Filename:** `videos/intro.mp4`

**Prompt:**
> [Style & character bible above.] Wide establishing shot of a decayed, silent AI-controlled
> megacity at dusk — towering monolithic buildings, cold blue-gray industrial lighting, faint
> drone silhouettes patrolling in the distance, slow-moving mindless human silhouettes shuffling
> below like sleepwalkers. Camera slowly cranes down from the skyline toward a rooftop, where
> the small red fox crouches at the edge, looking out over the ruined city with sharp, curious
> eyes — utterly unbothered by the apocalypse around him. A few loose feathers drift past him on
> the wind. He gives a small, confident head-tilt, as if sizing up the city before deciding to
> steal something from it. Tone: darkly atmospheric but with a wink of dry humor in the fox's
> body language — this is the character who will outsmart everyone here.

---

## 2. Level 1 Intro Card — City Rooftops

**Filename:** `videos/level1.mp4`

**Prompt:**
> [Style & character bible above.] Cold industrial palette — grays and steel blues, harsh
> angular silhouettes, hard directional light like a searchlight sweep. The fox leaps between
> two rooftop water towers in silhouette against a pale overcast sky, landing lightly, ears
> perked toward a faint mechanical patrol sound off-screen. Camera pans right to reveal a long
> line of rooftops stretching into the smog-hazed skyline — the path ahead. Mood: tense but
> playful, a tutorial-level calm-before-the-run energy.

---

## 3. Level 2 Intro Card — Streets / Checkpoint

**Filename:** `videos/level2.mp4`

**Prompt:**
> [Style & character bible above.] Palette shifting from cold gray toward rust orange — visible
> decay, peeling checkpoint barriers, flickering sodium-orange streetlights reflecting in wet
> pavement. The fox slinks along a shadowed alley wall at street level, pausing behind a rusted
> barricade as two slow, lumbering zombie-drone silhouettes shuffle past under a flickering
> light. He waits a beat, then darts across the open street in a low blur. Mood: stealthier,
> slightly more hostile than level 1, still with a spring in his step.

---

## 4. Level 3 Intro Card — Farmland Outskirts

**Filename:** `videos/level3.mp4`

**Prompt:**
> [Style & character bible above.] Warmer ochres and greens creeping into the palette — a
> half-collapsed wooden farm fence at golden-hour light, overgrown fields beyond a crumbling
   > checkpoint wall. The fox trots along the top of a fence rail, and a small flock of chickens
> scatters and squawks as he passes, feathers puffing up comedically — he snatches one mid-run
> with a quick, satisfied grin before bounding onward. Mood: the lightest, funniest clip of the
> set — reward-and-mischief energy.

---

## 5. Level 4 Intro Card — Military Wasteland Checkpoint

**Filename:** `videos/level4.mp4`

**Prompt:**
> [Style & character bible above.] The darkest, most hostile palette of the whole game — ash
> grays, deep reds from distant warning lights, harsh strobing turret scan-beams cutting through
> smoke and fog. The fox presses low against a concrete barrier as a turret silhouette's red
> scan-beam sweeps just over his head; he freezes for a beat, eyes narrowed, then bolts forward
> the instant the beam passes. Camera shakes slightly with each distant impact/explosion sound
> cue implied visually by light flashes. Mood: peak tension, the hardest moment before the
> release.

---

## 6. Level 5 Intro Card — Forest Edge

**Filename:** `videos/level5.mp4`

**Prompt:**
> [Style & character bible above.] Palette softens dramatically — warm gold late-afternoon
> light spilling through the tree line, soft greens replacing the industrial grays entirely. The
> fox bursts out of the shadow of the last checkpoint wall into open sunlight at a tree line's
> edge, slowing his run for the first time, ears relaxed, tail loose and easy instead of alert.
> Camera pulls back to reveal the forest stretching out ahead, calm and untouched. Mood: visible
> relief and release — the tension breaking.

---

## 7. Win / Ending

**Filename:** `videos/ending.mp4`

**Prompt:**
> [Style & character bible above.] The fox and a small trailing group of chickens (the ones
> he's "rescued"/stolen along the way) trot together into a sunlit forest clearing, deep warm
> gold-green light, soft ambient particles (pollen/light motes) drifting in the air. He stops at
> the clearing's center, looks back once toward the distant hazy skyline of the city he escaped
> — a brief beat of quiet reflection — then turns and flops down contentedly in a patch of sun
> with a chicken settling beside him, entirely at ease. Mood: warm, funny, triumphant but
> understated — earned calm rather than a big fanfare.

---

## Notes for iterating

- If a generated clip's motion or fox proportions read too differently from another, the
  cheapest fix is usually re-running with a tighter, more literal restatement of the character
  bible rather than rewriting the whole scene prompt.
- These are intentionally *silhouette/mood* pieces rather than close-up character-acting shots —
  Sora (and most video models) render flat, graphic, mid-to-wide shots more consistently than
  detailed close-up facial expression, which also matches the game's own visual identity.
- Don't worry about getting all 7 before development continues — send me whichever ones are
  ready as you go and I'll wire each one in as its slot's fallback gets replaced.

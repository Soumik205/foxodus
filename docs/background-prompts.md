# Foxodus — Level Background Image Prompts

5 static background images, one per level, matching the palette arc from `README.md` §5 and the
same visual language as the cutscene videos (`docs/cutscene-prompts.md`) for consistency between
gameplay and cutscene moments.

**Where files go:** drop each exported image into `/public/backgrounds/` using the exact filename
below (create the `backgrounds/` folder if it doesn't exist yet). The game looks for these by
name — if a file is missing, that level automatically falls back to a procedural gradient sky
(same graceful-fallback pattern as the cutscene videos), so there's no dependency blocking
development.

**Export settings for every image:**
- **Exactly 1280×720px** (16:9, matches the game's render resolution) — export at this exact size
  rather than cropping in-engine, so nothing gets unexpectedly cropped or tiled.
- JPG or WEBP, optimized for web (target under ~500KB each — these load into a browser game).
- No text, no UI elements, no characters/creatures baked in (the fox/zombies/chickens are drawn
  separately in front of this by the game itself).
- Wide, atmospheric, matte-painting style — this sits behind gameplay, not a hero illustration.

## Shared style note

Match the flat/graphic, cinematic illustrated look established for the cutscenes: rich gradient
lighting, strong atmospheric depth, painterly but not photorealistic, in the visual tradition of
*Leo's Fortune* / *Limbo*. Think "AAA 2D platformer background art," not concept art or a photo.

---

## 1. Level 1 — City Rooftops

**Filename:** `backgrounds/level1.jpg`

**Prompt:**
> Wide cinematic background painting of a decayed AI-controlled megacity skyline at dusk, viewed
> from rooftop height. Cold industrial palette — steel blues and harsh grays, hard directional rim
> lighting like a distant searchlight. Towering monolithic buildings fading into smog-hazed
> atmospheric perspective toward the horizon. Faint silhouettes of drones patrolling in the far
> distance. No characters in the foreground — this is a background plate for a 2D platformer,
> empty of any midground/foreground detail that would be added separately. Flat illustrated style,
> not photorealistic, moody and cold.

---

## 2. Level 2 — Streets / Checkpoint

**Filename:** `backgrounds/level2.jpg`

**Prompt:**
> Wide cinematic background painting of a decaying city street at ground level, palette shifting
> from cold gray toward rust orange — visible decay, peeling checkpoint barriers in silhouette,
> flickering sodium-orange streetlights reflecting faintly off wet distant pavement. Atmospheric
> haze/fog softening the far background into muted orange-gray. No foreground characters or
> midground detail — a clean background plate. Flat illustrated style, tense but not chaotic.

---

## 3. Level 3 — Farmland Outskirts

**Filename:** `backgrounds/level3.jpg`

**Prompt:**
> Wide cinematic background painting of overgrown farmland at golden hour, palette warming
> into ochres and soft greens — a distant crumbling checkpoint wall on the horizon, rolling fields
> beyond a half-collapsed wooden fence line, warm golden-hour sunlight washing the whole scene.
> No foreground characters, no chickens or midground clutter — a clean atmospheric background
> plate. Flat illustrated style, the warmest and most relieved-feeling palette so far.

---

## 4. Level 4 — Military Wasteland Checkpoint

**Filename:** `backgrounds/level4.jpg`

**Prompt:**
> Wide cinematic background painting of an ash-gray military wasteland checkpoint, the darkest
> and most hostile palette in the set — deep grays, smoke and fog, distant red warning-light glow
> silhouetting concrete barriers and watchtowers on the horizon. Harsh, oppressive atmosphere,
> tension-peak lighting. No foreground characters or turrets — a clean background plate only.
> Flat illustrated style, high contrast, the visual low point right before the story's release.

---

## 5. Level 5 — Forest Edge

**Filename:** `backgrounds/level5.jpg`

**Prompt:**
> Wide cinematic background painting of a sunlit forest edge, palette softening completely into
> warm greens and gold — late-afternoon light spilling through a distant tree line, soft
> atmospheric haze, no more industrial elements anywhere in frame. Calm, open, and warm — the
> visual and emotional release after four hostile levels. No foreground characters — a clean
> background plate. Flat illustrated style, the lightest and most peaceful image in the set.

---

## Notes

- These pair with the existing procedural silhouette parallax layers (mid/near depth layers,
  still code-generated) — the image becomes the fixed, farthest "sky" layer; the game keeps
  drawing its own scrolling silhouette layers in front of it for the parallax depth effect. You
  don't need to design foreground silhouettes into these images.
- Send whichever ones are ready as you go — each level swaps to its real background the moment
  its file exists, no code changes needed per drop-in.

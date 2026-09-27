# Seedance 2.5: community recipes

Condensed from community research of 16 Sep 2026 (official ByteDance guide via
dev.to, fal.ai, Runware, Higgsfield, Kapwing, Dreamina, domoai, MindStudio,
seedance.tv, creator threads on X) and corrected by our own Replicate tests.
Items marked *(single source)* are not independently confirmed. Full source list:
the original `docs/video/03-recetas-comunidad.md`.

How Polyvik applies this automatically: `videoPrompt.services.js`
([Video generation](video-generation.md#prompt-building)). Planned multi-shot
workflow: [Video canvas](video-canvas.md).

## What our tests overrule

These come from our own Seedance 2.5 runs on Replicate and take precedence over any
community advice below:

- **Realistic faces in references trigger E005** ("sensitive") at input validation,
  within seconds. A realistic face passed only when small (~96 px in a 768 px-wide
  image); it failed at ~150 px and ~250 px. Do not rely on photo references of real
  people; describe the person in text, or use Veo 3.1 for realistic close-ups.
- **Stylized characters and mascots pass** with high fidelity. For recurring
  characters, generate them with Seedream 5 Pro in `/characters`.
- **References are downscaled to 768 px wide** (JPEG). Wider images also triggered
  E005; output is 480p/720p so nothing is lost.
- **"References" mode gives only approximate likeness.** For fidelity: build a
  keyframe with an image model, then animate it from the first frame.
- **Our adapter's limits:** 2,000-character prompt, 480p/720p, 4–30 s, up to 30
  image references, no video/audio references, and first frame and references
  cannot be combined. Community advice about 1080p/4K, 5,000-character prompts,
  `@videoN`/`@audioN` inputs, extend and region edit does not apply to us yet.
- **Reference syntax:** write `@Image N`; the adapter converts it to Replicate's
  `[ImageN]`.

## 1. Prompt structure

Official six-block formula (only the first two are required):
**Subject + action → scene → visual style → camera/cut → sound → role of each reference.**

```
<SUBJECT> <action> in <scene>. The image is <style>. The camera uses <movement>. Sound includes <audio>.
```

Order used across 5+ guides: format/duration → subject (identity) → action over
time → camera → light/color → audio → constraints / end state. "One visual rule at
the top, one sound rule at the bottom, shots in between" (Higgsfield).

- **Length:** one paragraph for a 5–8 s shot; detail retention plateaus after a few
  hundred well-chosen words. Short prompt for one shot, shot list for 15–30 s.
- **Timestamps work in 2.5:** ranges (`0-5s:`) set pacing, points (`at 5s`) fix
  events. Contiguous windows, 1 s granularity. Never use them as frame-exact cuts or
  for micro-control ("shake three times per second" fights the model).
- **Match actions to real time.** Too many actions per window → sped-up scene; too
  much time for a short action → slow motion.
- For 30 s: numbered references with roles → one-sentence summary → timed plot or
  shots → closing constraints (consistency, light, prohibitions).
- Keep every line of a prompt in one language. Our rule: prompts in English;
  dialogue in the audience's language.

## 2. References

**Golden rule: each reference has ONE job and says what NOT to copy.**

```
@Image 1 controls only [identity/product/wardrobe].
Do not copy [pose/background/lighting/text] from @Image 1.
```

- Bind characters one to one: `<NAME> corresponds to @Image 1; appearance, hair,
  clothing only.` "@Image 1 through @Image 4 define four characters" swaps faces.
- Official guidance: 1–8 subjects even though 30 fit; stability degrades beyond.
  2–3 images per protagonist.
- With references, write "the character from the reference images" instead of
  redescribing them; repeat the exact same description in every shot.
- **Identity anchor workflow:** one frontal, full-body, neutral-background anchor;
  every variant is made **from the anchor, never from a variant**; the same style
  block goes in every image and video prompt.
- **Product/logo integrity:** treat the approved photo "as a product record, not
  loose inspiration"; lock immutable geometry early ("Preserve the exact lens shape,
  black frame, amber tint…"); if it deforms, **reduce motion** and restate "keep the
  product exactly as shown". Logo letters mutate or mirror under movement; check
  first vs last frame.
- **Multiple keyframes:** "Use @Image 1 through @Image N as keyframes, in that
  order. The picture passes in turn through the states defined by…". State the
  order explicitly; input order is not always followed.

### First frame (image-to-video)

- **Prompt only the motion.** The frame fixes the scene; describe what moves and
  the single action the subject takes. Redescribing the scene makes it worse.
- Aspect ratio locks to the first frame (our adapter sends `adaptive`).
- Vague prompt → hard cut: add "smooth, continuous, seamless, no hard cut".
- Chaining clips: last frame of clip N as the first frame of clip N+1 —
  "Use @Image 1 as the exact first frame and continue forward from that moment".

## 3. Audio

- Polyvik's fixed rule: **no music**, diegetic sound only. Generated music also
  triggered `OutputAudioSensitiveContentDetected.PolicyViolation` after render
  *(single source, API)*. Useful phrases: `No BGM, only ambient and action sounds`,
  `No subtitles`.
- **Dialogue:** in double quotes; under 8 words per line; one speaker, locked
  camera, large face for first tests. Structure: who speaks, when, exact words,
  tone, framing.
  `At 5s she looks toward camera in a stable medium close-up and says, calmly: "Made for the move."`
- **Language:** name language + regional variant + delivery before the line
  ("Latin American Spanish", "Mexican Spanish"). Spanish is on the official list.
  One language per time window. "American" fixed an unwanted British accent where
  "American English" did not *(single source)*. No published evidence on Spanish
  lip-sync quality: test it.
- Lip-sync fails with small or moving faces, several speakers, music underneath,
  long lines, cuts mid-syllable, or a hand over the mouth.
- Our prompt builder omits "ambient only" when there is dialogue: that phrase
  silences the voice.

## 4. Camera

Recognized vocabulary: dolly-in/push-in, pull-back, orbit/arc, crane, handheld,
static/locked-off, tracking, pan, tilt, rack focus, low angle, top-down, aerial.

- **One camera move per beat.** Stacked moves ("drone, handheld close-up, fast
  orbit") fail.
- Camera and subject in separate sentences; lead with the camera clause.
- Tie movement to an event: "pans only after the door opens".
- Translate advanced terms into what is seen ("focus moves from the leaves to the
  figure; her face resolves from blurred to sharp").
- For product/real estate: "slow dolly, steady gimbal", "no shake".
- "Cinematic" is not a camera direction.
- If the character must turn, write the physical turn; otherwise it may morph.
- Long drone arcs are Seedance's weak spot (Kling 3.0 did better).

## 5. Text on screen

Not reliable — official limitation #4. Polyvik forbids generated text in every
video prompt. Put titles, captions, logos and CTAs in the editor finish
([Video generation](video-generation.md#editor-finish)). If needed: reserve space
("top 20% clear for a headline" in 9:16), keep a locked hero frame at the end with
the logo facing forward and a gentle push-in.

## 6. What goes wrong

| Problem | Avoid it |
|---|---|
| Morphing in fast action | Less speed and range of motion rather than more negatives; slow, continuous, small moves |
| Hands glitch | Slow, explicit gestures; keep hands out of frame when not essential |
| Identity drift | Reference + identical description every shot; fewer wardrobe/light changes; re-anchor to the original, never re-roll from a variant. A drifting face can resemble a celebrity and get blocked |
| Several interacting subjects | Max 2 characters per shot; "exactly four members, never five" |
| Prop scale wrong | State relative size and owner of the prop |
| Sped-up or slow-motion scene | Match actions to real time; fewer events per window |
| Wardrobe changes / extras appear | List wardrobe per act; count people; "no people, no signage" for locations |
| Liquids that never settle | Describe the end state: "…makes only small natural settling movements" |
| Negatives backfire | Phrase positively ("sharp, in focus"); constraints at the end; no negative-prompt field |
| Anime/clay turns realistic 3D | Reinforce "protect the original line work" |
| Audio moderation | No music |

**Iterate one variable per re-run**; fix the weakest element instead of rewriting
everything. Iterate at 480p, deliver at 720p.

## 7. Marketing recipes

**Pipeline everyone uses:** image model (GPT Image 2.5 / Seedream) → Seedance
image-to-video → editor for text, logo and music. "Iterate the still first, then
animate." Think in 15 s montages of 4–6 shots and keep the best clips; do not try
to one-shot the whole video.

**15 s spot:** 0–4 s hook, 4–10 s proof, 10–15 s payoff. Hook before 1 s; one
readable action per shot; same product in first and last frame; room for copy.

### Product ad

Four beats: hook (contrast) → problem → proof (use) → payoff. No generated text,
logos, claims or testimonials.

```
Extreme macro shot of a luxury mechanical watch on a dark velvet surface. The second hand ticks with satisfying precision as the camera slowly orbits 360 degrees, revealing intricate engravings and sapphire crystal reflections under soft studio key lighting.
```

With a product first frame: "Use the uploaded product frame as the exact appearance
reference. Preserve the matte…" plus one single movement.

### Food and drink

Seedance 2.5 won "beverage pour physics" 3/3 in one comparison. Hook in 2 s (pour,
cheese pull, steam, crunch); macro texture; backlit steam; build to a money shot;
say where the liquid ends up.

```
a slow steady push-in at close range, a frosted glass bottle of pale-orange sparkling soda on a wet slate countertop, a tall glass of ice beside it, a hand lifts the bottle and pours a steady stream into the glass, the soda fizzing and racing with bubbles, a curl of orange zest dropping onto the foam, bright clean daylight from the upper left, fresh airy color grade, shallow depth of field.
```

### Fashion

Locked camera; only the subject moves; minimal motion ("one slow quarter-turn and
settles"). Check fit, fabric, print and logo; collect front, side/back and detail
views first.

```
An 8-second fashion lookbook clip. A model in a flowing camel-tan trench coat walks slowly toward a locked, static camera down a clean sunlit studio runway, then stops and makes a half-turn so the coat flares and settles around her.
```

### Real estate

Use the real property photo as first frame (adaptive aspect); "slow dolly, steady
gimbal"; "no people"; diegetic sound, no music. ~3 min per clip.

```
The camera glides slowly and steadily forward through the bright open-plan living room, drifting past the cream sofa toward the floor-to-ceiling windows and the green garden beyond. Soft late-afternoon daylight shifts gently across the pale oak floor, sheer curtains breathe slightly, and leaves move outside the glass. Smooth cinematic dolly motion, photorealistic real estate cinematography, steady and slow. Quiet natural room tone with faint birdsong through the glass, no music.
```

### Reels hook

9:16, 15–20 s. Human reaction in the first two seconds, handheld, cutaways on the
beat. (Our builder keeps handheld when the prompt asks for it.)

### Testimonial / UGC

A person talking to camera in a café or on a beach, lips synced, is reliable —
but with our face limits, prefer a stylized presenter or a text-described person.
Formula: `[creator persona] + [product] + [hook] + [problem] + [demonstration] + [benefit] + [reaction] + [CTA] + [camera style] + [platform format]`.
Style block: "Natural smartphone video quality. Slight realistic handheld shake."
No regulated claims and no generated testimonials presented as real.

### Logo motion design

No clean community case of an animated vector logo. Safest: logo in the first frame,
one slow camera move, "preserve the logo exactly" — or add the logo in the editor.
**Risk zone.**

## 8. Duration

4–5 s = one beat (fast iteration); 8 s = micro-narrative; 15 s = a scene; 30 s = a
full spot. 9:16 at 15–20 s for social. Available aspects in our catalog: 9:16, 1:1,
16:9, 4:3, 3:4, 21:9.

## 9. When to use another model

- Under 8 s of product with no dialogue: cheaper models do as well.
- Person talking to camera (stylized or small face), labeled product, or 15–30 s
  narrative: Seedance 2.5.
- Spectacular aerial camera: Kling 3.0.
- Realistic close-up faces: Veo 3.1 (registered as provider `google`).
- Legible text or an animated logo: none — do it in post.

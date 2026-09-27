# Script blocks and storyboard grid

**Priority:** medium · **Effort:** M (about 4 to 5 dev-days for both) · **Status:** proposed

## Summary

There are two planning generators:

1. **Script → blocks.** A brief, article or context becomes N timed video blocks. Each block has a *function*, an **image prompt** (keyframe), a separate **animation prompt** (motion only) and on-screen text, plus a voiceover plan with a per-block time range. The canvas then spawns one prompt node per block.
2. **Storyboard grid.** A story plus references becomes 9 ordered beat prompts, which are rendered as a 3×3 grid of cells.

## Why it matters for Polyvik

- It maps directly to the **Script** and **Storyboard** nodes of `video-canvas.md`. Monkey Studio's split between `imagePrompt` and `animationPrompt` is exactly the rule the plan adopts: the keyframe prompt describes the scene, and the Animate node receives a "motion-only" prompt.
- The block schema is a ready-made first version of the **Shot** object (order, duration, framing, action, dialogue).

## How Monkey Studio did it

### A. Script (`generateScriptFromGraph`, `POST /api/v2/generate-script-graph`)

Request: `{ articleText, promptTexts[], contextTexts[], productText, blockCount (1–4, default 4), secondsPerBlock (2–10, default 4), language ('es'|'en'|'pt'|'fr'|'it'|'de'), format }`.

Algorithm:

1. A beat table (HOOK, REVEAL, DETAIL, HERO + CTA) is sliced **from the end**: `beats.slice(-blockCount)`. With 1 block you get the hero+CTA, with 2 you get detail+CTA, and so on, so the CTA is always last.
2. Time range per block: `${i*s+1} - ${(i+1)*s} sec`.
3. One call to Gemini 2.5 Flash, temperature 0.4, `responseMimeType: application/json`.
4. Normalise: accept the legacy `scenes` key, clamp to `blockCount`, re-attach label, time range and duration from the table (the model's values are not trusted), and build a human-readable text echo.

Response shape:

```json
{
  "voiceover": { "tone": "...", "lines": [ { "timeRange": "0:00–0:04", "line": "..." } ] },
  "blocks": [
    { "index": 1, "label": "HOOK", "timeRange": "1 - 4 sec", "durationSeconds": 4,
      "function": "...", "imagePrompt": "...", "animationPrompt": "...", "onScreenText": "" }
  ]
}
```

The client then spawns one prompt node per block, wired from the script node (`buildBlockNodes`).

The original prompt was hard-wired to **food delivery**: food macro shots, restaurant name, a client CTA. Below is the **generic rewrite** that keeps its structure and craft rules. The food-specific wording has been removed; the requirement lists are unchanged.

Beat table (generic):

```js
const SCRIPT_BLOCK_BEATS = [
  { id: 'HOOK',     label: 'HOOK',       description: 'Open with an extreme close-up or a single tactile focal moment. Implicit motion is required (steam, drip, shimmer, light catching a surface, a hand entering frame). Image prompt terse: 1–2 short sentences. On-screen text MAY carry a teaser of max ~6 words.' },
  { id: 'REVEAL',   label: 'REVEAL',     description: 'Show the full product/subject in its real context — the "ah, this is what it is" moment. Long-form image prompt with full composition + props.' },
  { id: 'DETAIL',   label: 'DETAIL',     description: 'A single sensory detail that sells it (texture, material, mechanism, ingredient). Long-form image prompt.' },
  { id: 'HERO_CTA', label: 'HERO + CTA', description: 'Wide hero shot with intentional negative space (typically upper third) for a text overlay (logo + product name + CTA). Long-form image prompt.' },
]
```

Prompt (the generic rewrite; the lines about the required fields are verbatim from the original):

```text
You are writing a <format, e.g. "16-second vertical reel"> as <N> VIDEO blocks of <s> seconds each. These blocks will be generated as short cinematic VIDEO clips and concatenated — they are NOT still images. Match the cinematic, editorial detail level of professional reel scripts.
Write ALL output (function, image prompt, animation prompt, on-screen text, voiceover) in <Language>. Do not mix languages.
Block plan (always use these labels and time ranges, in this order):
Block 1 (1 - 4 sec) — HOOK: <beat description>
...

For each block return a richly detailed JSON entry with these fields:
- `function`: 1 sentence. Explains what THIS block does for the reel.
- `imagePrompt`: a long, cinematically specific prompt (3–6 sentences). Required ingredients: exact subject + framing (extreme macro / overhead 45° / low-angle three-quarter / wide hero / etc), composition + props (every visible item, surfaces, backgrounds, secondary objects), lighting (direction, hardness, warmth, side / overhead, sheen on wet surfaces), depth of field (razor-thin, shallow, medium), color/grade hints, and ALWAYS end with "Vertical 9:16 framing". Do NOT mention on-screen text in this prompt — text is added in edit.
- `animationPrompt`: 2–4 sentences describing the video MOTION over the full <s> seconds. Required: explicit motion verb (slow push-in / dolly-in / dolly-out / parallax / tilt-down / focus rack / hold), starting framing → ending framing, anything that moves vs stays still, motion stability ("no shake", "smooth glide"), and the closing line "24fps cinematic". Slow and editorial — no quick cuts, no zoom blur, no aggressive moves.
- `onScreenText`: the literal overlay copy (or empty string ""). Only the HERO+CTA block should normally carry text. When present, format as multi-line: a top headline (product name in caps), a subline, and a CTA line. Match the output language.

ALSO produce a `voiceover` plan that runs across the whole reel:
- `voiceover.tone`: 1–2 sentences describing voice + delivery.
- `voiceover.lines`: array with EXACTLY one entry per block, in order. Each entry { "timeRange": "0:00–0:04", "line": "..." }. Aim for ~2.5 words / second pacing (~10 words per 4-second block). Total voiceover should land under ~28 words for a 16-second reel. Last line is the CTA.

Return ONLY a single JSON object shaped like { "voiceover": { "tone": "...", "lines": [...] }, "blocks": [{ "function":"...","imagePrompt":"...","animationPrompt":"...","onScreenText":"..." }, ...] }. No markdown, no commentary.

[Brand context] / [Product context — ground every block in it] / [Additional instructions] / [Other context] / [Article content — background reference only]
```

### B. Storyboard grid (`POST /api/v2/plan-image-grid`)

Request: `{ projectId, story, directiveText, contextTexts[], referenceAssetIds[≤6], cellCount (1–16, default 9) }`. It needs at least one of story, directive or context.

Prompt (verbatim), with references attached as inline images before it:

```text
Break the story below into exactly <cellCount> ordered beats for an image grid.

[if refs] Reference image(s) attached. Do not invent substitutes for any subjects shown.
<directiveText>
<contextTexts joined by blank lines>

Story:
<story>

Return ONLY a JSON array of exactly <cellCount> strings. Each string is a self-contained image generation prompt for that beat. No markdown, no labels, no commentary.

Output format example: ["prompt 1...", "prompt 2...", ...]
```

- The model was the reasoning chain (Gemini Pro → Flash → Lite), temperature 0.6, JSON mime type.
- Recovery: if the output is not a JSON array, the first `[...]` is extracted with a regex. If fewer than `cellCount` prompts come back, the list is padded with `"<last prompt> (beat k)"` so the grid is always full.
- Client: the node collects upstream context, directive and script text plus image references (at most 6), then fires **9 parallel image generations** (`Promise.all`), each with the same references and directive. Each cell updates on its own (`gridCells[i] = { prompt, isRunning, assetUrl, assetId, error }`). The node reports an error only when **all** cells fail.

## How to implement in Polyvik

**Script node** (`video-canvas.md` → Script)

- New LLM task `video_script`: **Opus 5.5, effort high, cache "5m"** (it is the writer; its output is what gets published).
- Use `generateStructured` with a tool whose output is the **Shot list** directly:

  ```json
  {
    "type": "object",
    "properties": {
      "style": { "type": "string", "description": "Fixed style descriptor repeated in every shot block." },
      "voiceover": { "type": "object", "properties": {
        "tone": { "type": "string" },
        "lines": { "type": "array", "items": { "type": "object",
          "properties": { "shot": {"type":"integer"}, "line": {"type":"string"} }, "required": ["shot","line"] } } } },
      "shots": { "type": "array", "items": { "type": "object", "properties": {
        "order": {"type":"integer"}, "beat": {"type":"string"}, "durationSeconds": {"type":"integer"},
        "function": {"type":"string"}, "framing": {"type":"string"}, "camera": {"type":"string"},
        "keyframePrompt": {"type":"string"}, "motionPrompt": {"type":"string"},
        "audio": {"type":"string"}, "dialogue": {"type":"string"}, "onScreenText": {"type":"string"},
        "elements": {"type":"array","items":{"type":"string"}} },
        "required": ["order","durationSeconds","keyframePrompt","motionPrompt"] } }
    },
    "required": ["shots"]
  }
  ```

- Add the plan's rules to the prompt: English for image/video prompts and the audience language for dialogue; about 20–24 words of narration per 10 s; numbers written out; phrase things positively; a single action per shot; the style descriptor identical in every shot.
- **Durations:** instead of `blockCount × secondsPerBlock`, take the total duration and snap each shot to durations the chosen model accepts (`durationsFor` in `videoModels.config.js`). The "slice beats from the end so the CTA survives" trick is still worth keeping for short ads.
- Voiceover goes out as **text only**, since voice/TTS was removed from Polyvik. It feeds subtitles in Assemble, or Seedance native audio.
- Route `POST /canvas/script`, `credit("assist")`.

**Storyboard node** (`video-canvas.md` → Storyboard)

- The plan prefers **one 3×3 grid in a single generation** (shared identity and lighting), cut into cards. Monkey Studio instead generated 9 separate images. Offer both:
  - *Grid mode (default, cheap):* 1 GPT Image 2.5 call with a composite prompt ("3×3 storyboard, panel 1: …"), then cut into 9 cards with `sharp` (equal thirds, trimming a known gutter). Cost: 1 image credit.
  - *Cells mode (quality):* the Monkey Studio approach, N parallel calls through `generateNodeImage` with shared references. Cost: N image credits, shown up front.
- The beat planner prompt above can be reused almost as is. Task `storyboard_beats`: **Sonnet 5, effort low**; the tool output is `{ beats: string[] }` with exactly N items (enforced by `minItems`/`maxItems`), which removes the padding hack.
- When the Script node feeds the Storyboard, skip the planner: use each shot's `keyframePrompt` directly.
- Each card can be promoted to a Keyframe (as its start frame, or as a composition reference only).

## Risks and open questions

- Grid-mode cut accuracy: image models do not always respect equal panels. A vision check of panel borders, or a fallback to cells mode, may be needed.
- Script quality depends heavily on the brand context: feed brand DNA (voice, forbidden claims) the same way copy generation does.
- The 1–4 block cap was specific to Monkey Studio; Polyvik should allow more shots, bounded by the model's total-duration limits.

## Effort

- Script task, schema, route and node: 2–3 d
- Storyboard planner and grid/cells generation with cutting: 2 d

**Depends on:** video canvas Shot model; `pipeline-chat-builder.md` is optional (it can emit Script/Storyboard nodes).

## Source (archived)

- Server `Hivek-Dev/monkey-studio-server` @ `2394f22a30c1ae56a5f46733ff89d6c1e0a75e43`: `src/server.js` — `SCRIPT_BLOCK_BEATS`, `formatBlockTimeRange`, `generateScriptFromGraph`, `POST /api/v2/generate-script-graph`, `POST /api/v2/plan-image-grid`
- Client `Hivek-Dev/monkey-studio-client` @ `8d742b58dd8139129d6c9c723fe4c5f87feb9e58`: `src/features/creative-studio/useCreativeStudioCanvas.js` (imageGrid and scriptPrompt run branches, `buildBlockNodes`)

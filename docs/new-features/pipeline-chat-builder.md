# Pipeline chat builder

**Priority:** high · **Effort:** L (about 8 to 12 dev-days) · **Status:** proposed

## Summary

A chat dock on the canvas that turns a plain-language goal ("a 12 s vertical reel of our e-bike, hero image first, then animate it") into a ready-wired graph of canvas nodes. The user sees one or more suggestion cards (name, summary, output badge, editable settings) and presses **Build** to drop the graph on the canvas. The same dock also accepts a pasted JSON or Markdown spec and builds it locally, with no LLM call.

Monkey Studio had three layers:

1. **Pipeline SDK** (client, deterministic): a kind catalog with aliases, builders, a JSON/Markdown parser, an inflater that lays out nodes in columns, and per-model video clamping.
2. **`POST /api/v2/pipeline-suggest`** (server): Claude Sonnet with a system prompt that teaches the node vocabulary, plus the user's saved skills so it can pick one.
3. **`PipelineChatDock`** (client UI): Conversation, Templates and History tabs; style-hint chips; quick-reply chips; reference uploads that are analysed by vision and wired into the graph at build time.

## Why it matters for Polyvik

- The video canvas (`docs/video-canvas.md`) adds seven node types (Script, Element, Storyboard, Keyframe, Animate, Extend, Assemble). Wiring them by hand is the biggest usability barrier. A chat that emits the whole Shot graph, with gates already in place, makes the MVP usable by non-experts.
- It gives canvas templates a single representation: a template is just a spec, and the chat, the template gallery and any future "save canvas as template" all share it. See `small-gaps.md` §4.
- The SDK's kind catalog doubles as the **declarative node catalog** the video canvas plan asks for (§4 of the plan: "Declarative per-model catalog").

## How Monkey Studio did it

### Flow

```
user text ──► parseStructuredSpec(text)
                 │ returns spec? ──yes──► inflateGraph(spec) ──► suggestion card ──Build──► addCustomGraph(nodes, edges)
                 │ no
                 ▼
     POST /api/v2/pipeline-suggest { message, history[-6], references[] }
                 ▼
     { reply, suggestions: [{ name, summary, nodes, edges, requestedUploads? }], quickReplies[] }
                 ▼
     inflateGraph(each suggestion) ──► cards (+ quick-reply chips)
```

- History: the last 6 turns only (`rawHistory.slice(-6)`), with `{ role, text }`.
- Sessions are stored per project in `localStorage` (`monkey-studio:chat-sessions:<projectId>`, max 50 sessions).
- **Style-hint chips** (`Moody warm`, `Cinematic`, `Slow push-in`): the active chip is appended to the next user message.
- **Suggestion card settings panel:** before Build, the user can change aspect ratio, duration, resolution, audio, model and "auto-play on build". The settings apply only to the primary generator (for image+video "mixed" pipelines, only the video node is touched, so the tier wiring is not broken).
- **Output badge:** `detectPipelineOutputKind` returns `video | image | text | mixed | unknown`. It was added because users started video spend thinking they would get an image.
- **Reference uploads:** the paperclip uploads to `/api/assets`, then calls `POST /api/v2/describe-reference { assetId, kind }` → `{ description }`. The client (origin/main) calls this endpoint, but it was **never shipped on the server main branch**. At Build time:
  - each upload becomes an `assetOutput` node with `role: 'reference'`, parked in a column to the left of the graph (`minDx − 480`, 400 px row gap);
  - it is wired to the generator named by the slot's `wireTo`. If `wireTo` points at a text node, a BFS walks downstream to the first generator. Last resort: the first generator in the spec. For ad-hoc uploads the priority is `videoNode > imageNode > universalNode`;
  - the vision description is **prepended** to the context card whose title matches the slot kind (regex `character|presenter|subject|person|protagonist|host` for characters, `product|item|…` for products).
- `requestedUploads` slot shape, as the client reads it: `{ id, label, kind: 'character'|'product'|'image', wireTo: <spec node id> }`.
- **Meta-apology scrub** (server): if the reply contains phrases like "couldn't parse" or "try rephrasing", it is replaced by `"I need a bit more to go on — what kind of output are you after?"` with default chips `['A single image', 'A short video', 'A multi-tier ad', 'Something else']`.
- Server validation: keep only suggestions with a non-empty `nodes` array and an `edges` array; at most 6 quick replies.
- Skills catalog: up to 64 skills, each `{ id, title, summary: description.slice(0, 280) }` (about 18 KB of prompt).

### Spec format (the wire contract)

Flat JSON:

```json
{
  "name": "Pipeline name",
  "summary": "Optional one-liner",
  "nodes": [
    { "id": "ctx-1", "kind": "contextCard", "title": "Dog", "text": "..." },
    { "id": "img-1", "kind": "imageNode", "title": "Hero", "prompt": "...", "aspectRatio": "9:16" }
  ],
  "edges": [ { "from": "ctx-1", "to": "img-1" } ]
}
```

Tiered JSON: `{ "name", "tiers": [ { "nodes": [...], "wires": [...] }, ... ] }`. Tiers are flattened, and `wires` and `edges` are interchangeable.

Markdown (flat or tiered). A `##` header that is not a known kind is treated as a tier label, and `###` headers are nodes. The body becomes `text`, `prompt` (image/video) or `url`:

```markdown
# E-bike commercial

## Tier 1: Studio reference
### context: Bike spec
Matte black, integrated battery, walnut grips
### image: Reference
Clean studio shot, neutral grey infinity
### play
### wires
play -> Reference
Bike spec -> Reference

## Tier 2: Hero
### character: Rider
Late 30s, athletic, tactical confidence
### image: Hero
Rider mounting the bike, golden hour city street
### wires
Reference -> Hero
Rider -> Hero
```

Wire resolution in Markdown: exact title (case-insensitive), then slugified title, then kind name (so `play -> X` works). Markdown cannot carry inline fields such as duration; use JSON for those.

### Parser details worth keeping

- JSON is detected by a leading `{` or `[`; for an array, the first element is used.
- Markdown is detected by `/(^|\n)#{2,3}\s+\w/` **or** a mid-string `##` (flattened paste). Newlines are re-injected with `.replace(/(\S)\s*(#{1,3}\s)/g, '$1\n$2')`.
- Header regex: `/^([a-z]+)\s*(?:[:\-]\s*(.+))?$/i` → `kind: title`.
- Wire line regex: `/(.+?)\s*-{1,2}>\s*(.+)/` (accepts `->` and `-->`).
- Markdown node ids: `${kind}-${slug(title)}-${counter}`.
- It returns `null` when the input is not structured, and the caller then falls back to the LLM.

### Kind aliases (verbatim from `kinds.js`)

```js
export const KIND_ALIASES = Object.freeze({
  // Sources / inputs
  context: 'contextCard', contextcard: 'contextCard',
  url: 'urlSource', urlsource: 'urlSource',
  character: 'character',
  brief: 'directive', directive: 'directive', brand: 'directive',
  styleguide: 'directiveBus', stylebus: 'directiveBus', directivebus: 'directiveBus',
  // Generators
  prompt: 'universalNode', universal: 'universalNode', text: 'universalNode',
  image: 'imageNode', img: 'imageNode',
  video: 'videoNode', vid: 'videoNode',
  // Post-process / transformations
  imagegrid: 'imageGrid', grid: 'imageGrid', storyboard: 'imageGrid',
  imageextend: 'imageExtendControls', outpaint: 'imageExtendControls', extendimage: 'imageExtendControls',
  videocrop: 'videoCropControls', cropvideo: 'videoCropControls',
  videoextend: 'videoExtendControls', extendvideo: 'videoExtendControls', scene: 'videoExtendControls',
  videoconcat: 'videoConcat', joinclips: 'videoConcat', concat: 'videoConcat',
  videostitch: 'videoStitch', stitch: 'videoStitch',
  // Planning (legacy)
  script: 'scriptPrompt', scriptprompt: 'scriptPrompt',
  timeline: 'timeline', shotsequence: 'timeline', shots: 'timeline',
  // Controls (legacy)
  controls: 'controls', imagecontrols: 'imageControls',
  // Run
  play: 'play',
  // Annotation
  label: 'label', note: 'label',
  comment: 'commentThread', comments: 'commentThread', thread: 'commentThread', commentthread: 'commentThread',
  // Uploaded references
  assetoutput: 'assetOutput', reference: 'assetOutput', ref: 'assetOutput', imageref: 'assetOutput', asset: 'assetOutput',
})
```

`normaliseKind(raw)` accepts an alias or a canonical name, case-insensitive, and returns `null` when the kind is unknown. `kindRole()` classifies a kind as `source | generator | transform | planning | controls | run | annotation`.

### Layout algorithm (`computeDepths`)

1. **ASAP:** depth = longest path from any node without parents (memoised DFS, cycle-safe).
2. **ALAP for pure sources:** a node with no parents but with consumers moves to `min(consumer depth) − 1`, so tier-3 context cards sit next to the tier-3 generator instead of all piling up in column 0.
3. Position: `dx = depth × 640`, `dy = indexInColumn × 400`. Canvas ids are `chat-<kind>-<ts>-<i>` so building the same spec twice never collides. Edges pointing at unknown ids or at the node itself are dropped.

### Per-model video clamping (`videoConstraints.js`)

The inflater clamps each video node's fields to what the chosen model accepts, so the node displays the real value instead of one the server rewrites silently:

- **Duration:** nearest allowed value; **a tie rounds up** ("at least what they asked for"); values above the maximum or below the minimum snap to the edge.
- **Aspect ratio:** keep it if allowed; otherwise use `9:16` if the model allows it; otherwise the model's default.
- **Resolution:** walk **down** `['480p','720p','768p','1080p','4k']` from the requested rung to the first one allowed.
- An unknown model id falls back to the default model's limits (permissive), not an error.

The table lists models Monkey Studio used; rebuild it from Polyvik's `videoModels.config.js` rather than copying these numbers.

### The system prompt (verbatim, generic enough to reuse)

The skills addendum is appended when the user has saved skills:

```text
The user has these saved Skills (AI personality / writing style / domain presets) available on their account. When you emit a directiveBus, populate its "skillId" field with the id of the skill that BEST matches the pipeline's domain and intent. Match against the skill descriptions — they list explicit trigger keywords. If truly NONE of these apply (rare), leave skillId as "". Do not invent skill ids that aren't in this list.

Available skills:
- <id> (<title>): <summary ≤280 chars>
```

Base prompt (`PIPELINE_SUGGEST_SYSTEM_PROMPT`; product name replaced by `<APP>`):

```text
You are the pipeline assistant for <APP>, a node-based generative-AI canvas. Your job: translate a user's natural-language goal into a concrete pipeline that can be spawned on the canvas with one click.

Available node kinds (pick the right tool for the job, don't fall back to context+image for everything):

SOURCES (no inputs — they feed downstream):
- contextCard: static text feeder. For object/scene descriptions, briefs, anything you want included as upstream context. Fields: "title", "text".
- character: character anchor — fixed subject description (face, build, wardrobe, voice). Use for keeping a person/creature consistent across many generations. Fields: "title", "text" (the anchor description).
- directive: project-level direction (audience, goal, tone, brand voice). Use for campaign-wide rules that influence every generator downstream. Fields: "title", "text".
- directiveBus: style + personality bus. Carries TWO selectors that apply downstream: a saved Directive (palette / moodboard / visual style) AND a saved Skill (AI personality / voice / writing style). Use whenever the user mentions "personality", "voice", "skill", "style guide", "palette", "moodboard", or wants a reusable preset to apply to many generators. Fields: "title", "directiveId" (leave empty unless the user names a specific saved directive), "skillId" (REQUIRED to be the best-matching id from the saved-skills catalog at the bottom of this prompt — pick whichever one's description matches the pipeline's domain; only leave empty as a last resort if NOTHING matches).
- urlSource: fetches an article from a URL — body text + images flow downstream. Fields: "title", "url".

GENERATORS (consume upstream context, produce assets):
- universalNode: multi-mode generator. In text mode it's a prompt-authoring surface that emits text into downstream image/video generators. Fields: "title", "text", and optionally "aspectRatio" / "durationSeconds" / "resolution" / "model" if the user named one.
- imageNode: image generator. Connect contextCards / characters / directives upstream + (optional) image references. Fields: "title", "prompt", and optionally "aspectRatio" (e.g. "16:9", "9:16", "1:1") and "model" (only if the user named one). Set these directly on the imageNode rather than spawning a separate controls panel.
- videoNode: video generator. Connect text/context + optional reference frames or earlier-tier images. Fields: "title", "prompt", and these inline settings — set whichever the user mentioned: "durationSeconds" (string, e.g. "8", "12"), "aspectRatio" (e.g. "9:16", "16:9", "1:1"), "resolution" (e.g. "1080p", "720p"), "generateAudio" ("true" or "false"), "model" (only if named). DO NOT emit a separate timeline/controls panel for these — set them inline on the videoNode itself.
- imageGrid: 3×3 storyboard grid generator. Connect a story (contextCard) upstream and it produces 9 ordered scene images. Use for storyboards and mood grids. Fields: "title", "gridSize" (default "3x3").
- scriptPrompt: structured reel-script generator (HOOK → REVEAL → DETAIL → CTA). Connect article/context upstream. Fields: "title", "blockCount" (default "4"), "language" (e.g. "en", "es").

POST-PROCESS / TRANSFORMATIONS (consume an existing asset, output a transformed one):
- imageExtendControls: outpaint or pad an existing image into a new aspect ratio. Use when the user says "extend", "outpaint", "wider", "taller". Fields: "title", "targetAspectRatio" (e.g. "16:9"), "mode" ("ai-extend" or "pad").
- videoCropControls: crop or letterbox a video into a new aspect ratio. Fields: "title", "targetAspectRatio", "mode" ("crop" or "letterbox").
- videoExtendControls: continuous next-scene generator — last frame of source video becomes the start of a new clip. Fields: "title", "text" (becomes the next-scene intent).
- videoConcat: joins multiple finished videos into one. Fields: "title".
- videoStitch: v2 of videoConcat — preserves per-clip aspect ratios and audio for mixed dims. Fields: "title".

PLANNING / NOTES:
- For pacing, beat-by-beat shot lists, voiceover scripts, mood notes, anything prose-y about timing or structure — use a contextCard with the prose in its "text" body and connect it upstream of the generator. The generator already accepts free-form context that way.
- DO NOT emit "timeline", "controls", or "imageControls" panels. Those exist in the catalog but are deprecated for chat-spawned pipelines — generator-level settings (duration, aspect, resolution, audio, model) belong on the generator node itself (see imageNode / videoNode field notes above), and prose belongs on a contextCard.

ORCHESTRATION:
- play: connect TO any generators so the user can press one button to run the whole branch.

ANNOTATION:
- label: free-floating text label on the canvas. Does NOT influence generation. Use only for visual annotations the user explicitly asks for.

Connection rules (edges go from -> to):
- contextCard / character / directive flow INTO imageNode / videoNode / universalNode as upstream context.
- universalNode (text mode) flows INTO imageNode / videoNode as a prompt source.
- An imageNode flows INTO another imageNode/videoNode as a visual reference (this is how multi-tier pipelines chain — tier 2 imageNode receives tier 1 imageNode as a reference).
- urlSource flows INTO scriptPrompt or contextCard so the article body becomes context.
- imageGrid / scriptPrompt receive context and produce structured outputs.
- imageExtendControls / videoCropControls / videoExtendControls receive an upstream asset they transform.
- videoConcat / videoStitch receive multiple completed videos.
- play connects TO the generators (play -> imageNode) so the user can press it once.

Picking the right kind:
- "describe X" / "anchor for X" / "make X consistent" → contextCard or character
- "brand voice" / "campaign direction" / "tone for the whole project" (free text the user gave you) → directive
- "personality" / "voice" / "skill" / "style guide" / "palette" / "saved preset" / "moodboard" → directiveBus (the saved-skill + saved-directive bus the user picks from after spawn)
- "fetch this article" / "from this URL" → urlSource
- "storyboard" / "9 scenes" / "grid of frames" → imageGrid
- "reel script" / "TikTok script" / "HOOK / CTA structure" → scriptPrompt
- "make this wider" / "outpaint" / "extend the image" → imageExtendControls (snap onto an imageNode)
- "crop this video" → videoCropControls
- "next scene" / "continue this clip" → videoExtendControls
- "join these clips" / "concat" → videoConcat
- "plan the timing" / "shot sequence" / "pacing" / "beats" / "voiceover" → contextCard with the prose in its body, connected to the generator. (NOT a timeline node.)
- "12s reel" / "9:16 vertical" / "1080p" / "with audio" / "with the X model" → set those values DIRECTLY on the videoNode/imageNode's fields (durationSeconds, aspectRatio, resolution, generateAudio, model). Don't spawn a separate panel.
- "image of X riding Y" → contextCard(s) + imageNode

When the user mentions BOTH free-text personality (which you can write into a "directive" body) AND a saved skill they want applied, emit BOTH a "directive" node (with the prose) AND a "directiveBus" node (the saved-skill bus). They serve different layers — the directive node is project-level prose direction, the directiveBus references the user's saved Skill / saved Directive presets.

Respond with ONLY a single JSON object as the last line of your response. No markdown, no code fences, no commentary.

Schema:
{
  "reply": "<one short friendly sentence to the user>",
  "suggestions": [
    {
      "name": "<short pipeline name, max 5 words>",
      "summary": "<one-line description of what this pipeline does>",
      "nodes": [
        { "id": "ctx-dog", "kind": "contextCard", "title": "Dog", "text": "<rich description>" },
        { "id": "ctx-bike", "kind": "contextCard", "title": "Bike", "text": "<rich description>" },
        { "id": "main-prompt", "kind": "universalNode", "title": "Prompt", "text": "<the main idea>" },
        { "id": "img", "kind": "imageNode", "title": "Image", "prompt": "<image prompt>" },
        { "id": "play", "kind": "play" }
      ],
      "edges": [
        { "from": "ctx-dog", "to": "img" },
        { "from": "ctx-bike", "to": "img" },
        { "from": "main-prompt", "to": "img" },
        { "from": "play", "to": "img" }
      ]
    }
  ]
}

Tiered (multi-stage) pipelines:
The user may ask for a "tier 2", "tier 3", "two-tier", or "three-tier" pipeline. This means a chained-generation graph where each tier consumes the OUTPUT of the previous tier as a reference, plus its own additional inputs. Example: tier 1 is a contextCard + imageNode (produces image A). Tier 2 has imageNode B that takes image A as a reference, plus a fresh contextCard for the new variation. Tier 3 has a videoNode that takes image B as a reference, plus three more contextCards and an extra image upload.

To express tiers, emit nodes/edges where later-tier nodes reference earlier-tier node IDs in their incoming edges. The canvas lays this out left-to-right automatically by longest-path depth, so just wire correctly and tiers visualize themselves. The whole graph still goes in ONE flat "nodes" + "edges" pair — there is no separate "tiers" field in the JSON you emit, just a connected graph. Each generator node (imageNode, videoNode) you place at tier N+1 should have at least one incoming edge from a tier-N generator's id.

Hard rules:
- Always pre-fill every node with concrete content from the user's request. Never leave "text" or "prompt" empty if the user gave you details.
- IDs must be short, stable, lowercase-kebab strings unique within the suggestion.
- Each edge's "from" and "to" must reference IDs that exist in this suggestion's nodes array.
- Default to ONE suggestion unless the user explicitly asks for variants or alternatives.
- Output JSON only.

NEVER apologise about your own output format.
- DO NOT emit replies like "I produced output that I couldn't parse", "couldn't parse cleanly", "try rephrasing", "paste a JSON / Markdown spec directly", or any meta-commentary about the response shape. The user does not see your raw output — they see the rendered card, so meta-apologies make no sense to them.
- If the user's request is genuinely too vague to draft a pipeline, DO NOT punt with an apology. Instead emit a clarifying question in "reply" + 2–4 "quickReplies" chips so the user can answer in one tap. Leave "suggestions" empty in that case.
- If the user's request is off-topic for pipeline construction (small talk, etc.), still emit a short friendly reply and ONE simple suggestion (e.g. a placeholder contextCard) — never refuse to produce a suggestion.
- The JSON schema above is the ONLY allowed output shape. There is no fallback shape. If you would otherwise refuse, return suggestions: [] and a clarifying-question "reply".
```

Note: the schema in the prompt omits `quickReplies` and `requestedUploads`, although the server reads the first and the client reads the second. In Polyvik both belong in the tool schema.

## How to implement in Polyvik

**Core**

- New service `src/services/canvasPipeline.services.js` with `suggestPipeline({ tenant, brandId, message, history, references })`.
- Call it through `generateStructured` with a **tool schema** instead of "JSON as the last line", which removes the regex extraction and the meta-apology problem. Suggested tool `deliver_pipeline`:

  ```json
  {
    "type": "object",
    "properties": {
      "reply": { "type": "string" },
      "quickReplies": { "type": "array", "items": { "type": "string" }, "maxItems": 4 },
      "suggestions": {
        "type": "array", "maxItems": 3,
        "items": {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "summary": { "type": "string" },
            "nodes": { "type": "array", "items": { "type": "object",
              "properties": { "id": {"type":"string"}, "kind": {"type":"string", "enum": ["<Polyvik kinds>"]},
                "title": {"type":"string"}, "text": {"type":"string"}, "prompt": {"type":"string"},
                "fields": {"type":"object"} },
              "required": ["id","kind"] } },
            "edges": { "type": "array", "items": { "type": "object",
              "properties": { "from": {"type":"string"}, "to": {"type":"string"} }, "required": ["from","to"] } },
            "requestedUploads": { "type": "array", "items": { "type": "object",
              "properties": { "id": {"type":"string"}, "label": {"type":"string"},
                "kind": {"type":"string","enum":["character","product","place","logo","style"]}, "wireTo": {"type":"string"} },
              "required": ["id","label","kind","wireTo"] } }
          },
          "required": ["name","summary","nodes","edges"]
        }
      }
    },
    "required": ["reply","suggestions"]
  }
  ```

- LLM task: `canvas_pipeline` in `llmTasks.config.js`, **Sonnet 5, effort medium, cache "5m"**. Split the system prompt into `{ stable: catalog + rules, variable: skills + brand + characters }` so the catalog is cached.
- Inject Polyvik context instead of generic "saved skills": the `skills/` folder (01–15) via `skillsLibrary.services.js`, the brand's saved directives (`listDirectives`), and **characters** (`listCharacters`), so the model can emit an Element node bound to an existing character id.
- Route: `POST /canvas/pipeline-suggest`, `credit("assist")`. The local parse path costs nothing.
- Validate on the server: unknown kinds are dropped, edges to missing ids are dropped, gates are enforced (an Animate node without an upstream Keyframe is rejected, per §5 of the plan).
- Reference analysis: reuse `asset_describe` (Haiku) from `assets.services.js` instead of building a new describe endpoint.

**Panel**

- Port the SDK to TypeScript under `polyvik-panel/src/pages/canvas/pipeline/` (`kinds.ts`, `parser.ts`, `inflater.ts`, `videoLimits.ts`). The kind catalog becomes Polyvik's: `textNode`, `imageNode`, `videoNode` today, plus Script, Element, Storyboard, Keyframe, Animate, Extend and Assemble from the video canvas plan.
- Take video limits from `GET /video/models` (backed by `videoModels.config.js` and `durationsFor`) instead of a hard-coded table.
- Dock UI in the ADN style (outline borders, discreet backgrounds, pills with icons). The Conversation, Templates and History tabs carry over. History can stay in `localStorage` (a per-viewer convenience).
- Suggestion cards must show the **estimated cost** before Build (`estimateVideoCost` for video nodes) and never auto-run video. The "auto-play on build" toggle is allowed for image-only graphs only (approval-before-spend rule).

**Link to video canvas nodes**

| Chat intent | Nodes emitted |
|---|---|
| "30 s ad for X" | Script → N × (Keyframe → Animate) → Assemble |
| "storyboard first" | Script → Storyboard (see `script-and-storyboard-grid.md`) |
| "use Ana (character)" | Element(character id) wired to every Keyframe |
| "continue this clip" | Extend (see `scene-continuity.md`) |

## Risks and open questions

- Emitting a whole Shot graph means pre-filling many prompts at once, so the output tokens grow. Cap it at about 6 shots per suggestion and let the Script node expand the rest.
- The layout must know Polyvik's real node widths; the numbers 640 and 400 fitted Monkey Studio nodes.
- Should the chat be able to **edit** an existing canvas ("make shot 3 darker")? Monkey Studio only appended graphs. Recommendation: append-only for v1.
- The Markdown format is a power-user feature; keep the parser but hide the syntax from the UI.
- Skill auto-pick: Polyvik skills are video styles (01–15), so the prompt text must describe them as such.

## Effort

- SDK port to TS (kinds, parser, inflater, limits) with unit tests: 2–3 d
- Core service, tool schema, validation and route: 2 d
- Dock UI (tabs, cards, settings, uploads): 3–4 d
- Integration with video canvas nodes: 1–2 d (after the MVP nodes exist)

**Depends on:** video canvas MVP nodes (for the video part); image-only pipelines can ship first.

## Source (archived)

- Client `Hivek-Dev/monkey-studio-client` @ `8d742b58dd8139129d6c9c723fe4c5f87feb9e58` (origin/main):
  `src/features/chatbot/PipelineChatDock.jsx`, `src/features/chatbot/sdk/{README.md,builders.js,index.js,inflater.js,kinds.js,parser.js,videoConstraints.js}`
- Server `Hivek-Dev/monkey-studio-server` @ `2394f22a30c1ae56a5f46733ff89d6c1e0a75e43` (main):
  `src/server.js` — `PIPELINE_SUGGEST_SYSTEM_PROMPT` and `POST /api/v2/pipeline-suggest`

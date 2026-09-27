# Prompt and direction chats

**Priority:** medium · **Effort:** M (about 3 to 4 dev-days) · **Status:** proposed

## Summary

Monkey Studio had three small LLM helpers. They share one pattern: a **two-mode chat**. In one mode the AI asks one question at a time; in the other it produces the final artifact.

1. **Prompt chat / "Improve" button** (`optimizePromptFromChat`, `POST /api/v2/prompt-chat`):
   - `reply` mode is a prompt-engineering interview;
   - `rewrite` mode returns one optimized production prompt.

   The **Improve** (✨) button on a node is `rewrite` with an empty transcript. It writes the result back in place, and if the node already had generated text, it pushes the rewrite onto that node's text history.
2. **Direction interview** (`craftDirectiveFromChat`, `POST /api/v2/directive-chat`):
   - `question` mode asks the next question about goal, audience, palette, light, and so on;
   - `finalize` mode writes a reusable visual directive.
3. **Directive → starter canvas** (`planDirectiveNodes`, `POST /api/v2/plan-directive-nodes`): a directive paragraph becomes a small pre-wired node pack (a "blueprint") that the user can drop on the canvas.

## Why it matters for Polyvik

- Polyvik already extracts directives **from images** (`extractDirective` in `canvas.services.js`). It cannot yet build a directive **from a conversation** for users who have no reference image. That is the interview.
- The canvas has no "Improve prompt" action today. It is a one-click, low-cost win that fits the "assist" credit.
- The blueprint planner becomes a building block for canvas templates (`small-gaps.md` §4) and for the pipeline chat (`pipeline-chat-builder.md`).

## How Monkey Studio did it

Shared mechanics:
- Messages are sanitised to `{ role: 'user'|'assistant', content }`, each at most 4000 chars. The prompt chat keeps the last 30 messages, the directive chat the last 20.
- The transcript is rendered as `AI: …` / `User: …` lines inside a single text prompt, with no multi-turn API.
- Model chain: Gemini 2.5 Pro → Flash → Flash-Lite, temperature 0.6 (the planner used 0.35).
- Prompt chat billed credits from token usage **after** a successful call ("failures don't bill").

### 1. Prompt chat: prompts (verbatim)

`rewrite` mode:

```text
You are a prompt engineer rewriting an image/video generation prompt.
Output ONE optimized production prompt that improves the user's draft. Do not ask questions. Do not reply conversationally. Do not add greetings or commentary.
Requirements:
- Dense single paragraph, 2-5 sentences, imperative voice.
- Front-load the subject / shot type, then add camera, lens, lighting, mood, palette, medium, era if relevant.
- Preserve any anchor subjects the user named verbatim — do not invent substitutes.
- No markdown, no labels, no quotes, no preamble, no questions. Return ONLY the rewritten prompt text.

Current draft to rewrite:
<draft ≤4000 chars>

Prior conversation (for context only — do NOT respond to it, only use it to inform the rewrite):
<transcript, omitted when empty>
```

Lesson recorded in the code: an earlier placeholder ("begin by asking…") that was shown when the transcript was empty leaked reply-mode behaviour into rewrite mode. **Omit the transcript block entirely when it is empty.**

`reply` mode:

```text
You are a prompt engineer helping the user craft or improve a generation prompt for an image or video model.
Default behavior: ask ONE short, specific question at a time to fill gaps — subject identity, shot type (wide/medium/close), camera angle/lens, lighting, palette, mood, medium (photo/illustration/3D), references.
If the user is already satisfied or asks for a rewrite, briefly confirm and suggest they click "Apply rewrite" (do not rewrite yourself yet — the rewrite mode handles that).
Keep each message tight (one or two sentences). No markdown. No greetings.
If you see the user typing a fully-formed request (not asking for help), diagnose what is missing in at most two bullets, then ask a single follow-up question to cover the biggest gap.

Current prompt draft (for context):
<draft>

Transcript so far:
<transcript>   |   (no messages yet — begin by asking what they want to generate)
```

### 2. Direction interview: prompts (verbatim)

`question` mode:

```text
You are a creative director interviewing the user to craft a reusable visual directive for their project.

Ask ONE short, specific question at a time to fill gaps in: goal/format (ad, editorial, social…), audience, brand/tone, palette, lighting mood, composition, medium (photo/illustration/3D), era or references.

Keep each question tight (one sentence, optionally 2-3 quick options in parentheses).

Do NOT summarize, do NOT write the directive yet, do NOT greet — just the next question.

Transcript so far:
<transcript | "(no messages yet — start the interview)">
```

`finalize` mode:

```text
You are a creative director. Based on the interview transcript below, produce the final reusable visual directive.

Focus on universal style rules (lighting, palette, composition, texture, tone, medium), NOT subject specifics.

One dense paragraph, 2-5 sentences, imperative. No markdown, no labels, no quotes. Return only the directive.

Transcript:
<transcript>
```

### 3. Directive → starter canvas (blueprint planner)

Allowed kinds: `context`, `directive`, `emptyImage`, `emptyVideo`, `controls`, `imageControls`, `urlSource`.

Response schema (Gemini `responseSchema`, verbatim):

```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "summary": { "type": "string" },
    "nodes": { "type": "array", "items": { "type": "object", "properties": {
      "kind": { "type": "string", "enum": ["context","directive","emptyImage","emptyVideo","controls","imageControls","urlSource"] },
      "title": { "type": "string" }, "hint": { "type": "string" }, "defaultText": { "type": "string" } },
      "required": ["kind","title","hint"] } },
    "edges": { "type": "array", "items": { "type": "object", "properties": {
      "fromIndex": { "type": "integer" }, "toIndex": { "type": "integer" } },
      "required": ["fromIndex","toIndex"] } }
  },
  "required": ["name","summary","nodes","edges"]
}
```

Instructions (verbatim):

```text
You are a creative production planner.
Given the Directive below (a universal art-direction paragraph), propose a small node pack that, when instantiated on a canvas, gives the user a pre-wired starting workspace to produce the image the directive describes.

Rules:
- Choose node kinds strictly from: context, directive, emptyImage, emptyVideo, controls, imageControls, urlSource.
- MANDATORY: the pack MUST include exactly ONE `context` node titled "Main prompt" (or similar) with an EMPTY `defaultText`. This is where the user writes the scene description for the main generation — it drives the hero output. Its hint should tell the user what to write here (e.g. "Describe the hero scene/subject to generate — the directive applies the style on top.").
- MANDATORY: the pack MUST include exactly ONE `controls` node attached to (edge from) the Main prompt. This controls node drives generation settings (aspect ratio, size, preset, model) for the hero output.
- Use additional `context` text nodes for supporting material: copy/headline, product specs, hex color palettes, typographic specs, composition instructions — one concern per node, not a wall of text. These are NOT the Main prompt.
- Use `directive` to pin the art-direction paragraph in the canvas.
- Use `emptyImage` for BOTH the hero output AND any reference images the user should upload (hero object, logo, talent). A single `emptyImage` slot can be filled by Play (generation) or by clicking Upload (file from disk). Prefer one hero output first; add more only if the directive clearly implies variants or distinct reference roles.
- Use `emptyVideo` the same way for video slots.
- Use `imageControls` for reference image slots that need a role (reference / start-frame / end-frame). Do NOT use `imageControls` for the hero output — its controls node already handles it.
- Keep the pack tight: typically 5–9 nodes. Never exceed 10.
- Title each node with 1–3 words; `hint` is a one-sentence instruction for the user on what to put there.
- Include `defaultText` ONLY for context nodes that carry stable, known content (hex palette list, brand typography spec, fixed copy). The Main prompt MUST have empty `defaultText`. Leave empty otherwise.
- Edges: the Main prompt and all supporting `context` nodes and `directive` feed the hero `emptyImage`. The `controls` node attaches to the Main prompt (not via edge — attachment is magnetic; still emit the edge from Main prompt → hero emptyImage).
- `name` is a short, human memorable label (3–6 words) for this pack.
- `summary` is one sentence describing what the pack is for.

Directive (working name: "<name>"):
<directiveText>

Output must be valid JSON matching the response schema. No markdown, no commentary.
```

Post-processing: drop kinds that are not allowed, keep at most 10 nodes, clamp strings (title 120, hint 600, defaultText 8000), and drop edges that are out of range or point at the node itself.

## How to implement in Polyvik

**Prompt Improve and prompt chat**

- New LLM task `prompt_improve`: **Sonnet 5, effort low**, no cache. Tool `{ prompt: string }` for rewrite and `{ reply: string }` for reply.
- **Adapt the rewrite rules to Polyvik's prompt rules** (`video-canvas.md` §3):
  - short prompts: "very long prompts distort", so cap the rewrite at about 60–80 words for images;
  - for image **edits**, rewrite only *what changes*;
  - for **Animate**, rewrite motion only;
  - keep `@Image N` role mentions verbatim;
  - phrase things positively.

  Pass the node type (`image | edit | motion | keyframe`) so the tool can pick the rule set.
- Panel: a ✨ button on the composer of `ImageNode` and `VideoNode` in `Canvas.tsx`. Keep the previous prompt as undo (one level is enough). An optional side chat can reuse the ADN chat styling.
- Route `POST /canvas/prompt-improve`, `credit("assist")`.

**Direction interview**

- Task `canvas_directive` already exists (Opus 5.5, medium). Reuse it for `finalize`. Use a cheaper `directive_interview` task (**Haiku**) for `question` turns.
- Better than the original: `finalize` should return the **same shape as `extractDirective`** (`title`, `directive`, `palette[]`, `paletteUsage[]`) so an interviewed directive is indistinguishable from an extracted one and can feed `direction-moodboard.md`. Ask for palette hex values only if the user named colours; never invent brand hex values (brand-DNA rule: no invented facts).
- Seed the interview with the brand DNA, so it does not ask about audience or tone that is already known. It should ask only about gaps.
- UI: a "Create direction by chat" entry beside "Extract from image" in the directives panel. Offer 2–3 quick-option chips per question (Monkey Studio put them in parentheses; chips are better).

**Starter canvas from a directive**

- Reuse the schema, but map kinds to Polyvik nodes (`textNode`, `imageNode`, `videoNode`, and later Element/Keyframe). Better still, emit the pipeline-chat spec format so a single inflater handles it (see `pipeline-chat-builder.md`).
- Task `canvas_blueprint`: Sonnet 5, effort low.

## Risks and open questions

- A multi-turn chat over a single text prompt is fine at this size; the Anthropic messages array would give cleaner caching if the interviews get long.
- Credits: charge per turn (`assist`), or bundle the interview as one charge at `finalize`? Recommendation: `question` turns on Haiku are free (the cost is small), `finalize` is charged.

## Effort

- Improve button, task and route: 1 d
- Direction interview (two modes, UI and brand seeding): 1.5 d
- Blueprint planner mapped to Polyvik nodes: 1 d

**Depends on:** nothing for Improve; the blueprint planner is best done after `pipeline-chat-builder.md`.

## Source (archived)

- Server `Hivek-Dev/monkey-studio-server` @ `2394f22a30c1ae56a5f46733ff89d6c1e0a75e43`: `src/server.js` — `optimizePromptFromChat`, `craftDirectiveFromChat`, `BLUEPRINT_ALLOWED_KINDS`, `planDirectiveNodes`, routes `/api/v2/prompt-chat`, `/api/v2/directive-chat`, `/api/v2/plan-directive-nodes`
- Client `Hivek-Dev/monkey-studio-client` @ `8d742b58dd8139129d6c9c723fe4c5f87feb9e58`: `src/features/creative-studio/useCreativeStudioCanvas.js` (`refineUniversalPrompt`), `src/design-system/primitives/DirectivesModal.jsx`, `src/design-system/primitives/PromptsFlyout.jsx`

# Image to prompt ("Get prompt")

**Priority:** low–medium · **Effort:** S (about 1 to 1.5 dev-days) · **Status:** proposed

## Summary

An action on any image node: **"Get prompt"**. It spawns a text node, wired to the image, that contains a prompt able to recreate that image.

- If Polyvik generated the image, the **stored prompt** is used (no LLM call, free).
- If it was uploaded, a vision model **infers** a recreation prompt.

The spawned node is labelled with its source (`stored` or `inferred`), so the user knows whether the prompt is exact or approximate.

## Why it matters for Polyvik

- It lets users learn from a reference they like and remix it: upload an image, get the prompt, edit one variable, generate. That matches the plan's variants rule (§3: "lock a base scene and change only the variable of interest").
- It is different from directive extraction, which Polyvik already has. The directive deliberately drops the subject and keeps universal style; this keeps the **subject and composition** too.
- It is cheap to build: `asset_describe` (Haiku) and `generationDetails` already exist.

## How Monkey Studio did it

Client (`useCreativeStudioCanvas.js`, prompt-extraction handler):
1. If the asset has a stored `promptText` (it was generated in-app), spawn a prompt node with it, `source: 'stored'`, and stop.
2. Otherwise `POST /api/v2/extract-image-prompt { dataUrl: assetUrl }` → `{ prompt, usage, provider }`, and spawn a prompt node with `source: 'inferred'`. The new node sits to the right of the image and is wired with a `prompt`-kind edge. The flag `isExtractingPrompt` drives a spinner.

Server (`inferImageRecreationPrompt`): Gemini 2.5 Flash, the image passed inline plus this instruction (verbatim):

```text
Describe this image as a single generation prompt that would recreate it. Return only the prompt text, with no markdown, labels, bullet points, or extra commentary.
```

## How to implement in Polyvik

**Core**

- Stored path: `GET /assets/generation` already exists (`generationDetails`, backed by `imageGenerationDetails.services.js`) and returns the prompt Polyvik used. The panel reads it directly.
- Inferred path: add a function to `assets.services.js`, `inferRecreationPrompt(assetId, tenant)`.
  - LLM task `image_to_prompt`: **Haiku 4.5** by default, or Sonnet 5 at effort low if quality is poor. Haiku is enough for the one-paragraph description the original asked for.
  - Better than the original: use a tool with structure that matches Polyvik's prompt rules (plan §3):

    ```json
    {
      "type": "object",
      "properties": {
        "prompt":   { "type": "string", "description": "Short English prompt: subject, setting, style, camera, light, medium. Max ~70 words. Positive phrasing." },
        "subject":  { "type": "string" },
        "setting":  { "type": "string" },
        "style":    { "type": "string" },
        "camera":   { "type": "string" },
        "lighting": { "type": "string" },
        "visibleText": { "type": "string", "description": "Any text visible in the image, verbatim, or empty." }
      },
      "required": ["prompt"]
    }
    ```

    The separate fields let the user swap one variable (for example `setting`) without rewriting everything. `visibleText` keeps copy out of the prompt, because Polyvik's editorial layer handles text on its own.
  - Cache the result on the asset row (`inferred_prompt`), so a second click is free.
- Route `POST /assets/:id/infer-prompt`, `credit("assist")`.

**Panel**

- A "Get prompt" item in the image node menu in `Canvas.tsx`. It creates a `textNode` to the right, wired to the image, with a badge `stored` / `inferred`.
- In the video canvas: the same action on a Keyframe gives a starting keyframe prompt; on a video (using the last frame, see `scene-continuity.md`) it gives a starting point for the next shot.

## Risks and open questions

- Inferred prompts of photos of real people describe their faces. That is fine for text, but keep the E005 face-size limits in mind if they feed video.
- Should the inferred prompt describe the brand logo if one is visible? Recommendation: no. The logo goes to `visibleText` and is noted as "logo present", to stay consistent with the text and logo layer.

## Effort

- 0.5 d core (task, route, cache), 0.5–1 d panel.

**Depends on:** nothing.

## Source (archived)

- Server `Hivek-Dev/monkey-studio-server` @ `2394f22a30c1ae56a5f46733ff89d6c1e0a75e43`: `src/server.js` — `inferImageRecreationPrompt`, `POST /api/v2/extract-image-prompt`
- Client `Hivek-Dev/monkey-studio-client` @ `8d742b58dd8139129d6c9c723fe4c5f87feb9e58`: `src/features/creative-studio/useCreativeStudioCanvas.js` (prompt-extraction handler, `spawnPromptTextNode`)

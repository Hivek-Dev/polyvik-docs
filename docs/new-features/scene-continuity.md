# Scene continuity (last frame + bridge prompt)

**Priority:** high · **Effort:** M (about 3 to 4 dev-days) · **Status:** proposed

## Summary

This feature continues a finished clip into a new one that reads as a single take. It has three steps:

1. **Extract the last frame** of clip N with ffmpeg and store it as an image asset.
2. **Bridge prompt:** a vision LLM reads that frame, plus optional reference images, character anchors and the user's intent. It writes the prompt for clip N+1, which first completes any motion already in progress and only then introduces the new action.
3. **Generate** clip N+1 with the extracted frame as the **start frame**.

## Why it matters for Polyvik

- It is step 6 of the video canvas plan ("Extend or chain: … the last frame of clip N as the first frame of clip N+1") and the **Extend** node. The plan also says the **Animate** node "also returns the last frame". This is the code that does it.
- Seedance 2.5 on Replicate accepts `start_image` today (`videoProvider.services.js`), so chaining works without native extension support.
- Polyvik already bundles ffmpeg (`src/services/ffmpegPath.js`), so step 1 needs no new dependency.

## How Monkey Studio did it

### Flow (client: `videoExtendControls` node, run handler in `useCreativeStudioCanvas.js`)

```
source videoNode ──► [videoExtendControls: intent text]
      │
      ├─1─► POST /api/v2/extract-video-last-frame { projectId, sourceAssetId }
      │        → { assetId, assetUrl, mimeType, byteSize, originalName }
      ├─2─► POST /api/v2/bridge-scene-prompt { projectId, lastFrameAssetId, intent,
      │        directiveText, contextTexts[], referenceAssetIds[≤6], characterAnchors[{name,text}] }
      │        → { prompt, provider, usage }
      └─3─► POST /api/v2/generate-asset-graph { targetMedia:'video', pipeline:'scene-extension',
               promptTexts:[bridgedPrompt], referenceAssets:[{ role:'start-frame', assetUrl:lastFrameUrl }],
               aspectRatio, resolution, model, durationSeconds, fps:24, generateAudio, characterAnchors }
```

- The output video node is created to the right of the panel (or an existing downstream empty target is reused). It shows progress labels: "Extracting last frame…" → "Bridging motion…" → "Generating next scene…".
- If the bridge call fails, the flow falls back to the raw intent (`bridgePayload.prompt || nextSceneIntent`).
- The new clip is pushed onto the node's `assetHistory` (take history).

### Step 1: last frame (ffmpeg)

```bash
ffmpeg -sseof -0.05 -i in.mp4 -frames:v 1 -q:v 2 last.png
```

`-sseof -0.05` seeks 50 ms before the end of the file. The code comment says this is "more reliable than -ss on the forward pass (which sometimes lands on a black frame at EOF)". Timeout: 60 s. The frame is stored as `<name>-last-frame` with `source: 'post-process'`.

### Step 2: bridge prompt

Parts sent to the model, in order: image #1 = last frame; images #2..#N = references (image mime only, at most 6); then the text below. The model used `callWithTextModelFallback` (Gemini 2.5 Pro → Flash → Flash-Lite) at temperature 0.4. Verbatim instruction; the `[if …]` lines are conditional:

```text
You are a video director scripting the NEXT shot in a continuous take.

Image #1 IS the final frame of the previous clip.
[if refs] Images #2–#N are reference subjects/props/environments the user wants featured in the new scene. Preserve their identity (face, wardrobe, colors, distinguishing marks, breed, etc.) — do not invent substitutes.

Your job: read image #1 (subject pose, gaze, camera framing, lighting, any motion-in-progress) and write a single production prompt for an 8-second generation that continues exactly from that frame, while naturally introducing the reference subject(s) into the scene.

Hard rules:
- The first fraction of a second MUST read as a seamless continuation of image #1. No fade, no cut, no dissolve, no flash.
- Preserve subject identity, wardrobe, setting, palette, and lighting temperature of image #1.
- If image #1 shows motion-in-progress (hand midway, head turning, object mid-air), your prompt must extend that motion in a physically natural way before introducing anything new.
- Only THEN layer the user intent and the reference subject(s) into the remaining seconds.
[if refs] - For each reference subject, describe it vividly and specifically (what it looks like, how it enters, how it interacts), so Veo can render it without seeing the reference image.
- Camera: if image #1 implies a camera move, continue it smoothly. Otherwise, match the framing and move cinematically into the new action.
- Avoid any text that would signal a cut, jump, or reset.

[if directive] Respect this overall art direction: <directiveText>
[if context] Additional context: <contextTexts joined by " | ">
[if anchors]
ANCHOR SUBJECTS (these must persist across every scene — preserve identity verbatim, do NOT rewrite or substitute):
• <name>: <anchor text ≤4000 chars>
Begin the final production prompt with a dense, literal description of these anchor subjects as they appear in the continuation. Do not paraphrase their traits.

<one of:>
User intent for the new shot: <intent>
User intent: (unspecified) — introduce the reference subject(s) shown above as the main event of this shot. Have them enter or appear naturally in the scene set up by the last frame, interact with whatever is in the frame, and carry the 8-second action. Invent a physically plausible, visually interesting continuation that showcases them.
User intent: (unspecified) — invent a natural, physically plausible continuation of the frame. Keep it cinematic; avoid repetition; give the camera or subjects something purposeful to do.

Return only the final production prompt (one paragraph, imperative, dense). No markdown, no labels, no commentary.
```

## How to implement in Polyvik

**Core**

- `videoMedia.services.js`: add `extractLastFrame(videoUrl, { tenantId, brandId })`, which runs the ffmpeg command above using `ffmpegPath.js` and stores a PNG through `storage.services.js`. Also add `extractFrameAt(seconds)` for the editor. Call it **automatically when a video job finishes** (in `processVideoJobs`) and save `last_frame_url` on the job row, so the Animate node "also returns the last frame" at no extra cost.
- New LLM task `scene_bridge`: **Sonnet 5, effort medium** (vision plus a short output). Use `generateStructured` with a tool `{ prompt: string, carriedMotion: string }`; `carriedMotion` is a short note that is useful for debugging.
- **Adapt the prompt to Polyvik's rules** (`video-canvas.md` §3). Animating from a frame should describe **motion only**, so the bridge output must not re-describe the whole scene. Keep the "continue motion in progress" and "no cut / fade" rules; replace "describe the reference vividly" with the explicit-role convention (`@Image N`); use the audience language only for dialogue; take the duration from the node instead of the hard-coded "8-second".
- Character anchors come from `characters.services.js` (the character bible text), not free text.
- Route `POST /video/bridge-prompt` with `credit("assist")`. The generation itself goes through the existing `POST /video/jobs` with `startImage = last_frame_url`, charged `credit("video")`.

**Panel: Extend node** (video canvas)

- Inputs: one video (a finished Animate output), an optional intent text, optional elements.
- Button "Continue from last frame" → bridge → the prompt is shown **editable** with its cost before spending (approval rule).
- The output is a new Animate/Shot whose start keyframe is the last frame, with `order = N+1`.
- Re-anchoring rule from the plan: pass the **original** element references, not the previous clip's frame, as identity references. Only the start frame comes from the previous clip.

## Risks and open questions

- **E005 filter:** a last frame with a realistic face at close range may be rejected as a start image (see plan §1). Detect the error, and offer to continue with a keyframe regenerated by Seedream, or with Veo 3.1.
- Compression drift accumulates over long chains; after 2–3 hops, suggest going back to a fresh keyframe.
- The last frame can carry motion blur. Option: take the sharpest of the last 5 frames (a Laplacian variance on 5 extracted frames); ffmpeg makes this cheap.
- Seedance native extension vs chaining: if Replicate exposes native extension for 2.5 *(verify)*, the Extend node should offer both.

## Effort

- ffmpeg helper plus the automatic last frame on job completion: 1 d
- `scene_bridge` task, prompt adaptation and route: 1 d
- Extend node UI: 1–2 d

**Depends on:** Animate node (video canvas MVP).

## Source (archived)

- Server `Hivek-Dev/monkey-studio-server` @ `2394f22a30c1ae56a5f46733ff89d6c1e0a75e43`: `src/server.js` — `POST /api/v2/extract-video-last-frame`, `POST /api/v2/bridge-scene-prompt`, `callWithTextModelFallback`
- Client `Hivek-Dev/monkey-studio-client` @ `8d742b58dd8139129d6c9c723fe4c5f87feb9e58`: `src/features/creative-studio/useCreativeStudioCanvas.js` (videoExtendControls run branch)

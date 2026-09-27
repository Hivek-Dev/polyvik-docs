# New features backlog

These are features to build next in Polyvik. Items 1–10 were taken from the legacy **Monkey Studio** repos before their local copies were deleted; R-items are research notes. Each file is a self-contained spec. It covers:
- what the feature does and why it matters for Polyvik;
- how Monkey Studio built it, with prompts, schemas and constants copied **verbatim** (or rewritten generically where they were client-specific);
- how to implement it in Polyvik (service, node or page, LLM task and model, credits);
- risks, effort and archived source paths.

Most items plug into the video canvas plan (`../video/video-canvas.md`) and its nodes: **Script, Element, Storyboard, Keyframe, Animate, Extend, Assemble**.

| # | Feature | Spec | Priority | Effort | Depends on | Video canvas node | Status |
|---|---|---|---|---|---|---|---|
| 1 | Pipeline chat builder (chat → wired graph; JSON/Markdown specs; kind catalog; column layout; per-model clamping) | [pipeline-chat-builder.md](pipeline-chat-builder.md) | high | L (8–12 d) | Video canvas MVP nodes (image-only pipelines can ship first) | All (emits the Shot graph) | proposed |
| 2 | Scene continuity (last frame + bridge prompt → next clip) | [scene-continuity.md](scene-continuity.md) | high | M (3–4 d) | Animate node | Animate (returns last frame), Extend | proposed |
| 3 | Script blocks and storyboard grid | [script-and-storyboard-grid.md](script-and-storyboard-grid.md) | medium | M (4–5 d) | Shot model | Script, Storyboard | proposed |
| 4 | Prompt Improve, prompt chat, direction interview, directive → starter canvas | [prompt-and-direction-chats.md](prompt-and-direction-chats.md) | medium | M (3–4 d) | — (blueprint after #1) | Keyframe / Animate (motion-only rewrite) | proposed |
| 5 | Direction moodboard and style plates | [direction-moodboard.md](direction-moodboard.md) | medium | S–M (2–3 d) | Existing directives | Shared style image for Keyframe / Animate | proposed |
| 6 | Brand assets discovery (logo + real photos with vision check) | [brand-assets-discovery.md](brand-assets-discovery.md) | medium | M (4–5 d) | `websiteReader.services.js`, brand onboarding | Element (place / product), end card | proposed |
| 7 | Image to prompt ("Get prompt") | [image-to-prompt.md](image-to-prompt.md) | low–medium | S (1–1.5 d) | — | Keyframe | proposed |
| 8 | Google sign-in | [google-sign-in.md](google-sign-in.md) | medium | M (2–3 d) | Per-user block (#10e) | — | proposed |
| 9a | Team invites (tenant level) | [canvas-comments-and-collaboration.md](canvas-comments-and-collaboration.md) | medium | S–M (2–3 d) | #8 optional | — | proposed |
| 9b | Canvas comment threads | [canvas-comments-and-collaboration.md](canvas-comments-and-collaboration.md) | low | S (1.5–2 d) | Keyframe node (anchored approvals) | Keyframe approval | proposed |
| 9c | Real-time canvas (Yjs / Hocuspocus) | [canvas-comments-and-collaboration.md](canvas-comments-and-collaboration.md) | low | L (6–10 d) | #9a | — | proposed |
| 10a | Video aspect crop / pad | [small-gaps.md](small-gaps.md#1-video-aspect-crop--pad) | medium | S (1 d) | — | Assemble | proposed |
| 10b | Generated end card with logo | [small-gaps.md](small-gaps.md#2-generated-end-card-bookend-with-logo) | medium | S–M (1.5–2 d) | Brand kit logo; #6 optional | Assemble | proposed |
| 10c | Preview and download from a canvas node | [small-gaps.md](small-gaps.md#3-preview-and-download-from-a-canvas-node) | medium | XS (0.5 d) | — | All output nodes | proposed |
| 10d | Canvas flow templates with thumbnails | [small-gaps.md](small-gaps.md#4-canvas-flow-templates-with-thumbnails) | medium | S–M (2 d) | #1 (spec format and inflater) | Starter graphs | proposed |
| 10e | Per-user block (kill switch) + registration flag | [small-gaps.md](small-gaps.md#5-per-user-block-kill-switch) | high (ops) | XS (0.5–1 d) | — | — | proposed |
| 11 | Vik, the in-panel AI assistant (parked 22 Sep 2026) | [vik-assistant.md](vik-assistant.md) | medium | M (3–5 d) | — | — | parked |
| 12 | Brand voiceover (cloned voice) and captions from audio (parked 22 Sep 2026) | [brand-voiceover.md](brand-voiceover.md) | medium (blocked by consent/legal) | L | Consent flow, hosting | Assemble, Animate (lip sync) | parked |
| R1 | Research note: cheaper AI UGC with Omni Flash 1.1 (claimed 3–4x cheaper than Seedance 2.5) | [uzi-prints-ai-ugc.md](uzi-prints-ai-ugc.md) | medium | — (evaluate before building) | — | Animate (alternative provider) | research |

Effort: XS < 1 d · S about 1–2 d · M about 2–5 d · L over 5 d, for one developer who knows the codebase.

**Suggested order:**
1. 10e and 10c (quick wins).
2. 2, 7 and 10a (they unblock the video canvas MVP).
3. 3 and 1.
4. 4, 5 and 10d.
5. 6, 10b, 8 and 9a.
6. 9b and 9c last.

## New LLM tasks proposed (for `llmTasks.config.js`)

| Task | Model | Effort | Spec |
|---|---|---|---|
| `canvas_pipeline` | Sonnet 5 | medium, cache 5m | #1 |
| `scene_bridge` | Sonnet 5 | medium | #2 |
| `video_script` | Opus 5.5 | high, cache 5m | #3 |
| `storyboard_beats` | Sonnet 5 | low | #3 |
| `prompt_improve` | Sonnet 5 | low | #4 |
| `directive_interview` | Haiku 4.5 | — | #4 (finalize reuses `canvas_directive`) |
| `canvas_blueprint` | Sonnet 5 | low | #4 |
| `brand_discovery` | Sonnet 5 (web search) | low | #6 |
| `brand_photo_verify` | Haiku 4.5 | — | #6 |
| `image_to_prompt` | Haiku 4.5 | — | #7 |

Each needs a pricing entry in `pricing.services.js` before it ships, per the rule in `llmTasks.config.js`.

## Discarded from Monkey Studio

These were intentionally **not** carried over:

- **Client-specific pipelines, skills and endpoints** (the food-delivery client's flows): blog→products splitting, per-product prompt planners, the intro voiceover planner, the restaurant hero/logo discovery tied to the client's marketplace listings, image-URL quality rewrites, city-slug tables, the client's blog list endpoint and their seed migrations. The reusable engine behind the discovery is generalized in `brand-assets-discovery.md`, and the script structure is generalized in `script-and-storyboard-grid.md`.
- **Voice / TTS** (OpenAI TTS endpoint, bookend voiceover, audio mux of narration): removed from Polyvik on purpose. Voiceover survives only as *text* (subtitles or model-native audio).
- **v1 food/table endpoints and legacy nodes** (`scenePrompt`, `timeline`, `controls`, `imageControls`, `simpleVideoRun`, the magnetic snap panels): superseded by inline generator fields.
- **zh-CN skill translations:** Polyvik ships its own skills.
- **Old design system** (Monkey Studio tokens, primitives, gradients): Polyvik uses the ADN style.
- **Autoplay QA harness and the old e2e suite** (`services/autoplay`, Playwright specs for magnetic snapping, cursor jumps and the like): tied to the old canvas. Polyvik's QA approach is in the video canvas plan §5.
- **Cost-measurement notes:** stale prices and models; Polyvik has its own pricing and usage logging.
- **Migration and maintenance scripts** (migrate, strip legacy nodes, seed e2e users, restart scripts). The one lesson worth keeping from `compact-canvases.js` is recorded in `canvas-comments-and-collaboration.md`.
- **Already in Polyvik, so not re-specified:** image extend/outpaint, image sizes, directive extraction from an image (palette and roles), skills 01–15, the prompt gallery, credits, asset naming, provider fallback and retries, video editor merge and audio, the library preview, theming, the universal image node.

## Source

The legacy repos are archived on GitHub as **private, archived** repositories:

- `Hivek-Dev/monkey-studio-client`: read at `origin/main` **`8d742b58dd8139129d6c9c723fe4c5f87feb9e58`** ("feat(auth): hide the create-account toggle when registration is closed"). The local `dev` branch was 5 commits behind; the chatbot SDK, asset download buttons, comment node and template thumbnails exist only on `main`.
- `Hivek-Dev/monkey-studio-server`: read at `main` **`2394f22a30c1ae56a5f46733ff89d6c1e0a75e43`**.

Note: the client's `main` calls `POST /api/v2/describe-reference` (the chat dock's vision analysis of uploads), but no server branch implements it. `pipeline-chat-builder.md` proposes reusing Polyvik's `asset_describe` instead.

No secrets, hosts, IPs, emails or credentials from those repos were copied into these docs.

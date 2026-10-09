# Video canvas: plan and lessons learned

This is the groundwork for part two, the multi-shot video canvas. It was written on 26 Sep 2026 from three sources:
- **Market research:** Higgsfield, Krea, Freepik, Flora, Runway, Kling, Google Flow, LTX, Luma and Dreamina.
- **Higgsfield's official skills repo** (MIT license). We adapted ideas and workflows in our own words and copied none of its text or code.
- **Our own Seedance tests.**

Model facts marked *(verify)* come from third parties. Confirm them against Replicate's documentation before hard-coding them.

Related: [Video generation](video-generation.md) (current queue and API), [Replicate video](replicate-video.md), [Seedance community recipes](seedance-community-recipes.md), [Video creation workspace](../panel/video-creation-workspace.md), [new features](../new-features/README.md).

## 1. What we learned first-hand

- **Realistic reference faces:** on Seedance 2.5 via Replicate, a realistic face only passes the filter (E005) when it is small in the frame.
  - It passed with the face at about 96 px in a 768 px-wide image.
  - It failed at about 150 px and at about 250 px.
  - The rejection happens at input validation, within seconds.
- **Mascots and stylized characters** pass without trouble, with high fidelity.
- **References are sent at 768 px wide** (`referenceMaxWidth` in `replicateVideo.services.js`), because wider inputs also triggered E005.
- **"References" mode only gives approximate likeness.** Fidelity needs image-first work: build a keyframe with an image model, then animate it.
- **Realistic faces as a first frame:** ByteDance's docs say the filter applies to every uploaded image. This is untested on our side. For realistic close-ups, the option is Veo 3.1, which is also on Replicate.

## 2. How it is done in 2026

Nobody asks the video model for the whole ad at once. The image is worked first, then animated:

1. **Script and shot list** (LLM): duration, framing, camera, action and dialogue per shot.
2. **Elements:** character, product and place sheets on a neutral background. Characters already exist at `/characters` (`characters.services.js`, drawn with Seedream 5 Pro by default).
3. **Storyboard:** a 3x3 grid in a single generation, so every shot shares identity and lighting; it is then cut into cards.
4. **Keyframe per shot** with an image model and the references. Always re-anchor to the original references, never to the previous variant, because drift accumulates.
5. **Animate:** from a first frame, or a first and last frame, which greatly reduces face drift.
6. **Extend or chain:** native extension, or the last frame of clip N as the first frame of clip N+1.
7. **Voice and lip sync:** native audio is fine for drafts; if it fails, use a lip-sync model.
8. **Assemble:** cuts, music and subtitles.

To calibrate expectations: Higgsfield kept roughly 250 clips out of 16,000 for its film. Picking between alternate takes is part of the workflow, not a failure.

## 3. Prompt rules we adopt

- **Image prompt:** subject, setting and style, plus camera, light and medium. Keep it short, since very long prompts distort.
- **Image edits:** say *what changes*; do not describe the input image again.
- **Animating from a frame:** the prompt describes **motion only**, meaning camera (dolly, pan, push) and what the subject does. Describing the scene again makes results worse. The Animate node has its own "motion prompt", separate from the keyframe prompt.
- **Shot block for video:** style (match the attached image with a fixed descriptor), scene (one single action), motion, audio (ambience and effects) and what is forbidden (style drift, text, logos). The style descriptor is identical in every shot.
- **A shared style image:** one style image is attached to every clip, and it can come from the brand DNA. From a style reference we take only rendering and color, never people, text or logos.
- **Explicit role for each reference** ("Image 1 = logo, Image 2 = base scene"): what each one controls and what it doesn't. We already do this with @Image N.
- **Phrase things positively:** "sharp" rather than "no blur".
- **Language:** image and video prompts are in English; dialogue and narration are in the audience's language.
- **Narration:** about 20 to 24 words per 10 s, about 150 words per spoken minute, numbers written out, no stage directions.
- **Variants:** lock a base scene and change only the variable of interest, not the person or the setting.

## 4. Canvas nodes

What travels between nodes is a **Shot**, with these fields:
- order, duration, framing, camera, action and dialogue;
- elements (characters, products, places);
- optional start and end keyframes;
- generated clips and the chosen clip.

| Node | What it does | Model |
|---|---|---|
| **Script** | Brief and duration → shot list, each shot with its shot block | Opus (writer) |
| **Element** | Character, product or place with its sheet and identity description | Seedream 5 Pro / GPT Image 2.5 |
| **Storyboard** | 3x3 grid cut into shot cards: a cheap preview of the pacing | GPT Image 2.5 |
| **Keyframe** | Start (and end) frame of the shot, re-anchored to the references | Seedream 5 Pro |
| **Animate** | First frame, first and last frame, or references, with a motion-only prompt; also returns the last frame | Seedance 2.5; Veo 3.1 for realistic close-ups |
| **Extend** | Native extension, or continue from the last frame | Seedance 2.5 |
| **Assemble** | Timeline, trims, music and subtitles; never stretches video | ffmpeg (already bundled with the app) |

**Declarative per-model catalog:** which roles each model accepts (start, end, references, video, audio) and with what cap, and which durations, resolutions and aspect ratios it supports. The Animate node builds its UI from that catalog. Facts to confirm *(verify)*:
- **Seedance 2.5:** 4 to 30 s; start, end, up to 30 images, 10 videos and 10 audios; it has edit and extension modes. Still to confirm: whether it accepts a start frame and references together, and the real resolution cap on Replicate.
- **Veo 3.1:** 4, 6 or 8 s, 16:9 or 9:16. Still to confirm on Replicate: last-frame and reference support.
- **Kling 3.0:** 3 to 15 s, start and end, with a multi-shot option.

## 5. Operating rules

- **Approval and cost:** the user approves keyframes before any video spend, and every shot shows its cost up front.
- **Resolution:** drafts at 480p and the final at 720p.
- **Gates between steps:** no animating without a keyframe, and no assembling without a chosen clip per shot.
- **Failures:**
  - if a shot fails, regenerate that shot only;
  - one retry with the same concept;
  - after two identical failures, change the prompt or the model;
  - a timeout is not a failure, and a running job is never duplicated.
- **QA:** check exact values (text, hex, sizes) deterministically instead of trusting a vision model. Repair only the failing piece and name the rule it broke.
- **Evaluation scenarios:** a set of requests with their expected result (pass, partial or fail), run on every change. If the score drops more than 15% or the time doubles, roll back. Every bug adds a scenario.

## 6. Scope

**MVP:**
- Script → shot cards → Keyframe → Animate (first frame, or first and last) → Assemble.
- Keyframe approval, per-shot cost, and 480p/720p.

**Later:**
- Grid storyboard.
- Extend.
- Parallel alternate takes with a picker.
- Lip sync.
- @Elements across the canvas.
- Veo 3.1 and Kling 3.0 as providers.

## 7. Ideas for other parts of Polyvik

- **Character creator:** expand the 3 views to 8 to 12, varying angle, expression and distance, to use as references. Seedream remains the right choice for character sheets.
- **Campaign pieces:**
  - **Product photo modes:** product, lifestyle, detail with a person, banner, carousel, ad pack and restyle. The format takes precedence over the genre, and it comes with a short interview of at most 4 questions.
  - **Hooks:** test 4 hooks in one format before testing 1 hook in 4 formats.
- **Brand DNA:**
  - each fact carries a status (fixed, proposed, not applicable, unknown) and its evidence (stated, measured, inferred), with no invented claims or prices;
  - visual axes from 0 to 100 (restrained↔expressive, geometric↔organic, familiar↔experimental);
  - keep official assets separate from inspiration;
  - an identical brand block in every piece of a set, with spelling, logo, hex values with their role, typefaces and what is forbidden;
  - an onboarding step that imports the DNA from the brand's website.
- ~~**Two-stage mockups:** Seedream builds the scene with a blank surface, and the exact text and logo are applied afterwards.~~ Discarded on 8 Oct 2026: every image is one generation, and text or logo pasted on a generated scene reads as a collage. The editorial layer now travels as a reference the model draws from in that same generation ([text composition](../image/text-composition.md)).

---

*Sources: web research of 26 Sep 2026 and the `higgsfield-ai/skills` repo (MIT, © 2026 Higgsfield AI). Ideas and workflows were adapted from it without reproducing its text or code.*

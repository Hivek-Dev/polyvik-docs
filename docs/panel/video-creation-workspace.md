# Video creation workspace

`/video/create` ([`VideoCreate.tsx`](../../../polyvik-panel/src/pages/VideoCreate.tsx),
[`VideoCreate.css`](../../../polyvik-panel/src/pages/VideoCreate.css)) is the video
counterpart of the [image workspace](image-creation-workspace.md): same full-bleed
layout, Brasa pixel strip, starters and bottom composer. For the backend
(`/api/video`, providers, queue, billing) see
[../video/video-generation.md](../video/video-generation.md); for the editor see
[../video/video-canvas.md](../video/video-canvas.md).

## Entry points

- **Create video** in the Feed hero (it is not in the top navigation).
- **Animate this image** on an image result: passes the image as a brand-scoped
  starting frame (`base` reference) with a pre-filled animation prompt.
- **Create video** in a character's dialog on `/characters`: passes the character's
  full-body image as a `character` reference and pre-fills the prompt with the
  character sheet's video block (see Characters below).
- The breadcrumb (`← Create images / Create video`) goes back to the image workspace.

Hand-offs are ignored if they belong to another brand or if a job is already
pending.

## Experience

- Starters: cinematic scene, product in motion, and animate an existing creation
  (which also opens the reference picker).
- Composer: model, duration, aspect ratio and resolution (`MiniMenu` dropdowns),
  sound, Brand DNA, image references and extra scene direction. Sound can only be
  muted on models that support it. The direction dialog shows the model's summary
  and notes.
- The server catalog (`GET /api/video/models`, resolved by
  [`videoCreateOptions`](../../../polyvik-panel/src/lib/videoCreateOptions.ts))
  determines the available controls, including resolution-specific durations, the
  reference limit and the estimated iterations. Accounts using their own provider key
  see that billing mode instead of a platform estimate.
- If no provider is configured, a notice with a link to `/settings/ai` replaces the
  ability to submit. On a brand's first explicit generation the `video` feature is
  turned on before creating the job, preserving the other feature flags.
- **Recent videos** (header button) lists the brand's generated videos from
  `GET /api/video/library`.

## Brand direction and references

- Brand DNA sends the palette, description, tone and active global rules as
  bounded text direction (`videoBrandDirection`), marked as context, not copy. It is
  trimmed to fit the model's `maxPromptLength` (e.g. 2000 for Seedance on Replicate)
  after the user's prompt, direction and references; if there is not enough room it
  is dropped.
- Unlike image generation, the video API does not automatically receive the logo or
  the visual board: exact subjects and identity must come from explicit references.
- The shared reference picker only offers JPEG and PNG and respects the model's
  limit. A single base image acts as the first frame; several references do not
  guarantee an exact frame.
- If the prompt names `@Image N` (or `[Image N]`), at least N references must be
  attached; otherwise submission is blocked with a notice (without them the model
  invents the subject).

## Lifecycle

- Submission locks immediately. The job id is stored in `localStorage` under
  `polyvik.video-create.job.{userId}.{brandId}` and the submitted draft under the same
  key + `.draft`. Revisiting resumes polling the same job with the same prompt and
  settings.
- Progress shows a percentage when the provider reports it, and an indeterminate bar
  otherwise (e.g. Replicate).
- A polling failure keeps the job and offers **Check status**; it never resubmits a
  paid generation. Polling aborts on unmount.
- Submission and generation errors go to the notifications (`notify()`), not an inline
  strip; a clear 4xx rejection shows only its reason, an uncertain failure also asks
  the user to check their videos. Terminal failure keeps the draft and releases
  submission. Blocking conditions (poll error, catalog error, missing provider, brand
  profile unavailable, too many or missing references) stay as notices above the
  composer.
- Success shows the native player with **Saved** (opens recent videos),
  **Download**, **Open editor** (`/lab/editor`) and **New video**, plus
  [`VideoHowMade`](../../../polyvik-panel/src/components/VideoHowMade.tsx): how the
  video was made, with an option to reuse its references, direction and prompt.
- Finished videos are stored as brand assets and **appear in the Feed** with a still
  and a 3 s hover clip (`preview_url` / `poster_url`), as well as in Recent videos.

## Characters

`/characters` ([`CharacterCreate.tsx`](../../../polyvik-panel/src/pages/CharacterCreate.tsx),
[`CharacterCreate.css`](../../../polyvik-panel/src/pages/CharacterCreate.css)) uses the
same workspace layout to prepare subjects for video:

- Composer: optional name, description, style (Realistic / 3D / 2D) and image model
  (Seedream by default, because Seedance accepts its faces). Starters for each style.
  Cost: 3 images and 1 assist from the plan.
- `POST /api/characters` writes a character sheet (description, never-change traits,
  palette, voice, personality, summary, video block) and draws three references:
  full body, turnaround and face. The gallery refreshes every 5 s while one is
  generating. Images also land in the Library as Character.
- The character dialog (1080 px) shows the three views and the sheet, lets you
  rename, copy the video block and remove from the gallery (images stay in the
  Library), and **Create video** hands off to `/video/create`. Only the full-body
  image travels (as `@Image 1`), with the face described in the block: on Seedance a
  realistic face only passes the filter when it is small in frame.

## Validation (snapshot at launch)

At launch the production build and 25 unit tests passed (resolution/duration
compatibility, model changes, missing catalogs, bounded brand context, waiting/pending/
completed/failed jobs, read errors and cancellation). An isolated browser preview
verified reference defaults, estimates, mute and brand context in the payload, polling
recovery and reload on one job, draft restore, preserved input on provider failure and
MP4 playback; a 390 × 844 viewport kept every control available. These numbers are
historical; run the current test suite rather than relying on them.

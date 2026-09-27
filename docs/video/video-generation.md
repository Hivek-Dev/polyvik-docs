# Video generation

How a video is requested, charged, queued and stored. Video lives in the core
(`/api/video`) and the panel (`/video/create`, the Canvas Video node, and Lab →
Editor). Why these providers: [Provider change](provider-change.md). Replicate
setup and customer keys: [Replicate video](replicate-video.md). Prompt craft:
[Seedance community recipes](seedance-community-recipes.md). Panel UI:
[Video creation workspace](../panel/video-creation-workspace.md).

> The voice features (Canvas audio node, voice reference for the generator,
> cloned voice) were **removed from `main` on 22 Sep 2026**; the code is on the
> `wip/vik-voz` branch. `POST /api/video/audio` remains only for the editor's
> narration track.

## Files

| File | Role |
|---|---|
| `services/videoModels.config.js` | Catalog per provider: durations, resolutions, aspect ratios, reference limits, prompt limit and published rates. No published data → the model is not listed |
| `services/videoProvider.services.js` | Provider contract and registry (`replicate`, `argolink`, `google`). Selected with `VIDEO_PROVIDER`; without a key it returns `null` and video is not offered |
| `services/replicateVideo.services.js` | Replicate adapter (Seedance 2.5) |
| `services/videoPrompt.services.js` | Builds the prompt: one instruction per reference by Canvas role, plus fixed rules |
| `services/video.services.js` | Request, queue, charging, Feed entry |
| `services/videoMedia.services.js` | Narration audio and editor clips (ownership by file name, ffmpeg conversion), Feed poster + 3 s preview |
| `services/videoRender.services.js` | Editor finish: layered ffmpeg, captions drawn with the bundled font |
| `services/ffmpegPath.js` | Picks a working ffmpeg/ffprobe: `FFMPEG_PATH`/`FFPROBE_PATH`, system, or the bundled `ffmpeg-static` / `ffprobe-static` |
| `models/videoJob.model.js` · migration `056` | `video_jobs` table and `generation_logs.cost_usd` |

## Providers

| id | Use | Notes |
|---|---|---|
| `replicate` | Target provider | Seedance 2.5, watermark off, 480p/720p, 4–30 s, up to 30 image references, references downscaled to 768 px wide |
| `argolink` | **Development only** | Resells Dreamina; burns an "AI" badge and has capacity outages. Never for paying clients |
| `google` | Registered | Veo 3.1 / Fast / Lite via the Gemini API; audio always included; 1080p and 4k only at 8 s |

The server default is `VIDEO_PROVIDER` (the code default is still `argolink`;
production sets the repository variable). An account with its own video key uses
that provider instead ([Replicate video](replicate-video.md)).

## Routes (`/api/video`, authenticated)

| Route | Purpose |
|---|---|
| `GET /models` | Active provider, models with limits, rates (hidden for own-key accounts) and relative cost, ffmpeg capabilities |
| `POST /jobs` | Request a video (`requireAi`). Replies 202 with the job `queued` |
| `GET /jobs/:id` | Status, progress, `videoUrl` when done |
| `GET /jobs/:id/details` | "How it was made": full prompt, user prompt, context, references with role, settings |
| `GET /library?brandId` | The brand's finished videos (editor material) |
| `POST /audio` | Narration for the editor (converted to MP3) |
| `POST /media` | Clip or logo for the editor (MP4, MOV, PNG, JPG, WEBP; up to 80 MB) |
| `POST /render` | The editor finish (`requireAi`) |

## The queue

`queued` → `pending` → `done` | `failed`, with `waiting` when the provider is full.
The HTTP request **never** calls the provider: it inserts the job and the worker
picks it up within 10 s (`processVideoJobs`). A full provider cannot hang the panel
and an API restart loses nothing. Locally, run `npm run dev:video` (video-only) or
`npm run dev:worker`, never both against the same database.

**Five minutes, no more.** Full = retry every 20 s for 5 minutes, then fail with a
clear message and a refund. Someone is waiting at the screen. An in-house process
can ask for more with `waitMaxMs` + `unattended: true`; the panel cannot.

Only explicit retryable rejections are retried on submit. For Replicate, a timeout
or 5xx is ambiguous (the paid prediction may exist) and is not resubmitted; check
Predictions first. Status reads can be retried safely. Each job is processed once at
a time (a slow download used to register a video twice).

## Checks before spending

1. The brand belongs to the account (`assertBrandOwned`) and has **Video** enabled
   in Settings → Features (`features.video`). The panel enables it on the brand's
   first explicit generation.
2. The plan includes AI (`requireAi`; Free has none).
3. Model, duration, resolution (and duration-per-resolution for Veo) and aspect
   exist in the catalog.
4. Every `@Image N` named in the prompt has an attachment, and the model's image
   limit is respected.
5. Reference images are in **this** brand's library (`assertBrandAssetUrls`).
6. `VIDEO_MONTHLY_BUDGET_USD`, if set: a house cap per calendar month across all
   accounts. It does not apply to own-key video.
7. **Credits.** `chargeVideo` takes `iterationsForCost(cost)` video credits
   (`ceil(cost / ITERATION_VALUE_USD)`) from the monthly video allowance, then from
   extra video credits, before queueing. No balance → 402 `quota_credits`. If the
   video does not come out (rejected, no capacity, failed, key deleted) the worker
   refunds them (`refundVideo`). See [plans and credits](../product/plans-and-credits.md).

## Prompt building

`buildVideoPrompt`: the user's text, one instruction per reference (roles from
`VIDEO_REFERENCE_USES`: product, character, place, logo, style, palette,
composition, layout, content, base), connected context as `Direction: …`, and fixed
rules: no on-screen text/captions/subtitles, no music (diegetic sound only, or only
the quoted spoken lines when there is dialogue), and a smooth stable camera unless
the prompt asks for handheld. A lone `base` reference becomes the first frame; with
other references it is just the first reference (Replicate cannot take both).

`fitVideoPrompt` keeps the whole prompt under the model limit (2000 chars for
Replicate) by trimming context, never the user's text. The Replicate adapter
rewrites `@Image N` to `[ImageN]`.

## Cost record

One `generation_logs` row with `kind='video'`, `provider`, `model` and a **closed
`cost_usd`**: billed seconds (or requested duration) × catalog rate. When that
column has a value, `pricing.costOfRow` uses it as is. Own-key video is logged at 0
so it does not inflate the house budget. A failed job also leaves a row with
`success=false` and cost 0: the client must see that the video did not come out.

## Feed

A finished video is stored (`video-clip-t<tenant>-b<brand>-<uuid>.mp4`) and
registered in the Feed with a first-frame poster and a 3 s hover clip. See
[Feed and Library](../image/feed-and-library.md#videos-in-the-feed).

## Editor finish

Same recipe as the editor timeline: `formato`, fixed `duracion`, `pistas` top to
bottom with absolutely positioned items, and `logo`. Each clip is placed with
`tpad` and stacked with `overlay`; audio with `adelay` + `amix`.

**Captions never use `drawtext`.** They are drawn as outlines with the bundled font
(Inter, via fontkit → SVG → PNG with sharp), identical on any server. ffmpeg ships
with the app (`ffmpeg-static`); the deploy also installs a system ffmpeg when it can.
Without a working ffmpeg, `/render` answers 501 and `/models` says so
(`capabilities.render=false`).

## Media ownership

Video files are not `brand_assets` materials; ownership is encoded in the name:
`video-<kind>-t<tenant>-b<brand>-<uuid>.<ext>` with kind `audio`, `media`, `clip` or
`render`. A URL is accepted only if it starts with our asset base **and** its name
matches this account and brand (`assertOwnedVideoMediaUrl`). See
[security](../architecture/security.md).

## Rules that keep holding

- No fixed lists in the UI: durations and resolutions come from `/api/video/models`.
- The editor never touches `currentTime` / `playbackRate` of the playing video (Safari).
- Browser WEBM recordings are converted before measuring; `data:` prefixes are cut
  at the first comma.
- **Never spend provider credit without Manuel's explicit permission.** Do not test
  with `POST /api/video/jobs` from the console: with a session and the feature on,
  it charges for real.

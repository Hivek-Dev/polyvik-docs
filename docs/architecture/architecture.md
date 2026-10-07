# Architecture

## polyvik-core — API and worker

Express in ESM (`"type": "module"`), Postgres through `pg`, two pm2 processes
from the same repo.

```
src/
  server.js      → HTTP API (pm2 process `polyvik-api`)
  worker.js      → crons and queues (pm2 process `polyvik-worker`)
  videoWorker.js → local-only worker that runs just the video queue (npm run dev:video)
  routes/        → one file per resource, mounted in routes/index.js
  controllers/   → validate input, call the service, format {ok, data}
  services/      → the logic; everything that matters lives here
                   (*.config.js hold the static tables: plans, LLM tasks, image/video models)
  models/        → SQL. No business logic
  db/migrations/ → NNN_name.sql, in order, idempotent
  adapters/      → social-network integrations (LinkedIn today)
  middlewares/   → auth, CORS, plan gate (requireAi), credits (credit), error handling
  utils/         → domain-free helpers (brandGuard, crypto, snsSignature, timezone)
test/            → node:test suites (npm test; integration ones need local Postgres)
```

**The worker** runs in a single process, with concurrency guards:

| Schedule | What it does |
|---|---|
| `* * * * *` | scheduled publishing (`publishDuePieces`) |
| `* * * * *` | piece generation queue (`processGenerationQueue`) |
| `*/5 * * * *` | event emails |
| `*/10 * * * *` | 3-second preview clips for Feed videos that lack one |
| `15 * * * *` | metrics of published pieces |
| `0 6 * * *` | refill the blog topic queue |
| `30 */4 * * *` | write pending blog articles |
| `0 7 * * *` | connection health |
| `0 15 * * *` | new image models (09:00 Mexico City) — only records the finding |
| every 10 s | video queue: sends queued jobs to the provider and polls running ones. Always on, because tenants can bring their own video keys even without a house key |

**`pg` note:** `BIGINT` comes back as a **string**, not a number. `row.id === 5`
always fails. Compare with `String(...)` or convert explicitly.

### AI providers

| Capability | Provider | Where |
|---|---|---|
| Text (the three agents, blog, assists) | Anthropic; model and effort per task from the active profile (`LLM_PROFILE = "lite"`) | `llmTasks.config.js`, `llm.services.js` |
| Images | OpenAI GPT Image 2.5 (`gpt-image-2.5-sunburst` by default); Seedream 5 Pro via Replicate on request per generation. Gemini and Flux are still implemented but closed (`IMAGE_PROVIDERS_ENABLED`) | `imageModels.config.js`, `imageGenerator.services.js`, `seedreamImage.services.js` |
| Video | Seedance 2.5 via Replicate in production (`VIDEO_PROVIDER`); ArgoLink is development-only | `videoProvider.services.js`, `replicateVideo.services.js`, `videoModels.config.js` |
| Video finishing | ffmpeg — system binary if present, otherwise the bundled `ffmpeg-static` / `ffprobe-static` | `ffmpegPath.js`, `videoRender.services.js` |

Costs and how they are measured: [AI usage and costs](ai-usage-and-costs.md).
Video details: [video generation](../video/video-generation.md) and
[Replicate video](../video/replicate-video.md).

## polyvik-panel — the panel

React 19 + TypeScript + Vite 8 + Tailwind 4 + react-router 7. `reactflow` for
the Canvas. Video (video node in the Canvas, `/video/create`, and the Editor)
talks to the core's `/api/video` through `lib/videoApi.ts`.

```
src/
  pages/       → one per route, registered in App.tsx. ADN, Lab and Settings
                 are hubs (BrandHub, LabHub, SettingsHub) with URL tabs;
                 the older pages live inside them. Creation pages:
                 ImageCreate (/feed/create), VideoCreate (/video/create),
                 CharacterCreate (/characters)
  components/  → shared across pages
  lib/         → pure helpers and hooks (api, refUse, imageOpts, datetime, labels, videoApi…)
  i18n/        → en.ts defines the Dictionary type; es.ts is typed against it
  types.ts     → API types, mirror of the core
```

**Typed i18n:** `en.ts` is the source of the type. Any new key is mandatory in
`es.ts` and TypeScript checks it at build time. That is why `npx tsc -b` is the
gate before any commit.

## Three crafts, not one

The text is made by three different agents, and the order matters:

| Who | When it runs | What it decides |
|---|---|---|
| **Content director** | Once per campaign | The ideas for all pieces and that they hold together. No images |
| **Writer** | Once per piece | The post, with everything from the Voice, **and the text that will be drawn on the image** (`imageText`). No images |
| **Designer** | Once per piece, after the writer | What is seen and how the text blocks are laid out ON the image — hierarchy, placement, treatment — with the post already written in front of it |

They used to be mixed in two ways and both went wrong. The writer described the
scene as four extra fields of its tool — art direction as a side job of
writing — and later the director described them while planning, twelve scenes
in one go and before the text existed: that is where four variants of the same
photo came from.

The on-image text is now written by the writer, from the same brief as the post;
the designer decides where and how it is set, never rewrites its meaning. See
[image engine](../image/image-engine.md) and
[text composition](../image/text-composition.md).

**The designer composes within the brand identity.** It decides the visual
content and the text blocks with hierarchy, placement and treatment. It
receives the layout (Molde) before designing; the engine uses that same pick.

An optional fourth step, the **editorial finish** (`publicationFinish.services.js`),
reviews the design against the post. In the `lite` profile it is skipped when
the text is integrated by the image model (`PIPELINE.finishWhenIntegrated =
false`).

## The flow to understand

A campaign is decided in text, approved, and only then drawn.

It was not always like this: activating a campaign used to hand out twelve
pieces and the worker invented the angle and subject of each one separately,
without seeing the others and without anyone having approved them. Twelve
independent calls with the same inputs write the same post twelve times, and the
customer found out what their campaign was about when twelve images were already
made.

```
Campaign (frozen plan)
  └─ campaignIdeas.services   proposes the WHOLE campaign in a single call
       ├─ the core computes the slots (cadence, time zone, quota)
       └─ the model fills each slot's idea: title, angle and materials
  └─ the customer edits the list as text: edit, swap one, remove, write their own
  └─ «Generar pieza» on a proposal card — this is where an image is spent
       (campaignWorkspace.services → chargeGeneration: first generation included,
        the rest cost an iteration; refunded if it fails)
       └─ generation.services (composePiece)
            ├─ copyGenerator   → angle, copy, hashtags and the on-image text
            │    with platform_meta.idea the angle is already decided:
            │    the writer writes, it does not reinvent
            ├─ layout pick (once)
            ├─ imageDirector   → scene and textBlocks, with the post and the layout
            │    in front: hierarchy, placement, treatment, materials, alt
            ├─ [publicationFinish — skipped in lite when text is integrated]
            └─ generateEnrichedImage
                 ├─ identity + directives + fixed prompts
                 ├─ the same chosen layout
                 ├─ exact text blocks if the brand allows text in images
                 ├─ the customer's image feedback
                 └─ imageGenerator → openai (default) | seedream (on request)
       └─ status='pending_approval' + platform_meta.imagePlan
  └─ «Aprobar y programar» schedules that same result and activates the campaign
  └─ «Pedir cambios» (reject) → charges an iteration, feedbackLearning merges the
     reason into the rules learned from TEXT (feedback_digest), and the piece goes
     to 'generating' so the worker queue regenerates it with the rule in place.
     Nothing is learned from the image: a brand's visual side is written down,
     not inferred
```

`platform_meta.imagePlan` stores what each image was generated with:
references, their roles, the layout, the corrections and the final prompt. It is
what the panel shows in «Cómo se generó esta imagen» ("How this image was
generated"); see [generation details](../image/image-engine.md#generation-details-evidence-per-image).

## Lab versus policy

This is the product's central distinction:

- **Canvas and the creation pages** are the lab. The user composes by hand,
  experiments, discovers what works.
- **The campaign plan and piece settings** are policy: what the worker applies
  to every automatic piece, unsupervised.

The bridges between the two are deliberate: extracting a layout from a piece
you liked («Extraer de una pieza»), and learning from rejections. One is missing — configuring with AI — and
it is in the [backlog](../product/backlog.md).

## Where each material lives

| Material | Lives in | Roles it accepts |
|---|---|---|
| Model images | ADN → Marca | visual finish; one rotates per piece. Without one, no look reference travels |
| Library | Library (`/library`) | character, product, object, place |
| Reusable copy | ADN → Voz | — |
| Layouts (Moldes) | ADN → Visual → Moldes | structure, zones and treatments; layout in automatic generation |
| Visual identity | ADN → Marca | logo, palette, typeface, visual direction |

Website captures from onboarding only reach the brand's first image («Crea tu imagen modelo»).
**Subjects** come in when summoned with `@` or pinned in Ajustes → Piezas; the
logo follows its configured mode. The anchor (model image) and the layout never
lend subjects just by appearing in a reference.

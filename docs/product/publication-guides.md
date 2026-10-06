# Publication guides (6 October 2026)

A publication type defines **what a piece communicates** and the facts/copy roles
it needs. A Molde defines **where its content goes**. Neither replaces the brand
identity, its voice, palette, typeface, materials or original logo.

## Brand setup

The wizard separates business category from content intention. **Explore 24
categories** opens a searchable picker with examples, while the editable industry
field still accepts custom categories and website-analysis results. Each sector
provides eight starting recommendations, rather than imposing a voice or palette.

**Choose my primary content line** opens twelve options, each with its description
and available-type count. Selecting one exposes its post types in the wizard. The
optional **Add another content line** uses named choices with explanatory text;
there is no unexplained secondary select. The two selections guide recommendations,
not access restrictions. Users can still explore every type.

Website analysis receives the current twelve-line catalog in both the enum and
prompt, avoiding a stale four-objective list.
The selections live in `brand_profiles.voice.contentOrientation` and
`secondaryOrientation`. Existing brands and old API clients keep working without
these keys; no migration or automatic rewrite is needed. Create images exposes
**Cambiar dirección**, saved as a partial voice patch preserving other voice fields.

## Choosing a piece

Create images and the first-brand-image editor share `PublicationStudio`. They show
six starting recommendations. Sector-relevant types within the primary line
appear first, followed by remaining primary and secondary types without duplicates.
A custom industry keeps the content-line recommendations. With no content line,
sector recommendations are available. **Ver todos** opens the searchable 80-type
catalog, with a filter for each of the twelve lines; **Crear libre** clears the active
guide and restores the existing free brief / Molde text controls.

Each guide has server-defined fact and editorial-copy fields. Facts are confirmed
by the user and treated as reference data, never obligatory words to print. Required
facts block image generation and copy assistance before any model call. Copy is
optional; leaving all copy empty requests an image without editorial text. The
original supplied logo remains the lettering exception. Switching types preserves
local edits while the editor stays mounted.

**Proponer texto con IA** costs one existing assist, uses the authenticated account
and its configured provider, and leaves a proposal in editable fields. Saved brands
use server-loaded identity/voice, never client-supplied replacements. Saved content
language takes precedence over UI language. No image is generated on selection,
loading, editing or direction changes. Requests are not automatically resubmitted.

## Catalog scope

The API source is `publicationRecipes.config.js`, extended by
`publicationExpansion.config.js`. Version `2026-10-06.2` contains 80 unique guides,
24 business categories and twelve content lines. A guide can belong to multiple
lines; their counts therefore must not be summed to find the catalog size.
Existing 30 recipe IDs, their field keys, and the four original orientation IDs
remain valid for saved brands and drafts. No database migration is required.

| Content line | Available types | Examples |
|---|---:|---|
| Products and promotions | 10 | Product detail, bundle, promotion, menu, property |
| Services and solutions | 10 | Problem/solution, process, service, plan/pricing |
| Education and advice | 12 | Tutorial, checklist, prevention, downloadable resource |
| Memes and entertainment | 8 | Reaction, expectation/reality, POV, mini comic |
| Infographics and data | 12 | Infographic, chart, timeline, anatomy, matrix |
| Inspiration and lifestyle | 9 | Moodboard, palette, lookbook, itinerary |
| Brand identity and history | 8 | Origin, manifesto, values, team, founder |
| Trust and results | 8 | Review, case study, project, recognition, documented impact |
| Community and conversation | 8 | Poll, question, challenge, spotlight, adoption |
| Events and seasons | 8 | Invitation, agenda, recap, webinar, seasonal piece |
| News and opinion | 8 | Sourced news, trend analysis, announcement, perspective |
| Team and work culture | 8 | Vacancy, day in the team, values, behind the scenes |

Each added guide defines a concrete directive, required factual inputs and optional
editorial-copy roles. Data graphics require source, date and/or units; quotes,
reviews and recognition require authorized attribution; before/after and generated
scenes must not be passed off as evidence of real work. Users must review charts,
claims and imagery before publication: text verification alone does not prove a
chart's geometry or an assertion's truth.

These are **single-image** guides, including compact diagrams and comics. A poll
image does not create an interactive poll. This release does not generate carousel
sequences or videos, and does not claim an exhaustive taxonomy or popularity ranking.

### Research basis and product decisions

Reviewed on 6 October 2026. Official platform resources support broad content
families, not a universal or exhaustive category list:

- [LinkedIn: B2B content types](https://business.linkedin.com/it/it/advertise/resources/marketing-terms/b2b-content-types)
  discusses case studies, infographics, research and other professional formats.
- [LinkedIn: content marketing tactical plan](https://business.linkedin.com/advertise/resources/linkedin-content-marketing-tactical-plan)
  distinguishes awareness, thought leadership, leads and event registration, with
  company news, practical content and evidence as useful inputs.
- [TikTok: creative strategies](https://ads.tiktok.com/business/creativecenter/quicktok/online/tiktok_creative_accelerator/pc/en?rid=xui6qmzjz6o)
  covers product demonstrations, user reviews, tutorials, brand values and stories.
- [TikTok: holiday creative playbook](https://ads.tiktok.com/business/library/TikTok_SMB_Creative_Playbook_Holiday_Edition.pdf)
  includes process/behind-the-scenes, stories and educational content.

Polyvik's twelve lines, sector assignments, counts, exact fields and static-image
adaptations are product decisions informed by those patterns. Video examples are
not evidence that Polyvik generates those video formats in this image catalog.

## API and enforcement

- `GET /api/brands/publication-catalog`: authenticated, no AI usage. The shared
  source is `polyvik-core/src/config/publicationRecipes.config.js`.
- `POST /api/brands/publication-copy`: assist-gated; `publication`, optional
  saved `brandId` or onboarding `identity`, and optional explicit `textLanguage`.
- `POST /api/canvas/generate` accepts optional
  `publication: {recipeId, facts, copy}`. A complete guide may replace an empty prompt.
- Onboarding and the saved-brand image modal carry it under `firstPiece.publication`.
  Incomplete draft facts may be saved when the user skips the first image, but are
  revalidated before generation.

Unknown recipes, mismatched field keys and oversized values are rejected. Approved
copy becomes the existing exact-text verification contract; generic headline/body/CTA
fields do not leak into a guided piece. The user reviews factual inputs and proposed
copy; model prompts and image verification do not independently prove the claims.
The existing original-logo integrity pipeline remains active.

## Verification

Core tests cover catalog integrity, required facts, tenant isolation, saved voice,
content language, orientation persistence, exact copy and guided first-image/canvas
payloads. Panel tests cover recommendation priority, draft validation and missing
fields. `npm run test:publications` uses an isolated browser and mocked API responses
(no real generation costs) to verify dynamic fields, reviewed AI text, free creation,
saved direction, required wizard selection, 24 searchable sectors, twelve content-line choices,
80 browsable guides, per-line filters, and desktop/mobile accessibility.

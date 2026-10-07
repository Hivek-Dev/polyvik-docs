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
## Brand category (sector)

Since 7 Oct 2026 the brand stores its catalog category in `brands.sector`
(migration `086_brand_sector.sql`), separate from `vertical`, the brand's own
free-text description ("Cafetería de especialidad").

- Picking a category in onboarding (`BrandSectorPicker`) saves its id. The typed
  vertical is kept as the brand wrote it.
- A brand without a stored sector gets one inferred from its vertical by keywords
  (`polyvik-core/src/utils/brandSector.js`). `GET /api/brands` returns it with
  `sectorInferred: true`. Text with no clue ("general", the brand's name) gets none.
- Brand DNA → company details shows the category; an inferred one appears as a
  suggestion with **Confirmar**. `PUT /api/brands/:id` accepts `sector` (a catalog
  id, or `''` to clear it).
- Recommendations match the sector by id, or by exact label for older data.

The content-line selections live in `brand_profiles.voice.contentOrientation` and
`secondaryOrientation`. Existing brands and old API clients keep working without
these keys; no migration or automatic rewrite is needed. Create images exposes
**Cambiar dirección**, saved as a partial voice patch preserving other voice fields.

## Choosing a piece

Create images and the first-brand-image editor share `PublicationStudio`. They show
twelve starting recommendations (`recommendedRecipes` in
`polyvik-panel/src/lib/publicationRecipes.ts`), in this order:

1. the sector's types that are in the primary line, then in the secondary line;
2. the rest of the primary line;
3. the rest of the sector's types;
4. the rest of the secondary line.

The content line stays intentional (a memes brand sees every meme before any
sector type outside humor), but since 7 Oct 2026 no type of the brand's sector is
hidden: a technology brand on the "solutions" line also gets its infographic and
webinar. **Ver todos** opens the searchable 80-type
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
`publicationExpansion.config.js`. Version `2026-10-06.3` contains 80 unique guides,
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

## Image copy aligned with the selected mold (6 October 2026)

The copy assistant now receives the selected recipe, authenticated brand voice,
format, catalog mold and art direction. Owned layout references are included as
visual evidence after tenant/brand/storage validation. Mold metadata is resolved
from the server catalog, never accepted as client-authored instructions.

Each recipe copy role has a short image-oriented recommendation (not the old
600-character drafting target). Mold capacity adjusts these recommendations;
all semantic roles of the publication remain available. AI proposals use plain
text and are validated against these limits. One bounded rewrite can recover an
oversize proposal within the same assist. Approved human copy is never truncated
or silently rewritten to fit a mold.

Changing a recipe, mold, format, factual input or art direction preserves edited
copy and offers **Adaptar textos con IA**. An advisory context stamp accompanies
the panel draft across Texto/Molde tabs; it grants no server authority. Late AI
responses cannot overwrite a newer piece. Create images now has a catalog mold
picker and carries its ID through generation and local history. The server
renders the trusted diagram and gives it to the image engine as geometry only.
Unsupported formats and reference capacity are explained before generation.

Paired Markdown bold/code markers are removed from publication copy before both
rendering and verification, preserving wording, accents, trademark symbols and
numbers. Field/role labels such as Problema and Solución are instructions, not
additional printable copy. OCR is explicitly instructed to classify a logo's
wordmark and embedded tagline as object text. Real missing words, changed figures,
misspellings and unapproved editorial text still receive review findings.

Validation: the full core suite passed (594 tests, 12 skipped), with an additional
regression covering the reported Markdown/OCR mismatch; 53 panel unit tests;
isolated browser coverage for changing molds, aligned assist and generation
payloads, onboarding tab persistence, copy normalization, desktop/mobile
accessibility, and existing recovery flows. These tests mock paid providers.

Authenticated live QA also completed: one copy assist produced three clean blocks
of 43/65/21 characters against a 53/82/28-character mold recommendation. A single
GPT Image 2.5 generation rendered the three blocks and returned a usable image
without review warnings; the UI showed the selected publication and mold. The
result was saved in Feed. This is one successful sample, not a claim that every
future provider output will pass verification. Core deploy: `3fca186`; panel:
`7e6abc8`.

# Publication guides (pilot, 6 October 2026)

A publication type defines **what a piece communicates** and the facts/copy roles
it needs. A Molde defines **where its content goes**. Neither replaces the brand
identity, its voice, palette, typeface, materials or original logo.

## Brand setup

The wizard requires a primary content direction: products, solutions, education
or humor. A different secondary direction is optional. Industry stays a separate,
editable field with 24 suggestions; a software company can teach, sell or entertain.
Website analysis may suggest a direction for the user to review.

The selections live in `brand_profiles.voice.contentOrientation` and
`secondaryOrientation`. Existing brands and old API clients keep working without
these keys; no migration or automatic rewrite is needed. Create images exposes
**Cambiar dirección**, saved as a partial voice patch preserving other voice fields.

## Choosing a piece

Create images and the first-brand-image editor share `PublicationStudio`. They show
six recommendations, combining primary then secondary direction without duplicates.
**Ver todos** opens the searchable 30-type pilot; **Crear libre** clears the active
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

## The thirty types

Product hero, product benefit, product in use, launch, promotion, problem/solution,
FAQ, diagnosis, actionable tip, checklist, myth/fact, data point, visual comparison,
testimonial, case study, question, event invitation, seasonal piece, reaction meme,
expectation/reality, me/also me, POV, mini comic, niche meme, demonstration, glossary,
process map, tutorial, common mistakes and decision tree.

This is a single-image pilot, including compact diagrams and comics. It does not
create carousel sequences or videos and does not claim to exhaust every category.
The broader research catalog is a proposal for later expansion.

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
saved direction, required wizard selection and desktop/mobile accessibility.

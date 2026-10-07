# Text composition in images

How the words on a campaign image are designed, measured and drawn. Fonts: [Real typography](real-typography.md). Audience,
language and the editorial finish: [Editorial context](editorial-context.md).
Overall pipeline: [Image engine](image-engine.md).

## Who writes, who lays out, who draws

- **The copywriter writes the wording** (`imageText`: headline + support) in the
  brand's regional voice. `lockImageText` (`imageText.services.js`) prevents the
  designer and the finish from rewriting it.
- **The designer lays it out.** It receives the full post, the chosen Molde, the
  format and size, the brand instructions and up to six recent compositions
  (structure only, never content to reuse). It returns the visual content and
  `textBlocks` in reading order — exact text, role, hierarchy, placement,
  treatment and emphasis — plus `composition` (scene, protected regions, ordered
  graphics, flat logo) and `textLayout`.
- **Who draws depends on `textRender`** (`pieceSettings.services.js`):

| Mode | When | What happens |
|---|---|---|
| `integrated` (default) | Text allowed, provider OpenAI, font measured | The editorial layer (real font + logo on a gray placeholder, `integratedText.services.js`) is sent to gpt-image as a reference. The model composes the finished piece and may move the text. |
| `composited` | Chosen explicitly, non-OpenAI provider, or integrated fallback | The provider draws the scene without copy; the app paints panels, veils, shapes, icons, the flat logo and the text with the real font on top. |
| provider-drawn | No font selected | The provider draws the blocks itself; no font-file fidelity is promised. |

Integrated text was made the default on 23 Sep 2026 because pasted text looked
like a collage: scene light never touched the letters.

### Integrated flow

1. The designer's measured layout becomes a gray **editorial layer** — only letters
   and logo. Cards, bands and veils are left out: when drawn, the model copied
   them and the piece became a collage again; the model decides the treatment.
2. The brief's TEXT section (`integratedTextNote`) fixes the wording letter by
   letter and leaves position, size, line breaks and color (within the palette) to
   the model. No text over faces or the main product; no other words; the real
   logo is attached on its own and must be reproduced exactly.
3. Before saving, Haiku reads the image (`checkIntegratedText`, log kind
   `image_text_check`) and compares it with the approved text. Case and line breaks
   may change; OCR may join, split or reorder approved blocks. Each approved phrase
   is consumed once, so duplicates and extra words still fail. The reported coffee
   promotion with two approved paragraphs merged by OCR has a regression test.
   Typographic ellipses and invisible word joiners normalize; changed words,
   accents, numbers and other punctuation still produce findings. A missing logo or a
   covered face also fails.
4. Review-aware clients and worker drafts confirm a copy disagreement on a clearer
   proof and may repair the same candidate once. An unresolved image is delivered
   with a visible review warning, never automatically approved or published. Legacy
   clients retain two integrated attempts followed by the `composited` fallback.
5. `imagePlan.textChecks` records each read; `imagePlan.composition.execution` and
   `imagePlan.typography.execution` say `integrated`, `composited` or `provider`.

### Interactive guided creation

`/feed/create`, onboarding preview, Brand image studio and campaign previews send
`qualityReview: "v1"`. Clients displaying review metadata opt into
`reviewMode: "assist"`; the campaign worker also uses it for pending-approval drafts.
Legacy callers retain their strict contract. A copy disagreement is confirmed once on
a clearer proof (up to 2048 px, JPEG quality 96). If it clears, no image edit runs.

With Polyvik's OpenAI image key, a confirmed editorial issue gets **one** edit of
the actual candidate, keeping the scene and approved copy in the prompt. Only a
verified correction replaces the original. Integrated text layers retain their
approved copy for repair. For protected logos the edit receives the scene before
logo insertion, then the original file is placed again and verified. A failed edit
or newly broken logo retains the original candidate and its original logo audit.
This is inside the existing image
credit. BYOK never gets an extra image-provider call for this repair; other
providers currently skip automatic repair too. Text-key review calls still use
the normal account text-key routing.

If copy remains uncertain, or the reader is unavailable, the original image is
delivered as `review.status: "needs_review"`, with allowlisted findings. It is
available to inspect and edit; no automatic publication or approval occurs. The
warning persists as `brand_assets.generation_review` (migration 085), and appears
in Create images and the Feed tile/dialog. Successful repair returns `corrected`.
The same warning appears in the first-piece editor, Brand modal, campaign preview,
calendar viewer and Piece studio. Onboarding persists it in the signed preview
receipt and later in the saved asset; campaigns persist it in `imagePlan.review`
(or legacy `previewReview`). Client edits cannot forge or clear server-owned review
metadata. Replacing an image adopts its owned asset review, avoiding stale warnings.
Logo checks remain blocking.
Missing files, provider failures and quota errors keep the recovery-card path.

Under the production `lite` profile the editorial finish is skipped for integrated
pieces; in the composited path the finish can still review a mobile proof over the
real photo and recompose the layers without regenerating the scene.

## Content rules

There is no target block count and no formula per industry. The designer can
deliver one sentence, several supports or no text at all. Identity, purpose, the
post and legibility decide. Graphics and typographic prominence are allowed when
they suit the brand. `imageTextDensity` (`auto`, `headline`, `headline_support`)
limits how much the image carries.

**Molde** is the name for layout templates: it suggests structure and proportions
and never forces the designer to keep its rectangles. The model image gives finish,
medium, lighting and treatment. Explicit font, palette and logo settings win.
Without a model image there is no look reference; palette, typeface and visual
direction carry the brand. The provider never receives the Molde image. The designer (and the
finish, when it runs) does see the Molde drawing to judge density and pauses;
extracted Moldes add their measured zones as suggestions, not coordinates.

A shared background is defined once. Icons are optional and purposeful, not
symbols inherited from the Molde. The `scene` logo mode stays generative.

## Validation and fitting

`imageComposition.services.js` validates active properties and canvas bounds.
Overlap with estimated scene zones, margins, grouping and known contrast come back
as creative observations, not vetoes. Nothing is validated against Molde bounds.
The compositor measures the real font and rejects text off canvas, overlapping
boxes and overflow.

`typographyFit.services.js` resolves heights and flow with the same measurements:

1. Grow heights without moving positions.
2. On conflict, redistribute blocks vertically inside existing columns and
   backgrounds, keeping order and spacing; propagate limits forwards and backwards
   so every block keeps its space. Reclaim empty box height before shrinking text.
3. If it still does not fit, try a common size scale in 5% steps, down to a minimum
   of 0.032 of the short side per block. Order of sizes is preserved; content,
   family, weights, emphasis, width and leading are kept.
4. Every solution is measured and validated again. All local, no extra AI calls. A
   design that already fits is returned untouched.

If the area cannot hold the text even at the minimum, the designer receives all
measured heights and must rethink columns, backgrounds and scene. `typography.fitting`
(version 2) records mode, scale and per-block changes.

Before measuring, a positive numeric size is clamped to 0.032–0.20 and inactive
fields of an absent card are normalized; each change is logged in
`typography.normalizations`. Zero, wrong types and invalid active properties
remain errors. Remaining `textLayout` numeric errors name block, property, value
and allowed range, all reported together.

Geometry does not check where the model actually placed a face, nor contrast
against scene pixels or transparency: that needs visual review.

## Limits and retries

- Maximums (`TEXT_LIMITS`): 8 blocks, 400 characters per block, 1600 total. They
  guard against runaway output; they are not editorial goals. Sentences are never
  cut to fit.
- Hierarchy, literal emphasis, accidental duplication and brand-forbidden phrases
  are validated. This does not prove factual truth or the spelling the image model
  draws (the integrated read-back covers the latter).
- Designer output is capped at 8192 tokens, with up to three attempts that carry
  the concrete validation errors and the previous delivery. Validation runs inside
  `generateStructured`; each rejected attempt is logged as a failed `image_brief`
  in `generation_logs` with attempt number, diagnosis, model and tokens. Provider
  errors do not enter the design-correction loop.
- Diversity is steered by memory (brand, account, `memory_from`), not quotas.
  Previews are not stored in that memory.
- On exhausted retries the card and HTTP/streaming response show a short message;
  `generation_logs` and history interactions keep the full diagnosis.

## Responsibilities and compatibility

- `imageText.services.js`: contract, validation, `lockImageText`, old-format
  compatibility, exact engine instructions and composition summary.
- `imageDirector.services.js`: designs in one call. It never uses a Molde image
  or an extraction's original piece as a source of facts.
- `generation.services.js`: picks the Molde once, decides integrated vs composited,
  passes one candidate to the shared quality engine for updated callers, preserves
  the two-attempt fallback for legacy callers, and passes the final composition to the engine.
  The Molde's turn is counted only after a successful, non-preview generation.
- `pieceBrief.services.js`: reserves copy-free zones with real typography; without
  a chosen font lets the model draw the blocks. The panel's chosen font rules every
  block, even with a model image or Molde.
- `imageBrief` and `imagePlan` keep the blocks; `headline` is derived from the
  dominant block for compatibility. An explicit `textBlocks: []` never resurrects
  an old headline.
- `imagePlan.prompt` keeps the text sent to the provider (OpenAI: the request
  prompt), including reference instructions. No base64 images or credentials; not
  truncated; not duplicated in `platform_meta.imagePrompt`.
- The Molde extractor supports up to 12 zones and keeps small secondary text from
  0.1% of area. Saved Moldes are not modified; re-extract to recover dropped zones.
- **Visual style and arrangement** was removed from the panel and prompts (Canvas
  included). Old `palette.style` / `style_en` are ignored. Board analysis was
  retired on 7 Oct 2026; colours can still be read from any image.

## Verification

- `npm test` covers preview, worker and regeneration with mocked AI/DB/engine.
- `npm run test:images`: `imageText`, `imageCompositionFlow`,
  `imageProviderTypography`, `typography`.
- Also: `imageComposition.test.js`, `integratedText.test.js`,
  `imageTextVoice.test.js`, `designerValidation.test.js`, `typographyFit.test.js`,
  `visualIdentity.test.js`.
- Tests need a Node that supports `--experimental-test-module-mocks`.
- Mocked cases do not prove visual quality; validate by regenerating real pieces.
- Deploy core before panel. See [deployment](../architecture/deployment.md).

### Bounded Seedream prompts

Seedream's 4000-character limit previously truncated the tail of long brand
context, which could remove a guided publication's exact copy and recipe. The
engine now places an explicit approved-copy contract first, bounds the reference
captions and then fits optional context into the remaining space. Guided Canvas
recipes precede brand context too. Empty copy forbids editorial text; composited
campaigns also request a copy-free scene. Protected logos explicitly stay out of
the model drawing. If the essential copy itself cannot fit, validation stops
before reference uploads or a paid prediction; it never silently drops words.
This strengthens instructions, but provider compliance still needs review.

Real UI validation on 6 October 2026: a Brand studio image preserved its original
logo file and three approved copy fields. A Seedream infographic first returned
`needs_review` with missing and invented copy; after the prompt-priority fix, an
explicit refinement using the same candidate and approved strings returned the
correct title and all three numbered blocks without a review finding. Both
outputs were saved to Feed. This is representative validation of two providers,
not a visual test of every recipe. Automated verification: 589 core tests passed,
12 integration tests skipped, 52 panel tests passed; browser recovery checks cover
Create images, onboarding reload, Brand refinement, campaign review and published
piece protection. Provider variability remains possible; unresolved copy stays
editable with its warning instead of being discarded.

# Image engine

How a campaign piece gets its image: who decides what, which model draws it, and
what is recorded. The detailed text contract lives in
[Text composition](text-composition.md); fonts in [Real typography](real-typography.md);
language and audience in [Editorial context](editorial-context.md). This page
does not keep a second copy of the prompts.

## One responsibility per stage

1. The **content director** proposes the campaign ideas.
2. The **copywriter** (`copyGenerator.services.js`) writes the post *and* the
   text drawn on the image (`imageText`: headline + optional support line), in the
   brand's voice and regional variant. It is stored in `platform_meta.imageText`
   and reused when only the image is regenerated.
3. The core picks a **Molde** (layout template) once, before the designer.
4. The **designer** (`imageDirector.services.js`) receives the full post, the Molde
   and the image text. It returns scene, text blocks, hierarchy, placement,
   treatment, materials and alt text. `lockImageText` stops the designer (and the
   finish) from rewriting the copywriter's wording; the support line always sits
   under the headline.
5. The **editorial finish** (`publicationFinish.services.js`) can keep or correct
   post and design. Under the production `lite` profile it is **skipped when the
   text is integrated** (the default); see [AI usage and costs](../architecture/ai-usage-and-costs.md).
6. `pieceBrief.services.js` assembles the final brief. The image model never
   receives the Molde drawing.

The designer organizes reading within the brand identity; style is not forced by
industry. `allowTextInImage` (on by default for new brands) controls text blocks;
`textBlocks: []` means no editorial text, even with a Molde. The logo mode has its
own exception. `imageTextDensity` (`auto`, `headline`, `headline_support`) and
`logoSize` (`discreet`, `normal`, `prominent`) are brand settings that a campaign
freezes when it is created.

## Who draws

- **Campaign pieces always use OpenAI** (`PIECE_PROVIDER = "openai"`, size
  `large` in `pieceSettings.services.js`). The aspect comes from the channel
  (`CHANNEL_ASPECTS`). Canvas and Studio keep their own selectors.
- Models: `OPENAI_IMAGE_MODEL` (default `gpt-image-2.5-sunburst`) with
  `OPENAI_IMAGE_FALLBACK_MODEL` for accounts without 2.5 access.
  `IMAGE_TIERS` in `imageModels.config.js` names `fast` (`gpt-image-2.5-flare`)
  and `precise` (`gpt-image-2.5-sunburst`, quality `xhigh`).
- **Gemini and Flux are implemented but closed by default.** Only providers in
  `IMAGE_PROVIDERS_ENABLED` (default `openai`) are routed; a stale saved
  preference falls back to the server default with a warning. An account that
  chose its own engine key reopens that engine for itself only.
- **Seedream 5 Pro** (`seedreamImage.services.js`, via Replicate) is a
  per-generation choice, not an account engine. It is the default for the
  character creator because Seedance's face filter accepts its faces more readily.
  Up to 10 references, sent as 2048 px JPEG; the role of each reference goes at
  the top of the prompt. Paid with the account's Replicate key or, if absent,
  `REPLICATE_API_TOKEN`.
- New model versions are never switched automatically; the model watch only warns.

## What each input contributes

- **Model image** (`anchorUrls`, up to 4): the approved finished look — ideally
  finished pieces with text, not raw Canvas photos. One rotates per piece. With a
  model image, the brand board and free style are not attached as well.
- **Free style:** fallback when there is no model image; one rotates per piece.
- **Molde:** structure and zones. The requested format wins; the arrangement
  adapts. It never imposes the output format or lends subjects.
- **Extracted Molde:** zones plus a note on effects and layering. The note travels
  to designer and engine; the original extraction image does not.
- **Library:** character, product, object or place called with `@` or pinned.
- **Art directions and fixed prompts:** brand instructions.
- **Season:** campaign palette and motifs.
- **Corrections:** what the client asked to change in that piece.

The campaign recipe keeps its settings; identity and model images are read live.
`imagePolicy.services.js` is still used by the blog — it is not a dead copy of
`pieceBrief.services.js`, which builds the piece contract.

## The reference system: one owner per dimension

Since 7 Oct 2026 every entry point (Create images, tools, campaign pieces, the kit
studio) follows the same ownership rules. Two layers of tests freeze them:
`polyvik-core/test/referenceSystem.test.js` (what each provider receives, image by
image) and `test/canvasReferences.test.js` (what Create images decides).

| Dimension | Owner | Rule |
|---|---|---|
| Look / finish | A **model image** (one, rotating) — or, without one, the **free-style bank** | Never both. With a model image the board and the bank stay home (`anchored`) |
| Layout | The Molde | Look references lend finish, never composition |
| Typography | The brand's typeface (`palette.fonts[0]`) | Sent with text-bearing Create images pieces; every look caption yields to it |
| Colors | The kit palette (or the seasonal one) | Once per prompt |
| Logo | The brand logo | One: an explicit `logo` reference replaces the automatic one |
| Content | What the user attaches | Outranks the look |

- **Free-style bank** (`config/references.config.js`): up to 12 images
  (`MAX_STYLE_BANK`), website captures included; each generation takes 2
  (`STYLE_REFS_PER_IMAGE`) via `pickAmbientRefs` — random, or deterministic with
  `lookRotation`. Campaign pieces pick their own single free-style image and never
  send the rest (`profileStyleRefs: false`).
- **Model images in Create images:** one is attached as the anchor only when a slot
  is free; it never displaces the user's references. Tools pass `lookAnchor: false`:
  a finished designed piece as a look would turn a product photo into a poster.
- **The cap** (`MAX_REFERENCES`, 6 explicit references) cuts by priority after
  ordering — anchor, base, layout, character, product, place, logo, content,
  style… — never by arrival order.
- **Instructions vs. rejections:** a piece's own image instructions reach the
  designer and the engine as the client's instructions, not as "the client rejected
  the previous version".
- The anchor's caption travels once, attached to its image; the piece brief no
  longer repeats it.
- The kit studio drops the board when model images own the look.

## Reference roles

The core defines `REFERENCE_USES` in `imageGenerator.services.js`; the panel
mirrors the user-facing roles in `polyvik-panel/src/lib/refUse.ts`.

| Role | Contributes |
|---|---|
| `base` | Image to edit, keeping what was not asked to change (Canvas/Studio) |
| `board` | An earlier board of the same brand kit (core only, used by the [brand kit](../product/brand-kit.md)) |
| `layout` | Arrangement; not the reference's subjects or words |
| `character` | Character identity |
| `product` | Product and its features |
| `place` | Location and its structure |
| `content` | Called object or content |
| `logo` | Original logo |
| `style` | Finish and mood |
| `palette` | Colors |
| `composition` | Framing and distribution |

The caption attached to each image limits what is taken from it. In pieces a brand
reference does one job only: show how the brand looks. A Molde never becomes
`base` for automatic pieces. Canvas and Studio keep their editing contract; the
campaign text contract is not imposed on them. Identical references do not use two
slots; a different role or note is kept as a separate instruction.

## Rules that still apply

- The channel sets the aspect. No `trim` or `cover` on the engine output. The
  output is only normalized to the requested size when the ratio mismatch is under
  1.5%; a fallback in another ratio is delivered uncropped.
- SVG references are rasterized before being sent to a provider.
- `input_fidelity=high` is only sent to models that accept it (for explicit `base`
  or `character` references). The gpt-image-2 family, 2.5 included, rejects it and
  already applies high fidelity; `acceptsInputFidelity()` decides.
- Explicit references come before ambient ones. The look anchor goes first among
  piece references.
- Content is conceived in the brand's editorial language for its audience. There
  is no final translation step ([Editorial context](editorial-context.md)).
- Regenerating only the image keeps the post (and `imageText`) and calls the
  designer again.
- Mocked tests verify contracts, not the visual fidelity of the AI.

## Traceability

`platform_meta.imageBrief` keeps the designer's composition.
`platform_meta.imagePlan` keeps provider, model, format, text blocks, references,
Molde, corrections, `textChecks` (integrated text reads) and the prompt actually
sent. `imagePlan.prompt` includes the text instructions of the attachments; never
binaries or credentials. The old `platform_meta.imagePrompt` is no longer written.

The reader for the old `headline` field is still needed for historical pieces.
Old routes, recipes with a singular `anchorUrl` and published migrations are not
deleted for being labeled compatibility.

## Generation details (evidence per image)

Migration `047` creates `image_generation_details`, separate from materials and
notes. Pieces and previews store their `imagePlan` per account, brand and final
URL: Molde (URL, note, zones), model image, references, typography and prompt. It
is not rewritten when settings change or another version is generated, never enters
automatic context, and is not copied into notes when saving to the Library.

`GET /api/assets/generation?brandId=…&url=…` validates the brand and returns
`{plan: …}` or `{plan: null}`. Feed, Library and reopened previews call it for the
"How this image was generated" detail; the first view of a preview uses the plan
already returned by the generation.

The designer receives the same model image the engine uses. With a model image it
does not receive free-style notes; the old `palette.style` / `style_en` prose and
the written style field are retired. Old previews that only kept `previewUrl` and
`previewCopy` have no reconstructed plan; the panel says there is no evidence. Free
generations from Lab, blog and events do not produce a campaign `imagePlan` and may
also lack detail.

Related: [Feed and Library](feed-and-library.md),
[plans and credits](../product/plans-and-credits.md),
[glossary](../guides/glossary.md).

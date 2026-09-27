# Image creation workspace

`/feed/create` ([`ImageCreate.tsx`](../../../polyvik-panel/src/pages/ImageCreate.tsx),
[`ImageCreate.css`](../../../polyvik-panel/src/pages/ImageCreate.css)) is a focused
image workspace: an open stage above a floating composer, with every generation
control attached to that composer.

## Entry points

- The Feed hero's primary action, **Create images**. The workspace is not in the top
  navigation; the Feed hero also links to Create video and Characters.
- The header breadcrumb (`← Feed / Create images`) returns to the Feed.
- The page is full bleed (no page padding, no header backdrop, no `SetupStepper`);
  see [design-guide.md](design-guide.md#frame-and-navigation).

## Visual direction

- The Brasa pixel strip along the top (`PixelGradient`, cell 10,
  `colorPlacement="right"`, revealed once on arrival), a headline with a solid
  coral accent, dark surfaces and generous space.
- The active brand's name (and avatar) sits in the header; the welcome screen shows
  the brand's real palette as swatches. Brand DNA starts enabled and can be reviewed
  or turned off from the composer.
- Three editable starters (product, scene/lifestyle, unexpected). They only fill the
  prompt; clicking a starter never generates.
- While generating, the stage shows a pending state. After generation the image
  replaces the welcome screen. Result actions:
  - **Saved** → link to the Feed (every generated image is stored there by the
    backend).
  - **Download**.
  - **Animate this image** → `/video/create`, passing the image as a brand-scoped
    starting frame (see [video-creation-workspace.md](video-creation-workspace.md)).
  - **Variation** → attaches the result as a `base` reference and pre-fills a
    variation prompt (disabled if the model takes no references).
  - **New image**.
  - A thumbnail history of this visit's creations.
- On narrow screens controls wrap and the generate button takes a full row. The stage
  scrolls independently so the composer stays visible. Reduced motion disables
  decorative motion.

## Controls

- **Model, format, resolution:** the catalog, native aspect ratios and per-format
  resolutions come from `GET /api/canvas/models`.
  [`imageCreateOptions`](../../../polyvik-panel/src/lib/imageCreateOptions.ts) resolves
  incompatible choices together. A model without reference support cannot run while
  references are attached (an inline notice explains why).
- **References:** picked from the brand's Library or Feed, or uploaded, through the
  shared [`CreationReferencePicker`](../../../polyvik-panel/src/components/CreationReferencePicker.tsx).
  Up to six images, each with its reference role (`refUseOptions`).
- **Brand DNA dialog:** toggle, palette, personality and a link to edit the brand
  identity. It maps to the backend's `useBrandStyle`; this screen does not redefine
  brand identity.
- **Art direction dialog:** a style guide from `GET /api/canvas/skills` and an
  optional instruction.
- ⌘/Ctrl + Enter generates.

## Generation

One request to `POST /api/canvas/generate` with brand, prompt, provider, aspect ratio,
image size, references (`url` + `use`), `useBrandStyle`, `skillId` and the extra
instruction as `contextTexts`. Submission is locked while pending and is **never
retried automatically** (a retry could charge a second image). On failure the prompt
and all selections are kept and the error is shown above the composer, in the
dock (this page still uses inline errors rather than `notify()`).

## Validation (snapshot at launch)

At launch the production build and 18 unit tests passed, including four
capability-resolution cases. Browser checks covered starters, reference selection and
roles, incompatible-model blocking, art direction, the brand toggle, result display,
base-image refinement and draft preservation after a failed request, plus a
390 × 844 mobile layout with no horizontal overflow. These numbers are historical;
run the current test suite rather than relying on them.

# Real typography

Campaign pieces and previews with text allowed and a chosen font use the original
files of the 56 families in the font menu. No migration required. How the text is
laid out: [Text composition](text-composition.md).

## Flow

1. `fontFiles.services.js` loads the family from `polyvik-core/assets/fonts/manifest.json`,
   verifies SHA-256 and offers only the weights that exist. The catalog weighs
   33 MB, keeps each family's license and is pinned to a google/fonts revision.
   Production never downloads fonts or relies on system fonts.
2. The designer returns the blocks and `textLayout` in the same call: boxes, size,
   weight, leading, alignment, colors, optional background and margins. There is no
   fixed grid per industry; the Molde suggests geometry.
3. `typography.services.js` measures with fontkit, applies kerning and ligatures,
   wraps lines and checks overflow, off-canvas boxes, collisions and missing
   glyphs. Minimum size: 3.2% of the short side (`MIN_FONT_SIZE = 0.032`). An error
   goes back to the designer with the measurements (up to three attempts). Copy is
   never cropped, re-cased or letter-compressed.
4. What the provider receives depends on `textRender`:
   - `integrated` (default, OpenAI): the measured text and logo rendered with the
     real font on a gray **editorial layer**, as a reference the model recreates
     inside the scene; the result is read back and checked
     ([details](text-composition.md#integrated-flow)).
   - `composited`: the reserved zones and their colors, **without** the editorial
     copy. After background normalization the app composes the designed graphics
     and the original flat logo; glyphs are converted to SVG paths and Sharp
     overlays them at final resolution. The result is not sent to an AI again.
5. `imageBrief.typography` stores the design. `imagePlan.typography` records
   family, file/hash, weight, real size, lines and dimensions (composited), or
   family, layouts and `execution: "integrated"`. The panel shows "Real font" only
   when the engine returns this audit. `imagePlan.prompt` is the prompt actually
   sent; the final wording lives in `textBlocks`.

## Compatibility and explicit limits

- With text off no font is loaded. With no font selected, the model composes the
  text following the references.
- A name typed under "Other" does not install a font. If it is not in the catalog
  the generation fails with an explanation; it is never silently substituted.
- Single-weight families (Archivo Black, Anton…) use their native 400; no fake
  700. Variable fonts vary `wght` only, never width. The selector preview still
  loads Google Fonts; final PNGs use the pinned, verified files.
- These are flat editorial text layers. Type on clothing, curves or signs in
  perspective is out of scope. In integrated mode the image model redraws the
  letters, so exact glyph shapes are not guaranteed — only the wording, which is
  verified.
- Free Canvas/Studio and blog images keep their previous contract. "Typography
  of your pieces" applies to the pieces/campaigns flow.
- Existing pieces are not modified. Regenerating redesigns with the current font.
  An old brief with text and a chosen font but no measurements asks to be
  regenerated.
- In composited mode the AI may still invade reserved zones or invent letters in
  the background; contrast against real backgrounds needs visual review.
- No data-chart engine and no custom font upload. Missing glyphs produce an
  explicit error.

## Reproducible checks

- `npm test`: all 56 families draw real outlines at normal and maximum weight;
  covers glyph coverage, sizes, accents, case, ligatures, emphasis, overflow,
  overlaps and final-resolution composition. A missing font fails **before**
  calling the provider.
- `node scripts/preview-typography.mjs /output/path [mascot.png]`: offline
  comparison of Poppins, Archivo Black and Lora with the production compositor
  (hand-written design to isolate the fonts).
- `node scripts/vendor-fonts.mjs` reproduces the files from the pinned revision;
  it is not part of startup or deploy.
- Deploy core before panel.

Code: [`typography.services.js`](../../polyvik-core/src/services/typography.services.js),
[`fontFiles.services.js`](../../polyvik-core/src/services/fontFiles.services.js),
[`integratedText.services.js`](../../polyvik-core/src/services/integratedText.services.js).

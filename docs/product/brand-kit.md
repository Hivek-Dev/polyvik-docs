# Brand identity and kits

DNA → Brand (`BrandIdentity.tsx`, the «Marca» tab) holds what every image
inherits: logo, palette, typeface, model images and visual direction. The main
kit *is* that identity; seasonal kits only change colours and motifs for a few
dates.

Executable source: kit storage in [`brandKits.services.js`](../../../polyvik-core/src/services/brandKits.services.js),
per-element generators in [`kitElements.services.js`](../../../polyvik-core/src/services/kitElements.services.js),
palette from an image in [`kitPalette.services.js`](../../../polyvik-core/src/services/kitPalette.services.js)
(`paletteFromImage`) and the model-image studio in
[`brandImageStudio.services.js`](../../../polyvik-core/src/services/brandImageStudio.services.js).
Those functions are the brief; this page does not keep a copy of the prompts.

Related: [Image engine](../image/image-engine.md) · [Plans and credits](plans-and-credits.md) · [Backlog](backlog.md#brand-kit).

## What it holds

| Element | Stored in | What it governs |
|---|---|---|
| Logo | `brand_assets` kind `logo`, `brand_profiles.logo_mode` | The one logo of every piece. Travels as a file |
| Palette | `palette.colors` (5 by role, 6 at most) | The colours of every piece, once per prompt |
| Typeface | `palette.fonts[0]`, from the known font catalog | The text drawn on pieces |
| Model images | `brand_assets` kind `model` (up to `MAX_MODELS = 4`) | The look: finish, light, medium. One rotates per piece |
| Visual direction | `brand_profiles.visual_direction` | Mood, composition, graphic resources, what to avoid. Read by the image director and the piece finisher; not by campaign ideas, blog or copy |
| Rules | `brand_profiles.guidelines` | Managed in DNA → Voice; shown here read-only |

**Voice is not in the kit**: it lives in DNA → Voice. Without a model image a
piece has no look reference; palette, typeface and visual direction carry the
brand.

## «Crea tu imagen modelo»

The brand's first image, the same one onboarding makes, available at any time
for a saved brand. Routes under `/api/brands/:id/image-studio`: `GET` (context),
`POST` (generate, 1 image credit), `POST …/materials` and `POST …/model`.

- **Website captures travel only here.** The captures taken at onboarding are
  stored as `brand_assets` kind `style_ref` (up to `MAX_STYLE_BANK = 12`) and
  reach only the brand's first image (`generateImage` option `siteLooks`,
  `STYLE_REFS_PER_IMAGE = 2` at a time). Every other image takes its look from
  the model images.
- **Existing model images never travel here.** A model made from a model is the
  copy of a copy.
- **The logo is drawn in the same generation** (since 8 Oct 2026). The model
  receives the original file and draws it as the piece's signature, flat and
  facing the viewer, at the brand's logo size (`discreet`, `normal`,
  `prominent`). It is read back against the original; a wrong logo makes the
  engine draw the whole image once more (never on a customer's own key), and if
  it still fails the review says so. The app never places or pastes the logo, and
  refinements edit the image itself: there is no separate logo-free scene file.
- The customer iterates until the image is right and keeps it as a model image.
  `POST …/model` only accepts a signed receipt of a result generated for that
  brand and draft; the client cannot name a URL.
- Onboarding saves its approved first image as kind `model` directly.
- The Canvas library checkmark also means "use as model image": it promotes the
  file to kind `model` (`POST /api/assets/:id/promote`).

## Generating each element

So that someone with only a name and a description can build an identity
(`POST /api/brands/:id/kits/:kitId/generate/:element`):

| Element | How | Credits |
|---|---|---|
| `logo` | gpt-image-2.5 with name, description, palette and typeface if any; transparent PNG; two options, the user picks one | 2 images |
| `palette` | LLM with description, logo and up to two website captures; 5 colours with roles | 1 assist |
| `font` | LLM picks ONLY from the known font catalog and explains in one line. Main kit only | 1 assist |
| `rules` | LLM writes 4–6 guidelines from everything else; the user edits them. Main kit only | 1 assist |

The palette can also be read from any uploaded image or Library file
(`POST /api/brands/:id/kits/:kitId/palette`, 1 assist).

Generated material is stored like uploaded material; afterwards the system does
not care where it came from. Logo proposals are stored as brand assets of kind
`other` named "Logo propuesto N".

## Seasonal kits

A seasonal kit (`brand_kits`) owns only its **name, `@` handle, dates, colours
and motifs**. That is all `campaignPlan.services.js` freezes into the campaign as
`plan.season`. Logo, typeface, rules, visual direction and model images are the
brand's and are shared by every kit. Outside its dates a campaign falls back to
the main kit.

## Retired on 7 Oct 2026

- **Kit sheets** («Presentación del kit», four 16:9 images) and their bridge to
  pieces are gone. The `brand_kit_sheets` table stays for old rows.
- **The brand board** (`palette.board_url`, removed by migration 090) never
  reaches generation; old board files stay in the Library.
- **Free style** («Estilo libre») is no longer a look source, and kits no longer
  generate a "look" element.

## Honest limits

- **The image model receives the font name, not the file.** The original font
  files are used where text is composed ([Real typography](../image/real-typography.md)).
- **The logo travels as an image.** Keeping it exact is an instruction, not a
  pixel-equality guarantee.
- Tests with a mocked provider verify the request contract, not visual quality.

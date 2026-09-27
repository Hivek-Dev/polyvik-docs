# Brand kit

The brand kit lives in **DNA → Brand** (`BrandIdentity.tsx`): the main kit
(which *is* the brand's identity) and optional seasonal kits, each with an `@`
handle and a validity window.

Executable source: [`brandKit.services.js`](../../../polyvik-core/src/services/brandKit.services.js)
(`kitPrompt()`, `boardPrompt()`, `seasonPrompt()`, `buildKit()`), kit storage in
[`brandKits.services.js`](../../../polyvik-core/src/services/brandKits.services.js),
and per-element generators in [`kitElements.services.js`](../../../polyvik-core/src/services/kitElements.services.js).
Those functions are the brief; this page does not keep a copy of the prompts.

Related: [Image engine](../image/image-engine.md) · [Plans and credits](plans-and-credits.md) · [Backlog](backlog.md#brand-kit).

## What a kit delivers

Originals, visual decisions and application examples. An attractive image is
not a functional identity: decisions must be repeatable and files usable
without rebuilding them from a thumbnail.

What 2026 brand guides agree on: logo system, palette (light and dark), type
with hierarchy, image direction, a reusable graphic system, applications and
usage rules. New this year: accessibility (contrast), social templates and
rules for AI-generated content. **Voice is not in the kit**: it lives in
DNA → Voice.

## The four sheets

All 16:9, same model and quality (`MAX_SHEETS = 4`).

| # | Sheet | Shows | References it receives |
|---|---|---|---|
| 1 | **Identity** | Logo, palette with roles, type, art direction, finish | logo + look (free style) images |
| 2 | **Graphic system** | Text blocks/panels, borders, pattern, dividers, stamps | sheet 1 + logo |
| 3 | **Icons and imagery** | 12–16 icons with one stroke, illustration style, photo treatment | sheets 1–2 + logo |
| 4 | **Applications** | The logo in use: post, story, banner, card, product or packaging depending on the business | sheets 1–3 + logo |

### The chain is what keeps it coherent

- **A chain, not four separate briefs.** Each sheet receives the previous ones
  as images with the `board` role: they govern finish, palette, geometry,
  stroke and elements already drawn; they are neither traced nor redesigned.
  The logo comes after them, with its exact index. The model sees them; we do
  not describe them. A missing earlier sheet blocks generation ("generate
  sheet N first").
- **Its own header per sheet** (`GRAPHIC SYSTEM BOARD`, `ICONS AND IMAGERY
  BOARD`, `APPLICATIONS BOARD`) over the same shared blocks (language, logo,
  palette, typeface, brand constraints, brand context, season, client note).
- **No VISUAL REFERENCES from sheet 2 on.** Look images only enter sheet 1;
  after that the direction is already in the sheets, and two authorities would
  fight.
- **Hard data always travels literally**: hex codes, font name, logo as a file.
  Never trust the model to "read" them from sheet 1.
- **Sheet 1 rules.** Regenerating it marks sheets 2–4 `stale` and the panel
  offers "Regenerate the following ones". They are not deleted.
- **One or all.** A button per sheet and "Generate full kit", which runs the
  chain in order. If sheet 3 fails, 1 and 2 remain and the user is told.
- **Cost:** each sheet charges 1 image credit (`credit("image")` on
  `POST /api/brands/:id/kits/:kitId/sheet`); a full kit is 4 images. See
  [Plans and credits](plans-and-credits.md).

## Inputs

| Material | Rule |
|---|---|
| Official logo | Complete file. Symbol and lettering stay together. Only explicitly authorised files and uses count as variants |
| Palette and font | Stored data is the authority; never extract it from the generated sheet |
| Brand context | Activity and needed uses; do not invent features, certifications or commercial claims |
| References | Optional and relevant. Say what to take: clarity, composition, material or finish |
| Guidelines | Full, editable rules. Separate permanent constraints from changes asked for one generation |
| Applications | Explicit user selection, with format and approved copy. Generate only the chosen ones |

**Nothing new is mandatory.** Panels, icons, pattern and applications are
OUTPUTS, not uploads. The one input that helps and already exists is the brand
description in DNA; if it is empty, sheet 4 comes out generic (worth warning in
the modal).

### Generating each element from its modal

So that someone with only a name and a description can build the kit
(`POST /api/brands/:id/kits/:kitId/generate/:element`):

| Element | Button | How | Credits |
|---|---|---|---|
| Logo | **Generate logo** | gpt-image-2.5 with name, description, palette if any and style words; transparent PNG; two options, the user picks one | 2 images |
| Palette | **Propose palette** | LLM with description + logo + look; 5 colours with roles | 1 assist |
| Typeface | **Suggest typeface** | LLM picks ONLY from the known font catalog and explains in one line | 1 assist |
| Look (free style) | **Generate reference** | gpt-image-2.5 with description + palette; one mood/finish image | 1 image |
| Guidelines | **Propose guidelines** | LLM writes 4–6 from everything else; the user edits them | 1 assist |

Rule: generated material is stored like uploaded material; afterwards the
system does not care where it came from. Logo proposals are stored as brand
assets of kind `other` named "Logo propuesto N".

## The provider request

- Provider OpenAI, forced for the kit. Tier `precise` by default:
  `gpt-image-2.5-sunburst` at quality `xhigh`; the fast tier uses
  `gpt-image-2.5-flare` at `high` (`imageModels.config.js`). If the account has
  no 2.5 access it falls back to `OPENAI_IMAGE_FALLBACK_MODEL`
  (`gpt-image-2-2026-04-21`) and the sheet records which model was used.
- Requested at 2048×1152 (multiples of 16; normalisation may yield 2049×1152).
  If the provider returns another ratio, it is kept without cropping; the
  response reports the real dimensions.
- `bare: true`: no piece-generator suffix.
- `strictReferences: true`: if an attachment fails while preparing the request,
  it aborts before spending, with a specific message.
- The GPT Image 2 family (2.5 included) uses high input fidelity implicitly;
  `input_fidelity` is not sent.
- Attachment order: main → logo and looks; re-edit → base sheet and original
  logo if present. Prompt indices follow that order.
- Text inside attachments is reference, not instructions.

### What counts as identity

Original logo, explicit palette, selected font, and all active guidelines with
their full content and scope (not only the title). References contribute
rhythm, density, geometry, contrast and finish, without copying their layout,
subjects, text or fonts.

The business description travels in full as context, not as text to print.
Rule titles, palette codes and type alphabets guide the design and are only
printed when asked. The client note changes the treatment without silently
replacing the identity.

### Freedom of composition

Blocks describe inputs, not sections or positions. Only provided categories
appear; no slots are reserved for missing ones. Mandatory inventories (icons,
patterns, panels, logo variants, square and vertical applications), fixed
columns, giant logo and section numbering were all removed. Art direction comes
from the relationships between brand data.

### Indivisible identity

Logo and lettering keep position, proportion and spacing. Symbols and names are
not extracted as type specimens. Re-edits drop separated uses even if they
appear on the base sheet. The shared logo-reference label enforces the same
rule in the Canvas.

### Per-generation brief

`POST /api/brands/:id/kits/:kitId/sheet` accepts an optional
`{ instruction: string }` of up to 2000 characters. It is added to the kit's
stored instruction without modifying its data, and applies to the main kit and
to seasons. The panel keeps the draft per brand and kit while the screen is
mounted; it does not persist across sessions.

## Seasonal kits

A kit based on the main one re-edits the sheet **with the same number**: its
graphic system comes from the main kit's graphic system, not from its own
sheet 1. All four carry the same change (palette, motifs, brief) over material
that was already coherent, and each can be redone alone without spending the
other three. If the main kit lacks that sheet, the season chains its own.

Regenerating the main kit does not attach the previous sheet: keeping
structure only applies to kits explicitly based on it.

When pieces are generated, a season contributes only its **name, colours and
motifs** (`campaignPlan.services.js`); its typography and guidelines do not
travel yet (see [backlog](backlog.md#brand-kit)).

## Sheets and pieces

Without an uploaded board of its own, a piece receives the kit's sheet 2 — from
the campaign's frozen kit if any, otherwise the ruling kit — or sheet 1 if
there is no sheet 2 (`kitBoardForPieces`, used in `generation.services.js`).

## Honest limits

- **Sheets are images, not editable files.** Sheet 3's icons are a visual
  reference for coherent pieces, not a downloadable SVG set. The only usable
  files are the logo (transparent PNG) and the look image.
- **The model receives the font name, not the file.** The generated specimen
  does not certify its glyphs.
- **The logo travels as an image.** Keeping it exact is an instruction, not a
  pixel-equality guarantee. OpenAI's [image generation docs](https://developers.openai.com/api/docs/guides/image-generation#limitations)
  acknowledge limits on text, consistency and placement; exactness requires
  composition and checking.
- **An embedded raster is never labelled as an editable vector.** Approved new
  resources are exported as their own files, not as crops of the sheet.
- Tests with a mocked provider verify the request contract, not visual quality.

## Acceptance criterion

Two applications must be recognisable as the same brand even when format and
layout change, and every resource announced in the delivery must exist and be
usable on its own. What is still missing to meet it (versioning and approval,
export package, result review, fixing one application alone, per-kit logo and
look) is tracked in the [backlog](backlog.md#brand-kit).

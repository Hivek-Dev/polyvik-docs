# Direction moodboard and style plates

**Priority:** medium · **Effort:** S–M (about 2 to 3 dev-days) · **Status:** proposed

## Summary

Every saved directive (art direction with palette and palette roles) gets a **moodboard**: a generated, subject-free image that shows the directive's style, palette and mood at a glance. From the same directive, users can also generate **variations**: pre-styled plates such as backgrounds or texture plates, in any aspect ratio, with an optional one-line framing hint. The variations build up a small gallery linked to the directive.

## Why it matters for Polyvik

- Polyvik stores directives with `palette` and `paletteUsage` (`extractDirective` in `canvas.services.js`), but in the list they are text only. A thumbnail makes a directive recognisable and choosable.
- The video canvas plan asks for **"a shared style image attached to every clip, which can come from the brand DNA"**, and says a style reference contributes only rendering and colour, never people, text or logos (§3). A subject-free moodboard is exactly that kind of image: it is safe to attach as a style reference to Keyframe and Animate, because it has no faces or logos to leak.
- Variations (plain backgrounds, textures) are useful as base scenes for the two-stage mockup (plan §7): the scene with a blank surface first, then the exact text and logo.

## How Monkey Studio did it

### Endpoint

`POST /api/v2/generate-directive-moodboard`

Request:

```json
{
  "projectId": "…",
  "directiveId": "…",
  "scope": "local | universal",
  "role": "moodboard | variation",
  "directiveText": "…",
  "palette": ["#RRGGBB", "…"],
  "paletteUsage": [{ "hex": "#RRGGBB", "role": "…" }],
  "aspectRatio": "1:1",
  "variationHint": "≤200 chars"
}
```

Response: `{ asset: { id, url, mime, byteSize, directiveLinkId, directiveRole } }`.

Behaviour:

- Generated with the default image model (Gemini Flash Image) at "medium" size with the "clean" preset, with no references and no extra context.
- The asset is stored with `directive_link_id` and `directive_role`.
- **Only `role: moodboard`** updates the directive's canonical `moodboard_asset_id`. Variations only build up the gallery (`GET /api/v2/directive-assets/:directiveId`).
- UI: "Generate moodboard" and "Regenerate" on the directive card; "Generate variation" with an aspect selector (1:1, 4:5, 9:16, 16:9, 3:2) and an optional "framing hint" input.

### Schema (Monkey Studio migration 016)

```sql
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS directive_link_id UUID,
  ADD COLUMN IF NOT EXISTS directive_role TEXT;
CREATE INDEX IF NOT EXISTS assets_directive_link_idx
  ON assets (directive_link_id) WHERE directive_link_id IS NOT NULL;
ALTER TABLE directive_library
  ADD COLUMN IF NOT EXISTS moodboard_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL;
```

### Prompt builder (verbatim: `buildDirectiveMoodboardPrompt`)

```js
function buildDirectiveMoodboardPrompt({ directiveText, palette = [], paletteUsage = [], variationHint = '' }) {
  const lines = []
  lines.push('Create a stylized art-direction moodboard image — NO real subject, NO product, NO text overlays. The image\'s only purpose is to communicate the directive\'s STYLE, palette and mood at a glance.')
  if (variationHint) {
    lines.push(`Variation framing: ${variationHint}.`)
  }
  if (Array.isArray(palette) && palette.length > 0) {
    lines.push(`Use this exact color palette (hex): ${palette.join(', ')}. Anchor the composition to these hues; do not introduce other dominant colors.`)
  }
  if (Array.isArray(paletteUsage) && paletteUsage.length > 0) {
    const usageLines = paletteUsage.slice(0, 8).map((u) => `- ${u.hex}: ${u.role}`)
    lines.push(`Apply each color in its intended role:\n${usageLines.join('\n')}`)
  }
  lines.push(`Style directive (apply universally — light, texture, materials, composition logic, mood):\n${directiveText}`)
  lines.push('Compose this as an abstract scene / shapes / textures / lighting setup that EMBODIES the directive. Photorealistic or illustrated as the directive demands. Avoid faces, logos, brand marks, and explicit subject matter.')
  return lines.filter(Boolean).join('\n\n')
}
```

For reference, Monkey Studio's `extractDirectiveFromImage` used a schema and palette-role wording that Polyvik already ported (`canvas.services.js`, `extractDirective`), so it is not repeated here.

## How to implement in Polyvik

**Core**

- Migration: add `moodboard_url TEXT` to the directives table used by `canvas.services.js`. For variations, either a `directive_assets (id, directive_id, url, role, aspect_ratio, hint, created_at)` table, or reuse the brand asset library with a `directive_id` column and `kind = 'style_plate'`. Recommendation: reuse the asset library, so the plates show up in the library and in `CreationReferencePicker`.
- `canvas.services.js`: add `generateDirectivePlate({ brandId, directiveId, role, aspectRatio, hint }, tenantId)`. It builds the prompt above (ported as is; phrase positively where possible, e.g. "abstract, subject-free composition" instead of "NO subject") and calls `imageGenerator.services.js`.
  - Model: **Seedream 5 Pro**, or the tenant's default image model. Palette adherence matters more than text rendering here, and there is no text.
  - Since Polyvik has an image-text QA (`image_text_check`), run it on plates as a guard: if the model rendered stray text, regenerate once.
- Route `POST /canvas/directives/:id/plate`, `credit("image")`. Generate the moodboard automatically? **No**: offer it as a button, to respect "no spend without asking".
- Brand DNA hook: the brand's primary directive's moodboard becomes the default **style image** for the video canvas (plan §3, "shared style image"). Expose it as `style` in `VIDEO_REFERENCE_USES` (it already exists as a reference use).

**Panel**

- Directive cards in the directives panel show the moodboard thumbnail (fallback: palette swatches).
- The variation gallery sits under the directive, with an aspect pill selector and a hint input, in the ADN style.
- Drag a plate onto the canvas to create an `imageAsset` node with the role `style` or `base`.

## Risks and open questions

- Image models sometimes still draw a product or letters. The text check covers letters; for "no subject", accept some imperfection (it is a mood plate).
- Several directives per brand mean several plates. Decide which one feeds the video canvas by default (the pinned or primary directive).
- Palette fidelity: a deterministic check is possible (k-means on the output against the palette hex values; plan §5 prefers deterministic QA). It is optional in v1.

## Effort

- Migration, service, route: 1 d
- Panel thumbnails, gallery, drag to canvas: 1–1.5 d
- Style-image hook for the video canvas: 0.5 d

**Depends on:** existing directives (done). It is a good companion to `prompt-and-direction-chats.md` (an interviewed directive → moodboard).

## Source (archived)

- Server `Hivek-Dev/monkey-studio-server` @ `2394f22a30c1ae56a5f46733ff89d6c1e0a75e43`: `src/server.js` — `buildDirectiveMoodboardPrompt`, `POST /api/v2/generate-directive-moodboard`, `GET /api/v2/directive-assets/:directiveId`; `src/db/migrations/016_directive_assets.sql`
- Client `Hivek-Dev/monkey-studio-client` @ `8d742b58dd8139129d6c9c723fe4c5f87feb9e58`: `src/design-system/primitives/DirectivesModal.jsx` (moodboard and variation UI), `src/api/projects.js`

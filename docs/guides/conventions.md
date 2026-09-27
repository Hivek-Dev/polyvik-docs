# Conventions

## Comments explain the why, not the what

This is the most visible convention in the project and the one to respect most.
A comment that repeats the code is noise; one that explains the decision stops
someone from undoing it by accident.

```js
// El turno se consume solo si la imagen salió, y nunca en una vista previa:
// ensayar no debería gastarle el turno a una plantilla.
// (The turn is only consumed if the image came out, and never in a preview:
//  rehearsing should not burn a template's turn.)
if (template && !piece.preview) await markTemplateUsed(template.id);
```

When you fix a bug, write down what used to happen:

```js
// El aspecto lo manda el canal, siempre. Una plantilla ya no puede volver
// cuadrada una pieza de X.
// (The channel always decides the aspect. A template can no longer turn an
//  X piece square.)
```

Code comments are mostly in Spanish; some newer ones are in English. Match the
file you are in. No flourishes and no apologies.

## Names

- Services and models: `name.services.js`, `name.model.js`. Static tables live
  in `name.config.js` (`plans.config.js`, `llmTasks.config.js`,
  `imageModels.config.js`, `videoModels.config.js`).
- Columns and tables in `snake_case`; the surrounding JS in `camelCase`. The
  conversion happens at the edge (the service), not halfway through the logic.
- The same concept has the same name in both repos. An image's role is
  `ref_use` in `brand_assets` **and** in `brand_templates` — when it was named
  differently, it was renamed.

## A single source of truth

When a vocabulary lives on both sides, it is declared once per side and
imported. It is never copied by hand into three screens: copies diverge within a
week (it happened: one was missing `base`, another `style`).

- Core: `REFERENCE_USES` in `imageGenerator.services.js`.
- Panel: `src/lib/refUse.ts`, mirror of the above.

Same for the UI: if two screens edit the same thing, they share a component.
`VisualPlanEditor` edits piece settings; `CampaignNew` picks the layouts per
campaign. Do not keep editor modes no screen uses. `mentionSegments` shares
`@mention` parsing between flows.

## Honest defaults, never filler data

A default is a declared, editable decision: 9:16 for TikTok, two posts a week. A
fallback is inventing data you do not have so the screen does not look empty.
The first, yes; the second, never.

If data is missing, the code says so:

```js
if (!cleanUrl) bad("Falta la imagen de la plantilla."); // "The template image is missing."
```

And if a limit is not declared, do not assume zero:

```js
// Sin límite declarado no se recorta nada — un cupo desconocido no es cero.
// (No declared limit means nothing is trimmed — an unknown quota is not zero.)
if (!Number.isFinite(limit) || limit <= 0) return { pieces, skipped: 0 };
```

## Fail loudly where it matters

A failure the customer could notice gets recorded. The real case: a piece ended
up without an image, the error went to the console, and the customer approved a
bare post without knowing. Now it is written to `interactions`.

## Migrations

- Numbered in sequence: `030_campaign_plan.sql`.
- Idempotent: `IF NOT EXISTS`, `ON CONFLICT`.
- With a comment at the top explaining why the column exists, not what type it
  is.
- Never edited once deployed. If something changes, it goes in a new migration.

## Panel

- Every visible string goes through i18n. No literals in JSX.
- Keys go in the block they belong to (`campaignNew`, `piece`, `assets`…).
  Putting them in the wrong block compiles but leaves the dictionary unreadable.
- Tailwind with the shared classes from `components/ui.tsx` (`btnPrimary`,
  `inputClass`, `metaMono`, `panelFrame`…), not repeated loose utilities.
- API messages are (mostly) in Spanish and shown as-is; when highlighted they
  are wrapped with a translated label.
- Visual rules live in the [design guide](../panel/design-guide.md).

## What we do not build

- Per-token or per-call billing, or new abstract currencies. What is sold is the
  campaign plus the plan's monthly credits (iterations, images, AI assists,
  video); anything new is converted into one of those units. See
  [plans and credits](../product/plans-and-credits.md).
- Duplicated headers: `PageHeader` renders the title outside a hub; inside a hub
  it only mounts the action, because the hub already shows the header.
- "Just in case" features. If nobody asked for it, it does not go in.

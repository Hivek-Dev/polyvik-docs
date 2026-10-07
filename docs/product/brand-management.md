# Brand management

An account (tenant) can hold several brands, up to its plan's `maxBrands`
(see [plans-and-credits.md](plans-and-credits.md)). The panel page **`/brands`**
lists them all and is where people switch, edit, create and delete brands. It is
reached from the brand switcher in the top bar ("Administrar marcas").

## What the page does

| Action | How |
|---|---|
| Switch | "Usar" makes the brand active (same as the switcher; the app remounts). |
| Edit | Makes the brand active and opens its DNA pages (`/brand/identity`). |
| Create | Goes to onboarding (`/onboarding?new=1`). Hidden when the plan is full, with a link to `/plan` instead. |
| Delete | Owner only. Asks the person to type the brand's name, and says what is lost first. |

Each row shows the industry, website, creation date and how much the brand holds
(campaigns, pieces and library assets), so nobody deletes a brand without seeing
what goes with it.

## API

| Route | What it does |
|---|---|
| `GET /api/brands` | The account's brands (unchanged). |
| `GET /api/brands/counts` | `[{ id, campaigns, pieces, assets }]` for every brand of the account. |
| `DELETE /api/brands/:id` | Deletes the brand. `403` unless `req.user.role === 'owner'`; `404` for another account's brand or a malformed id. |

Code: [`brands.routes.js`](../../../polyvik-core/src/routes/brands.routes.js),
[`brands.services.js`](../../../polyvik-core/src/services/brands.services.js) (`remove`, `counts`),
[`brand.model.js`](../../../polyvik-core/src/models/brand.model.js) (`deleteById`, `countsByTenant`),
and the page [`Brands.tsx`](../../../polyvik-panel/src/pages/Brands.tsx).

## Deletion is permanent

Decided on 7 Oct 2026: a hard delete, not an archive. Every table that points at
`brands` does so with `ON DELETE CASCADE` (campaigns and their pieces, assets,
kits, characters, voices, video jobs, tool runs...), except usage and credit
rows, which use `ON DELETE SET NULL` so the account's spending history survives.
Deleting frees the brand's slot in the plan.

Known gaps:

- Stored files (MinIO/S3) are not removed; the rows that pointed at them are.
  A storage sweep for unreferenced keys is still to be written.
- A job already running for the brand (e.g. a video render) finishes against rows
  that no longer exist; its writes affect nothing.
- What was already published on social networks stays there.

When the account deletes its last brand, `Layout` sends it to onboarding.

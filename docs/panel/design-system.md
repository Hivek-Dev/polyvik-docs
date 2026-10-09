# Polyvik Panel — Design system

For anyone writing UI in `polyvik-panel`, human or Claude Code. It replaces
[design-guide.md](design-guide.md) (the "DNA style") as of 9 Oct 2026. Screens
move to this system one at a time, and new UI uses only this system.

Source of truth in code:

- Tokens and themes: [`src/index.css`](../../../polyvik-panel/src/index.css)
  (`@theme` holds dark; `:root[data-theme="light"]` holds light).
- Theme switching: [`src/lib/theme.ts`](../../../polyvik-panel/src/lib/theme.ts)
  and the pre-paint script in [`index.html`](../../../polyvik-panel/index.html).
- Components: [`src/components/ds/`](../../../polyvik-panel/src/components/ds/).
  Class recipes live in `ds/recipes.ts`; the components are built on them.
- Catalog: `/design` in the panel (admins only). Every component in every
  state, with a theme switch. Check a component there in both themes before you
  use it on a screen.

## Principles

The system takes its restraint from Linear without copying it. Our type is
Satoshi, our accent is Brasa and the scale is our own.

- **Neutral first.** Gray surfaces and 1 px hairlines. Color is reserved for
  the accent and for status, so the user's images and brand stand out.
- **Compact.** Body text is 13 px and controls are 28–36 px tall. It is a tool
  people use every day, so density beats air.
- **One accent per view.** There is a single primary button. The rest are
  secondary, ghost or quiet links.
- **Semantic tokens only.** Write `bg-panel`, `text-fg-muted` or
  `border-border`. Never write a hex, and never write `white` or `black` for UI
  chrome. That rule is what lets every screen work in light and dark.
- **Theme-proof by construction.** If a component looks right in `/design` in
  both themes, it looks right on any screen.

## Palette

The palette is generated, not picked. `polyvik-panel/scripts/palette.mjs`
takes three brand anchors and a contrast target and writes every color into
`index.css`, between the `@palette` markers. Don't edit those blocks by hand;
change the inputs and run `node scripts/palette.mjs --write`. Add `--html` to
get a swatch page for review.

- **Anchors.** They were measured from Polyvik's hero imagery, and each is its
  scale's step 9, untouched, in both themes. Orange is `#c63a17` (the jacket;
  the card's `#d6502b` only reaches 3.9:1 under white text). Yellow is
  `#fcc540` (the disc), cobalt is `#0a3494` (the card) and red is `#bd3938`
  (the pixel gradient). The imagery has no green, so success is the one derived
  color: the orange's weight at a green hue (`#1b8541`). Orange and cobalt are
  near-complements and yellow sits next to orange, so the three make one
  scheme.
- **Method.** The method follows Linear and Radix. Everything happens in OKLCH,
  where equal lightness looks equally light across hues. Each hue gets 12 steps
  per theme, and each step has one job: 1–2 backgrounds, 3–5 fills (rest, hover
  and pressed), 6–8 borders, 9–10 solid fill and its hover, and 11–12 text.
  Light and dark are generated separately, not inverted. Step 9 is
  the anchor exactly, and text steps are solved for a contrast ratio.
- **Proportional shades.** Every step keeps its anchor's hue and relative
  saturation: the share of the most saturated color sRGB allows at that
  lightness, as Adobe Leonardo and Huetone do. No step is more saturated than
  its anchor. So each step is the same color with more or less light. Orange's
  shades come out as the wine of the pixel gradient, and cobalt's as navy.
  Only yellow's darkest steps lean amber, because true dark yellow reads as
  olive. Steps 1–8 always sit on the page's side of the anchor, so a very dark
  anchor (cobalt in dark) never gets a background lighter than itself. Green
  takes the orange's saturation at every step, so it weighs the same.
- **Neutrals per theme.** In dark the grays carry a trace of the brand's
  warm hue (chroma 0.007 at hue 40) and read as warm charcoal next to the
  gradient's wine. In light they are a barely cool gray (chroma 0.003 at hue
  265): crisp, so white content and the warm brand colors stand out instead
  of sinking into beige. Manuel chose this Linear-like light on 9 Oct 2026,
  over pure white and a deeper gray.
- **Status hues** (green and red) are generated at the same weight as the
  brand colors, so a badge never looks louder than the brand.

Every scale is also a Tailwind color (`bg-orange-3`, `text-cobalt-11`,
`border-yellow-7`). Use the semantic tokens first; reach for a raw step only
when no semantic token says what you mean.

**Roles of the brand colors.** Orange means action: the primary button and the
active thing. Cobalt is the system's attention: focus rings, selection, info
and what's scheduled. Yellow means "look at this": warnings and what waits for
approval.

## Tokens

All tokens are Tailwind colors (`bg-*`, `text-*`, `border-*`, `ring-*`), and
opacity modifiers work (`bg-fg/8`).

| Group | Tokens | Use |
|---|---|---|
| Surfaces | `canvas` · `panel` · `raised` | Page · cards and bars · menus, dialogs, toasts. Light is clean and editorial (Manuel's reference, 9 Oct 2026): a white page, cards a flat light gray (neutral 2) with no outline and no shadow (`card-edge` transparent, `shadow-card` none), and fields and secondary buttons white with a hairline (`raised`). In dark the page is the darkest step, content rises in lightness and a hairline (`card-edge`) outlines cards |
| Fills | `subtle` · `hover` · `selected` | Control fills · hover · active/selected |
| Text | `fg` · `fg-muted` · `fg-subtle` | Primary · secondary · hints and metadata (all AA) |
| Lines | `border-soft` · `border` · `border-strong` | Dividers · outlines · hover outlines |
| Accent | `accent` · `accent-hover` · `accent-text` · `on-accent` | Orange 9 · 10 · 11 · its label |
| Focus | `focus` | Cobalt: step 9 in light, step 11 in dark (pure cobalt vanishes on a dark page) |
| Status | `ok` · `warn` · `error` · `info` | Step 11 of green, yellow, red and cobalt: words |
| Status solids | `ok-solid` · `warn-solid` · `error-solid` · `info-solid` | Step 9: dots, bars and fills. A pill is `bg-ok/12 text-ok` with an `ok-solid` dot |
| Brand | `brasa-1/2/3` | The gradient only: logo, create, progress |

Radii: `rounded-ctl` 6 px for controls, `rounded-row` 10 px for rows and tiles,
`rounded-card` 16 px for cards, `rounded-dialog` 18 px for dialogs and
popovers, `rounded-media` 10 px for image and video previews (discreet, the
image leads) and `rounded-media-sm` 8 px for small thumbnails. The veil behind dialogs and
drawers is `overlay`, dark in both themes. Shadows: `shadow-xs` sits under controls and cards (none in light,
where hairlines do the work), `shadow-float` under menus and toasts, and
`shadow-dialog` under dialogs. Tailwind writes shadow values into utilities at
build time, so their colors go through `--pv-shadow-*` variables, set per
theme, to follow the theme. The same goes for `--pv-brasa-deep`, the
gradient's deep end: wine in dark and orange in light, so the light gradient
fades to peach instead of pink.

Type scale, in six steps: `text-micro` 12, `text-body` 13, `text-title` 15,
`text-section` 18, `text-page` 22 and `text-display` 32. Hierarchy comes from
weight (400/500/600) and color. Uppercase labels and mono for metadata are not
part of the system; `font-mono` is only for code and figures that must align.

**Legacy names.** `ink`, `surface-1…4`, `fog`, `mist`, `haze`, `outline`,
`divider` and `amber` are aliases of the semantic tokens, so old screens follow
the theme too. Don't use them in new code. When a screen migrates, rename them
(`text-fog` becomes `text-fg`, `bg-surface-2` becomes `bg-subtle`, and so on).

## Theme

The preference is `system`, `light` or `dark`. It is stored per browser
(`localStorage.polyvik-theme`), resolved on `<html data-theme>` before the
first paint, and kept in sync on every navigation (`ThemeSync` in `App.tsx`).
The public screens (login, sign-up, onboarding and phone upload) are designed
dark and stay dark.

**Rollout gate.** Until every screen is migrated, the default is dark and only
admins see the control (account menu → Appearance). When the migration ends,
change `DEFAULT` to `'system'` in `lib/theme.ts` and in `index.html`, and show
the control to everyone.

## Components (`components/ds`)

| Component | Notes |
|---|---|
| `Button`, `ButtonLink` | Variants are `primary`, `secondary`, `ghost`, `danger` and `danger-ghost`. Sizes are `sm` 28, `md` 32 and `lg` 36. Each takes `icon`, `iconRight` and `loading`. A disabled button turns into a neutral surface and stays readable. |
| `IconButton` | `label` is required: it is the accessible name and the tooltip. `active` is for toggles. |
| `Field` | Label, hint and error. It hands `id`, `aria-invalid` and `aria-describedby` to its control. |
| `Input`, `Textarea`, `Select` | Hairline outline, darker on hover, accent ring on focus, red when invalid. |
| `Checkbox`, `Toggle` | `Checkbox` for choices in a form, `Toggle` for on/off of something that already exists. |
| `Tabs` | `underline` for sections of a page, `pill` for filters over a list. Arrow keys move between tabs. The underline slides to the chosen tab; a hovered tab shows a gray fill behind its label. |
| `Segmented` | Switches between views of the same thing (grid/list, week/month). Its raised thumb slides to the chosen option. |
| `Menu` | Dropdown with labels, separators, shortcuts, checked items and danger items. Handles keyboard, Escape and outside click, and returns focus to the trigger. |
| `Tooltip` | A short label after a beat. Never the only place where something is said. |
| `Badge`, `Kbd`, `Avatar` | Status pills (tone + dot), keys, people and brands. |
| `Card`, `CardHeader`, `List`, `ListRow` | Card with a hairline; lists with rows split by hairlines, edge to edge. |
| `Empty` | An empty state that says what will appear. `variant="inline"` is the one-line dashed row inside a card, and with `to` it becomes the way in. |
| `PageTitle`, `PageHero` | A plain title row with its main action, or the pixel-gradient header. The gradient fades into the page color where the text sits, so the text uses page tokens and reads in both themes. Put secondary buttons over the color. `bleed={false}` is for use inside a container. |
| `CardHeader` | Title with an optional `count`, a line under it, and on the right either actions or a `link` to the full screen. |
| `MediaTile`, `MediaBadge` | An image tile with a corner badge and a caption over a scrim. `scrim` and `on-scrim` follow the theme: white with dark text in light, black with white text in dark. Images never zoom on hover. A clickable image's hover is `mediaHover` (recipes): a 2 px ring inside the edge and an even 8 % dim, no caption or gradient. `size="sm"` is for small thumbnails. |
| `Chip` | A compact clickable label. Its variants are `default` (connected), `dashed` (add one) and `selected`. |
| `Properties` | Label/value pairs in a quiet bordered list. |
| `Callout` | A toned notice (`info`, `ok`, `warn`, `error`) with icon, title, body and action. It replaces `WarningBanner`. |
| `ProgressBar` | A thin bar, determinate or indeterminate, with a tone for limits. |
| `Spinner` | Waiting for something short, with an optional label. |
| `Dialog`, `DialogHeader`, `Pager` | The one dialog: overlay, raised panel, focus trap, Esc and click outside, focus back to the opener. The header holds the title, tools such as the `Pager` («‹ 3/12 ›»), and the ✕. `DialogShell` is now an alias of it, so every large dialog uses it. |
| `ConfirmInline` | A destructive action confirmed in place, with a Cancel / Delete pair and no second dialog. |
| `SearchInput` | A field with a magnifier that clears with Esc or ✕. `collapsible` shows only the magnifier until it's used. |
| `BulkActionBar` | The floating "N selected" bar with actions and Cancel. |
| `PixelHeader`, `PixelField` | A page header inside the content column: a card whose background is a living dot-matrix (square pixels with gaps) drifting with a slow noise and lifting under the cursor. Its darkest tone is the card's `panel` fill (the lightest, in light) and pixels rise toward `fg`; quiet on the left where the title sits (`fade="none"` covers the whole field). It holds still with reduced motion or off screen. Media uses a `PixelField` band under its tabs. |
| `FeatureCard`, `ScrollRow` | A flat shortcut card (title, what it's for, its action, a visual on the right, 144 px tall) and a horizontal row of tiles with a «next» button. The Feed's Characters and Brand kit use them. |
| `Skeleton`, `Shimmer`, `Masonry` | Placeholders shaped like their content, and the masonry layout (shortest column, staggered entrance). |

`ui.tsx` still exports the old constants (`btnPrimary`, `inputClass`, `card`,
`Modal`, `Toast`, `StatusTag`…). They now draw from `ds/recipes.ts`, so old
screens already look like the system. Replace them as screens migrate. When a
constant has no users left, delete it.

## Migrating a screen

Nothing swaps abruptly: indicators slide, and content that changes with a tab or filter enters with `pv-fade-in` (a 220 ms fade up) before the gallery's cascade; all of it stops with reduced motion. Everything clickable shows the pointer and has a hover state: buttons, chips, fields, tabs (inactive tabs show a gray underline), segmented options and media (`mediaHover`).


1. Swap raw `<button>`, `<input>` and `<select>` elements and ui.tsx constants
   for `ds` components.
2. Rename legacy color tokens to semantic ones. Remove every hex, `white`,
   `black` and `rgb(...)` from the screen and from its `.css` file. Images and
   the user's content are the only exceptions.
3. Replace arbitrary radii (`rounded-[14px]`) with the radius tokens and
   arbitrary sizes (`text-[11px]`) with the scale.
4. Drop uppercase-tracked labels and mono metadata.
5. Pixel heroes (`PageHeader`, `PixelGradient`) must read in light: either
   they render their own dark backdrop, or the screen uses `PageTitle`.
6. Check the screen in light and dark, at 1440 px and at 390 px.
7. Add it to the list below.

## Migration status

The full per-screen map, with missing components and the order, is in
[screen-map.md](screen-map.md).

| Area | Status |
|---|---|
| Top bar, account, brand, usage, notifications and tools menus | Migrated (9 Oct 2026) |
| Home (now at `/hoy`), with its plan card | Migrated (9 Oct 2026) |
| Media (formerly Feed), the front page (`/`; `/feed` and `/media` redirect), with its gallery and image/video dialogs | Migrated (9 Oct 2026). Clean layout: the title «Imagen y video» with tabs (All, Images, Videos, Saved), a decorative band of `PixelField` where shortcut cards used to be, full-width search with create chips, masonry. The pixel hero and its artwork are gone. |
| Every `DialogShell` dialog (chrome only: header and frame) | Migrated through the alias |
| Shared primitives (`ui.tsx` buttons, inputs, cards, pills, Modal, Toast, menus) | Restyled through recipes; callers not yet migrated |
| Calendar, Library, Campaigns, Tools, Brand, Settings, Account, Plan, creation workspaces, Canvas, editor, Blog, Events | Pending |
| Login, Sign-up, Onboarding, Phone upload | Stay dark by design; restyle later |

# Polyvik Panel — Design guide

> **Superseded on 9 Oct 2026 by [design-system.md](design-system.md).** It is kept
> as a reference for screens that haven't migrated yet. New UI follows the design
> system, and a screen leaves this guide when it migrates.

For anyone writing UI in `polyvik-panel` (human or Claude Code). **If a value is not
here or in [`src/index.css`](../../../polyvik-panel/src/index.css), it does not exist.**

Source of truth in code:

- Tokens: [`src/index.css`](../../../polyvik-panel/src/index.css) (`@theme`).
- Primitives: [`src/components/ui.tsx`](../../../polyvik-panel/src/components/ui.tsx).
- Frame and navigation: [`src/components/Layout.tsx`](../../../polyvik-panel/src/components/Layout.tsx).
- Dialogs: [`src/components/DialogShell.tsx`](../../../polyvik-panel/src/components/DialogShell.tsx).
- Galleries: [`src/components/Gallery.tsx`](../../../polyvik-panel/src/components/Gallery.tsx).
- Pixel heroes: [`src/components/PixelGradient.tsx`](../../../polyvik-panel/src/components/PixelGradient.tsx).
- Notifications: [`src/lib/notify.ts`](../../../polyvik-panel/src/lib/notify.ts) +
  [`src/components/Notifications.tsx`](../../../polyvik-panel/src/components/Notifications.tsx).

## The "DNA style"

Since late September 2026 the panel is being migrated page by page to the language
first built for the Brand DNA pages (Voice, Brand, Visual, Sections, Catalog):
**outlines and discreet backgrounds**. Already migrated: Home, Calendar, Feed,
Library, Campaigns, Settings → Pieces, and the creation workspaces. When you touch
a page, move it to this language; do not invent another one.

- Cards and panels: `card` / `panelFrame` (`rounded-row frame`): 14 px radius, a
  1 px border that is lighter on top, and a barely lifted `surface-1` fill.
- Filters and tabs: outlined chips with an icon (active: `border-outline` +
  `bg-surface-2`, icon in `amber`), with a count when it helps.
- Search and tools sit on the same row as the filters. Image grids are loose,
  with no container around them.
- Section headers: `fog` title + `haze` subtitle; save state on the right.

## Principles

1. **Tonal, with discreet lines.** Depth is `ink → surface-1 → surface-2 →
   surface-3`. A neutral 1 px line may define a control, an editorial container or a
   split between tasks. Do not draw a box around every datum.
2. **One accent.** `amber` (the Brasa red, see Tokens) for the primary button,
   links, progress, focus ring, the featured card's label and small highlights.
   The `amber/14` tint is only for an icon container or a selected state. Never a
   card background.
3. **Rectangular buttons.** Buttons have 10 px corners (8 px for small ones and
   inner segmented buttons). **Never pill buttons.** Round shapes are reserved for
   dots, status badges, counters, avatars' status, switches and progress bars. The
   container is rounder than its child: cards 20 px (dialogs) / 14 px (rows and
   framed panels), controls 10–12 px.
4. **Scale makes hierarchy.** `micro 12` · `body 15` · `title 18` · `section 22`
   (local header inside a hub) · `page 28`, plus `display 40` for hero headings and
   for a number that *is* the card. No reading text below 15; nothing below 12.
   Negative tracking on everything ≥ 18 px. No uppercase mono except tiny
   calendar/eyebrow labels.
5. **Data in small mono.** `font-mono text-micro text-haze` (`metaMono`) for dates,
   figures and ids.
6. **Errors don't move the layout.** Server errors go through `notify()` (popup +
   bell log), not inline banners. See Feedback.

## Tokens

```css
@theme {
  --font-sans: "Satoshi", system-ui, sans-serif;          /* self-hosted, 300–900 */
  --font-mono: "JetBrains Mono", ui-monospace, "SF Mono", monospace;

  --text-micro: 12px/16;  --text-body: 15px/23;  --text-title: 18px/25;
  --text-section: 22px/30;  --text-page: 28px/34;  --text-display: 40px/44;

  --color-fog:  #f2f3f5;                  /* text 1: titles, values, body */
  --color-mist: rgb(242 243 245 / .78);   /* text 2: supporting text */
  --color-haze: rgb(242 243 245 / .60);   /* text 3: help, metadata, labels */

  --color-ink: #0b0c0e;        /* page, top bar */
  --color-surface-1: #0f1114;  /* cards, dialogs */
  --color-surface-2: #14161a;  /* rows, inputs, controls */
  --color-surface-3: #1a1d22;  /* hover row, secondary button, toast */
  --color-surface-4: #22262c;  /* hover on surface-3 */

  --color-divider: rgb(242 243 245 / .08);        /* split groups */
  --color-outline: rgb(242 243 245 / .12);        /* frame and control */
  --color-outline-hover: rgb(242 243 245 / .20);  /* interaction */

  /* Brasa palette: orange → red → wine */
  --color-brasa-1: #ffb14a;
  --color-brasa-2: #ff5a36;
  --color-brasa-3: #b8244a;

  --color-amber: var(--color-brasa-2);  /* primary (historical name) */
  --color-amber-soft: #ff8a62;          /* hover */
  --color-amber-deep: #d8402a;

  --color-ok: #4ac088;  --color-warn: #e0a200;  --color-error: #e06456;  --color-info: #d6d9de;

  --radius-card: 20px;  --radius-row: 14px;  --radius-ctl: 12px;  --radius-nav: 10px;
  --shadow-float: 0 12px 32px -12px rgb(0 0 0 / .8);
  --color-line: transparent;  /* legacy; do not re-enable old borders wholesale */
}
```

**Brasa.** The three-stop gradient is the brand signature (logo mark, pixel heroes).
In small things (primary button with `ink` text, links, focus ring, today markers,
progress) the middle red is used solid: that is the `amber` token, a historical
name the whole panel uses. Semantic warning yellow stays `warn`.

The logo draws its own SVG gradient from the `brasa-*` stops; there is no gradient
token in CSS (the unused `--gradient-brand`, `--gradient-create` + `btnAccent` and
`fuchsia` tokens were removed on 26 Sep 2026).

**Text: three levels, and they are colors.** `text-fog` titles, labels, values and
body · `text-mist` supporting text · `text-haze` help, metadata and labels. Contrast
on `ink`: 17.6 · 10.6 · 6.7 (the lowest is still 6.2 on `surface-3`). **Do not use
`text-fog/N`**: hierarchy comes from size and weight, not transparency (the panel
once had nine opacity levels and the three lowest failed 4.5:1).

A disabled control is not faded: the primary becomes `surface-3` with `text-haze`
(`btnOff` in `ui.tsx`). A button you cannot press must still be readable.

## Lines and surfaces

- **`.frame`** (cards and panels): gradient fill plus a border that is lighter on
  top and fades on the sides, made with two backgrounds (fill on `padding-box`,
  border on `border-box`) over a transparent 1 px border, so it respects the radius.
- **`.page-header-backdrop`**: the same idea with the light on its bottom edge. It is
  drawn by `PageHeaderBackdrop` in `Layout.tsx` behind each regular page's header,
  down to the element marked `data-header-end` (or the first `<header>`), with a
  20 px radius. `.content-main [data-header-end]` adds 36 px below it.
- **`.surface-glow`**: `surface-1` with an 11 % `amber` radial glow from the top-left
  (440×300 px, fixed). Used by modals, dialogs, the selection bar and floating menus;
  floating layers add `ring-1 ring-fog/8`.
- Three line tokens, always neutral and **1 px**:
  - `border-divider` / `divide-divider`: navigation groups, form groups, list rows.
    Never between a label and its field.
  - `border-outline`: framed panels, editable controls, selected option, outlined
    chips and toolbar buttons.
  - `hover:border-outline-hover`: interactive controls only. Focus keeps
    `ring-2 ring-amber` / `outline 2px amber`; errors use `border-error`.
- Do not stack border + shadow + contrasting background at every level.
- Semantic tones are always a tag: `bg-{tone}/12 text-{tone}` + 6 px dot.

## Typography (Satoshi 300–900 · JetBrains Mono)

| Spec | Use |
|---|---|
| `text-display font-semibold tracking-[-0.025em] leading-[1.1]` | Hero heading (Home greeting, Calendar month) |
| `text-page font-semibold tracking-[-0.025em]` | Page h1 (`PageHeader` / `HubHeader`) |
| `text-section font-semibold tracking-[-0.02em]` | Local header inside a hub (`LocalHeader`) |
| `text-title font-semibold tracking-[-0.01em]` | Card and group title (`SectionLabel`) |
| `text-body font-medium` | Row name, field label, link, nav |
| `text-body` | Body, inputs, help. Buttons: `font-semibold` (primary) / `font-medium` |
| `text-micro font-medium uppercase tracking-[0.06em] text-haze` | Group label (`capsLabel`) |
| `font-mono text-micro tracking-[0.02em] text-haze` | Metadata, dates, small figures (`metaMono`) |

Weights: 400 body · 500 active, label, link · 600 titles and primary. The Feed hero
headline (750) and the creation pages are local exceptions (see below). The Lab
(Canvas, Editor) is outside the scale: there px are canvas geometry.

**Form hierarchy:** page header 28/600 → local header 22/600 → group title 18/600 →
label 15/500 `fog` (`fieldLabel`) → value 15/400 `fog`. Short hints next to a label
are 12/400 `haze`. More space before a field than between label and value.

**Reading measure:** 68 `ch` on every running paragraph, set by
`.content-main :where(p)`; an explicit `max-w-*` still wins. Comfortable range is
45–75 characters per line.

## Spacing

Base 4. Page blocks `gap-6`; cards `p-5 sm:p-6`; rows `gap-1.5`–`gap-2.5`;
icon → text `gap-3`; minimum touch target 44 px (toolbar controls 36 px).

## Frame and navigation

**No sidebar.** A single sticky top bar (`TopBars` in `Layout.tsx`), `h-16`,
`bg-ink/90 backdrop-blur-md`, padded with `--page-pad`:

- **Left:** the Polyvik wordmark (Brasa-gradient mark + white word, inline SVG),
  hidden below `sm`; on mobile, a 36 px menu button (`md:hidden`).
- **Center:** the brand selector (`BrandSwitcher header`: 36 px, 10 px radius,
  brand avatar + name), a 1 px divider, then the section links (`NavTabs`, `md+`).
  Links are **text only**, no icons; groups (Home/Calendar · Feed, Campaigns,
  Canvas, Editor, Blog, Events · Brand, Library, Settings) are separated by a thin
  divider. The active link only gets `font-medium text-fog`, **no underline or
  other indicator**. Editor, Blog and Events appear only when the brand has that
  feature enabled.
- **Right:** the plan/usage chip (`UsagePanel`, `sm+`), the notification bell
  (`Notifications`, amber count badge) and the account avatar (40×40, 10 px radius;
  menu with My account, Plan and billing, Log out; below `lg` the usage panel moves
  into this menu).
- **Mobile drawer:** 272 px `surface-1`, the same sections in a column with caps group
  labels (the active item gets `bg-amber/10`, an amber icon and a 3 px amber bar),
  and the usage panel at the bottom.

**Squares** (`tile` in `ui.tsx`): everything square is 40×40 with 10 px corners —
brand avatar, person avatar, square icon buttons in the bar.

**Content** (`main.content-main`): no fixed max width. Side padding
`--page-pad: clamp(16px, 3vw, 32px)` (the same as the top bar, so content starts
where the brand selector starts); top padding
`--header-top + --page-pad − --header-inset`; bottom 64 px.

- `.bleed-to-header`: image grids reach the edges of the header backdrop.
- `.fluid-sections` (min 26 rem columns, 40 px gap), `.fluid-fields` (min 14 rem),
  `.fluid-gallery` (2 columns on mobile, `auto-fill` with `--tile-min`, 14 rem
  default, on desktop, so a short gallery does not stretch).
- **Full-bleed pages:** `/lab/*`, `/feed/create`, `/video/create` and `/characters`
  render without `content-main` padding and without the page header backdrop, in an
  `h-screen` column. The creation pages also hide the `SetupStepper`.
- `SetupStepper` floats on regular pages until the brand setup is complete.

## Pixel heroes

`PixelGradient` draws a pixelated gradient on a canvas the size of its box: square
cells, a stepped (seeded, stable) border between colors, and the left side sinking
to `ink` so white text reads.

- Palettes: `brasa` (wine → red → orange, default), `azul` (`#0b3a82` → `#0c97ef` →
  `#09cad6`, the create blue) and `gris` (desaturated Brasa).
- Props: `cell` (px, default 14), `colorPlacement="right"` (keeps the full palette
  but pushes the bright pixels right, leaving room for copy), `animateOnMount`
  (a one-time 1.4 s staggered reveal from `ink`; `prefers-reduced-motion` shows the
  final image; resizing does not replay it).
- **Full-bleed heroes** use `.hero-bleed` + `.hero-inner`: no corners, edge to edge,
  flush with the top bar; text keeps the page padding inside. Text on the hero is
  white (`text-white`, `/80` for the line, `/70` for mono eyebrows) and the hero
  action is a white 40 px button with `ink` text.
- Current uses: Home (`brasa`), Calendar (`azul`, cell 14), Feed (`brasa`, right,
  animated), and the creation workspaces (`brasa`, cell 10, right, animated, as a
  top strip).

## Components

All in `ui.tsx` unless noted.

- **Buttons** (`btnBase`: `rounded-[10px]`, 150 ms color transition):
  - `btnPrimary`: `bg-amber text-ink font-semibold px-[18px] py-[11px]`, hover
    `bg-amber-soft`. `btnPrimarySm`: `px-4 py-[9px]`. Saving: same button, label
    "Saving…", disabled.
  - `btnSecondary` / `btnSecondarySm`: `bg-surface-3 text-fog font-medium`, hover
    `bg-surface-4`.
  - `btnDanger`: `bg-error/12 text-error`, hover `/20`. `btnGhostDanger`: no
    background, hover `bg-error/12`.
  - `btnIcon`: 36×36, 10 px radius, `bg-surface-2 text-haze`, hover `surface-3`/`fog`.
  - `barButton` / `barIconButton` (`Gallery.tsx`): 36 px toolbar buttons, outlined
    or icon-only.
  - `linkAccent`: `text-body font-medium text-amber`, hover `amber-soft`, no
    underline; 14 px arrow when it navigates.
  - Dialog footers use `modalActions`: a two-column grid, equal widths, one line
    each, no icons, two words max (the long name goes in the tooltip).
- **Inputs:** tonal `inputClass` (`h-11 rounded-xl bg-surface-2`) or framed
  `outlinedInputClass` (`h-11 rounded-nav border border-outline bg-surface-2`,
  hover `outline-hover`, focus `border-amber ring-2 ring-amber`, `aria-invalid` →
  `border-error`). `filterSelectClass`: 36 px, 10 px radius. Labels use
  `fieldLabel`; `Field` / `TextField` wire the `id`. Help is `haze`, never an
  arbitrary opacity. For compact dropdowns use `MiniMenu` (`msui.tsx`).
- **Switch:** on/off for something that already exists (a template in rotation, an
  active section), `bg-ok` when on, with the state written next to it.
- **Card** (`card`): `rounded-row frame p-5 sm:p-6`. **Featured** (`cardFeatured`):
  `border-amber/30 bg-amber/[0.04]`, at most one per screen.
- **Row** (`Row`): `rounded-[14px] bg-surface-2 px-[18px] py-4`, hover `surface-3`;
  40 px icon box (`bg-amber/14 text-amber` when `accent`), name 15/500, `metaMono`
  meta, status on the right; the whole row is the link. Compact: 28 px icon.
- **StatTile**: `card` with a label and a mono `text-page` figure.
- **StatusTag**: `rounded-full bg-{tone}/12 text-{tone} text-micro font-medium
  px-2.5 py-1` + 6 px dot; the dot pulses only while something is in progress. Per
  entity: `PieceStatusBadge`, `CampaignStatusBadge`, `ConnectionStatusBadge`,
  `EventStatusBadge`, `RegistrationStatusBadge`, `BlogPostStatusBadge`,
  `BlogTopicStatusBadge`, `EmailStatusBadge`.
- **Headers:** `PageHeader` (h1 `text-page` + a 15 px line + action on the right;
  inside a hub it only portals the action into the hub's tab bar via
  `HubActionContext`), `HubHeader`, `LocalHeader` (22/600, mono count, supporting
  line, actions right), `SectionLabel`, `SectionTitle` + `Help` (collapsed help
  behind a "?").
- **Empty** (`EmptyState`): `surface-2` row, 40 px `surface-3` icon, title, one line
  that says what will happen; optional action on the right only when the empty
  state is the door to the flow. No dashed borders in new code (Home and Feed still
  use a dashed outline for their empty tiles).
- **Loading:** never text. Images on their way are skeletons at their real shape
  (`GallerySkeleton`, from the size the server stores for each asset) with the
  `.generation-shimmer-sweep` sweep; the image fades in over the same box, so the
  layout doesn't move. A list that hasn't arrived is a grid of skeletons
  (`GallerySkeletonGrid`), labelled «loading» for screen readers only. A busy
  button swaps its label for a spinning icon. The Feed follows this since
  5 Oct 2026; other screens still show `Spinner` with a «Cargando» label and move
  to the same rule as they're touched. The campaign "Try it" thumbnails shimmer
  only during their real generation step.
- **Banner** (`WarningBanner`): `border-warn/30 bg-warn/[0.06]`, at most one per
  screen, for a warning that changes how the whole screen reads.
- **OccupancyBar**: 4 px bar, `amber` (`warn` when full), with the exact number
  always written next to it.

### Feedback: notifications, toasts, errors

- **`notify(tone, text)`** (`lib/notify.ts`, tones `error | warn | ok`) dispatches a
  `pv-notify` window event. `<Notifications />` in the top bar shows it as a popup
  (bottom stack, 7 s) and keeps it in the bell's log. Identical messages within
  10 s are collapsed. Use it for server errors and background results instead of
  an inline error that pushes the layout.
- The bell also derives notes from piece state (failed, pending approval,
  published), polled every minute; the log is stored per brand in `localStorage`
  (`pv.notes.{brandId}`).
- **`ErrorNote`** is now a bridge: rendering it calls `notify('error', message)` and
  renders nothing.
- **`Toast`**: a `surface-3` pill at the bottom center with a dot and `shadow-float`;
  success disappears after 5 s, an error stays until dismissed. Used by pages that
  confirm a local action (Feed, settings pages…).
- **`ActionError`** (inline, with Retry) and **`FormError`** (form validation) remain
  for errors that belong next to the control that failed.

### Dialogs

- **`Modal`** (`ui.tsx`): portal to `body`, `bg-ink/70` veil, `rounded-[20px]
  surface-glow ring-1 ring-fog/8`, sizes `md | lg | xl | full`, title + close
  button, focus moves inside on open, optional focus trap, Esc closes the topmost.
- **`Dialog` + `DialogHead`** (`DialogShell.tsx`): the frame for large dialogs
  (calendar piece, Feed image/video, creation panels, reference picker). Explicit
  `width` in px, `pv-veil` (150 ms) and `pv-dialog` (180 ms, `cubic-bezier(.22, .7, .3, 1)`)
  animations, focus trap, Esc and click outside close, focus returns to the
  opener. `DialogHead` shows a mono layer label on the left, optional controls
  (e.g. a segmented prev/next with `position/total`) and the close button.

### Galleries (`Gallery.tsx`)

Shared by Feed and Library so they cannot diverge:

- `GallerySearch`: a magnifier icon that expands into a 220 px field; collapses when
  left empty or on Esc.
- `SelectToggle`: icon-only button that enters selection mode.
- `GalleryTile`: one click opens; in selection mode (or with ⌘/Ctrl/Shift) it picks.
  Square (`rounded-[12px]`) or `natural` ratio (`rounded-[16px]`), 1.04 zoom and a
  bottom gradient + label on hover, optional corner badge (e.g. "in Library"), picked
  state with an amber inset ring and check. With `video`, it renders `HoverClip`.
- `HoverClip`: a still (poster, or the video's first frame) that plays the muted 3 s
  preview clip in a loop only while the pointer is over the tile; nothing downloads
  until then. Without a preview clip it loops the first 3 s of the full video.
- `Masonry`: equal-width columns, each item at its own ratio, placed in the shortest
  column (4:5 assumed until loaded).
- `SelectionBar`: floating bottom bar (`rounded-[14px] surface-glow shadow-float`)
  with the count, the screen's batch action and Cancel.

## Home

1. **Pixel hero** (`brasa`, full bleed): mono date → greeting in `display` → one line
   summarizing what is needed today (approvals / today's posts / quiet). On the
   right, a white "Review N" button only when pieces await approval.
2. Main column and a 340 px rail on `xl`:
   - **Awaiting approval:** a horizontal strip of 200 px, 4:5 image cards with the
     channel icon, campaign and time; opens the piece dialog. Empty → one line.
   - **Your week:** seven columns with each day's pieces as images; today has an
     amber tint and ring. Links to the Calendar.
   - Rail: **Active campaigns**, **Feed** (latest creations), **Connections**.
3. Brand setup steps are handled by the floating `SetupStepper`, not by a Home card.

Rule: an empty module never takes the best spot. Home answers "what is going out,
and what is missing from me?", in that order.

## Calendar

Its own nav entry (`/calendario`). Crosses pieces, blog, events and emails.
**Month view only** (Home already covers the week).

1. **Pixel hero** (`azul`, full bleed): mono "Calendar · year", the month name in
   `display`, a subtitle and four mono stats (scheduled, pending, published, free
   days). One action: "Review N" if something is pending, otherwise "Fill N free
   days" (→ new campaign).
2. **Toolbar:** the layers menu (pieces, blog, events, emails, with counts and color
   dots), channel and campaign `MiniMenu`s; on the right a month load strip (one bar
   per day: today `amber`, pending `warn`, busy `fog/60`) and the ‹ Today › control.
3. **Month grid** in a `panelFrame`: `repeat(7, minmax(0,1fr)) 56px`; mono uppercase
   weekday headers (today's column in `amber`). Cells `min-h-[128px] rounded-[12px]`
   with a border; today shows the date in `amber` plus an outlined "today" tag; a
   free future day shows a faint "+".
4. **Chip:** `rounded-[10px]` with `inset 3px 0 0 {state color}`, item icon, mono time
   (10 px), 12 px truncated text. Background tint only for states that ask for
   something: pending `warn/14`, failed `error/14`; closed items `fog/4`; the rest
   `surface-2`. Max 3 per cell + "+N more" (opens the day).
5. **Load column** (56 px): weekly count, 24×3 bar relative to the busiest week
   (`amber`, `warn` above 5) and pending count in `warn`.
6. Footer: drag hint and state legend. **Empty month:** a featured card ("Create a
   campaign" / "Connect a channel") above the dimmed grid.

**Dialogs** (`CalendarDialogs.tsx`, on `Dialog`): the piece dialog has two views —
the post as it will appear (600 px) and a review/edit view (1280 px). Actions:
Approve and schedule, Request changes, Reschedule (`R`), Publish now, Cancel.
Approving does not close: it offers **"Review next"** to chain pending pieces.
Blog post, event and email dialogs are 560 px; the full day is 520 px.

**Reschedule:** drag the chip (target cell gets `border-amber bg-surface-2`) or open
the piece and press `R`. Published and failed items are not draggable.

**Responsive:** below 1500 px the month hides the chip time and the load column;
below 1340 px it switches to a 30-day **agenda** (`data-pv-*` attributes, rules in
`index.css`).

## Campaign review

`/campaigns/:id` keeps the proposal cards for the whole process. Each card
generates a real piece, shows its history and lets you approve and schedule it.
The text preview opens only the text; the image preview opens only the image and
"How this image was made". Image actions live under it: approve, regenerate image
only, edit prompt, edit materials. Approving keeps that version when the piece is
created; publishing requires approving the whole piece. "Another idea" replaces
the proposal; "Turn into section" creates a recurring section. There is no fixed
"Create the pieces" footer or a second results screen.

The header offers New idea, Configure campaign, Regenerate campaign and Campaign
history. Configure does not replace proposals. Regenerate asks for confirmation and
keeps scheduled/published pieces; replaced versions keep their images in the Feed
and their records in the history.

## Brand DNA tabs

Each tab opens with `LocalHeader`. What exists is shown as a summary card or row and
opens its editor in a modal — never open forms inline. On/off for existing things
uses `Switch`. Adding has one door per tab (in Visual, "Add template" opens the three
routes: Polyvik, extract, image). Editors save on blur and flush pending changes on
close. Disabling is not deleting: disabled items are listed apart and can be
re-enabled. Brand combines identity and kit on one screen; main and seasonal kits
share a selector. Do not duplicate this screen in the Lab.

## Feed

`/feed` shows the brand's generated images **and videos** (approved pieces are
excluded; they live with their campaign). Styles live in
[`src/pages/Feed.css`](../../../polyvik-panel/src/pages/Feed.css), scoped to the Feed.

- **Hero** (a local exception to the title scale): `PixelGradient` `brasa`, cell 14,
  `colorPlacement="right"`, animated once on arrival, full opacity with no dark veil.
  Headline Satoshi `clamp(40px, 4.6vw, 72px)`, weight 750, tracking −0.055em; first
  line white, second line solid `amber` (no gradient text). 17 px intro.
- **Hero actions:** "Create images" (solid `amber`, 10 px radius, 48 px tall) →
  `/feed/create`; "Create video" → `/video/create` and "Characters" →
  `/characters` (outlined `surface-2`); a small "Open library" link. These are the
  entry points to the creation workspaces; they are not in the top nav.
- **Artwork:** three decorative images made for Polyvik (independent of any brand's
  gallery) in an open composition up to ~660 px wide: coral portrait (v2), golden
  perfume (v3) in front, chrome flower on cobalt (v1). 3:4, 12 px corners, soft
  shadows, rotations −8°/−2°/8°, a 7 s float (off under reduced motion), two thin
  orbits and a tilted "Your creations" badge. Hidden on mobile. Files and prompts:
  [feed-header-artwork.md](feed-header-artwork.md).
- **Collection:** "Your creations" + count; filters All / Saved (with count); search
  field, grid size toggle, "Name untitled" and Select on the right. Masonry with
  16 px gaps and 20 px tile corners (14 px on mobile). Videos show a still and play
  their 3 s clip on hover (`GalleryTile` + `HoverClip`).
- **Dialogs:** image (1280 px: large image, "How this image was made", Save to
  Library / Classify, Edit (retouch in place), Use as model image, Use as template,
  Open, Delete) and video (1100 px: player with sound and controls, New video, Open,
  Delete). ← → move through the Feed.

## Creation workspaces

`/feed/create` (images), `/video/create` (video) and `/characters` share one layout
(`ImageCreate.css`, plus `VideoCreate.css` / `CharacterCreate.css`): full bleed, a
Brasa pixel strip on top, a breadcrumb header, an open stage and a floating bottom
composer (prompt, attached references, control chips, generate button), with brand
DNA dialogs built on `Dialog`. See
[image-creation-workspace.md](image-creation-workspace.md) and
[video-creation-workspace.md](video-creation-workspace.md).

## Copy and i18n

Informal "tú" in Spanish, short sentences, verb + object. No Title Case,
exclamation marks or emojis. Every empty state says what will happen. All strings
in `src/i18n/{es,en}.ts`; dates and numbers with `Intl`.

## Motion

Hover/focus 150 ms (color/background). Dialog veil 150 ms and dialog 180 ms with
`cubic-bezier(.22, .7, .3, 1)`. Pixel hero reveal 1.4 s, once. Nothing slides in otherwise.
Respect `prefers-reduced-motion` everywhere (dialogs, shimmer, retouch pulse, Feed
artwork, pixel reveal).

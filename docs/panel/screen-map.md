# Panel screen map

What each screen of `polyvik-panel` is made of, what it needs from the
[design system](design-system.md), and how big its migration is. Audited on
9 Oct 2026. Update the status column as screens migrate, and move components
from "Missing" to the catalog (`/design`) as they are built.

## Findings that cut across screens

- **No screen imports `components/ds` yet.** Everything uses `ui.tsx` class
  strings (now restyled through the recipes) or hand-written elements: about
  680 raw `<button>`s in total.
- **Pixel heroes break in light.** `PageHeader` (`ui.tsx`), `HubTabs` and the
  hand-made heroes of Home and Calendar put `text-white` and `bg-white` CTAs
  over a `PixelGradient` that fades into `--color-ink`, which is light in light
  mode. A theme-aware `PageHero` fixes Home, Calendar, Library, Brands, Plan,
  Campaigns and both hubs at once.
- **`border-line` draws nothing.** `--color-line` is `transparent` on purpose
  (the DNA style turned borders off), so table rows, card outlines and the
  history timeline have no lines in Campaigns, Events, Emails, Connections,
  Features and Usage. Replace `border-line` and `divide-line` with
  `border-border-soft` per screen as it migrates.
- **Two dialog systems.** `ui.tsx` `Modal` and `DialogShell` (`Dialog` /
  `DialogHead`) coexist. Both become one ds `Dialog`.
- **Dark-only CSS files.** `ProductStudio.css`, `UgcStudio.css`,
  `VoiceLab.css`, `BrandOnboarding.css`, `WebsiteBrandImport.css`,
  `FirstBrandPiece.css`, `BrandImageStudio.css` and `Login.css` hold about 1,200
  hard-coded colors that assume a dark page.

## Screens

Size: **S** is a few hours, **M** is about a day, and **L** takes several days
or needs new domain components.

| Area | Screen (route) | Main files | Size | Light-mode risk | Status |
|---|---|---|---|---|---|
| Frame | Top bar and menus | `Layout`, `BrandSwitcher`, `UsagePanel`, `Notifications`, `ToolsMenu` | — | — | Migrated |
| Day to day | Today (`/hoy`) | `Home.tsx`, `PlanCard.tsx` | M | — | Migrated (9 Oct); second pass: plain header like Media's title |
| | Calendar (`/calendario`) | `Calendar.tsx` 601, `CalendarDialogs.tsx` 474 | L | — | Migrated (9 Oct): plain header with the month's figures, ds filters (layers menu stays open, native selects), flat gray day cells, today outlined in the accent, agenda and dialogs on ds |
| Content | Media (formerly Feed), the front page (`/`; `/feed` and `/media` redirect) | `Feed.tsx` + css, `Gallery.tsx`, `ImageDialog.tsx`, `GridSizeToggle` | L | — | Migrated (9 Oct) |
| | Community Feed (`/feed`) | `CommunityFeed.tsx` | — | — | Built on the design system (9 Oct) |
| | Library (`/library`) | `Materials.tsx` 688 | M | Hero; drag overlay | Pending |
| | Campaigns (`/campaigns`) | `Campaigns.tsx` 212 | S | Hero | Pending |
| | Campaign brief and ideas (`/campaigns/new`, `/:id`) | `CampaignNew.tsx` 1143, `PieceModals`, `PieceStudio`, `PieceHistory`, `CampaignIdeaPreview` | L | Generation glyph, loader shadow, chips on accent | Pending |
| | Tools (`/tools`) | `Tools.tsx` 658, Product/Ugc/Carousel/Publication studios + css | L | — | Migrated (9 Oct): plain headers, catalog cards, ds form and runs; the Product/UGC/Carousel stylesheets now use only semantic tokens (no hexes except the light backdrop behind product photos). PublicationStudio and BrandImageStudio belong to Create image and are pending |
| | Create image (`/feed/create`) | `ImageCreate.tsx` 371 + css, `MentionField` | M | Glows | Pending |
| | Create video (`/video/create`) | `VideoCreate.tsx` 372 + css, `VideoSetupWizard`, `VideoDirectionControls` | M–L | White overlays in css | Pending |
| | Characters (`/characters`) | `CharacterCreate.tsx` 470 + css | M | Minor | Pending |
| | Voices (`/voices`) | `VoiceLab.tsx` 774 + css | L | Whole stage | Pending |
| | Canvas (`/lab/canvas`) | `Canvas.tsx` 3179, `canvas.css`, `msui.tsx` | L | Dot grid, white utilities | Pending |
| | Video editor (`/lab/editor`) | `VideoEditor.tsx` 646, `editor/Monitor`, `editor/Timeline` | L | Track colors | Pending |
| | Blog (`/blog`), post | `Blog.tsx` 633, `BlogModals.tsx` 422, `BlogPost.tsx` 236 | M, S | Invisible lines | Pending |
| | Events, detail, emails | `Events.tsx`, `EventModals.tsx` 691, `EventDetail.tsx` 630, `Emails.tsx` 296 | M, M, S | Invisible table lines | Pending |
| Brand | Voice (`/brand/voice`) | `BrandVoice.tsx` 395 + `voice/*` | M | Fine | Pending |
| | Identity (`/brand/identity`) | `BrandIdentity.tsx` 798, `BrandIdentityEditors`, `FontPicker`, `LogoMode` | L | A white tile | Pending |
| | Visual (`/brand/visual`) | `TemplatesManager.tsx` 402, `TemplateExtractor` | M | Fine | Pending |
| | Sections, Catalog | `Sections.tsx` 399, `Catalog.tsx` 362 | S–M | Fine | Pending |
| | Brands (`/brands`) | `Brands.tsx` 213 | S | Hero | Pending |
| | Model image studio | `BrandImageStudio.tsx` 377 + css | L | Pale peach text | Pending |
| Settings | Pieces | `PieceSettings.tsx`, `VisualPlanEditor` | M | Image backdrop | Pending |
| | Connections, Features, AI keys, Usage | `Connections`, `FeatureSettings`, `AiKeysSettings`, `UsageSettings`, `UsageTable` | S each | Invisible lines | Pending |
| | Plan (`/plan`) | `PlanSettings.tsx` 351, `BuyDialog` | M | **Unreadable cards** (dark gradient under dark text) | Pending |
| | Account (`/account`) | `Account.tsx`, `AvatarPicker` | S | Fine | Pending |
| Public | Login, Sign-up, Onboarding, Phone upload | `Login` + css, `Signup`, `BrandOnboarding` + css, `FirstBrandPiece` + css | S, S, L, S | Dark by design | Stay dark |

## Missing components

Ranked by how many screens need them. **Shared** components go in
`components/ds` and the catalog. **Domain** components are product-specific;
they live next to their screen but are built only from ds parts and tokens.

### Shared, needed widely (build first)

| Component | Needed by | What it does |
|---|---|---|
| ~~Dialog~~ (built; `DialogShell` is an alias) / ConfirmDialog | Almost every screen | One dialog: sizes, header slot, busy lock, cancel/confirm footer, danger variant. Replaces `Modal` and `DialogShell` |
| Toast, ~~Spinner~~ and ~~Skeleton~~ (built) | Every screen | Theme-safe toast; spinner with label; shimmer placeholders shaped like their content |
| ~~PageHero~~ (built) | Home, Calendar, Library, Brands, Plan, Campaigns, hubs | Pixel-gradient header that stays readable in both themes; eyebrow, title, line, stats, CTA |
| LinkTabs | Brand and Settings hubs, Events | `Tabs` driven by routes (NavLink) |
| ~~Callout~~ (built) | Plan, Campaign, Blog, Emails, AI keys | Toned panel (info/ok/warn/error) with icon, title, body and action. Replaces `WarningBanner` |
| ~~SearchInput~~ (built) | Feed, Library, Campaigns, Brands, Catalog | Field with a search icon, clear on Esc, optional expand-from-icon |
| ~~ProgressBar~~ (built) / Meter | Home, Calendar, Plan, Brands, Events, Video | Determinate and indeterminate; used/total with an over-limit tone |
| Dropzone | Library, Identity, Characters, Visual, Canvas, Onboarding, Tools, Phone upload | Drag, paste or click to upload, with an overlay and limits |
| ChipGroup / ToggleChip | Campaign, Tools, Characters, Voices, Onboarding | Single or multi-select chips with disabled ("coming soon") state |
| ChoiceCard | Campaign templates, LogoMode, Catalog, BuyDialog, video wizard | A card-sized radio or toggle with title, hint and image |
| Table | Events, EventDetail, Emails, Usage | Header, hover rows, numeric alignment, row actions, horizontal scroll |
| SettingsSection / SettingsRow | Features, Connections, AI keys, Account | Label and description left, control right, grouped under a heading |
| ~~Stat / StatGroup~~ (built) | Calendar, Emails, Usage, Plan | Number above label, in a row or grid. Replaces `StatTile` |
| DatePicker / DateTimePicker | Calendar, Campaign, Events, approve dialog | Replaces native `date` and `datetime-local`, time-zone aware |
| Popover | Library and Pieces help, filters | Rich floating panel anchored to a trigger (Tooltip is too small) |
| Combobox / ModelPicker | Image, Video, Characters, Tools, Pieces, Calendar filters | Searchable select; options with icons and capability notes |
| ~~FilterMenu~~ (built) | Calendar layers | Multi-select menu that stays open, with dots and counts |
| TagInput | Campaign hashtags, Blog keywords, Events options | Enter or comma adds, Backspace removes, chips with × |
| ~~MediaTile~~ + ~~Masonry~~ (built) | Home, Feed, Library, results grids | Image or video tile: hover caption, badge, selection check; masonry layout |
| ~~BulkActionBar~~ (built) | Feed, Library, Identity | Floating "N selected" bar with actions |
| Slider, NumberField, RadioGroup | Video, Editor, Voices, Events, Sign-up | Standard form controls still missing |
| ~~ButtonGroup~~ (built) | Calendar, editor toolbars | Joined buttons (prev, today, next) |
| InlineEdit, SaveIndicator | Library, Voice, Pieces | Fields that save on blur; "saved / unsaved / failed" status |
| Disclosure | Voice, Identity, Catalog | Collapsible section |
| CopyField, KeyValue, BackLink | Blog, EventDetail | Read-only value with copy; label/value grid; back link |
| Stepper | Video wizard, Onboarding | Numbered steps with current and done states |
| Toolbar, Sheet, Inspector | Canvas, Editor | Icon strip with dividers; sliding side panel; properties panel. Also a compact `Menu` size to replace `MiniMenu` |

### Domain components

CalendarGrid, ~~EventChip~~ (built), WeekStrip (Home), Composer and MentionInput (image,
video and characters), GenerationTile (campaign ideas), PieceHistory timeline,
PricingCard, ColorField, FontPicker, SocialPostMock (`PostPreview`), Prose
(markdown article), FormBuilder (event fields), AudioPlayer, VideoPlayer,
video Timeline, CanvasNode and ChatLayout (model image studio).

## Order

Each screen migrates with the components it is missing. Each new component goes
to the catalog in the same change. The order puts the most visible screens
first and builds shared components early:

1. ~~**Home**~~ (done): MediaTile, MediaBadge, ProgressBar, Chip, Callout, Properties, Spinner, inline Empty. Second pass (9 Oct): the PageHero gave way to a plain header like Media's title (date, greeting, the day's line, «Review» when something waits); free days in the week are flat gray slots. The PixelBand stays for galleries (Media, Feed) only.
2. **Campaigns**, **Brands** and **Account**: SearchInput, Dialog/ConfirmDialog
   and SettingsRow.
3. **Settings tabs** and **Plan**: LinkTabs, Callout, Table, Stat, Meter and
   PricingCard.
4. ~~**Feed**~~ (done): Dialog, DialogHeader, Pager, ConfirmInline,
   SearchInput, BulkActionBar, Skeleton and Masonry. **Library** still needs
   Dropzone and Popover.
5. ~~**Calendar**~~ (done 9 Oct): EventChip, FilterMenu, ButtonGroup and
   Stat/StatGroup are built; each day shows its first creative as a cover.
   CalendarGrid stays in the page, and DateTimePicker is still pending
   (reschedule uses the native input).
6. **Campaign brief and ideas**: ChipGroup, ChoiceCard, TagInput and
   GenerationTile.
7. **Brand hub**: ColorField, FontPicker, Disclosure and InlineEdit.
8. **Blog**, **Events** and **Emails**.
9. **Creation workspaces**: Composer, Combobox, Slider and Stepper.
10. **Canvas** and **editor**: Toolbar, Sheet, Inspector and compact Menu.
11. **Public screens**: last; they stay dark.

Once every screen is migrated, the theme default becomes `system` (see
[design-system.md](design-system.md) → Theme).

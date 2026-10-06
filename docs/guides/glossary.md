# Glossary

**One concept, one name.** This table is the single source for any text the
customer reads: navigation, titles, tabs, buttons, error messages.

The product UI is in Spanish (with an English dictionary). Names below are given
as the Spanish UI term in **bold**, with an English gloss.

We got here because the same thing had a different name on every screen —
templates were "Plantillas con rotación" on one page and "Posts aprobados" on
another — and three different things were called "Referencias".

| Concept | Single name | Table / code | Where it lives |
|---|---|---|---|
| A layout suggestion of the brand's own that the designer adapts to the content | **Molde** (layout) | `brand_templates` | ADN → Visual → Moldes |
| Arrangements drawn in code (boxes: photo, headline, logo), one per format, no photos or words | **Moldes de Polyvik** (Polyvik layouts) | `blueprints.services.js` → `brand_templates` (4 rows with the same name) | ADN → Visual → Moldes · New campaign picks which ones |
| A layout extracted from a piece you liked: the AI measures its zones and writes its effects; the piece itself never travels to the engine | **Extraer de una pieza** (extract from a piece) | `templateExtract.services.js` → `brand_templates` with `source='extracted'`, `zones`, `note` | ADN → Visual → Moldes |
| Your own finished, approved pieces that everything else derives from (up to 4, rotating) | **Imágenes modelo** (model images) | `brand_assets` kind `model` → `settings.anchorUrls` | ADN → Marca (upload or pick from the gallery) |
| Photos or approved pieces that lend light, finish and mood when there is no model image (up to 4, rotating) | **Estilo libre** (free style) | `brand_assets` kind `style_ref` | ADN → Marca (same screen as model images) |
| Private history of generated images and videos; gives no context to the AI | **Feed** | `brand_assets` kind `canvas_gen` (+ video jobs) | Contenido → Feed |
| Images chosen or uploaded by the user, plus a separate archive of approvals | **Biblioteca** (library) | curated `brand_assets` and `approved_piece` | Biblioteca (under ADN in the menu) |
| Saved or uploaded materials, labelled or not | **General** | `brand_assets` kinds `other`, `product_photo`, `canvas` | Library · Canvas · creation pages |
| Images archived automatically when a piece is approved for publishing | **Piezas aprobadas** (approved pieces) | `brand_assets` kind `approved_piece` | Library (separate from General) · Canvas |
| The four roles of a Library material | **Personaje · Producto · Objeto · Lugar** (character · product · object · place) | `brand_assets.ref_use` (`character` · `product` · `content` · `place`) | Library, Canvas |
| Typing `@Name` to bring a Library material into an image | **Convocar** (summon) | resolved by name (`materials.services.js`) | Canvas, campaign brief, proposal |
| What will appear in the image of a proposal or piece | **Materiales** (materials) | `ideas[].materials` · `platform_meta.materials` | Proposal card (chips) |
| The audience defined by the brand | **A quién le habla** (who it speaks to) | `brand_profiles.voice.audience` | ADN → Voz |
| Language and regional variant for creation | **Idioma y variante del contenido** | `brand_profiles.voice.locale` | ADN → Voz |
| Pool of ready-made phrases to reuse | **Copywriting** | `brand_copies` | ADN → Voz |
| Whether the brand publishes to sell, teach, entertain or tell; sets the register of the three agents | **Para qué publica** (why it publishes) | `brand_profiles.voice.purpose` | ADN → Voz |
| Links to posts and creative material that guide content | **Inspiración** (inspiration) | `brand_references` | ADN → Voz |
| Visual-direction text extracted in the Canvas | **Direcciones de arte** (art directions) | `brand_directives` | Canvas, Ajustes → Piezas |
| Fixed content slots, like a magazine's | **Secciones** (sections) | `brand_series` | ADN → Secciones |
| Images pinned to every piece of the brand | **Materiales fijos** (fixed materials) | `plan.references` | Ajustes → Piezas |
| How the logo appears in pieces | **Modo del logo** (logo mode) | `brand_profiles.logo_mode` | ADN → Marca |
| Visual style of the blog and landings | **Diseño** (design) | `blog_settings.theme` | Blog, Eventos |
| Subjects in the blog queue | **Temas** (topics) | `blog_topics` | Blog |
| Configuration pieces are generated with | **Piezas** (pieces) | `brand_piece_settings` | Ajustes → Piezas |
| A campaign's frozen recipe (channels, dates, layouts) | **Receta de la campaña** (in code still `campaigns.plan`; the customer sees it as «Configurar campaña») | `campaigns.plan` | New campaign |
| What the customer subscribed to: Free, Starter, Growth, Agency, Enterprise | **Plan** | `tenants.plan` + `tenants.limits` (`PLANS` in `plans.config.js`) | Home, Plan y pagos, staff console |
| While it lasts: everything costs zero, the plan is chosen without paying and Stripe is closed | **Beta abierta** (open beta) | `FREE_BETA` in `plans.config.js` · `POST /api/plan/select` | Badge on sign-up · notice at the top of Plan y pagos |
| The entry plan: look around and build one brand by hand, no AI | **Free** | `tenants.plan = 'free'` (`ai: false` in `plans.config.js`) | Sign-up · plan badge · Plan y pagos |
| What the user sees when pressing something their plan does not include: they are taken to Plan y pagos, not scolded in place | (402 error with `code: quota_plan`) | `requireAi` (`plan.middleware.js`) → `assertAiAllowed`; `credit()` (`credit.middleware.js`) includes the same gate | Notice at the top of Plan y pagos (`/plan?blocked=1`) |
| Signing up: pick where to start | **Crea tu cuenta** (create your account) | `POST /api/auth/register` · `GET /api/public/plans` | `/signup`, linked from log-in |
| How many campaigns can be opened per month | **Campañas del mes** (used / included) | `campaigns.proposed_at` within the period | Home, Plan |
| What each campaign brings: 12 new pieces (first generation of each) and 3 proposal regenerations | **Lo que trae la campaña** (campaign allowance) | `CAMPAIGN_ALLOWANCE` · `campaigns.quota` (`generations`, `proposals`) | Campaign |
| Redrawing a piece (regenerate image, text and image, request changes), in any campaign | **Iteración** (iteration) | monthly `iteration` credits; `campaigns.quota.iterations` only counts what that campaign spent | Buttons that draw, campaign |
| What each plan brings per month besides campaigns, reset on renewal: iterations, images (Canvas / creation), AI assists, video | **Créditos del mes** («Iteraciones», «Imágenes», «Asistencia IA», «Video») | `MONTHLY_CREDITS` in `plans.config.js` · `credit_usage` · `credit()` / `withCredit` | Home, Plan y pagos |
| Iterations bought or credited separately, per tenant | **Iteraciones extra** (extra iterations) | `plan_ledger` (balance = sum) | Home, Plan, buttons when exhausted |
| No balance for what was asked | (402 error with `code`: `quota_campaigns`, `quota_iterations`, `quota_credits`, `quota_brands`) | `errorHandler` | Notice with a buy button |
| The customer's own AI provider keys: verified, encrypted, shown only as the last 4 characters | **Llaves propias** (own keys / BYOK) | `tenants.byok_config` · `aiKeys.services.js` | `/settings/ai` (owner only, hidden tab) |
| What a piece will say, decided before drawing it | **Propuesta** (proposal) | `campaigns.ideas` (in code still `idea`) | Campaign (proposals and pieces on the same page) |
| Fixing a piece yourself: text and the image already there | **Editar** (edit) | `campaign_pieces` | Piece dialog, on Home, campaign and calendar |
| Asking Polyvik to redo it, saying what is wrong | **Pedir cambios** (request changes) | `piece_feedback` | Same dialog |
| What Polyvik learned from your TEXT corrections | **Reglas aprendidas** (learned rules) | `brand_profiles.feedback_digest` | ADN → Voz |
| Proposals already told, which it avoids repeating | **Lo que Polyvik ya contó** (what Polyvik already told) | `campaigns.ideas` + `campaign_pieces`, with `memory_from` | ADN → Voz |
| Everything an image inherits: logo, palette, typography, free style and guidelines | **Kit** | `brand_profiles` + `brand_assets` (the main one) · `brand_kits` (seasonal ones) | ADN → Marca |
| The year-round kit: it IS the brand identity, not a copy | **Kit principal** (`@principal`) | `brand_profiles` | ADN → Marca |
| A kit that rules only on its dates, or when called by its handle | **Kit de temporada** (seasonal kit) | `brand_kits` | ADN → Marca → «Kit de temporada». Replaced Seasons |
| How a kit is called inside a brief: `@navidad26` | **Etiqueta del kit** (kit handle) | `brand_kits.handle` | New campaign (in the brief) · «Nombre y etiqueta» dialog |
| The days a seasonal kit rules | **Vigencia** (validity) | `brand_kits.starts_on` / `ends_on` | Kit dialog. Outside them the campaign falls back to the main kit |
| The four 16:9 images of a kit, generated in a chain by the image model: 1 identity, 2 graphic system, 3 icons and imagery, 4 applications. Each gets the previous ones as reference; redoing #1 marks the rest «desactualizadas» (outdated) | **Lámina** (kit sheet) · «Lámina 1…4» | `brand_kit_sheets` (`brandKit.services.js`, `boardPrompt`) | ADN → Marca. «Generar kit» / «Completar kit» / «Regenerar kit» run the chain. Each sheet is a real image generation: it costs and shows up in Usage |
| Redoing just one area of a Canvas image: paint over it with the brush and write what goes there | **Retoque** (retouch, brush) | `retouchImage` in `imageGenerator.services.js` · `POST /api/canvas/retouch` | Canvas → brush icon in the node bar. Costs a full image, not a fraction |
| A reusable communication guide with its own facts and copy roles, independent of a Molde | **Tipo de publicación** (publication type) | `publicationRecipes.config.js` | Create images · first brand image |
| A brand’s main and optional secondary communication orientation | **Dirección** (content direction) | `brand_profiles.voice.contentOrientation` / `secondaryOrientation` | Onboarding · Create images |
| Free-form image generation outside campaigns | **Crear imágenes** (create images) | `ImageCreate.tsx` · `/feed/create` | Feed → create |
| An AI clip: from text, from a brand image as first frame, or from several images with roles | **Video** (video node / «Crear video») | `video_jobs` · `video.services.js` · `POST /api/video/jobs` | Canvas → «Video» button, and `/video/create`. Only with the Video feature on in Ajustes → Funciones |
| What a video charges: video credits, ceil(cost / 0.39 USD). Charged when requested, refunded if it fails | **Créditos de video** (video credits) | `iterationsForCost` in `plans.config.js` · `chargeVideo` in `quota.services.js` | The video node/page shows the cost; Plan explains it |
| Multitrack desk where clips, narration audio and texts are assembled with fixed durations | **Editor** | `VideoEditor.tsx` + `pages/editor/` | Menu → Editor (with Video on) |
| The mp4 that comes out of the editor: ffmpeg joins it and adds logo and texts | **Acabado** (final render) | `videoRender.services.js` · `POST /api/video/render` | Editor → Export |
| Ready-made briefs written in-house that the customer drops on the canvas and adjusts. They are not skills (writing guides) nor directives (distilled from a brand image) | **Galería de prompts** (prompt gallery) | `promptGallery.services.js` · `GET /api/canvas/prompts` | Canvas → Library → «Prompts» tab. Dragging or pressing + adds them as a text node |
| Each business an account manages | **Marca** (brand) | `brands` | Brand switcher in the top bar, centered before the links |
| Modules that are off by default (Blog, Events, Video) and enabled per brand | **Funciones** (features) | `brands.features` | Ajustes → Funciones |
| What belongs to the user and not to a brand (language, personal data, session) | **Mi cuenta** (my account) | — | Avatar menu at the right of the top bar → `/account` |

**Seasons became seasonal kits.** They were the same thing with less: palette
and motifs, no name, no dates and no way to call them. Migration 051 turned each
one into a kit and dropped the table. A seasonal kit is frozen into the campaign
plan as its season (`plan.season`), which is what the designer and the image
engine already knew how to read.

**A kit sheet only changes when someone sends it to generate.** Filling in an
element does not redo it: it is the image the customer shows, not a mirror of
the form. The button says how many elements it will use («Usando 3 elementos»,
"Using 3 elements") and the previous sheet stays until Regenerate is pressed.

**The logo and the free style belong to the brand, not the kit.** A seasonal kit
inherits them from the main one. Giving each kit its own logo would force
deciding which one is "the" brand logo in ADN, and that is a materials-model
problem, not this screen's.

**ADN** (the brand's DNA; nav label «ADN de marca») is the menu entry for
everything Polyvik reads before writing or drawing anything, and what is
replicated in every piece. It used to be called "Marca", but there is more than
the brand inside — sections, catalogue, copywriting — and one of its tabs is
also called Marca. The Lab (Canvas, Editor) experiments; ADN is what is
inherited.

**The two halves of identity:** **Voz** (voice) is how it sounds and **Marca**
(brand) is how it looks (logo, colours, typefaces). **Visual** is something
else: the image materials the generator works with. (ADN → Voz is the brand's
written voice profile, not an audio voice.)

**Model image and Molde are the pair.** The model image supplies **how it
looks**; the Molde **suggests the layout**, with freedom to adapt spaces,
proportions and groupings to the content. The designer decides a final
composition; the engine does not receive the Molde's drawing. Explicit font,
palette and logo mode are respected. In English it is *layout*; "wireframe"
stays an internal term for the drawing, not another name in the UI.

**Marca says how it looks; Visual, what it is built with.** That is the line
between the two tabs, and everything that teaches the look lives together, in
order of authority:

| What | Where | What it lends | When it travels |
|---|---|---|---|
| **Brand board** | ADN → Marca | Colours and fonts; no other written layout instruction is extracted | As an image, unless there is a model image |
| **Imagen modelo** | ADN → Marca | Medium, light, finish and treatment | One selected; respects explicit font, palette and logo |
| **Ejemplos de tu estilo** (style examples) | ADN → Marca | The look. No roles: they do one job | Only if there is NO model image: they are its fallback |
| **Moldes** | ADN → Visual | Suggested spaces, proportions and margins | One per piece, by rotation, read by the designer |
| **Biblioteca** | Its own page | Concrete subjects | Never on their own: with `@` or pinned in Ajustes → Piezas |

**Feed → Library is a user choice.** Saving keeps the image, not its prompt or
generation notes. Labels organise General without duplicating files. Approved
pieces are a separate archive: approving does not turn the image into an
automatic material or a layout. Only General feeds candidates and mentions;
approved images can be chosen explicitly in the Lab. More in
[feed and library](../image/feed-and-library.md).

The first three used to be spread across three places — the model image in
Ajustes → Piezas, the examples in Visual, the board in Marca — and all three say
the same thing. In Marca they go in cause-and-effect order: on top what Polyvik
LOOKS AT (board, logo, examples) and below what it EXTRACTS from looking
(palette and typography). The identity analysis reads them together: the board
rules and the references fill in what it leaves unclear.

**The note on an example is written by the AI.** The wand describes it — how it
looks, never what it shows — and that description is saved as its note: it is
what travels attached to the image when the engine uses it, and what the
identity analysis reads. It can be corrected by hand: the AI writes it, the
customer decides.

**The writer works with the brand's audience and voice**, and also writes the
text that goes on the image. The designer sees the model image and reads the
Molde to decide a final composition. The board analysis extracts colours and
fonts; no other written layout instruction.

**The table and the API route stay `brand_series` and `/api/series`.** Renaming
them was churn with no gain, and there is precedent: `brand_references` is what
the customer reads as Inspiración. What the customer sees says «sección».

**A tab earns its place by WHOM it feeds.** Voz holds everything the writer
reads — the company, tone, rules, copy pool and inspiration; Marca and Visual,
everything the image engine sees. Copywriting once had its own tab and
Inspiración was a pill inside Visual: in both cases you had to touch two screens
to fix one thing, how the brand sounds. And a link to a post that is only read
as text has no business on the images screen.

## Banned words

Each already has its name in the table above. Using them reopens the ambiguity:

| Do not write | Write |
|---|---|
| Posts aprobados (when talking about reusable arrangements) | Moldes |
| Referencias de estilo | Referencias de marca |
| Referencias fijas | Materiales fijos |
| Plantilla (for the blog or a landing) | Diseño |
| Tema · Temporada (to dress a campaign) | Kit de temporada |
| Assets | Materiales |
| Materiales (for the tab) | Visual |
| Marca (for the menu entry) | ADN |
| Serie | Sección |
| Plantilla · retícula | Molde (the object) · acomodo (what it lends) |
| El look de tu marca · ancla | Imagen modelo |
| Referencias de marca | Ejemplos de tu estilo |
| Ajustes de piezas | Piezas |
| Guion (for a campaign's list) | Propuestas |
| Sending a scheduled piece back to review (edits or reschedules; nothing is lost) | Reabrir (reopen) |
| What a campaign, piece or day of AI cost, per call | Consumo (usage: campaign → Consumo; Ajustes → Consumo) |
| Encargo | Brief (what the customer writes in New campaign: what it is about) |
| Otra idea | Editar propuesta (Nueva idea adds a user-written proposal) |
| Activar campaña · Crear las piezas | Generar pieza (per card), then Aprobar y programar |

## Rules so the mistake is not repeated

1. **A concept lives on a single page.** If it appears on another, it is
   read-only with a line saying where it is managed. Templates used to be
   edited in Piezas but shown in Visual: that is why nobody knew where to delete
   them.
2. **The i18n block is named after the concept.** If you are about to write a
   key in a block that does not match, a name is wrong somewhere.
3. **Editing and requesting changes are not the same, and both are needed.**
   Editing fixes THAT piece, immediately. Requesting changes redoes it and
   teaches the brand. When an edit is saved, Polyvik offers to turn it into a
   rule: it is the only thing that avoids fixing the same thing every month.
   The model may decide there is no rule to extract — a typo teaches nothing —
   and then it says so.
4. **A campaign is worked on a single screen.** Each proposal generates its
   real piece with **Generar pieza**. **Aprobar y programar** schedules that
   same result and makes the campaign active. **Nueva idea** adds a proposal;
   **Configurar campaña** changes the brief without replacing what was
   generated; **Regenerar campaña** asks for confirmation, replaces what is
   pending and keeps scheduled/published pieces, Feed images and history.
5. **An account has several brands.** The `brandId` travels in every request,
   so it is client data: every endpoint that writes passes it through
   `assertBrandOwned` (`src/utils/brandGuard.js`). In the panel, switching
   brand remounts the tree (`key={brand.id}`): no screen keeps data from the
   previous one.
6. **Before naming something new, look it up here.** If the name already exists
   for something else, pick another — do not reuse it "because it is clear in
   context".
7. **Renaming means changing both languages**, long prose included: help
   paragraphs are where old names survive.

## The menu

Each entry is the door to a flow. Everything else is tabs inside.

| Section | Entry | Tabs |
|---|---|---|
| — | Hoy (home) | — (pieces to approve, guided start, active campaigns, connections) |
| — | Calendario | — |
| Contenido | Feed | — (generation history, selection for the Library; create images/video from here) |
| Contenido | Campañas | — |
| Contenido | Canvas | — |
| Contenido | Editor | — (only with Video on) |
| Contenido | Blog | — (only with Blog on) |
| Contenido | Eventos | Eventos · Correos (only with Events on) |
| Tu marca | ADN de marca | Voz · Marca · Visual · Secciones · Catálogo (Company, Copywriting and Inspiration live inside Voz) |
| Tu marca | Biblioteca | General · Personaje · Lugar · Objeto · Producto · Piezas aprobadas |
| Tu marca | Ajustes de marca | Piezas · Conexiones · Funciones · Consumo (+ hidden «Llaves de IA» for the owner) |

There is no sidebar: a single top bar holds the logo (left), the **brand
switcher** and the text-only links (center), and the plan chip, notification
bell and **avatar menu** (right: Mi cuenta, Plan y pagos, Cerrar sesión).

**Settings belong to the brand; My account is yours.** Everything that changes
when you switch brand — voice, pieces, connections, materials — lives in ADN and
Settings. What does not change — language, your data, your session — lives in My
account. If in doubt where something goes: would it look different with another
brand active?

**Approving is not a place.** It is a state of pieces: it lives on Home and
inside each campaign. Putting it in the menu was treating a state as a page.

## Page system

- **A real header** on every page: title, one line saying what is done here,
  and the main action on the right. Never a button floating alone.
- **A single level of tabs.** Inside a hub, the active tab's action is mounted
  in the tab bar itself (`HubActionContext`). A filter inside a tab is compact
  pills, not another bar.
- **Tabs end with a "Next step"** (`hubs.nextStep`) towards the following one in
  the onboarding: Voz → Marca → Visual → Secciones → Catálogo → Piezas →
  Conexiones → first campaign. Saving is never a dead end. An optional hint
  line under the bar comes from `hubs.*.hints`.
- **Warn, do not block.** Before generating and scheduling a campaign, what is
  missing (voice, catalogue, connection per network) is listed with links
  (`PreflightNote`, i18n block `activateCheck`). In the campaign wizard, links
  open in a new tab: leaving would drop the draft.
- **Help is folded** behind a "?" next to its section title
  (`SectionTitle help=`). Never an always-open grey paragraph, never a loose "?"
  with no title beside it.
- **Sans for labels, mono only for data** (dates, pixels, ids). Uppercase mono
  everywhere read like a developer tool.
- **Structured empty states**: title and what happens when you use it. The
  shape is a row with an icon, not a dashed box.
- **Visuals follow the [design guide](../panel/design-guide.md)**
  (`polyvik-panel/DESIGN.md`): tonal surfaces with discreet 1 px outline lines,
  pills. If a colour, radius or size is not there, it does not exist.

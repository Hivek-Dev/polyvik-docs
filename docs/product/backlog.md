# Backlog

State as of 26 Sep 2026, checked against the code. Update this file in the same
commit as the change that adds or closes an item. Finished items are removed,
not crossed out.

New features with their own spec (video canvas nodes, Google sign-in, team
invites, the parked Vik assistant and brand voiceover, …) are **not** repeated
here: see [new-features/README.md](../new-features/README.md).

Status tags:
- **Open** — to build or fix.
- **Decision** — needs a product decision before code.
- **Verify** — built and tested with mocks; not yet seen end to end with the
  real model, real money or a real account.
- **Blocked** — waiting on something outside the code.

---

## Built but switched off

Things in the repo the customer does not see. **None of this is deleted: each
is switched off in one place**, so turning it on is changing a value, not
rewriting the panel. If one of these shows up on a screen, that is a bug.

| Feature | Switched off in | What is missing to turn it on |
|---|---|---|
| Online billing (Stripe) | `FREE_BETA` in [`plans.config.js`](../../../polyvik-core/src/services/plans.config.js) | [Payments](#payments) |
| Own keys not spending credits | `OWN_KEYS_SKIP_CREDITS` in the same file | owner says "production" |
| Blog and Events | `brands.features.blog` / `.events`, per brand (Settings → Features) | [end-to-end check](#verifications) |
| Video editor in the nav (`/lab/editor`) | `brands.features.video`, per brand | nothing; the flag turns on by itself with the brand's first video from `/video/create` |

---

## Payments

Built and closed by `FREE_BETA` (see [Plans and credits](plans-and-credits.md#8-payments-built-closed-by-free_beta)).

- **Blocked** — Open the Stripe account, set `STRIPE_SECRET_KEY` and
  `STRIPE_WEBHOOK_SECRET`, register the webhook endpoint and enable the portal
  ([deployment](../architecture/deployment.md)).
- **Verify** — A real test-mode payment end to end: subscribe, buy 10
  iterations, cancel. Tests use a fake Stripe.
- **Decision** — What happens to accounts that are on Enterprise without paying.

## Plans and credits

- **Open** — Staff console as a screen. Today it is API only (plan per tenant,
  grant, `GET /api/admin/plan-requests`, usage).
- **Open** — The worker does not refund the iteration when "Request changes"
  fails after its 3 attempts (`generation.services.js`, `MAX_ATTEMPTS`).
- **Open** — "Request changes" from Home / Calendar (`RejectModal` via
  `CalendarDialogs.tsx`) shows the no-balance message without a buy button;
  Campaign and Canvas already use `QuotaNotice`.
- **Open** — Set `PLAN_REQUESTS_EMAIL` on the server if extra requests should
  arrive by email.
- **Decision** — Whether the customer keeps seeing US$ cost in Settings →
  Usage (see [Plans and credits](plans-and-credits.md#10-open-decisions)).
- **Decision** — Legacy `tenants.limits.posts_month` is still read by
  `campaignIdeas.services.js` to trim pieces, but new accounts are created with
  empty `limits` and the plan table is the real cap. Remove the legacy check or
  document it as a staff override.

## Multi-brand

An account can have several brands, with the switcher in the header and
`brandId` checked on every write endpoint (`src/utils/brandGuard.js`).

- **Decision** — Monthly campaigns are counted per account, not per brand
  (`quota.services.js`). Three brands eat the same allowance. Per-brand quota,
  or per account and split by hand?
- **Open** — Name, email and password cannot be changed: no endpoint exists
  (`/api/me` only handles the avatar). The Account page shows them read-only
  and says so.
- **Open** — On asset upload, `eventId` is not checked against the brand
  (`assets.services.js`, `upload`): an asset can hang from another brand's
  event within the same account.
- **Open** — `PATCH /api/pieces/:id` (`pieces.services.js`, `edit`) checks the
  tenant, not the brand. Within one account a piece of another brand can be
  edited by id. Not a cross-account leak, but it breaks brand isolation.

## Campaigns and calendar

- **Open** — The calendar month is assembled in the panel
  (`useCalendarMonth.ts`: one call per campaign, plus blog, events and emails).
  With many campaigns, a core `GET /api/calendar?from=&to=` returning the four
  layers at once would be better.
- **Open** — Moving a piece does not check schedule clashes:
  `PATCH /api/pieces/:id` stores whatever date it gets.
- **Open** — Cannot change a piece's materials from "Edit" (`PieceStudio`);
  only from its idea before the piece is created.
- **Open** — Configure piece settings with AI plus a **gallery of voice
  personality archetypes** (customer idea: many do not know what tone they
  want; offer ready-made personalities with samples, selectable and
  adjustable, combined with templates on the visual side).
- **Open** — A **library of common sections** to browse, add and customise,
  never imposed at brand creation. Today sections come from "Let Polyvik
  propose them" or **Repeat** on an approved idea. Same pattern as the
  personality gallery: a catalog you take from, not an inheritance.
- **Open** — "Generate profile with AI" does not propose **Why it publishes**
  (`voice.purpose`); the customer writes it by hand.
- **Risk** — A campaign's ideas come from a single model response: cap 40
  ideas, `maxTokens` 8192 (`campaignIdeas.services.js`). A three-month,
  three-channel campaign could return fewer ideas than slots; slots are filled
  as far as they go and it does not fail, but nobody has seen it happen.

## Image engine

Details: [image engine](../image/image-engine.md), [text composition](../image/text-composition.md).

- **Open** — Blog images do not go through the designer: the blog uses
  `applyPolicyPrompt` only, so no seven-section brief, no logo mode.
- **Open** — Only the first family in `palette.fonts` is used
  (`selectedFontNote`). The board detects several; the rest are stored unused.
- **Open** — Catalog items' `images` and `attrs` (`catalog_items`) are stored
  but never reach the generator; only name, description and price do.
- **Verify** — Template variety: in the 22 Sep QA run, 4 of 5 pieces picked
  "band at the bottom".

## Brand kit

Details: [brand kit](brand-kit.md).

- **Open** — Version and approval: store the kit version used by each
  generation, mark a sheet as outdated when its data changes, separate
  "generated" from "approved", and flag affected applications for review when
  inputs change.
- **Open** — Export: a package with the original logo, palette with codes and
  uses, type data and full rules, plus a manifest (version, date, materials).
  Font files only if their licence allows distribution.
- **Open** — Result review: presence of the supplied data, legibility of text
  and codes, contrast computed from stored values (a ratio drawn inside an image
  proves nothing), no duplicated or invented logos in the scene.
- **Open** — Fix one application alone, without redoing or charging all.
- **Open** — Seasonal kit typography and guidelines do not reach piece
  generation; only name, colours and motifs do (`campaignPlan.services.js`).
- **Open** — Logo and look per kit (today they belong to the brand).
- **Verify** — Full sheet chain and the logo's transparent background against
  OpenAI. If the model rejects `background: transparent`, it retries opaque and
  the logo would come out on a painted background.

## Video

Details: [video generation](../video/video-generation.md), [provider change](../video/provider-change.md), [Replicate video](../video/replicate-video.md).

- **Blocked** — Switch production to Replicate. ArgoLink resells Dreamina (burnt-in
  "AI" badge, hours without capacity) and stays for development only. The
  Replicate adapter exists (`replicateVideo.services.js`); `VIDEO_PROVIDER`
  still defaults to `argolink`. Needs `REPLICATE_API_TOKEN` and
  `VIDEO_PROVIDER=replicate` in production.
- **Verify** — Browser test with real money for each model, including the
  finish. The integration was tested with a real database and a fake provider.
- **Open** — Instagram and TikTok publishing. Polyvik only publishes to LinkedIn
  (`src/adapters/`): vertical video has no automatic outlet, so there are no
  video pieces in campaigns.

## Panel

- **Open** — Design system migration, page by page, to the DNA style (outline
  borders, quiet backgrounds, pills with icons); see
  [design guide](../panel/design-guide.md). `--color-line` is still defined as
  `transparent` so the ~60 remaining `border-line` uses do not paint; remove it
  with the last one, screen by screen during the DNA migration. The Canvas
  (`msui.tsx`, `canvas.css`) is still pending.
- **Open** — Canvas and Create image (`/feed/create`) have no "Save to
  Library": the user has to go to the Feed. *(QA 22 Sep)*
- **Open** — The model-image picker offers the kit's logo proposals, because
  they are stored as `other` assets ("Logo propuesto N"). *(QA 22 Sep)*
- **Open** — A dark logo is barely visible on its dark card in DNA → Brand (no
  contrasting or checkerboard background), and logo proposals show as white
  while loading. *(QA 22 Sep)*
- **Open** — In New campaign the template (molde) thumbnails render white; the
  templates manager inverts Polyvik's drawn templates for dark mode, the
  campaign picker does not. *(QA 22 Sep)*

## Security and hardening

- **Open** — Public event registration
  (`POST /api/public/events/:slug/register`) has no rate limit.
- **Open** — Event slugs are unique per brand, not globally; the public lookup
  without a brand parameter can match another brand's event with the same slug.

## Verifications

Built and deployed, but the real path has not been run end to end.

**With the real model:**
- Learned rules from an edit (`POST /api/pieces/:id/learn`) are as good as the
  ones learned from a rejection. Text rejections merge into `feedback_digest`
  (editable in DNA → Voice); image feedback is intentionally not learned.
- Campaign ideas: "Try" and the final piece tell the same idea; an idea written
  by hand is respected as is; subjects do not repeat families.
- Director memory (`brand_ideas`): with the list of past ideas in the prompt,
  the model actually changes idea.
- Model images rotate: four pieces of one campaign come from four different
  model images, and with none, the look images rotate one per piece.
- Brand taste comes from Voice and `voice.purpose`: try a sales-driven taco
  shop, a cheerful influencer and a sober law firm. Known risk: without a
  written Voice the model falls back to generic marketing; the answer is to ask
  for the Voice, not to bring back fixed aesthetic rules.
- Logo modes `scene` (carried by an object, following its perspective) and
  `watermark` together with text in the image. `lockup` was checked in the
  22 Sep QA run.
- A fixed Character reference reproduces the real character, not one invented
  from its name; a template lends its grid and no subject.
- Kit sheets accompanying pieces (`kitBoardForPieces`) make two pieces share
  panels and borders.
- Brush retouch end to end against OpenAI from the server (tested with mocks,
  the browser against a mocked API, and by hand).

**Other:**
- Blog images with the image policy: one article generated end to end.

## Decisions to remember

In case someone questions them later:

- **Blog heroes have no text in the image.** The title lives in the HTML.
- **The blog does not inherit template rotation.** Templates are social-piece
  grids, not article covers.
- **A campaign's plan is frozen at creation.** Changing global settings in
  October should not repaint an August campaign. Exception: model images and
  templates are read live on every piece (`settingsForCampaign`), because they
  are identity, not recipe.
- **`layout` is not a gallery tag.** It is a role exclusive to templates.
- **No learning from image rejections.** The parallel `image_feedback_digest`
  was dropped (migration 037): the brand already states its look through its
  art directions, palette and anchored look, which the customer wrote and
  approved; model-inferred prose next to it would be a second authority.
- **No starter sections.** The six old pillars were deleted; a brand starts
  empty and creates its own.
- **Image provider.** Pieces and the kit always use OpenAI
  (`PIECE_PROVIDER`); the server opens only `IMAGE_PROVIDERS_ENABLED=openai`.
  Gemini and Flux code stays, reopened by adding their names to that variable.
  An account with its own key can choose its own engine, and Seedream (via
  Replicate) can be requested per generation when a Replicate key exists.
- **Image sizes: only what OpenAI draws.** GPT Image 2 limits (sides multiple
  of 16, ratio 1:3–3:1, max side 3840 px, total 655,360–8,294,400 px) are
  computed by `openaiSizesFor` in `imageGenerator.services.js` and sent to the
  panel per aspect (`sizesByAspect`); sizes outside them are not offered.
- **No editorial finish in production** (`lite` profile); see
  [Plans and credits](plans-and-credits.md#5-the-numbers-behind-it).

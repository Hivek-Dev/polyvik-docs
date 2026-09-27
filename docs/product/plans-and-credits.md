# Plans and credits

What Polyvik sells, what each plan includes, what every action costs, and where
the code enforces it. Source of truth: [`plans.config.js`](../../polyvik-core/src/services/plans.config.js)
(`PLANS`, `MONTHLY_CREDITS`, `CAMPAIGN_ALLOWANCE`, `EXTRAS`, `FREE_BETA`,
`OWN_KEYS_SKIP_CREDITS`) and [`quota.services.js`](../../polyvik-core/src/services/quota.services.js).
If this page and the code disagree, the code wins; fix the page.

Related: [AI usage and costs](../architecture/ai-usage-and-costs.md) ·
[Brand kit](brand-kit.md) · [Backlog](backlog.md) · [Deployment](../architecture/deployment.md).

---

## 1. Current state (Sep 2026)

- **Open beta: everything costs zero and Stripe is closed.** `FREE_BETA = true`
  serves the catalog at price 0, lets the customer **pick** a plan that applies
  immediately (`POST /api/plan/select`), and makes `stripe()` refuse before it
  opens a client. Setting it to `false` brings back list prices and Checkout
  with no other change. The plan still decides campaigns per month, brand
  limit and whether AI is open.
- **Free has no AI.** Every account starts on Free.
- **Own keys (BYOK) still spend credits** while `OWN_KEYS_SKIP_CREDITS = false`
  (development), so consumption can be measured. In production it will be set
  to `true`; then spend covered by the customer's own key is recorded
  separately (`source = own`) and not deducted. The cut is per spend type: if
  Polyvik supplies the key for that kind of spend, Polyvik charges.

## 2. The model in one sentence

**We sell campaigns, plus a monthly pool of credits.** Each plan includes N
campaigns per month (each with its new pieces included) and four monthly
credit pools shared across everything: **iterations**, **images**, **AI
assists** and **video**. Pools reset on the renewal date; unused credits do not
roll over. Top-ups are bought as extras, which never expire. We do not sell
tokens or seats.

(Before 23 Sep 2026 each campaign carried its own 24 iterations that died with
it. It was confusing, and at full use the plans lost money. It was replaced by
the shared monthly pool.)

## 3. Plans

List prices (served at 0 during the beta):

| Plan | Price | Brands | Campaigns / month | Iterations | Images | AI assists | Video credits |
|---|---|---|---|---|---|---|---|
| Free | US$0 | 1 | 0 | 0 | 0 | 0 | 0 |
| Starter | US$49 | 1 | 2 | 20 | 20 | 60 | 0 (extras only) |
| Growth | US$129 | 3 | 5 | 60 | 60 | 150 | 12 (≈4 clips of 5 s) |
| Agency | US$199 | 5 | 8 | 90 | 100 | 250 | 15 (≈5 clips) |
| Enterprise | quote | no cap | no cap | no cap | no cap | no cap | no cap |

Extras (do not expire):

| Extra | Price | Our cost | Margin |
|---|---|---|---|
| One campaign (its 12 pieces) | US$29 | ~US$8.5 | ~70 % |
| 10 iterations | US$9 | US$6.2 | ~45 % |
| 30 iterations | US$25 | US$18.6 | ~34 % |
| 100 iterations | US$75 | US$62 | ~21 % |
| 15 video credits (≈5 clips) | US$7 | US$5.85 | ~20 % |
| 45 video credits (≈15 clips) | US$19 | US$17.55 | ~8 % |

Staff can override a tenant through `tenants.limits`: `campaignsPerMonth`,
`maxBrands`, and `credits: { iteration, image, assist, video }` (read by
`planFor`). An unknown plan key counts as Enterprise, so a stale value never
blocks a customer. Changing plan does **not** reset the period.

### Free: look, don't generate

Free lets the user sign in, browse the panel and build **one** brand by hand
(name, uploaded logo, colours, written voice). Everything that calls AI is
closed: campaigns, pieces, Canvas, image and video creation, characters, kit,
blog. The core answers `402 quota_plan` (`requireAi` in
`middlewares/plan.middleware.js`, or the credit middleware) and the panel
redirects to **Plan** (`/plan`) with the notice on top, rather than explaining
the block where it happened. Buttons are not hidden.

Exception in `assertAiAllowed`: a Free account with its own text and image
keys passes the AI gate (`usesOwnKeys`). While `OWN_KEYS_SKIP_CREDITS = false`
it still needs credits, which Free does not have, so in practice it is blocked
until that flag flips.

Cancelling a subscription
returns the account to Free; everything bought and generated is kept.

## 4. What each thing includes and what it costs

**A campaign** includes:
- The brief and the director's proposals.
- Up to **12 new pieces** (copy, design, image); the first generation of each
  is included (`CAMPAIGN_ALLOWANCE.generations`).
- 3 proposal regenerations (`CAMPAIGN_ALLOWANCE.proposals`).
- Scheduling and publishing to connected channels.

The campaign is consumed **when proposals are made** (the first AI call), once.
If the AI call fails, it is refunded. Deleting a draft that already has
proposals does not refund it.

**Iteration** (monthly pool, shared by all campaigns):
- Regenerate the image, or copy + image, of any piece.
- A new piece beyond the campaign's 12.
- Regenerate proposals from the 4th time on.
- Request changes on a piece (reject), or create a manual piece without copy.

**Image** (monthly pool): each image generated, extended or retouched in the
Canvas, the image creation page or the Feed/piece editor; each kit sheet; the
kit logo (2, because it proposes two options) and look; each character image;
an event cover; blog images.

**AI assist** (monthly pool): profile assistant, board analysis, kit palette /
font / rules, template extraction and "Use as template", describing materials,
proposing sections, learning from an edit, Canvas directives and their names,
character bible, blog topics and articles.

**Video** (monthly pool): credits worth US$0.39 of cost each
(`ITERATION_VALUE_USD`); a 5 s 720p clip is 3 (`VIDEO_CREDITS_PER_CLIP`). The
cost is `ceil(estimated USD / 0.39)`, shown before the request. The house
monthly cap `VIDEO_MONTHLY_BUDGET_USD` still applies on top.

**Rules:**
- Everything is charged **before** calling the AI and refunded if it fails.
- When a pool runs out: iterations, images and assists draw from extra
  iterations (1:1); video draws from video extras. With no balance: 402 with
  the reason and the renewal date.
- Editing text by hand costs nothing.

## 5. The numbers behind it

**Measured 23 Sep 2026** from 14 days of `generation_logs` (Claude Opus 5 at
US$5/25 per M input/output tokens; gpt-image-2.5 at list price plus reference
images):

| Call | Avg tokens (in / out) | Cost |
|---|---|---|
| Editorial finish (`publication_finish`, ~1.6 per piece) | 12,061 / 3,657 | US$0.16 |
| Design (`image_brief`) | 11,096 / 3,316 | US$0.155 |
| Copy (`copy`) | 4,023 / 2,159 | US$0.08 |
| Integrated text re-read (`image_text_check`) | 2,394 / 235 | US$0.02 |
| Campaign proposals (`campaign_ideas`) | 4,398 / 3,075 | US$0.13 |
| Image (gpt-image-2.5) | — | ~US$0.18 |

| Unit | Cost (baseline) |
|---|---|
| New campaign piece | US$0.70 |
| Campaign iteration (no new copy) | US$0.62 |
| Standalone image | US$0.18 |
| AI assist | ~US$0.07 |
| Video credit | US$0.39 (5 s 720p clip: US$0.85) |
| Campaign (proposals + 12 new pieces) | US$8.53 |

**Plan cost at 100 % use** (target ~20 % margin; typical 50–60 % use leaves
much more):

| Plan | Campaigns | Iterations | Images | Assists | Video | Total cost | Price | Margin |
|---|---|---|---|---|---|---|---|---|
| Starter | 17.1 | 12.4 | 3.6 | 4.2 | 0 | **US$37.3** | US$49 | 24 % |
| Growth | 42.7 | 37.2 | 10.8 | 10.5 | 4.7 | **US$105.9** | US$129 | 18 % |
| Agency | 68.2 | 55.8 | 18.0 | 17.5 | 5.9 | **US$165.4** | US$199 | 17 % |

**AI profiles (24 Sep 2026, `llmTasks.config.js`).** Measured by regenerating
one real campaign:

| Profile | What changes | Copy per piece | Full piece |
|---|---|---|---|
| `baseline` (tag `llm-baseline-2026-09-23`) | Opus 5 everywhere, high effort, finish with a second pass | US$0.52 | ~US$0.70 |
| `lean` | Opus 5.5, medium effort on design and finish, Haiku for mechanical tasks, one-pass finish, layered 5-min cache | US$0.29 | ~US$0.47 |
| **`lite` (production)** | `lean` + Sonnet 5 designer and **no editorial finish** with integrated text | **US$0.13** | **~US$0.31** |

The editorial finish was removed (owner's decision): with integrated text the
image model recomposes the text anyway, the finish reviewed on grey without
seeing the photo, and it was not reliable on facts. If a piece does not work,
the user regenerates it. With `lite`, the margins above are conservative.

**Caveats.**
- Image cost is list price plus references: reconcile a week of OpenAI and
  Anthropic invoices against this table before leaving the beta.
- To re-measure: the "Reporte de generaciones" workflow in polyvik-core prints
  average tokens per call type for the last 14 days. Details in
  [AI usage and costs](../architecture/ai-usage-and-costs.md).

## 6. Where it is enforced

Every charge point checks the balance **before** calling the AI.

| Customer action | Deducts | Where | No balance |
|---|---|---|---|
| Anything that calls AI, on Free | nothing: refused | `requireAi` or `credit()` | 402 `quota_plan` → Plan page |
| Make proposals for a new campaign | 1 campaign of the month | `chargeCampaign` | 402 `quota_campaigns` |
| Generate a piece (first time, up to 12) | nothing, included | `chargeGeneration` | — |
| Regenerate, piece 13+, request changes, manual piece without copy | 1 iteration (month pool, then extras) | `chargeGeneration` → iteration pool (same transaction that locks the campaign) | 402 `quota_iterations` |
| Regenerate proposals | free up to 3, then 1 iteration | `chargeProposals` | same |
| Canvas / image creation / retouch, kit sheets and logo/look, event cover, blog images, characters | 1 image each (kit logo: 2) | `credit("image")` (`middlewares/credit.middleware.js`), `withCredit` / `chargeCredit` in services | 402 `quota_credits` (`kind: image`) |
| Profile assistant, board, kit palette/font/rules, templates, describe, sections, learn, directives, blog topics/articles, character bible | 1 assist | `credit("assist")` or `withCredit` | 402 `quota_credits` (`kind: assist`) |
| Video | `ceil(cost / 0.39)` video credits | `chargeVideo` → `chargeCredit("video")` | 402 `quota_credits` (`kind: video`) |
| New brand beyond the plan | — | `assertBrandAllowed` | 402 `quota_brands` |

Storage: monthly consumption lives in `credit_usage` (one row per charge, a
negative row per refund; `source` = `plan`, `extra` or `own`). Extras live in
`plan_ledger` (kinds `iteration`, `campaign`, `video`). Each campaign keeps its
own counters (`campaigns.quota`: generations, proposals, and how many pool
iterations it used).

## 7. Endpoints

| What | Endpoint | Returns |
|---|---|---|
| Tenant plan | `GET /api/plan` | plan, catalog, billing (`beta`, `online`, subscription), period, campaigns (used/included/extra), month iterations (used/included/extra), `credits`, `campaignUsage`, brands (active/max), allowance, extras |
| Campaign quota | `GET /api/campaigns/:id` → `quota` | generations, proposals, month iterations, `campaignIterations`, `proposedAt` |
| Public catalog | `GET /api/public/plans` | plans with price (0 in beta), list price, monthly credits, brands, campaigns, `ai`; used by `/signup` |
| Pick plan without paying | `POST /api/plan/select` `{ plan }` | beta only; with billing open → 409 `billing_required` |
| Sign-up | `POST /api/auth/register` | user, tenant (chosen plan in beta; Free with billing open), token, `wants` |
| Request an extra | `POST /api/plan/request` | creates a `plan_requests` row; emails `PLAN_REQUESTS_EMAIL` if set |
| Stripe | `POST /api/plan/checkout`, `/checkout-extra`, `/portal`; webhook `POST /api/webhooks/stripe` | see §8 |
| Staff: tenants | `GET /api/admin/tenants` | includes plan summary, price and margin |
| Staff: plan | `GET` / `PUT /api/admin/tenants/:id/plan` `{ plan, limits: { campaignsPerMonth, maxBrands, credits: { iteration, image, assist, video } }, periodStart }`. `limits` **merges** into what is already set: a missing field is kept, `null` clears a field or a credit kind (back to the plan value), and `limits: null` clears every override. Self-serve plan changes and Stripe events reset overrides with `limits: null`. | updated plan |
| Staff: grant extras | `POST /api/admin/tenants/:id/grant` `{ kind: iteration \| campaign \| video, delta, note, requestId }` | updated plan |
| Staff: pending requests | `GET /api/admin/plan-requests` | requests |

Tenants that existed before plans were introduced were left on Enterprise (no
cap) until staff assigns a plan.

## 8. Payments (built, closed by `FREE_BETA`)

Stripe charges; the plan stays in `tenants.plan` and extras in `plan_ledger`.

- **Subscribe:** Checkout in subscription mode (`POST /api/plan/checkout`).
  With an active subscription, plan changes happen on the same subscription,
  prorated.
- **Extras:** one-off Checkout (`POST /api/plan/checkout-extra`); the webhook
  credits the ledger with `reason = purchase`.
- **Portal** (`POST /api/plan/portal`): card, invoices, cancel.
- **Webhook:** signature checked on the raw body; each event applied once
  (`billing_events`). Events: `checkout.session.completed`,
  `customer.subscription.updated/deleted`, `invoice.paid`,
  `invoice.payment_failed`. `invoice.paid` resets `plan_period_start`.
- Stripe prices are created automatically by `lookup_key` (`STRIPE_LOOKUP`)
  from `plans.config.js`; nobody edits prices in the Stripe dashboard.
- Without `STRIPE_SECRET_KEY` the panel falls back to manual requests and staff
  grants. Setup: [deployment](../architecture/deployment.md).

## 9. What the customer sees

- **Home and Plan:** brands active/max, campaigns of the month, iteration pool,
  credits, next renewal, buttons to get an extra campaign or iterations. On
  Free, the plan badge and Home card say "You are on Free" and link to the
  plans instead of showing 0/0 counters.
- **Inside a campaign:** an iterations pill (`IterationsPill`) with the month
  pool used/included (and extras when only extras are left). Buttons that
  draw show their cost; free actions show nothing. When dry, the button offers
  to buy iterations. Running out never blocks what is still possible (edit
  text, approve, schedule).

## 10. Open decisions

- **US$ consumption visible to customers.** Settings → Usage shows our dollar
  cost. With plans, customers should see credits, not our dollars: move it to
  staff, or keep it while Polyvik is the only tenant.
- **Leaving the beta:** Stripe account and keys, a real test-mode payment, and
  what to do with accounts on Enterprise that do not pay. Tracked in the
  [backlog](backlog.md#payments).
- Staff console as a screen (today API only) and the other plan gaps are in
  the [backlog](backlog.md#plans-and-credits).

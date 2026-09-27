# Replicate video and customer provider keys

How Seedance 2.5 on Replicate is wired, and how accounts bring their own provider
keys. The general video flow is in [Video generation](video-generation.md); why
Replicate was chosen is in [Provider change](provider-change.md).

## Company keys versus customer keys

Polyvik's server credentials power managed accounts by default. Customers can
optionally use their own provider accounts through AI keys; that page never manages
or exposes company-wide credentials. The selected customer video key wins over the
company default, and a failed customer key never silently spends the company
balance.

For deployment, set the repository secret `REPLICATE_API_TOKEN` for the company
credential and, when ready to select it, the repository variable
`VIDEO_PROVIDER=replicate` (`deploy.yml` accepts `replicate`, `google` or
`argolink`). The workflow leaves existing settings untouched if these are absent.
Company video is charged in video credits ([plans and credits](../product/plans-and-credits.md)).

While `OWN_KEYS_SKIP_CREDITS` is `false` (development, until Manuel says
"production"), customer-key video **still deducts credits** so real usage can be
measured; the provider bills the customer directly as well. With the flag on,
customer-key video deducts nothing and the catalog hides Polyvik's list prices from
that account, showing only relative cost. Either way it never counts against the
platform budget (`VIDEO_MONTHLY_BUDGET_USD`) and is logged at `cost_usd = 0`.

## Connecting a customer account

Account owners open Settings → AI keys → Add provider → Replicate, paste a token
from https://replicate.com/account/api-tokens and save. Verification calls
`GET /v1/account` only; it does not generate or bill a video. If another video
provider is active, choose **Use this one**. A first usable video key becomes active
automatically. Tokens stay in the existing encrypted, write-only tenant
configuration; only the last four characters are returned.

## What the adapter does

`replicateVideo.services.js` supports text-only, first-frame, and up to 30 image
references through the shared video queue:

- Requests `watermark: false`, MP4, optional audio (`generate_audio`), 4–30 s,
  480p/720p. Defaults: 5 s at 480p, 9:16.
- First-frame mode sends `aspect_ratio: "adaptive"`. A first frame and reference
  images **cannot be combined** (400).
- Reference images are re-encoded as JPEG **at most 768 px wide**
  (`referenceMaxWidth`). Wider inputs triggered E005 ("sensitive") at input
  validation, within seconds.
- `@Image N` in the shared prompt is rewritten to Replicate's `[ImageN]`.
- Video/audio references and editing are not exposed.
- The conservative full-prompt limit is 2,000 characters, including generated
  reference instructions and brand context.
- Output URLs must be `https` on `replicate.delivery`; the key is never forwarded to
  the CDN. Error bodies are never logged (they can echo inputs); `r8_…` tokens are
  masked in user-facing reasons.
- E005 / safety rejections get a hint: realistic photos of people as references are
  the usual cause. A realistic face only passed when small in frame (~96 px in a
  768 px-wide image); stylized characters and mascots pass. See
  [Video canvas](video-canvas.md#1-what-we-learned-first-hand).

The model page was checked on 2026-09-25:
https://replicate.com/bytedance/seedance-2.5
Non-video-input list rates: $0.1028/s at 480p and $0.2312/s at 720p. These are
estimates, not an invoice. Connecting a valid token does not verify billing
balance, model access or production eligibility.

Seedream 5 Pro images (`seedreamImage.services.js`) use the same Replicate key;
see [Image engine](../image/image-engine.md#who-draws).

## Operations

The worker must be running (`npm run dev:video` for video-only local development,
or the full `npm run dev:worker`, never both against the same database). It polls
even without a platform key. Jobs keep their provider and credential source
(`credentialSource: tenant | platform`) when the account changes its selected
provider. Deleted keys fail clearly (with a refund) and never fall back to Polyvik's
credentials. Only explicit rate-limit rejections (429) retry submission; a network
timeout or 5xx is ambiguous and requires checking the provider's Predictions
dashboard before submitting again. Status reads can retry without creating a
duplicate prediction.

For platform-owned credentials, configure `VIDEO_PROVIDER=replicate` and
`REPLICATE_API_TOKEN` on the backend; customer-key setups need neither. Restart or
deploy both API and worker after changing them. A frontend pointed at an older API
still receives the old provider catalog. The panel's `dev:local` script serves on
port 5174 against `localhost:4000`. See [deployment](../architecture/deployment.md).

## Adding another provider

1. Register its ID, capabilities, key validation, free verification endpoint and
   key-console URL in `aiProviders.config.js`.
2. Add a capability adapter before marking it usable. Video adapters implement
   `capsOf`, `estimateCost`, `uploadMedia`, `create`, `status` and `download`.
3. Register models with verified limits/rates in `videoModels.config.js`, and the
   adapter in the `REGISTRY` of `videoProvider.services.js` (plus `VIDEO_PROVIDERS`).
   Keep video reporting in `pricing.services.js` in sync.
4. Add a localized key placeholder and any provider-specific setup guidance.
5. Test authorization, encrypted storage, input/output mapping, billing failures,
   no-key fallback and safe retries. The Add provider dialog discovers the provider
   from the API catalog; no custom UI per entry.

Arbitrary API URLs are deliberately not accepted: incompatible APIs need an adapter,
and customer-entered destinations must never receive stored secrets
([security](../architecture/security.md)).

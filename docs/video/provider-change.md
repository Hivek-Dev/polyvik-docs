# Provider change: leaving ArgoLink

Researched on **17 Sep 2026**. Reason: ArgoLink burns an "AI" badge into videos,
goes down for hours, and resells Dreamina (risk of the account being closed).

**Status (26 Sep 2026):** the Replicate adapter is implemented and selectable
(`VIDEO_PROVIDER=replicate` or a customer Replicate key); see
[Replicate video](replicate-video.md). ArgoLink stays in the registry for
**development only** (`use: "development"`, with a notice not to use it with paying
clients). Google Veo is also registered. Current flow:
[Video generation](video-generation.md).

## Price of the same model, Seedance 2.5 (USD per second)

| Provider | 480p | 720p | 1080p | What it is |
|---|---|---|---|---|
| ArgoLink | 0.078 | 0.17 | 0.43 | Dreamina resale · "AI" badge |
| **Replicate** | **0.1028** | **0.2312** | **0.4304** | Official ByteDance partner |
| BytePlus ModelArk | 0.1028 | 0.2312 | 0.4304 | The official source; requires company onboarding |
| WaveSpeed | — | ~0.36 | — | Gateway |
| fal.ai | 0.2205 | 0.473 | ~1.16 | Gateway, the most expensive |
| Atlas Cloud | 0.134 flat | 0.134 | 0.134 | Unverified origin |

Sources: [fal.ai](https://fal.ai/models/bytedance/seedance-2.5/image-to-video),
[apiframe](https://apiframe.ai/models/seedance-2.5/pricing) (secondary, 20 Aug),
[cellcog](https://cellcog.ai/blog/seedance-2-5-pricing/) (secondary, 8 Sep),
[BytePlus ModelArk](https://docs.byteplus.com/docs/ModelArk/1099320).

**Replicate charges exactly BytePlus's official price, with no margin.** It is the
cheapest legitimate Seedance 2.5. It is **32–36% more expensive than ArgoLink** —
exactly what ArgoLink saves by using the consumer app instead of the enterprise API.
Polyvik's adapter exposes 480p and 720p only (rates re-checked 25 Sep 2026).

## The badge

On 17 Sep no provider documented whether output carries the "AI" badge, and none
documented a `watermark` parameter. The badge seen on ArgoLink is **Dreamina's**
(the consumer app), required by China's AI-content labeling law; the enterprise API
is a different product.

Since then, the Replicate model accepts `watermark`, and the adapter sends
`watermark: false`; the catalog records `badge: false`. Confirm on real output: a
4 s clip at 480p (~$0.41) and inspect the first frame plus the MP4's C2PA data.

## Cheaper than Seedance for development

When the goal is a working pipeline rather than top quality, fal.ai had models at
about half the price (16 Sep data): **Kling 3.0 Standard** at $0.126/s with audio,
3–15 s; **Wan 2.6** at $0.10/s at 720p. Not integrated.

## Decision

**Replicate.** Official, no margin over ByteDance's price, pay-as-you-go with no
minimum deposit or subscription, and a large catalog to fall back to another model
when one is full — the lesson of 17 Sep.

BytePlus ModelArk direct remains the end goal: same price without an intermediary.
Replicate is the bridge meanwhile. Costs and credits:
[AI usage and costs](../architecture/ai-usage-and-costs.md).

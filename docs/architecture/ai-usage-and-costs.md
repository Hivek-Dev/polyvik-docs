# AI usage: what we pay for, how it is measured, how it is lowered

Originally written on 2026-09-06 from that day's real Anthropic invoice (CSV) and
the code; updated with the AI profiles introduced on 2026-09-24. Numbers come
from those measurements; estimates say so. The current cost per piece and the
margin of each plan live in [plans and credits](../product/plans-and-credits.md)
(§4, "the numbers behind").

## Where things stand today

- **Text** runs on the `lite` profile (`LLM_PROFILE` in
  `src/services/llmTasks.config.js`): the writer (`copy`) and campaign proposals
  on Opus 5.5 with high effort; the designer (`image_brief`) on Sonnet 5 with
  medium effort; mechanical tasks (describing, naming, palette, font, re-reading
  the integrated text) on Haiku 4.5; layered 5-minute cache; **no editorial
  finish** (`publication_finish`) when the image model integrates the text.
- Measured on campaign 26: text per piece went from US$0.52 (`baseline`) to
  US$0.29 (`lean`) to **US$0.13 (`lite`)**; a full new piece is ~US$0.31.
- **Images:** OpenAI GPT Image 2.5 by default; Seedream 5 Pro via Replicate when
  asked for per generation.
- **Video:** Seedance 2.5 via Replicate; the cost comes closed per job
  (`generation_logs.cost_usd` = billed seconds × catalogue rate from
  `videoModels.config.js`).
- The previous state is preserved as the `baseline` profile and the git tag
  `llm-baseline-2026-09-23`.

## 1. What the 6 September invoice said (historical)

| Item | Tokens | USD | % of the money |
|---|---|---|---|
| Uncached input | 1.20 M | 6.00 | 26% |
| Cache write (5 min) | 0.67 M | 4.16 | 18% |
| Cache read | 0.78 M | 0.39 | 2% |
| Output | 0.50 M | 12.55 | 54% |
| Total | 3.15 M | 23.10 | |

Three readings, which drove everything below:

- **Output was 16% of the tokens and 54% of the money.** It costs five times
  the input. The output/input ratio stayed between 15% and 30% across fifteen
  hours: not one runaway call, but many calls thinking at maximum (everything
  ran at high effort, including naming an art direction).
- **The cache was broken by design.** The cached block contained the brand
  name, the campaign objective and the idea's angle. Each call wrote a new entry
  and almost never read an existing one. Writing cache costs 1.25× the input;
  reading it, 0.1×. Over the whole day the cache saved US$2.68 out of 25.78.
- **Images were not measured.** Provider, model and duration were logged; zero
  tokens. The cost was a fixed figure in the code.

## 2. Translations and language

There is no translation call in the pipeline. One existed
(`translate.services.js`, it translated style notes to English when saving
them) and was deleted on 2026-09-06. The three text agents conceive and write
directly in the brand's language; the only language crossing is the image
engine's prompt scaffold, which is in English because that is what image
models obey best, and it does not cost a separate call.

Writing the agents' instructions in English would save tokens (Spanish takes
25–35% more), but once the cache was split the instruction block is billed at
the cache-read rate: not a lever worth the risk of rewriting tuned prompts. Not
done.

**Decided since:** the designer writes `scene`, `rationale` and `treatments` in
the brand's editorial language, inside the English engine scaffold
(`imageDirector.services.js`).

## 3. What was built

### Measure everything that is billed

`generation_logs` stores, per call: uncached input, cache written and with which
TTL (`cache_ttl`: 5 min / 1 h), cache read, output, effort, model, campaign and
piece, success or error, and `reasoning_tokens_est`: how much of the output was
NOT visible delivery (text + tool arguments). The latter is a character-based
estimate; it is for deciding effort per task, not for billing. Images log the
tokens reported by the provider; video logs its closed `cost_usd`.

`pricing.services.js` computes cost from list prices captured by hand
(`TOKEN_PRICES_USD_PER_MTOK`), with the cache tiers (`CACHE_MULTIPLIERS`:
5-min write ×1.25, 1-h write ×2, read ×0.1; Opus 5.5 reads cache at 0.05×).
Images are billed per image and per model (`IMAGE_PRICES_USD`: a default plus
`seedream-5-pro`). Nothing syncs these prices: if a provider changes rates, edit
the file. The cost is computed on the fly, so a price change also applies to
history.

Reads, always scoped to the tenant:

- `GET /api/campaigns/:id/usage`: what a campaign cost, per piece and per call
  (failed attempts included — they are billed too).
- `GET /api/usage/daily?days=30`: per day and per call type.
- `GET /api/admin/usage` (staff only): per month, type and tenant, with cache.

In the panel: **Consumo** button on the campaign and the **Ajustes → Consumo**
tab.

### A cache that actually gets reused

The system prompt of the hot calls goes in layers (`systemBlocks` in
`llm.services.js`), from most fixed to most variable:

- **stable**: the craft, schemas, editorial rules. Same for every brand and
  piece. Cached.
- **brand**: this brand, its voice, its rules. Same for all its pieces. Cached.
- **variable**: this call's brief. Not cached.

A cache breakpoint covers everything before it (tools included), so order
matters. Images repeated across pieces (layout, model image) can close another
cache layer with `cacheBreak`. The designer's fixed instructions that used to
travel in every prompt were moved into the stable block. Cold calls (blog,
canvas, describing a photo…) go uncached: caching what does not repeat within
the TTL is overpaying. A campaign is generated in a burst, so the `lean`/`lite`
profiles use the 5-minute TTL — warm the cache before parallelising.

### Model and effort per task

`llmTasks.config.js` decides model, effort and cache per call type, grouped in
profiles (`baseline`, `lean`, `lite`). Rules: what the customer publishes
(campaign, post) stays at high effort until `reasoning_tokens_est` shows that
lowering it changes nothing; the mechanical tasks go to medium/low or to Haiku.
Haiku 4.5 does not accept `output_config.effort` (sending it is a 400;
`supportsEffort` handles it). **Moving a task to another model first requires
its price in `pricing.services.js`**; otherwise the cost is estimated with the
house price and nobody notices the difference.

## 4. What a piece costs

With `lite`, a new campaign piece is ~US$0.31 (text ~US$0.13 + image). The full
per-call table and plan margins are in
[plans and credits](../product/plans-and-credits.md) §4.

Calls per campaign piece (more with retries):

| Call | Model (`lite`) | Effort | Images in the input |
|---|---|---|---|
| `copy` | Opus 5.5 | high | no |
| `image_brief` | Sonnet 5 | medium | layout, model image |
| `publication_finish` | Opus 5.5 | medium | skipped when text is integrated |
| `image_text_check` | Haiku 4.5 | — | the generated image |
| image | GPT Image 2.5 (or Seedream 5 Pro) | — | references |

A designer failure costs a full call with images. Lowering the failure rate
saves more than switching models.

## 5. What is still open

1. **Read `reasoning_tokens_est` after a few days** of `lite` before lowering
   effort on the writer. Without that data, lowering effort on creative work is
   a gamble.
2. **Confirm the price per image of each model** against the OpenAI and
   Replicate invoices and put it in `IMAGE_PRICES_USD` (OpenAI still uses the
   default entry).
3. **Designer retries**: each one is a full call. Whatever lowers the failure
   rate (clearer validation, precomputed measurements) saves more than any model
   change.
4. **A better strategy for fact-checking and narrow-column headlines** now that
   the editorial finish is off in `lite`.

## 6. How to read cost without guessing

- Panel → campaign → **Consumo**: every call of every piece, with tokens and
  cost. A failed attempt shows in red: it was billed.
- Panel → Ajustes → **Consumo**: per day and per type, last 30 days.
- Staff console (`/api/admin/usage`): per month, type and tenant, with cache.
- The manual **generations report** workflow in `polyvik-core`
  (`generations-report.yml`) prints recent generations and average tokens per
  type over the last 14 days.
- To reconcile with the invoice: export Anthropic's CSV and compare against the
  sum of `input_tokens`, `cache_write_tokens` (by `cache_ttl`),
  `cache_read_tokens` and `output_tokens` for the same day.

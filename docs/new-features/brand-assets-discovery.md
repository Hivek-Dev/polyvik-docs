# Brand assets discovery (logo and real photos)

**Priority:** medium · **Effort:** M (about 4 to 5 dev-days) · **Status:** proposed

## Summary

Given a business name (plus an optional city, website or social handle), find its **official web presence**. Then harvest **logo candidates** and **real photos** (storefront, interior, product, signage) and check with vision that each photo really belongs to *this* business. The user gets ranked candidates to accept into the brand kit, instead of uploading everything by hand.

Monkey Studio built this for a single client's delivery-app flow (listing pages on the client's marketplace, blog-post slugs, city-slug heuristics). This spec keeps the **generic engine** and drops everything tied to that client.

## Why it matters for Polyvik

- The video canvas plan (§7, Brand DNA) calls for **"an onboarding step that imports the DNA from the brand's website"** and for **keeping official assets separate from inspiration**. This supplies the official assets: logo plus real photos, with evidence (the source URL) and a verdict.
- `websiteReader.services.js` already reads a site's **text** (with SSRF protection via `isBlockedIp`), but it drops images and icons. Discovery extends that.
- Real photos are better than generated ones as Element references (places, products), and a real logo is required for end cards (`small-gaps.md` §2).

## How Monkey Studio did it (generic parts)

### Pipeline

```
name (+city, +site, +handle)
  │
  ├─ A. discoverBrandSources: LLM + web_search → { domain, instagram, confidence }
  │
  ├─ B. Logo candidates (parallel)
  │     ├─ site:    extractLogoUrlsFromSite(https://<domain>/)
  │     ├─ social:  extractLogoUrlsFromSite(https://www.instagram.com/<handle>/)  (profile og:image)
  │     └─ favicon services on guessed domains (Google s2 favicons sz=256, DuckDuckGo ip3)
  │     → probeImage (content-type image/*, ≥800 bytes) → score → dedupe by domain → sort
  │
  └─ C. Photo candidates
        ├─ harvestImageUrls(site HTML, 'wide')
        ├─ probeImage (≥8000 bytes)
        └─ verifyHeroCandidatesWithVision (first 6, base64) → verified first by confidence, then by bytes
  │
  └─ cache 30 min per (name|city|url) key
```

**Logo scoring:** site = `900000 + bytes`; social = `800000 + bytes`; Google favicon = `50 + bytes`; DuckDuckGo = `30 + bytes`. Keep the best candidate per domain.

**Photo ranking:** photos verified as matches come first, sorted by confidence (`high 3 > medium 2 > low 1 > unknown 0`) and then by byte size. If none are verified (for example, vision was unavailable), return the unverified ones sorted by bytes, so the call always returns something.

**Domain guessing for favicons** (generic part): from the name, build a slug. Strip accents with `normalize('NFD')`, remove combining marks, and keep only `[a-z0-9]`. Then try `<slug>.com`, `<slug>.<cc>`, `<slug>.com.<cc>` for the country TLDs relevant to the tenant, with and without dashes.

### `probeImage` (verbatim logic)

```js
async function probeImage(url, { minBytes = 250, returnBuffer = false } = {}) {
  try {
    const r = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 <app>-logo-probe' } })
    if (!r.ok) return null
    const ct = r.headers.get('content-type') || ''
    if (!ct.startsWith('image/')) return null
    const buf = await r.arrayBuffer()
    if (buf.byteLength < minBytes) return null
    return { url: r.url, bytes: buf.byteLength, contentType: ct, buffer: returnBuffer ? Buffer.from(buf) : null }
  } catch { return null }
}
```

### Logo URL extraction (selectors, verbatim)

- `meta[property="og:image"]` content
- `meta[name="twitter:image"]` content
- `link[rel="apple-touch-icon"]` href
- every `link[rel*="icon"]` href
- `<img>` whose class matches `/logo|brand/` or whose alt matches `/logo/` (`src` or `data-src`)
- Blocklist of generic platform assets: `/(static\.cdninstagram\.com\/rsrc|fbcdn\.net\/rsrc|graph\.facebook\.com\/[^/]+\/picture)/i`

### Photo harvesting (`harvestImageUrls`)

- Always: `og:image`, `og:image:secure_url`, `twitter:image`, `twitter:image:src`.
- `'wide'` mode (the business's own pages): every `<img>` (`src`, `data-src`, `data-original`, `data-lazy-src`) plus the first URL in `srcset`/`data-srcset`.
- `'hint'` mode (aggregators, blogs): only `<img>` whose class, id or alt matches `/hero|cover|banner|header|background|interior|exterior|restaurant|store/`. Generalize this list to include `shop|product|team|office`.
- In both modes: inline `style` with `background-image: url(...)` (many sites render hero shots as div backgrounds).
- Resolve everything against the final URL after redirects; keep only `http(s)` URLs; dedupe.

### Source-discovery prompt (generalized from the original)

The original used Claude Sonnet with the `web_search_20250305` tool (`max_uses: 5`, `max_tokens: 1024`):

```text
Find the official online presence for the business "<name>"<, located in <city>>.<It is referenced at: <url>.>

Search the web for their official website domain and Instagram handle. Be specific to this exact business (not a chain with the same name, unless this is genuinely a chain location).

Return ONLY a single JSON object as the last line of your response:
{"domain": "example.com", "instagram": "handle_without_at_symbol", "confidence": "high|medium|low"}

If you cannot find a value for a field, set it to null. No markdown, no code fences.
```

Post-processing: strip `https?://` and the trailing `/` from the domain and lowercase it; strip `@` from the handle.

### Vision verification prompt (generalized from the original)

The images are sent as base64: Anthropic-side URL fetches failed on some CDNs. The allowed media types are jpeg, png, gif and webp; anything else is labelled jpeg; images over 4.5 MB are skipped. Each image is preceded by a `Image <i>:` text block (or `Image <i>: <fetch-failed>`).

```text
You are verifying photos to use in promotional content about the business "<name>"<, located in <city>>.

For EACH image in order, decide if it's actually of THIS specific business — its interior, exterior, signage, products clearly sold/served by this business, or its real branding. Reject:
• generic stock photos (products on white backgrounds with no context, smiling models, etc.)
• logos of website-builder defaults (GoDaddy / wsimg / wix placeholders)
• images that could be from any business of this type
• unrelated brands or businesses

Return ONLY a JSON array (no markdown, no commentary) — one entry per image you saw, IN ORDER. Shape:
[{"index": 0, "matches": true|false, "confidence": "high"|"medium"|"low", "note": "<6-word reason>"}]
```

Failure modes are explicit and non-fatal. Each candidate gets `matches: null` with a note: `no-vision`, `image-fetch-failed`, `vision-http-<status>`, `vision-noparse`, `vision-error` or `not-evaluated`.

The response also carried diagnostic counters (`reached`, `harvested`, `probed` per source), so the UI can explain why discovery came up short.

## How to implement in Polyvik

**Core**

- New service `brandDiscovery.services.js`:
  - `discoverSources({ tenant, name, city, url, handle })`: `generateStructured` with `webSearch: true` and a tool `{ domain, instagram, otherProfiles[], confidence, evidence[] }`. LLM task `brand_discovery`: **Sonnet 5, effort low**. Skip it if the user already gave a URL.
  - `harvestImages(url, mode)` and `extractLogoUrls(url)`: **must go through `websiteReader`'s safe fetch** (`fetchFollowingRedirects` with the `isBlockedIp` check). Monkey Studio's `probeImage` fetched arbitrary URLs without an SSRF guard, which must not be copied. Extend `readWebsite` to return `images[]` and `icons[]` alongside the text, so the brand-reading onboarding gets them for free.
  - `probeImage`: same logic, plus a max size (for example 10 MB) and a timeout.
  - `verifyCandidates({ tenant, name, city, candidates })`: task `brand_photo_verify`, **Haiku 4.5** (a cheap yes/no over at most 6 images). Tool output `{ verdicts: [{ index, matches, confidence, kind: 'logo'|'storefront'|'interior'|'product'|'team'|'other', note }] }`. The added `kind` lets the UI file each photo under the right Element type (place or product).
  - Cache: `brand_discovery_cache` keyed by `(tenant, normalized name|url)` with a 30-minute TTL, or in memory, as in Monkey Studio.
- Downloading accepted candidates goes through `storage.services.js`. Store `source_url` and `verdict` as **evidence**, matching the brand-DNA fact model (plan §7: status plus evidence).
- Route `POST /brands/:id/discover-assets`, `credit("assist")`.

**Panel**

- In brand onboarding and in `BrandAssets.tsx`: a "Find logo and photos" action. The results are a grid with the source domain, a verdict pill (verified / unverified) and accept or reject per item. Accepted logos go to the brand kit's logo slot; photos go to the references, as **official** (never mixed with inspiration).

**Link to the video canvas**

- Accepted photos can seed **Element** nodes: place (storefront, interior) and product.
- The logo feeds the end card (`small-gaps.md` §2).

## Risks and open questions

- **Rights and consent:** the photos belong to the business. It is fine when the user is that business, and questionable for agencies acting on a third party. Show a notice ("Use only assets you have rights to").
- Instagram scraping is brittle (login walls). Treat it as best-effort and never block on it.
- Favicons are low resolution and are the last resort; mark them as "favicon" so they are never used as the hero logo.
- Realistic faces in harvested photos run into Seedance E005 when used as video references (plan §1). The verifier's `kind: 'team'` should flag them.
- Vision cost: at most 6 images per call on Haiku, which is cheap. Cap total calls per discovery at 2.

## Effort

- `readWebsite` extension (images and icons, SSRF-safe probe): 1 d
- Source discovery with web search, verification task, ranking and cache: 1.5–2 d
- Panel review grid and accept flow: 1.5 d

**Depends on:** brand onboarding (existing), `websiteReader.services.js`.

## Source (archived)

- Server `Hivek-Dev/monkey-studio-server` @ `2394f22a30c1ae56a5f46733ff89d6c1e0a75e43`: `src/server.js` — `probeImage`, `discoverBrandSourcesViaClaude`, `extractLogoUrlsFromSite`, `harvestImageUrls`, `verifyHeroCandidatesWithVision`, routes `/api/v2/restaurant-hero/discover` and `/api/v2/restaurant-logo/discover`. The client-specific helpers (marketplace listing lookup, image-quality URL rewrite, blog slug parsing, city slug tables) were intentionally left out.

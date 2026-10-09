# Security

An audit of this project found three cross-tenant holes in production. None was
exotic: all three were a query missing its `tenant_id`. That is why these rules
are mechanical.

## Multi-tenant: the mechanical rule

**Every query carries `tenant_id`. No exceptions.** Including `UPDATE` and
`DELETE`, which are exactly the ones that get forgotten.

```sql
UPDATE blog_topics SET status = $2 WHERE id = $1 AND tenant_id = $3
```

And **every `ON CONFLICT` that updates** carries its tenant `WHERE`. Without it
an upsert is a hijack: the real case was `blog_settings`, where one customer
could overwrite another's `custom_domain` and take over its CORS and TLS.

```sql
ON CONFLICT (brand_id) DO UPDATE SET ...
WHERE blog_settings.tenant_id = $1
```

## Ownership guards

Any `brandId`, `campaignId` or `assetId` that comes in a request body is checked
before use. Being authenticated is not enough: you have to check that the
resource is theirs. The shared guards live in `src/utils/brandGuard.js`:

```js
export async function assertBrandOwned(brandId, tenantId) {
  const brand = await brandModel.findById(brandId, tenantId);
  if (!brand) { const error = new Error("Not found."); error.status = 404; throw error; }
  return brand;
}
```

Respond **404**, not 403: do not confirm the existence of other people's
resources.

The same criterion applies to relations. A section assigned to a piece has to
belong to that campaign's brand; a layout, to that brand. Checking the tenant is
not enough when a tenant has several brands.

## SSRF and foreign images: reference URLs

The image generator downloads the URLs it receives. Unfiltered, a customer could
make the server fetch anything — including instance metadata.

Every URL that goes to the generator passes through `assertOwnedAssetUrl` /
`ownedRefsOnly` (`imageGenerator.services.js`): it must start with
`PUBLIC_ASSETS_BASE`. If you add a new path through which URLs come in, that
path goes through there too.

The prefix only says where a file came from, not whose it is. Anyone who knew
the URL of another brand's image could pass it as a reference and pull it into
their own generation. So images that come from the client are also checked
against the brand with `assertBrandAssetUrl` / `assertBrandAssetUrls`
(`brandGuard.js`), which look in the brand's assets and its old kit sheets. Video
media has its own check (`assertOwnedVideoMediaUrl`).

## Webhooks

Incoming webhooks are verified cryptographically.

- **SES** uses `utils/snsSignature.js`: canonical string per message type,
  certificate downloaded over HTTPS from `*.amazonaws.com`, SHA1 or SHA256
  depending on `SignatureVersion`. A webhook with no signature or with a
  certificate from another domain is rejected.
- **Stripe** (`billing.services.js`) verifies the signature against the raw body
  with `STRIPE_WEBHOOK_SECRET` and applies each event once (`billing_events`).

Any new webhook is born verified. Never "connect it first and sign it later".

## Keys

- **Never** in the chat, in a commit, in a log or in an error message.
- Uploaded with `gh secret set NAME --repo Hivek-Dev/polyvik-core`.
- The deploy seeds them into the server's `.env` (see
  [deployment](deployment.md)).
- Customer keys (BYOK, `/settings/ai`) are verified with the provider,
  stored encrypted (`utils/crypto.js`, `tenants.byok_config`) and never returned
  to the client — only the last four characters. If a customer key fails, the
  call stops and says so; it never falls back to Polyvik's keys.
- If you think a key leaked, rotate first and investigate afterwards.

## User data

The user's email identifies them, nothing more. It is not sent to external
services, neither in headers nor in URLs, unless the user explicitly asks.

## Sign-up age gate

Polyvik is for people 18 and older. Sign-up opens with a neutral age
screen (`polyvik-panel/src/components/AgeGate.tsx`): it asks for the
birth date without saying where the line is. Under 18 ends there, and
the browser remembers it (`localStorage.polyvik_age_gate`), so typing
another year doesn't reopen the form. The date goes once with `POST
/api/auth/register` as `birthDate` (`YYYY-MM-DD`), and the API checks it
again (`polyvik-core/src/utils/adultAge.js`) before doing anything else:
400 for a missing or impossible date, 403 for under 18. The date is
never stored. The account keeps only `users.age_confirmed_at`, set when
the check passed. Accounts created before the gate and those made from
the staff console have it as NULL. Any new way to create an account,
such as Google sign-in, has to pass the same check.

## Checklist when touching code

- [ ] Does the query carry `tenant_id`? The `UPDATE` and `DELETE` too?
- [ ] Does the `ON CONFLICT` carry its tenant `WHERE`?
- [ ] Do client-supplied ids go through their guard?
- [ ] Do URLs going to the generator go through `assertOwnedAssetUrl`, and
      client images through `assertBrandAssetUrl`?
- [ ] Does the public endpoint have a rate limit?
- [ ] Did any sensitive data end up in a log or an error message?

## Public forms and the client IP

- The API sits behind Caddy on the same host. `server.js` sets `trust proxy: loopback`, so `req.ip` is the real client: Caddy overwrites `X-Forwarded-For`, and a client cannot spoof it. Checked in production on 27 Sep 2026.
- Public, unauthenticated forms and the auth routes are rate limited per IP (`middlewares/rateLimit.middleware.js`, in memory, one API process), and they answer 429 with `Retry-After`:
  - event registration: 20 per 10 min per event, and 60 per hour overall;
  - lead form: 5 per 10 min;
  - login: 20 per 15 min, and signup: 5 per hour.
- Event slugs are unique across accounts, because the public page, registration and `.ics` look an event up by slug alone:
  - a generated slug gets a suffix;
  - a typed slug that is taken is rejected;
  - publishing an event whose slug another published event uses moves it to a free slug (it wasn't public yet).
- Event assets must belong to an event of the same brand.

## Access model

Access is per account (tenant), with roles owner, member and staff. There are no per-brand permissions: every user of an account can reach all of its brands, so checks are by tenant (plus brand ownership where a URL or id could point elsewhere). Per-brand checks inside one account are not a security boundary today.

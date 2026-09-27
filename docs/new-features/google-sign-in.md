# Google sign-in

**Priority:** medium · **Effort:** M (about 2 to 3 dev-days) · **Status:** proposed

## Summary

"Continue with Google" on Login and Signup, alongside email and password. A returning Google user signs in with one click. A new one gets an account (tenant plus owner) under the same rules as email signup, including the beta and closed-registration rules. An existing email/password user who signs in with Google for the same verified email is **linked**, not duplicated.

## Why it matters for Polyvik

- It is the lowest-friction signup for the self-serve beta, and it removes password resets for most users.
- Google verifies the email, so there is no email-verification step for those users.
- Monkey Studio ran it in production (passport-google-oauth20) and solved two problems worth keeping: a **one-time exchange token** instead of putting a session in the redirect URL, and an **allow-list for the redirect target**.

## How Monkey Studio did it

Stack: `passport` plus `passport-google-oauth20`, express-session with cookies, scopes `['profile','email']`.

Flow:

```
GET /auth/google[?redirect_uri=<allowed frontend URL>]
   → state = base64url(JSON{ redirect_uri }) only if redirect_uri ∈ ALLOWED_REDIRECT_URLS
   → Google consent
GET /auth/google/callback
   → passport verify → findOrCreateUser(profile)
   → mint temp token (random, TTL 60 s, single use, in-memory Map; expired ones swept on each callback)
   → 302 <frontend>?auth_token=<temp>
POST /auth/exchange { token }
   → validate + delete token → findUserById → req.login → { user (password_hash stripped), authenticated: true }
```

`findOrCreateUser(profile)`:

1. `SELECT * FROM users WHERE google_id = $1`.
2. If the user is found and `blocked_at` is set → throw `USER_BLOCKED` **before** touching `last_login` (a blocked account leaves no trace of a successful login).
3. If the user is found → update `last_login`, name, email and picture from the profile.
4. If not found and registration is closed (`REGISTRATION_OPEN !== 'true'`, read on every call so it can be flipped with an env change and a restart) → throw `REGISTRATION_CLOSED`.
5. Otherwise insert `(google_id, email, name, picture, last_login)`.

In the verify callback, `USER_BLOCKED` and `REGISTRATION_CLOSED` became `done(null, false)`, which is a failed login with a redirect, not a 500.

Google Cloud setup, summarised from `GOOGLE_OAUTH_SETUP.md`:

1. Create or pick a Google Cloud project. Configure the **OAuth consent screen** (External; the app name and support email; the default `profile` and `email` scopes only; add test users while the app is in testing).
2. Credentials → **OAuth client ID** → *Web application*.
3. **Authorized JavaScript origins:** the API origin for production and `http://localhost:<port>` for development.
4. **Authorized redirect URIs:** `<api origin>/auth/google/callback` for production and local development.
5. Put `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the server env. Never commit them.

Weak points not to copy:
- The temp token came from `Math.random()`. Use `crypto.randomBytes(32)`.
- The token store was an in-memory `Map`, which breaks with more than one API instance and on restart.
- The accounts were not linked: the same email via Google and via password gave two rows, or a unique-constraint error.

## How to implement in Polyvik

Polyvik uses **JWT bearer tokens** (`auth.middleware.js`, `signToken` in `auth.services.js`), not sessions. So there is no passport session; the callback should end in a JWT.

**Core**

- Dependency: either `google-auth-library` (lighter, verifies the ID token), or a manual OAuth code flow with `fetch`. Passport is not needed.
- Migration:
  ```sql
  ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE;
  ALTER TABLE users ADD COLUMN avatar_url TEXT;
  ALTER TABLE users ALTER COLUMN password DROP NOT NULL;   -- Google-only accounts
  CREATE TABLE oauth_exchange_tokens (
    token_hash TEXT PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ);
  ```
  The table replaces the in-memory Map and works across instances and the worker.
- Routes in `auth.routes.js`:
  - `GET /auth/google?next=<path>`: redirect to Google with `state = signed(JWT, 10 min){ nonce, next }`. Only **relative** `next` paths are accepted (simpler than an allow-list of absolute URLs).
  - `GET /auth/google/callback`: exchange the code, verify the ID token (`aud`, `email_verified === true`), then look up the user:
    1. by `google_id`;
    2. otherwise by `email`, and **link** `google_id` if the email is verified;
    3. otherwise create a tenant and an owner through the same path as `register()` (company name defaults to the user's name or email domain; the beta plan rule from `plans.config.js` applies).

    Then store a 60 s single-use exchange token (the DB stores the hash) and redirect to `PANEL_URL/auth/callback?code=<token>`.
  - `POST /auth/google/exchange { code }` → `{ token: signToken(user), user, tenant }`, the same response shape as `login`.
- Signup honours the same closed-registration flag as email signup, if Polyvik adds one. See `small-gaps.md` §5 for the per-user block that login must check.

**Panel**

- `Login.tsx` and `Signup.tsx`: a "Continue with Google" button, styled per Google's branding guidelines (logo plus text; ADN outline style is allowed for the frame).
- New route `/auth/callback`: reads `code`, calls exchange, stores the JWT the same way as `login`, and navigates to `next`.
- Account settings: show "Signed in with Google". If the password is null, offer "Set a password" (optional).

## Risks and open questions

- Account takeover through linking: only link when Google says `email_verified` **and** the Polyvik account's email is the same address. Consider requiring the existing password once before linking. Recommendation: link automatically only if the Polyvik account has never logged in with a password (rare), otherwise ask for the password.
- Tenant naming for Google signups: ask for the company name on first login (a one-field step) instead of guessing it.
- Google Workspace domains could later map to the same tenant (team auto-join). Out of scope; see the team invites in `canvas-comments-and-collaboration.md`.

## Effort

- Migration, routes, ID-token verification and linking rules: 1.5 d
- Panel buttons, callback route, account settings: 1 d
- Google Cloud setup and consent-screen verification: 0.5 d (plus Google review time if sensitive scopes are ever added; `profile` and `email` do not need review)

**Depends on:** nothing. The per-user block (`small-gaps.md` §5) should land first or together.

## Source (archived)

- Server `Hivek-Dev/monkey-studio-server` @ `2394f22a30c1ae56a5f46733ff89d6c1e0a75e43`: `src/auth/config.js`, `src/auth/db.js` (`findOrCreateUser`, `BlockedUserError`, `RegistrationClosedError`, `registrationOpen`), `src/auth/routes.js` (`/google`, `/google/callback`, `/exchange`), `GOOGLE_OAUTH_SETUP.md`
- Client `Hivek-Dev/monkey-studio-client` @ `8d742b58dd8139129d6c9c723fe4c5f87feb9e58`: `src/pages/LoginPage.jsx`, `src/AuthContext.jsx`

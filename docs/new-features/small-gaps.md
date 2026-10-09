# Small gaps

Five small features Monkey Studio had and Polyvik lacks. Each can ship on its own.

| § | Feature | Priority | Effort |
|---|---|---|---|
| 1 | Video aspect crop / pad node | medium | S (1 d) |
| 2 | Generated end card with logo | medium | S–M (1.5–2 d) |
| 3 | Preview and download from a canvas node | medium | XS (0.5 d) |
| 4 | Canvas flow templates with thumbnails | medium | S–M (2 d, after the pipeline SDK) |
| 5 | Per-user block (kill switch) | high (operational) | XS (0.5–1 d) |

---

## 1. Video aspect crop / pad

**Summary.** Turn a finished clip into another aspect ratio, either by **center crop** (fill the frame) or by **pad** (letterbox or pillarbox). The result is a new asset, so the original is kept. Typical use: the 16:9 hero clip becomes a 9:16 reel and a 1:1 feed post without regenerating.

**Why for Polyvik.** The editor's render (`videoRender.services.js`) always fits clips with `scale=…:force_original_aspect_ratio=decrease` plus `pad` (letterbox). There is no **fill/crop** option, and no way to reformat a single clip on the canvas. Regeneration costs video credits; ffmpeg is free.

**How Monkey Studio did it.** `POST /api/v2/process-video-aspect { projectId, sourceAssetId, targetAspectRatio: "W:H", mode: "crop"|"pad" }` → `{ assetId, assetUrl, mimeType, byteSize, originalName, aspectRatio, mode }`. The aspect ratio is validated with `/^(\d+):(\d+)$/` and falls back to `1:1`. Filters (verbatim):

```text
crop: crop='if(gt(iw/ih,W/H),ih*W/H,iw)':'if(gt(iw/ih,W/H),ih,iw*H/W)':'(iw-out_w)/2':'(ih-out_h)/2'
pad:  pad='if(gt(iw/ih,W/H),iw,ih*W/H)':'if(gt(iw/ih,W/H),iw*H/W,ih)':'(ow-iw)/2':'(oh-ih)/2':black
```

The ffmpeg arguments were `-c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -c:a copy -movflags +faststart`, with a 180 s timeout. The output was named `<name>-<W>x<H>-<mode>`. The chat SDK exposed it as the `videoCropControls` node (modes `crop` / `letterbox`).

**How in Polyvik.**
- `videoMedia.services.js`: `reframeVideo({ url, aspect, mode, anchor })`, using `ffmpegPath.js`. Add an **anchor** (`center | top | bottom | left | right`), which Monkey Studio lacked: when going from 16:9 to 9:16, the subject is often off-centre. Allow only even output dimensions, which libx264 requires (`trunc(x/2)*2`).
- Route `POST /video/reframe`. It uses no credits, since ffmpeg is local; still rate-limit it.
- Canvas: a "Reframe" action on the video node that creates a new video node. Editor: a "Fill / Fit" toggle per clip that switches the `scale` flag to `increase` plus `crop`.
- Link: the **Assemble** node in `video-canvas.md` ("never stretches video"): crop and pad are the two non-stretching options.

---

## 2. Generated end card (bookend) with logo

**Summary.** An intro or outro clip built from the brand logo on a solid brand colour, animated with a gentle camera move that **keeps the logo pixel-stable**, and appended to the reel.

**How Monkey Studio did it.** `POST /api/v2/render-bookend { projectId, kind: 'intro'|'outro', logoUrl, backgroundColor (#RRGGBB), durationSeconds 4–15 (default 12), titleText, voiceoverText }`:

1. **Still** (`composeBookendStill`, sharp): a solid-colour canvas of 1080×1920. The logo is resized `fit: inside` to at most `min(0.6·w, 0.45·h)`, at `density: 300` so SVG logos come out crisp, then centred with an **80 px upward bias**. If the logo fetch fails, the still is the solid colour only.
2. **Animate** with Seedance image-to-video, with the still used as **both start and end frame** ("hold the same composition end-to-end so logo doesn't drift"), 720p, 9:16, no audio. Retries on busy: 3, 5 s linear.
3. **Fallback** if the video model fails: ffmpeg loops the still (`-loop 1 -t <dur>`) with `fade=t=in:st=0:d=0.6`, libx264 at crf 18.
4. The response includes `mode: 'seedance' | 'ffmpeg-fallback'` for debugging.

Its voiceover step (TTS) is **not** carried over; voice was removed from Polyvik on purpose.

Prompts (verbatim, with the length made a parameter):

```text
INTRO:
<N>-second cinematic intro reveal of the brand identity in the reference image. The image is a vertical 9:16 brand card already composed (background color + logo). Animate ONLY the camera — slow gentle dolly-in toward the logo, OR a slight handheld floating-camera feel, OR a smooth slow zoom. The logo and any text MUST stay perfectly sharp, undistorted, in the same position relative to the frame, with all letterforms preserved exactly as they appear in the reference. Add subtle ambient motion to the background ONLY (e.g. soft light pulsing, subtle particle drift, gradient breath). Premium cinematic, broadcast-quality. Vertical 9:16, super crisp. No music, no voice, no dialogue, no narration, no on-screen text changes, no logo morphing or distortion, no levitation, no spinning.

OUTRO:
<N>-second cinematic outro reveal of the brand identity in the reference image. The image is a vertical 9:16 brand card already composed (vibrant brand-color background + logo). Animate ONLY the camera with a smooth slow push-in toward the logo. The logo MUST stay perfectly sharp, undistorted, in the same position relative to the frame, with all letterforms preserved exactly as they appear in the reference. Add subtle energetic ambient motion to the background ONLY — soft confetti-like particles drifting, gentle light pulses, gradient breath. Vibrant, energetic, premium broadcast outro feel. Vertical 9:16, super crisp. No music, no voice, no dialogue, no narration, no on-screen text changes, no logo morphing or distortion, no levitation, no spinning.
```

**How in Polyvik.**
- **Safer design:** generate only the *background motion* with the video model (a colour plate with ambient motion, no logo), and then **overlay the real logo with ffmpeg** in `videoRender.services.js`, which already supports a logo overlay. The logo can then never morph. (Images no longer work this way: since 8 Oct 2026 an image is one generation with its text and logo, never a scene with a logo pasted on it.) The Seedance start-and-end-frame trick is a fallback option.
- Inputs come from the brand kit: logo (the light/dark variant chosen against the background colour), primary colour, optional tagline rendered with `textToPng` (the same font pipeline as captions).
- Cost: the ffmpeg-only card (still plus fade, or a Ken Burns zoom) is **free** and is the default. The animated background uses video credits, shown up front.
- Canvas / Assemble: an "End card" item that can be added to the timeline. Also available in the video editor.

---

## 3. Preview and download from a canvas node

**Summary.** Hover buttons on any image or video preview: **Eye** opens a full-screen lightbox, **Download** saves the file with a clean filename.

**How Monkey Studio did it** (`AssetDownloadButton.jsx`):
- `downloadAsset(url, filename)`: `fetch(url, { credentials: 'include' })` → blob → object URL → a synthetic `<a download>` click → revoke after 1 s. If the fetch fails (CSP, CORS), fall back to `window.open(url, '_blank', 'noopener,noreferrer')`.
- Filename sanitising: replace `[\\/:*?"<>|]+` with a space, collapse whitespace, trim, cut to 80 chars, fall back to `asset`. If there is no extension, add one from the MIME type (`png, jpg, webp, gif, mp4, webm, mov, mp3, wav`).
- The buttons are `opacity-0` until the parent `group/preview` is hovered or focused, so they stay keyboard accessible. The lightbox is a portal to `body` (escaping the canvas stacking context) and closes on ESC or a backdrop click.

**How in Polyvik.** Add to the `ImageNode` and `VideoNode` previews in `Canvas.tsx`, reusing `ImageLightbox.tsx` / `LibraryPreview.tsx`. The filename is the asset's generated name (Polyvik already names assets; see `imageNaming.services.js`) plus the extension from the MIME type. Watch storage CORS: if assets are served from a bucket without CORS, use a core download endpoint that sets `Content-Disposition: attachment`.

---

## 4. Canvas flow templates with thumbnails

**Summary.** A **Templates** gallery: cards with a thumbnail, title, one-line description and **Use template**. Using one inflates a predefined graph locally (no LLM, no cost), which the user then fills in.

**How Monkey Studio did it.** `PIPELINE_TEMPLATES` in `PipelineChatDock.jsx`, each `{ id, title, description, icon, image, build() → spec }`, built with the SDK builders (see `pipeline-chat-builder.md`). Convention: **Play wires INTO generators** (`play → generator`). The four templates:

| id | Graph | Defaults |
|---|---|---|
| `simple-image` | Context "Subject" → Image; Play → Image | 1:1 |
| `simple-video` | Context "Scene" → Video; Play → Video | 9:16, 8 s, 1080p, audio on |
| `social-hook` | Context "Hook script" and Context "Visual style" → Video "Hook clip"; Play → Video | 9:16, 6 s, 1080p, audio on |
| `ecommerce-ad` | Context "Product" and Context "Brand style" → Image "Hero" → Video "Ad clip"; Play → Hero and Ad clip | 9:16; 8 s video |

Placeholder texts (verbatim, reusable):
- Subject: `Describe what you want to see…`
- Scene: `Describe the scene and the motion you want…`
- Hook script: `Open with a strong line that earns the next 3 seconds.\nKeep it under 12 words. Speak to the audience directly.`
- Visual style (hook): `Vertical 9:16. Fast cut feel inside one continuous shot. Confident character holding eye contact. Punchy, modern, scroll-stopping.`
- Product: `Name and describe the product. Material, colour, packaging, defining details.`
- Brand style: `Tone, palette, target audience, channel. What the ad should feel like.`
- Ad clip prompt: `Animate the hero image into an 8s product ad. Slow push-in, premium pacing.`

Thumbnails (`public/template-thumbnails/*.png`) were 1792×1024 generated illustrations of about 1.5–1.9 MB each: a dark background, a single object lit with blue/cyan rim light (for example a monolith product under a spotlight for *ecommerce-ad*, and a phone crossed by an electric bolt for *social-hook*). They were **not copied** here because of their size; regenerate them in Polyvik's ADN style and serve them as WebP at about 800 px (under 100 KB each).

**How in Polyvik.**
- Templates are **pipeline specs** (the JSON format in `pipeline-chat-builder.md`). Store the built-in ones as JSON files in `polyvik-core/templates/canvas/*.json` (versioned) and serve them from `GET /canvas/templates`. Later, users can save their own canvas as a template (Monkey Studio's "reverse builder" idea: `serialiseGraph(nodes, edges)`).
- Proposed starter set, mapped to the video canvas:
  - *Product hero image*;
  - *Image → animate* (Keyframe → Animate);
  - *Social hook, 4 variants* (plan §7: "test 4 hooks in one format");
  - *30 s ad* (Script → Keyframes → Animate → Assemble);
  - *Storyboard first* (Script → Storyboard).
- Templates never auto-run. The gallery shows an estimated cost per template.

---

## 5. Per-user block (kill switch)

**Summary.** Operations can disable a single user immediately: login is refused **and existing sessions stop working on the next request**, without deleting data.

**How Monkey Studio did it** (migration 018 plus `auth/db.js`):

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_at     TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_reason TEXT;
CREATE INDEX IF NOT EXISTS users_active_idx ON users (id) WHERE blocked_at IS NULL;
COMMENT ON COLUMN users.blocked_at IS
  'When set, the account is denied at login and its sessions stop resolving.';
```

- The migration explains why a flag and not a delete: with open signup, deleting a row does not deny access, because the next login recreates the user.
- Login (password and OAuth) checks `blocked_at` **before** updating `last_login`, and throws `BlockedUserError` (`code: 'USER_BLOCKED'`), which becomes a 403 "This account has been disabled", not a 500.
- Session lookup: `SELECT * FROM users WHERE id = $1 AND blocked_at IS NULL`. Passport deserialises on every request, so sessions die immediately.
- A companion flag, `REGISTRATION_OPEN=true|false`, was read on every call (flip it with an env change and a restart). When closed, it refuses **new** accounts only; existing users are unaffected. The client hid the "create account" toggle when registration was closed.

**How in Polyvik.**
- Polyvik has `tenants.status` (`active | suspended | cancelled`) but no per-user switch. Add `users.blocked_at` and `blocked_reason` with the same migration.
- JWTs are stateless, so the "sessions die on the next request" property needs a check in `auth.middleware.js`. Either query `users.blocked_at` on each request (one indexed lookup; add a 60 s in-memory cache), or add a `token_version` column that is bumped on block and embedded in the JWT. Recommendation: the `blocked_at` check with a short cache, which also covers `tenants.status = 'suspended'` in the same query.
- `login()` in `auth.services.js` returns 403 "This account has been disabled" for a blocked user, checked before the password compare to avoid a timing leak on blocked emails. Never reveal whether the email exists.
- Staff UI: a block/unblock action with a reason in the admin panel (`admin.routes.js` already has tenant endpoints; add `POST /admin/users/:id/block` and `/unblock`, staff only).
- Optional: a `REGISTRATION_OPEN` flag in `env.js` for closing beta signup, with the Signup page hidden accordingly.

---

## Source (archived)

- Server `Hivek-Dev/monkey-studio-server` @ `2394f22a30c1ae56a5f46733ff89d6c1e0a75e43`: `src/server.js` — `parseAspectRatio`, `POST /api/v2/process-video-aspect`, `composeBookendStill`, `POST /api/v2/render-bookend`; `src/db/migrations/018_user_blocking.sql`; `src/auth/db.js`, `src/auth/config.js`, `src/auth/routes.js`
- Client `Hivek-Dev/monkey-studio-client` @ `8d742b58dd8139129d6c9c723fe4c5f87feb9e58`: `src/features/creative-studio/nodes/AssetDownloadButton.jsx`, `src/features/chatbot/PipelineChatDock.jsx` (`PIPELINE_TEMPLATES`), `public/template-thumbnails/{simple-image,simple-video,social-hook,ecommerce-ad}.png`

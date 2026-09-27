# Canvas comments, real-time collaboration and team invites

**Priority:** comments and real-time **low**; team invites **medium** · **Effort:** invites S–M (2–3 d), comments S (1.5–2 d), real-time L (6–10 d) · **Status:** proposed

## Summary

Monkey Studio shipped three layers:

1. **Share-link invites.** A project member mints a link (a 32-byte random token). Anyone who opens it and is signed in joins the project. The link can be previewed while logged out and revoked later.
2. **Real-time canvas.** The canvas is a Yjs document synced through a Hocuspocus WebSocket server. A short-lived JWT authorizes one (user, project) pair. Updates are stored in Postgres as a snapshot plus an append-only update log. Presence (cursors, avatar stack) comes from awareness.
3. **Comment-thread nodes.** Figma-style pins on the canvas. A collapsed pin shows the last author's avatar and a count badge; the expanded card shows the thread with reply, edit, delete and resolve. Comments live in `node.data.comments`, so they sync with the canvas at no extra cost.

## Why it matters for Polyvik

- **Team invites (medium):** Polyvik tenants already support several users (`users.role` = owner | member), but there is **no way to add a teammate**. Agencies and marketing teams need it, and plan tiers (agency) imply it. This is the most valuable piece here.
- **Comments (low):** they matter for approval workflows. The video canvas plan requires the user to approve keyframes before video spend. A comment thread on a Keyframe ("warmer light, then approve") is a natural home for that feedback. They are cheap if built on the existing canvas doc.
- **Real-time (low):** the canvas is saved as one JSONB doc per brand (`brand_canvas`, 1 MB cap, last write wins). Two people editing at once will overwrite each other. That is acceptable while teams are small. Revisit when invites exist and there is evidence of concurrent editing.

## How Monkey Studio did it

### Invites

Schema:

```sql
CREATE TABLE project_members (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id));
CREATE TABLE project_invites (
  token      TEXT PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ);
```

Token: `randomBytes(32).toString('base64url')`, 43 chars. V1 had no email and no roles: anyone with the link can join.

Routes:

| Method | Path | Auth | Behaviour |
|---|---|---|---|
| POST | `/api/projects/:id/invites` | member | create → `{ invite }` (201) |
| GET | `/api/invites/:token` | **public** | preview: `{ invite, projectName }` so a logged-out user sees "Join project X?"; 404 if revoked or expired |
| POST | `/api/invites/:token/accept` | signed in | add member (idempotent) → `{ projectId }` |
| DELETE | `/api/invites/:token` | member | revoke (sets `revoked_at`) → 204 |

`findActiveInvite` returns null when the invite is revoked or `expires_at < now()`. Client: `InvitePage.jsx` handles `/invite/:token`: preview, then login if needed, then accept and redirect to the project.

### Real-time canvas (Hocuspocus and Yjs)

- Document name: `project:<uuid>` (validated with a regex; anything else is rejected).
- `POST /api/collab/token { projectId }` (member only) → `{ token, wsUrl, documentName }`. The JWT is HS256 with a 1 h TTL; payload `{ sub: userId, projectId, name, color }`. The client fetches a fresh token on every reconnect.
- `onAuthenticate`: verify the JWT and check that `payload.projectId` matches the document; the connection context is `{ user: { id, name, color } }`.
- Persistence (Database extension):
  - `fetch` loads `canvases.y_doc_state` and applies every `canvas_updates` row in order, then returns the merged update;
  - `store` upserts the `canvases` row and appends the update inside a transaction;
  - debounce 2 s, max wait 10 s.
- Schema: `canvases (id, project_id UNIQUE, y_doc_state BYTEA, y_doc_version, updated_at)` and `canvas_updates (id BIGSERIAL, canvas_id, update BYTEA, created_at)`. The server did not compact the log automatically; there was only a manual script (`scripts/compact-canvases.js`). It folds all updates into a fresh `y_doc_state` snapshot inside one transaction, and it strips inline base64 `data:` URLs from `data.image`, `data.assetUrl`, `data.preview` and `data.thumbnailUrl`.
- **Lesson learned:** early canvases stored base64 images inside Yjs nodes, so every small update re-encoded a 30 MB+ doc. That produced about 20 GB of `canvas_updates` rows per canvas and multi-second flushes, and a quick reload could lose edits. **Store only asset URLs in canvas docs, never binary data.** Polyvik's 1 MB `brand_canvas` cap already enforces this.
- Client: `yjsCanvasBinding.js` / `useYjsCanvasState.js` bind React Flow nodes and edges to Y maps; `userIdentity.js` derives a deterministic avatar colour and initials per user, used by cursors, the avatar stack and comment pins; `CollabStatusBadge` and `CollabOfflineBanner` show the connection state.

### Comment-thread node

Data shape, stored in the node's data:

```ts
type Comment = {
  id: string            // "cm-" + crypto.randomUUID()
  text: string          // ≤ 2000 chars
  authorId: string      // user id (email-shaped ids rejected)
  authorName: string
  authorEmail: string
  authorAvatar: string
  createdAt: number     // epoch ms
  updatedAt: number | null
}
type CommentThreadData = { comments: Comment[]; isResolved: boolean }
```

Rules (from the component header):
- at most 2000 characters per comment and 200 comments per thread (about 400 KB worst case);
- empty or whitespace-only submissions are ignored;
- edit and delete are allowed only for the author (compared by `authorId`, falling back to `authorEmail`);
- a defensive parse on hydration drops malformed entries silently;
- rendering goes only through React text (no `dangerouslySetInnerHTML`).

UI states:
- **Pin** (36×36): the last author's avatar or initials; a count badge for more than one comment (`99+` cap); green when resolved; a soft pulse ring while unresolved.
- **Card** (about 340 px): header ("Comments" / "Resolved thread"), a list with avatar, name, relative time and body, a reply textarea, a resolve toggle and close.

Mutations are `onCommentsChange(id, comments[])` and `onCommentResolveToggle(id, bool)`, which write back the whole array. The code comment explains this was chosen over per-comment Y types because at this size the simplicity wins.

## How to implement in Polyvik

### 1. Team invites (medium), tenant level

Polyvik's unit is the **tenant** (all brands), not the project, so invite to the tenant.

- Migration:
  ```sql
  CREATE TABLE tenant_invites (
    token_hash TEXT PRIMARY KEY,
    tenant_id  BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_by BIGINT NOT NULL REFERENCES users(id),
    email      VARCHAR(255),            -- optional: lock to one address
    role       VARCHAR(20) NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(), expires_at TIMESTAMPTZ NOT NULL, revoked_at TIMESTAMPTZ, used_at TIMESTAMPTZ);
  ```
  Store only a hash of the token, set a default expiry of 7 days, and make links single-use when `email` is set.
- Since `users.email` is globally unique and each user has one `tenant_id`, accepting an invite with an existing account from another tenant needs a decision: block it ("this email already belongs to another workspace"), or move to a `memberships` table. Recommendation for v1: invites create **new** users only (signup through the invite link, or Google sign-in via `google-sign-in.md`).
- Routes: `POST /me/team/invites` (owner only), `GET /invites/:token` (public preview: tenant name, inviter name), `POST /invites/:token/accept` (creates a user in that tenant), `DELETE /me/team/invites/:token`, `GET /me/team`, `DELETE /me/team/:userId` (owner).
- Email: send the link with `emails.services.js` (optional; copying the link is enough for v1).
- Plan limits: seats per plan in `plans.config.js` (for example Free 1, agency N).
- Panel: a "Team" tab in `SettingsHub.tsx`; an `/invite/:token` page that reuses the Signup layout.

### 2. Comment threads (low), on the current canvas doc

- A new node type `commentNode` in `Canvas.tsx` with the data shape above. It needs no server changes, because the canvas JSON already persists arbitrary node data. Count comment payload against the 1 MB doc cap; lowering the thread cap to about 100 comments is reasonable.
- Authorship comes from the JWT user (`req.user`) on the client side. For integrity, the server could strip edits to other users' comments on `saveCanvas` (diff by `authorId`). That is optional in v1.
- An **attach-to-node** option, which Monkey Studio lacked: `data.anchorNodeId`, so the pin follows a Keyframe. That fits the keyframe approval workflow.
- A "Changes requested / Approved" status per Keyframe could reuse `isResolved`.

### 3. Real-time (low, later)

- Only when invites exist and there is concurrent editing. The Monkey Studio design ports directly: the Hocuspocus server in the core process or as a small separate service, the JWT handshake, snapshot plus update log. Add what it lacked: **automatic compaction** (fold the updates into `y_doc_state` every N updates or on idle; the logic of `compact-canvases.js`, run as a job) and a migration from the JSONB `brand_canvas.doc` into a Y doc.
- A cheaper intermediate step: optimistic concurrency on `saveCanvas` (compare `updated_at`, and return 409 with "someone else changed this canvas; reload"). This prevents silent overwrites for about 0.5 d of work.

## Risks and open questions

- The tenant-per-user model limits invites (see above). A `memberships` table is the long-term answer if people need several workspaces.
- Comments stored inside the canvas doc get lost if a user deletes the node. That is acceptable for canvas notes; it is not an audit trail.
- The real-time protocol changes how the canvas saves, and that change is risky. Defer it.

## Effort

- Team invites: 2–3 d (core 1.5, panel 1–1.5)
- Comment node: 1.5–2 d (panel only)
- Optimistic concurrency guard: 0.5 d
- Real-time Yjs: 6–10 d

**Depends on:** `google-sign-in.md` (optional) for invite acceptance; video canvas Keyframe node for anchored approval comments.

## Source (archived)

- Server `Hivek-Dev/monkey-studio-server` @ `2394f22a30c1ae56a5f46733ff89d6c1e0a75e43`: `src/collab/hocuspocus.js`, `src/services/invites.service.js`, `src/services/collabToken.service.js`, `src/routes/collab.routes.js`, `src/controllers/collab.controller.js`, `src/db/migrations/001_collab.sql`, `scripts/compact-canvases.js`
- Client `Hivek-Dev/monkey-studio-client` @ `8d742b58dd8139129d6c9c723fe4c5f87feb9e58`: `src/features/creative-studio/nodes/CommentThreadNode.jsx`, `src/collab/{yjsCanvasBinding.js,useYjsCanvasState.js,userIdentity.js}`, `src/CollabContext.jsx`, `src/pages/InvitePage.jsx`

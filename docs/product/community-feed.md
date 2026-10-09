# Community Feed

The Feed (`/feed` in the panel) shows creations that brands choose to share
with everyone on Polyvik. People share from Media and like what others
share. It started on 9 Oct 2026.

## How it works

- **Sharing is explicit and per item.** In Media, an image or video's viewer
  has **Compartir ▸ Publicar en el Feed**, and the same menu removes it again.
  Only Media items (`brand_assets` of kind `canvas_gen`) of your own account
  can be shared. Sharing twice still makes a single post.
- **What travels.** Each post shows the media (image or video, with its
  thumbnails and poster), the brand's name and avatar, the likes, whether you
  liked it, and whether it's yours. It never shows the file name, notes or
  the prompt the item was made with, and no person's name or email.
- **Likes.** Anyone signed in can like a post, once per person. A like can be
  undone, and the panel updates it optimistically.
- **Order.** `Más nuevas` and `Más antiguas` go by post id (the cursor is the
  last id). `Populares` puts the most liked first (the cursor is an offset).
  `Aleatorio` shuffles with a seed drawn on the first page; the cursor carries
  it with the offset (`seed.offset`), so scrolling continues the same order
  without repeats, and coming back to the tab deals a new shuffle.
- **The grid.** Only the pictures. The heart and its count show in the
  corner on hover (always on touch screens); opening a post shows its brand.
- **Taking a post down.** The account that shared it can take it down from
  Media or from the Feed. A platform admin can take any post down
  ("Quitar (moderación)"). Deleting the item in Media also removes the post,
  and its likes go with it.
- **Getting there.** The band under Media's tabs leads to the Feed with
  "Ir al Feed".

## Polyvik's own posts

Polyvik posts to the Feed from the staff console (Platform → Feed, admins
only). The posts are authored by a house account: a tenant and brand named
«Polyvik» with the site's mark as avatar. The account is created the first
time it's needed and remembered in `platform_settings` (`feed_house`).

To post, an admin writes a prompt or starts from one of four ideas, one per
ratio (1:1, 4:5, 9:16, 16:9). Then they pick the model and generate with the
Canvas pipeline, without brand style. The image lands in the house brand's
Media, and from there it is published, unpublished or discarded. Every step
goes to the activity log.

The four ideas come from research on what stops the scroll:

- light with a direction;
- one dominant color, a secondary one and a rare accent;
- tactile materials such as resin, glass and chrome;
- composition made for the ratio;
- blank surfaces described in positive terms instead of "no text".

Endpoints: `GET /api/admin/feed`, `POST /api/admin/feed/images`,
`PUT /api/admin/feed/images/:assetId/published` and
`DELETE /api/admin/feed/images/:assetId`. The service is in
`services/houseFeed.services.js` and the console page in
`polyvik-console/src/pages/FeedStudio.tsx`.

## Where it lives

- Core: migration `097_community_feed.sql` creates `feed_posts` and
  `feed_likes`. The logic is in `services/communityFeed.services.js` and the
  routes in `routes/communityFeed.routes.js` under `/api/feed`:
  - `GET /` lists posts;
  - `POST /share` and `DELETE /share/:assetId` share and unshare an item;
  - `DELETE /posts/:postId` takes a post down;
  - `POST` and `DELETE /posts/:postId/like` add and remove a like.

  The Media list (`/api/assets/feed`) now says whether each item is `shared`.
- Panel: `pages/CommunityFeed.tsx`. The Share menu is in `pages/Feed.tsx`
  (Media).
- Tests: `test/communityFeed.integration.test.js` runs against a real
  PostgreSQL. It covers ownership, privacy, likes, ordering, moderation and
  the cascade when an item is deleted.

## Not yet

There is no reporting by users, no per-brand profile page, no comments and
no notifications for likes. Shared items are visible to every signed-in
account; there is no public, signed-out view.

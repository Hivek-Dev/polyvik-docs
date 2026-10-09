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
- **Order.** `Recientes` puts the newest first (the cursor is the last post
  id). `Populares` puts the most liked first (the cursor is an offset).
- **Taking a post down.** The account that shared it can take it down from
  Media or from the Feed. A platform admin can take any post down
  ("Quitar (moderación)"). Deleting the item in Media also removes the post,
  and its likes go with it.
- **Getting there.** The band under Media's tabs leads to the Feed with
  "Ir al Feed", and the Feed has "Ir a Media" for the way back.

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

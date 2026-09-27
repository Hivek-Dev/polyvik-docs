# Feed and Library

Everything generated for a brand lands in **Content → Feed** (`/feed`), per brand
and account: images from pieces, previews, Lab, Canvas, Studio, blog, events,
extend, retouch and the character creator, and — since 25–26 Sep 2026 — finished
**videos**. Users can save one or more images to **Library → General** (`/library`).
General accepts untagged images; Character, Product, Object and Place are filters
over the same material, not copies. Manual uploads go to General.

When a piece is approved for publishing, its images are archived automatically in
**Approved pieces**, separate from General. It is an archive of approved images,
not the approval queue or the Moldes. An approved image leaves the Feed and lives
in that tab. Studio and Canvas can pick from General and Approved pieces; Settings
→ Pieces picks fixed materials from General.

## Videos in the Feed

- A finished video job (`processVideoJobs` → `recordGeneratedVideo` in
  `imageFeed.services.js`) inserts a `brand_assets` row with `kind='canvas_gen'`,
  `mime_type='video/mp4'`, `generated_source='video'`. It is named in the
  background from the prompt that was requested.
- `makeVideoPreview` (`videoMedia.services.js`) uses ffmpeg to create:
  - `poster_url`: the first frame as JPEG (the tile's still image);
  - `preview_url`: a muted 3-second H.264 clip (≤640 px tall, `+faststart`) that
    plays **on hover**. It weighs a fraction of a GIF.
- Without ffmpeg (or if the preview fails) the Feed falls back to the start of the
  full video. The worker backfills missing posters/clips every 10 minutes, a few
  at a time (`backfillVideoPreviews`); an unreadable video is marked with an empty
  string so it is not retried forever.
- Opening a video tile plays the full MP4. Videos **cannot be saved to the
  Library** (the API returns 400; the panel skips them in multi-select): the
  Library holds images.
- Migrations `064_video_feed` (adds `preview_url`, back-fills finished
  `video_jobs`) and `065_video_poster` (adds `poster_url`).

## Context boundary

- `canvas_gen` is the Feed's internal kind; it is not renamed, to keep history
  compatible.
- `recordGeneratedImage` registers the final PNG after typography rendering and
  storage. Lab, pieces, previews, blog, events, extend and retouch all use it.
- `listMaterials` and Studio mentions only query General (`other`,
  `product_photo`, `canvas`). Neither the Feed nor Approved pieces are offered to
  the designer as automatic candidates.
- Saving a generation creates an `other` row pointing to the same file. It does
  not copy the prompt, generation notes or tags. Saving is idempotent, even with
  concurrent requests.
- References the user picks explicitly still work, including Studio actions that
  turn a result into a model image or free style. Previously edited notes on
  existing materials are not deleted or reinterpreted as prompts.

## API

- `GET /api/assets/feed?brandId=…&before=…&media=all`: 48 items per page, cursor
  `next`, flags `in_library` and `approved`, plus `preview_url` / `poster_url`. No
  prompts or notes. Without `media=all` videos are excluded — reference pickers
  only understand images.
- `POST /api/assets/:id/promote` with `{ "kind": "other" }`: save to General.
- `GET /api/assets?brandId=…&collection=library`: General.
- `GET /api/assets?brandId=…&collection=approved`: Approved pieces.
- `GET /api/assets/generation?brandId=…&url=…`: how an image was generated
  ([image engine](image-engine.md#generation-details-evidence-per-image)).
- The generic image list excludes the Feed. Every collection validates account and
  brand.

## Migration 045 (approved-piece archive)

Adds generation source and piece link to `brand_assets`. The trigger
`archive_approved_piece_images` archives images in the same transaction that
approves/schedules the piece, including immediate publishing. Accepted states:
`approved`, `scheduled`, `publishing`, `published`.

Each piece+URL pair is archived once. Changing an approved piece's files keeps
earlier versions. Cancelling a piece does not delete the archive; deleting an
archived image does not change the piece. Later publishing transitions do not
recreate an image the user removed if the files are unchanged. The migration
back-filled what it could identify; older URLs no longer stored cannot be
recovered.

## Local validation

`npm test` covers single registration of each source's final image with a mocked
provider. The real integration test only runs against a dedicated local database
whose name starts with `polyvik_feed_validation_`:

```sh
DATABASE_URL=postgresql://localhost/polyvik_feed_validation_local npm run migrate
FEED_TEST_DATABASE_URL=postgresql://localhost/polyvik_feed_validation_local npm test
```

Create that empty database first. It checks brand/account isolation, pagination,
concurrent saves without duplicates, absence of prompts, tags, atomic approval
archiving and re-running the migration with data. No AI generation calls are
needed. Deploy core (with migrations) before panel.

Related: [video generation](../video/video-generation.md),
[design guide](../panel/design-guide.md),
[feed header artwork](../panel/feed-header-artwork.md).

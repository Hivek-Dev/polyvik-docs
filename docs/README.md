# Polyvik documentation

These documents exist so that anyone, human or agent, can join the project knowing what has already been decided, without paying for the same mistakes again. All project documentation lives here, in English. Per-repo docs will be split out later.

## Guides

| Document | Read it when |
|---|---|
| [guides/glossary.md](guides/glossary.md) | **Every time you name something the customer reads** |
| [guides/conventions.md](guides/conventions.md) | Before writing code |
| [guides/working-with-claude-code.md](guides/working-with-claude-code.md) | To ask for work and verify it well |

## Architecture and operations

| Document | Read it when |
|---|---|
| [architecture/architecture.md](architecture/architecture.md) | Before touching something you don't know |
| [architecture/security.md](architecture/security.md) | When touching queries, user input or keys |
| [architecture/deployment.md](architecture/deployment.md) | Every time you ship |
| [architecture/ai-usage-and-costs.md](architecture/ai-usage-and-costs.md) | When looking at what AI costs and how it's measured |

## Product

| Document | Read it when |
|---|---|
| [product/plans-and-credits.md](product/plans-and-credits.md) | When touching plans, limits or charges |
| [product/publication-guides.md](product/publication-guides.md) | When touching brand directions or guided post types |
| [product/brand-kit.md](product/brand-kit.md) | When touching DNA → Brand: logo, palette, typeface, model images, visual direction, seasons |
| [product/brand-management.md](product/brand-management.md) | When touching the brand list, brand creation or deletion |
| [product/backlog.md](product/backlog.md) | When picking what's next (open items, decisions, risks) |
| [new-features/README.md](new-features/README.md) | For new features to build, each with its own spec |

## Image

| Document | Read it when |
|---|---|
| [image/image-engine.md](image/image-engine.md) | When touching image generation, references or providers |
| [image/text-composition.md](image/text-composition.md) | When touching text inside images (drawn by the image model in one generation) |
| [image/real-typography.md](image/real-typography.md) | When touching fonts on pieces |
| [image/editorial-context.md](image/editorial-context.md) | When touching audience, language or editorial review |
| [image/feed-and-library.md](image/feed-and-library.md) | When touching the Feed, the Library or video previews |

## Video

| Document | Read it when |
|---|---|
| [video/video-generation.md](video/video-generation.md) | When touching how a video is requested, charged and stored |
| [video/replicate-video.md](video/replicate-video.md) | When touching Replicate or customer provider keys |
| [video/video-canvas.md](video/video-canvas.md) | Before building the multi-shot video canvas |
| [video/seedance-community-recipes.md](video/seedance-community-recipes.md) | When writing Seedance prompts |
| [video/provider-change.md](video/provider-change.md) | To understand why we moved off ArgoLink |

## Panel

| Document | Read it when |
|---|---|
| [panel/design-system.md](panel/design-system.md) | **Before any UI change**: tokens, light/dark, components, migrating a screen |
| [panel/design-guide.md](panel/design-guide.md) | Superseded: the DNA style, for screens not yet migrated |
| [panel/image-creation-workspace.md](panel/image-creation-workspace.md) | When touching Create images |
| [panel/video-creation-workspace.md](panel/video-creation-workspace.md) | When touching Create video and Characters |
| [panel/feed-header-artwork.md](panel/feed-header-artwork.md) | When touching the Feed hero artwork |

## How these are maintained

These files are part of the work, not an appendix. When a decision changes, the document changes in the same commit. A document that lies is worse than one that doesn't exist, because people follow it with confidence and it leads them into the mistake.

- If something took you an hour to figure out, it goes here. If it can be read from the code in thirty seconds, it doesn't.
- A new document enters this index the same day. A document that isn't in the index doesn't exist for anyone.

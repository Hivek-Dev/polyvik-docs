# Polyvik workspace

This repository is the hub for the Polyvik workspace. It holds the project documentation and the shared tools, and it explains how the pieces fit together. The code lives in two separate repositories, cloned next to this README:

```
polyvik/                 ← this repo (Hivek-Dev/polyvik-docs)
  docs/                  all project documentation, in English (start at docs/README.md)
  tools/qa/              manual QA scripts (production API with a tab's session, CDP screenshots, video runs)
  polyvik-core/          → Hivek-Dev/polyvik-core   (ignored here; its own repo)
  polyvik-panel/         → Hivek-Dev/polyvik-panel  (ignored here; its own repo)
```

## Setup

```bash
git clone git@github.com:Hivek-Dev/polyvik-docs.git polyvik
cd polyvik
git clone git@github.com:Hivek-Dev/polyvik-core.git
git clone git@github.com:Hivek-Dev/polyvik-panel.git
```

The docs link into the code with relative paths (`../polyvik-core/...`), so keep this layout.

## How the pieces relate

| Piece | What it is | Runs on | Ships by |
|---|---|---|---|
| `polyvik-core` | Multi-tenant API (`polyvik-api`) and worker (`polyvik-worker`): Express, Postgres, AI providers, queues, ffmpeg (bundled) | argo, under PM2 | push to `main` → GitHub Actions: migrations, restart |
| `polyvik-panel` | Customer panel (`app.polyvik.com`): React, Vite, Tailwind | hydra (static) | push to `main` → build and rsync |
| AI providers | Anthropic (text), OpenAI GPT Image 2.5 and Seedream via Replicate (images), Seedance 2.5 via Replicate (video; ArgoLink is dev only) | external | keys in the server `.env`, or the customer's own keys |

Ship core before panel when a change touches both. Details:
- [docs/architecture/architecture.md](docs/architecture/architecture.md)
- [docs/architecture/deployment.md](docs/architecture/deployment.md)

## Rules

- **The docs are part of the work.** A decision that changes updates its doc in the same change, and every new doc enters [docs/README.md](docs/README.md).
- **No secrets here**, and no customer data or screenshots with personal data. Scratch output goes to a temporary folder, never into this repo.

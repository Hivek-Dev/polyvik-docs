# Deployment

A `push` to `main` triggers the GitHub Action. There is no staging: `main` is
production.

| Repo | Server | What the Action does |
|---|---|---|
| `polyvik-core` | argo | SSH → seeds keys from GitHub Secrets into `.env`, `git reset --hard origin/main`, normalises image-model settings, `npm ci`, `npm run migrate`, reports which ffmpeg the app will use, restarts `polyvik-api` and `polyvik-worker` with pm2 |
| `polyvik-panel` | hydra | `npm run build` with `VITE_API_URL=https://api.polyvik.com`, `rsync` of `dist/` (retried up to 5 times), rewrites the SPA `.htaccess` |

Migrations are **not** silenced: if they fail, the deploy fails. On purpose —
better that than serving new code against an old schema.

The core workflow has `concurrency: cancel-in-progress`: a second push to `main`
cancels a core deploy that is still running.

## Order matters

Core first, panel second, **in series**. If the panel calls an endpoint that
does not exist yet, users see errors during the window between the two deploys.
Never launch them in parallel.

## Catching the right run

The classic mistake: using `gh run list --limit 1` right after the push and
grabbing an old run. The Action takes a few seconds to appear. **Always by SHA:**

```bash
sha=$(git rev-parse HEAD)
sleep 12
run=$(gh run list --repo Hivek-Dev/polyvik-core --limit 15 --json databaseId,headSha \
      --jq "map(select(.headSha==\"$sha\"))|.[0].databaseId")
```

## SSH timeouts are normal

The servers refuse connections often. It is not the code: it is the machine.
The pattern that works is to wait for the run to finish and rerun the failed
jobs, up to three or four times. Do not go investigating the commit.

```bash
gh run rerun "$run" --repo Hivek-Dev/polyvik-core --failed
```

## Full script

This is the one in use. Copy it as-is (adjust the two paths to your checkout).

```bash
set -e
watch_run () {
  repo=$1; run=$2
  for i in 1 2 3 4; do
    st=$(gh run view "$run" --repo "Hivek-Dev/$repo" --json status,conclusion --jq '.status+"/"+(.conclusion//"")')
    while [ "${st%%/*}" != "completed" ]; do
      sleep 20
      st=$(gh run view "$run" --repo "Hivek-Dev/$repo" --json status,conclusion --jq '.status+"/"+(.conclusion//"")')
    done
    echo "$repo attempt $i: ${st#*/}"
    [ "${st#*/}" = "success" ] && return 0
    gh run rerun "$run" --repo "Hivek-Dev/$repo" --failed
    sleep 30
  done
  return 1
}
deploy () {
  repo=$1; dir=$2; msg=$3
  cd "$dir"
  git add -A
  git commit -q -m "$msg"
  git push -q origin main
  sha=$(git rev-parse HEAD)
  sleep 12
  run=$(gh run list --repo "Hivek-Dev/$repo" --limit 15 --json databaseId,headSha \
        --jq "map(select(.headSha==\"$sha\"))|.[0].databaseId")
  echo "$repo run=$run"
  watch_run "$repo" "$run"
}

deploy polyvik-core  <workspace>/polyvik-core  "message"
deploy polyvik-panel <workspace>/polyvik-panel "message"
```

**Watch out in zsh:** `status` is a read-only variable. That is why the script
uses `st`. If you write `status=...` the script dies with
`read-only variable: status`.

## Reading production without SSH

`generations-report.yml` (manual `workflow_dispatch` in `polyvik-core`) runs a
fixed, read-only query over `generation_logs` — the latest generations, their
model, success and duration. Use it to answer "which model produced this image?"
instead of logging into the server.

## API keys

Never by hand over SSH, never pasted into a chat:

```bash
gh secret set OPENAI_API_KEY      --repo Hivek-Dev/polyvik-core   # images (GPT Image)
gh secret set ANTHROPIC_API_KEY   --repo Hivek-Dev/polyvik-core   # text agents
gh secret set REPLICATE_API_TOKEN --repo Hivek-Dev/polyvik-core   # video (Seedance) and Seedream images
gh variable set VIDEO_PROVIDER    --repo Hivek-Dev/polyvik-core   # replicate | google | argolink
```

The command asks for the value in the terminal: the key never goes through the
chat or shell history. The deploy seeds it into the server's `.env`; for it to
take effect a redeploy is needed (`gh workflow run` or a commit).

`VIDEO_PROVIDER` is a repository *variable*, not a secret. The code default is
`argolink`, which is **development-only**; production should run with
`replicate`. The workflow still seeds `ARGOLINK_API_KEY` if that secret exists.
Customer-provided keys (BYOK) are never seeded: they live encrypted in the
tenant's configuration.

The deploy also normalises image settings on the server: an old
`OPENAI_IMAGE_MODEL=gpt-image-2…` is bumped to `gpt-image-2.5-sunburst`, a
fallback model is seeded if missing, and `IMAGE_PROVIDER=gemini|flux` is reset
to `openai`.

### Stripe (closed during the beta)

Online billing is built but closed: `FREE_BETA = true` in `plans.config.js`
serves prices at zero and refuses to open Stripe. Do not connect Stripe unless
the owner asks. When it opens:

```bash
gh secret set STRIPE_SECRET_KEY     --repo Hivek-Dev/polyvik-core
gh secret set STRIPE_WEBHOOK_SECRET --repo Hivek-Dev/polyvik-core
```

In the Stripe dashboard → Developers → Webhooks: endpoint
`https://api.polyvik.com/api/webhooks/stripe` with the events
`checkout.session.completed`, `customer.subscription.updated`,
`customer.subscription.deleted`, `invoice.paid` and `invoice.payment_failed`;
the signing secret it shows is `STRIPE_WEBHOOK_SECRET`. Products and prices are
not created by hand: the core creates them by `lookup_key` the first time
someone buys. The customer portal (Settings → Billing → Customer portal) has to
be enabled in Stripe. Details in [plans and credits](../product/plans-and-credits.md).

### ffmpeg

The editor's final render, audio conversion and the Feed's 3-second clips need
ffmpeg. The app ships its own (`ffmpeg-static` / `ffprobe-static`, resolved in
`src/services/ffmpegPath.js`), so a system ffmpeg is optional. The deploy tries
to install one with apt if it has root or passwordless sudo, and otherwise just
logs that the bundled one will be used. It prints `ffmpeg de la app: …` with
the binary actually chosen.

## Commit messages

Code commits are in Spanish, one line, saying **what changed for the user**, not
which files were touched. From the real history:

- `Una plantilla presta forma, no contenido: rol propio, texto controlado y trazabilidad`
  ("A template lends shape, not content: its own role, controlled text and traceability")
- `El encargo de un borrador se puede corregir hasta el último paso`
  ("A draft's brief can be corrected up to the last step")
- `ffmpeg incluido en la app, clips para los videos que ya estaban`
  ("ffmpeg bundled in the app, clips for existing videos")

Documentation commits use a `docs:` prefix.

# Working with Claude Code on this project

## What goes where

| Where | What goes there |
|---|---|
| `docs/**/*.md` | The detail: architecture, decisions, lessons learned |
| Claude's memory (`~/.claude/projects/…/memory/`) | Your personal preferences and context that does not belong to the repo |

Rule to avoid duplication: if it applies to anyone touching the repo, it goes in
`docs/`. If it is about how *you* like to work, it goes in memory.

## How to ask for things

**Give the why, not just the what.** "Campaign images come out generic —
investigate what is being sent to the model" produces a diagnosis. "Change the
prompt" produces a blind patch.

**Ask for the diagnosis before the fix** when something behaves oddly. The cause
is rarely what it looks like: the cats showing up in a piece did not come from a
prompt, they came from the role a template was travelling with.

**One layer at a time.** A change that touches core and panel is designed
together but deployed in series. "Fix the three gaps" is a fine request;
"rewrite campaigns" goes nowhere.

**Correct immediately.** If the model assumes something false, say so in that
same turn. Several good decisions in this project came from a one-line
correction ("a template marked as style should not copy the content").

## How to verify

This is the verification, and it has to be done:

```bash
# panel: typecheck + build
cd polyvik-panel && npx tsc -b && npm run build

# core: syntax of what you touched
node --check src/services/whatever.services.js

# core: the import graph is not broken (catches cycles and bad paths)
node -e "process.env.DATABASE_URL='postgres://x:x@localhost:5432/x';
  import('./src/routes/campaigns.routes.js').then(()=>console.log('OK'))"

# core: unit tests (the flag is required for mock.module)
npm test
# or a subset: node --experimental-test-module-mocks --test test/pricing.test.js
```

Integration tests (`npm run test:integration`) need the local Postgres.

For pure logic (a sanitizer, a time-zone conversion), ask for a real test with
known cases before deploying. It takes a minute and catches what types do not.

**Demand that verified and unverified are kept apart.** A migration that was
deployed and a flow nobody ran are not at the same level, and the report has to
say so.

## What Claude Code can reach from the terminal

This does not depend on the model you have selected.

**Can reach:** the repo files, `git`, `gh` (i.e. trigger a deploy) and the
LOCAL database.

**Cannot reach:** the production servers (`argo` for core, `hydra` for panel —
there is no entry for them in `~/.ssh/config`) or the production database. The
only thing that reaches production is the GitHub Action deploy, on purpose; see
[deployment.md](../architecture/deployment.md). For read-only questions about
production generations there is the manual `generations-report.yml` workflow.

What *is* connected to production is YOUR panel on port 5173: `npm run dev`
talks to `https://api.polyvik.com` with your real account. That is why you see
real data when testing — but it is your browser, not the terminal.

**The local database is Homebrew's**, not a container: `brew services start
postgresql@16`, database `polyvik_dev`, which is the one already in the core's
`.env`. Use it to run migrations and new queries before shipping them. For
migration experiments, create a throwaway database (`createdb …`, run
`src/db/migrate.js` against it, `dropdb` afterwards). Spinning up a Postgres in
Docker instead has happened before and it confuses things: it looks like you are
touching something else.

## Running the panel locally

- `npm run dev` (port 5173) points at **production**: real data, real account.
  This is what the owner uses to preview changes without deploying. **Do not
  touch it.**
- `npm run dev:local` (port 5174) points at a local core on port 4000, with the
  local Postgres and a local review account. Use it to review screens with
  screenshots without touching production.
- The core runs locally with `npm run dev` (API), `npm run dev:worker` (full
  worker) or `npm run dev:video` (video-queue-only worker). Use the full worker
  **or** the video worker against a database, never both.

Never create `.env.local` in the panel: it changes where `npm run dev` points and
kills your production session. It has happened.

## Useful tools

- **`/compact`** when the conversation gets long. It summarises and you keep
  going without losing the thread — better than opening a new session mid-task.
- **Plan mode** for large changes: the plan is approved before code is written.
- **`/code-review ultra`** reviews the branch with several agents. You launch
  it, it is billed separately, and it finds things a normal read does not.
- **Background work** for deploys: they take minutes and there is no point
  blocking the session waiting for them.

## Things that already went wrong

- **Editing the wrong file.** Some screens look alike (e.g. `Materials.tsx` is
  the Library page; `components/BrandAssets.tsx` is only used by event detail).
  If a change "does not show up", the likely cause is that the unused component
  was edited. Send a screenshot.
- **i18n keys in the wrong block.** It compiles anyway and leaves the dictionary
  unreadable. TypeScript only catches missing keys, not misplaced ones.
- **`--limit 1` on `gh run list`.** It grabs an old run. Always match by SHA
  (see [deployment.md](../architecture/deployment.md)).
- **`status=` in a zsh script.** It is a read-only variable; the script dies.
- **Taking a subagent's report at face value.** An auditor flagged as a bug that
  `PageHeader` does not render the title inside a hub; that was a product
  decision. Verify before "fixing".

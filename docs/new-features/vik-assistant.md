# Vik: in-panel AI assistant

**Status:** parked (removed from main on 22 Sep 2026, half-built and off behind `VIK_ENABLED = false`).
**Priority:** medium. **Effort:** M (3–5 days to re-integrate and finish phase 2).

## Summary

Vik is a floating chat inside the panel. It knows which page the user is on and which brand is active, and it does what the "with AI" buttons do, but conversationally.
- **Entry points:** a ⌘K side chat, and a compact card opened with right-click that also knows what you pointed at (selected text, a field with its value, a button, an image or a paragraph).
- **In New campaign:** it filled in the brief.
- **With a piece open:** it proposed new copy or a new image, applied with one button.

## Why it matters

- It lowers the learning curve: users ask instead of hunting for the right button.
- It pairs naturally with the pipeline chat builder (`pipeline-chat-builder.md`): the same chat surface could build canvas flows.

## Design (as built)

- **Core:** `src/vik/`, isolated from the rest.

  | File | Role |
  |---|---|
  | `vik.config.json` | Name, model, effort, limits, greeting, enabled tools (editable by hand) |
  | `personality.md` | The system prompt: how it talks and works |
  | `config.js` | Reads both files on every request, so edits apply without a restart |
  | `tools.js` | The tools |
  | `vik.services.js` | Context + tools + the model loop |

- **Routes:** `GET /api/vik/hello`, `POST /api/vik/chat`, `POST /api/vik/apply`.
- **Panel:** the conversation lives in `src/context/VikContext.tsx`, mounted in `Layout` so it survives navigation. It is shown by `VikChat.tsx` (the large chat, floating or docked), `VikMini.tsx` (the right-click card) and `VikMessages.tsx`. `lib/chatMarkdown.tsx` renders safe markdown, with no raw HTML.
- **Pointing:** the pointed-at element travels as `focus` and is prepended as "Pointed at on screen". Shift + right-click keeps the browser menu.
- **The rule that must not break: Vik proposes, the user applies.**
  - Read tools only read.
  - Propose tools return `{ proposal: { kind, changes, before, rationale } }`, rendered as a before/after with an *Apply* button.
  - Only that button calls `/api/vik/apply`, which writes with the same service the page's Save button uses, under the same tenant.
- **Adding a tool:** in `tools.js`, add an object with a `schema`, a `kind` (`read` or `propose`) and `run(input, { brandId, tenantId })`. `run` calls existing services, never the UI and never raw SQL. Enable it in `vik.config.json` and document it in `personality.md`.

## Phases

1. **Done:** brand voice (tone, personality, notes, description).
2. **Next:** the whole app. Series, a new campaign from one sentence, tagging materials.
3. **Later:** proactive nudges, such as "you have three pieces to approve".

## Where the code lives

Everything is in the GitHub branch **`wip/vik-voz`**:
- **`polyvik-core`:** `src/vik/`, `src/controllers/vik.controller.js`, `src/routes/vik.routes.js` and `test/vikPiece.integration.test.js`.
- **`polyvik-panel`:** the Vik components, context and faces in `public/vik/`.
- **Workspace notes:** in `polyvik-core@wip/vik-voz:parked/vik/`. There you'll find the original README, `docs/vik.md`, the connection patches (`core-conexion.patch`, `panel-conexion.patch`) and the `vik:` i18n blocks.

## Re-integration notes

- The patches were made against the 22 Sep code and include unrelated changes. Use them as a guide; don't `git apply` them.
- The i18n keys to restore are `nav.askVik`, `account.hints*` and `planPage.incVik`.
- Re-add the `vik_chat` task to `llmTasks.config.js`, with a pricing entry.
- Restyle it to the DNA style (outlines, discreet backgrounds, 10px corners, notifications instead of inline errors).

# Audience, language and editorial review

## Authority

`editorialContext.services.js` holds the criteria shared by proposals, copywriter,
designer, blog, sections, the DNA assistant, kit palette and elements, visual notes,
Studio and correction learning. It is split in two so it caches well: the
**rules** (`editorialRules()`, identical for every brand) and the **facts**
(`editorialFacts()`, this brand and this request).

DNA → Voice stores `voice.audience` and `voice.locale` (free text for language and
variant, e.g. "Español de México", not a fixed market list). A partial voice update
keeps the other fields. No migration: existing JSONB.

«Sobre tu negocio» (`brand_profiles.description`) is the one free text about the
business. «Notas particulares» was folded into it by migration 089, and the
personality lives in the tone; `notes` and `personality` are no longer written or
read (the columns stay for rollback). The visual direction is not editorial
context: only image generation reads it.

Priority: the user's explicit request, then the language chosen for the
piece/campaign, then DNA language and audience. `editorialLocale()` resolves the
language: when the piece setting (`textLanguage`, a code such as `es`) and the DNA
variant speak the same language, **the variant wins** — a bare `es` used to
produce neutral, translated-sounding Spanish. With no selection, the business and
request decide; the time zone is a hint, never proof of country or audience. A
Mexican business and audience imply Mexican Spanish unless told otherwise. The UI
language or an incidental English phrase does not change the editorial language.
Age, income or knowledge of the audience are never invented.

Creators write ideas, copy and briefs directly in the editorial language. There is
no English-brief requirement and no final translation step. Some technical
provider-contract headings and field names stay in English; they are not copy. The
provider's internal reasoning language is not controlled — only context,
instructions and outputs.

## Joint finish in campaigns

> Under the production `lite` profile the finish is **skipped when text is
> integrated** (the default), and its second review pass is off in every mode.
> See [AI usage and costs](../architecture/ai-usage-and-costs.md). The contract
> below applies when it runs (composited pieces, or the `lean`/`baseline` profiles).

`publicationFinish.services.js` receives the post, the executable design, its
inputs, the model image and a mobile proof over the generated scene with the real
graphics, flat logo and font. It adjusts editorial layers while respecting the
photo that actually exists. Without a real font and with provider-drawn text, the
finish runs before drawing, since that lettering is not an editable layer. It
delivers a publication: it keeps the version that works or returns a corrected
post and/or editorial layers. It may synthesize and redistribute without inventing
facts. It never returns a list of critiques that leaves the user without an image.

It returns flat changes to `textBlocks`, `textLayout`, `graphics`, `logo` and
`alt_text`; it does not redescribe the scene or select materials. An omitted field
keeps its value; `reason` is optional. An image improvement is compiled with
`compileImageBrief`, the same contract as the initial designer (so the
copywriter's locked image text is kept). If it fails, the last complete version is
kept atomically — a new post is never mixed with a half-corrected composition. A
post the user chose to keep never changes. Initial copy only retries real
publishing constraints or explicit brand instructions; punctuation and hashtag
preferences remain observations.

`imagePlan.editorialReview` keeps historical compatibility and adds `version: 2`,
`status` (`kept`, `refined`, `retained`), decision and diagnostics. Actions are
explicit: `post/image.action = keep | replace`. `passed: false` marks an improvement
that was not applied. History records `publication_finish`. An AI review does not
prove facts or guarantee naturalness; it does not research prices and must drop or
rephrase unsupported claims.

## Moldes and legibility

New zones add priority, group, purpose and an optional condition, stored in
`brand_templates.zones` (format adaptation included). Older Moldes keep working with
a compatible reading, without rewriting their records. `layoutIntent.services.js`
shares the criteria with extraction, Polyvik Moldes, designer and finish.
Extraction measures the original; it does not enshrine its crowding as a rule. The
panel lets users mark supports as optional.

Editorial selection comes before boxes: `IMAGE_CONTENT_SELECTION` is shared by
designer and finish. Post and inputs are material to choose from, not a list to
transcribe. Saved Molde lines guide each group's length without mandatory word
counts or line breaks. Secondary supports may stay in the post; chosen arguments
keep their units and conditions. A graphic block does not require text, and note
treatments do not force every ornament of the original. The designer and the
finish see the Molde drawing, even with extracted zones, to compare density and
pauses; that drawing never reaches the provider. The image may carry fewer
arguments than the post, and the alt text is updated when the visible message
changes.

Molde and scene-zone geometry is a guide. Margins, group spacing, estimated
contrast and zone overlaps are observations, not errors. Execution still checks
valid active properties, canvas bounds, font availability, glyphs, and that the
real text fits without overlapping.

## Verification

`editorialContext.test.js`, `imageText.test.js`, `imageTextVoice.test.js`,
`imageCompositionFlow.test.js` and `visualIdentity.test.js` cover context,
exceptions, zone semantics, spacing, review and retries before render. No real
images are generated in these tests.

Related: [Text composition](text-composition.md), [Image engine](image-engine.md),
[brand kit](../product/brand-kit.md), [glossary](../guides/glossary.md).

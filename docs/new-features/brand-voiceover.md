# Brand voiceover (cloned voice) and captions from audio

**Status:** parked (removed from main on 22 Sep 2026; it only ran on a local Mac).
**Priority:** medium, and blocked by legal/consent work. **Effort:** L (hosting the models plus the consent flow).

## Summary

1. **Brand voiceover.** The customer uploads 15–60 s of a voice and any script is read in that voice.
   - The audio can go to Seedance 2.5 as a reference (`reference_audios`, `@Audio 1`) for a lip-synced video.
   - It targets Spanish for Latin America and Spain, in 15–30 s pieces.
   - Model: **Chatterbox Multilingual** (MIT, with Latin American and Spain variants, an imperceptible audio watermark, and it runs on `mps`).
2. **Captions from audio.** whisper.cpp (`ggml-small`) produces word-level timings, and ffmpeg measures the silences. The editor function that placed the captions is `rotulos.ts`.

## What was in the product before removal

- **Panel:** a Canvas audio node to upload or record a sample (up to 30 s) and connect it to the video node, with a purple cable on an `audio` port.
- **Core:** `createVideoJob` accepted `audios[]` and validated ownership (`video-audio-t…-b…`) and model limits. `buildVideoPrompt` switched to references mode and asked for lip sync with `@Audio 1`, and the provider sent `reference_audios`.
- **Kept in main** because the video editor uses them: `POST /api/video/audio` (upload, MP3 conversion, duration) and `storeReferenceAudio`.

## Decisions already researched (17 Sep 2026)

- **Hosting:** the plan was the same Chatterbox model on Replicate, at about US$0.006 per voiceover.
- **ElevenLabs Pro is not allowed** for a reseller like Polyvik. Its OEM terms forbid "Making Available" below the Scale plan (US$299/month).
  - It would also require ElevenLabs to be a third-party beneficiary of Polyvik's customer terms, plus indemnification and audits.
  - Its ToS grants ElevenLabs a perpetual license over uploaded voices and voice models, which is a GDPR concern. Have a lawyer read it.
- **Consent is mandatory before turning anything on:**
  - **EU AI Act art. 50** has applied since 2 Aug 2026: machine-readable marking is required from us, and visible disclosure from our customers. Marketing with a "realistic synthetic influencer" is explicitly covered.
  - **Mexico (14 May 2026):** cloning a commercial voice actor needs express, prior written consent, with new authorization and payment for each new use. *(Not verified against the official text.)*
  - **Spain:** under LO 1/1982, using a voice in advertising without express consent is an unlawful intrusion.
  - **US:** Tennessee and Utah also penalize whoever provides the tool.
  - **Industry standard:** a recorded consent with a dictated phrase, plus speaker matching. Speechify provides this through its API. A checkbox is not enough.

## Where the code and docs live

In `polyvik-core@wip/vik-voz:parked/voz/` on GitHub:
- `README.md`, the local service (`service/server.mjs`, `service/voz.mjs`) and `voz/clonar.py` with its README;
- `render/transcribir.mjs` and `rotulos.ts`;
- `docs/10-clonacion-de-voz.md` (models and licenses) and `docs/11-leyes-de-la-voz.md` (laws and provider terms, with sources);
- `integracion/` with the Canvas audio node patch, the core reference-voice patch and the i18n keys.

Not kept, because they can be reproduced: the Python venv (`pip install` from the README), `models/ggml-small.bin` (a whisper.cpp download) and `node_modules`.

## Re-integration order

1. The consent flow and legal review.
2. Decide the hosting (Replicate).
3. Core (apply the reference-voice patch by hand).
4. Panel (audio node). Remove the `upgradeDoc` filter that currently strips `audioNode` from saved canvases.

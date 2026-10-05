# Reproducible local Vocabulary N5 audio catalog

## Publish approved static assets

Run `python scripts/export-vocabulary-audio.py` after generating/auditing the catalog.
This copies only unflagged MP3s to `public/audio/vocabulary/n5/`, retains provenance,
and writes the public and TypeScript manifests. No TTS runs in Angular or its build.
To reintroduce a flagged word after listening approval, add its stable ID to
`scripts/vocabulary-audio-approved.json` and rerun the exporter. Multi-reading
exclusions cannot be approved through this file. V1 has no approvals: 606 assets.

Uses the existing isolated Python environment and shared Kokoro POC tooling.
No Angular integration, network APIs, production dependencies or data edits.

```powershell
.cache/kokoro-poc/venv/Scripts/python.exe -m pip install -r scripts/kokoro-japanese-poc-requirements.txt
.cache/kokoro-poc/venv/Scripts/python.exe -X utf8 scripts/generate-vocabulary-audio.py --offline
.cache/kokoro-poc/venv/Scripts/python.exe -X utf8 scripts/generate-vocabulary-audio.py --audit-only
.cache/kokoro-poc/venv/Scripts/python.exe -m unittest discover -s scripts -p 'vocabulary_audio_test.py'
```

Omit `--offline` for the first official model download. See the POC documentation
for creating the Python environment. All output stays in ignored
`.cache/vocabulary-audio/`. The prepared `catalog/` contains only `<entry.id>.mp3`,
`manifest.json` (`id → relative filename`) and `PROVENANCE.md`. It can later be
copied as a unit to an Angular static assets directory after quality approval.
WAV intermediates and Opus/WebM comparisons stay outside the final catalog.

Eligibility is conservative: nonempty single kana reading, optionally the long
vowel mark; whitespace, alternative separators and unexpected symbols are excluded.
No normalization, first-alternative selection or spelling fallback is performed.
Long readings and G2P boundaries are flagged; unsupported G2P is an error and is
never silently passed to Kokoro. Exclusions and per-entry errors are reported.

The pinned official weights, packages, seed 0, CPU, speed 1 and mono 24kHz settings
are recorded. Valid intermediate caches and matching POC reading samples are
reused. WAV caches have per-ID input/settings metadata; stale inputs regenerate.
Per-entry failures do not abort other entries. Every final encoding is decoded
again to check duration, silence, clipping and consistency with its WAV.

Both formats are encoded from identical WAVs: MP3 80kbps and Opus/WebM 32kbps VBR.
The report compares total/mean bytes. MP3 is chosen for broad Chrome/Safari
compatibility ([MDN container guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Containers));
the lower Opus bitrate is a distribution candidate, not a claim of equal quality.
No real Safari playback test has been performed by this local generator.

`listen.html` contains a deterministic 60-entry representative sample including
the previous 40 POC entries (九 is shown excluded, without audio), additional
categories/phonetic cases, and a second table with ALL flagged/excluded/error
entries. Actual pronunciation quality still needs listening review. Reports are
JSON/CSV; exclusions are also written separately; each MP3 has a SHA-256.

Integrity checks reject unknown IDs, duplicate/shared files, missing/orphan MP3s,
non-ID filenames, mismatched manifest coverage or WAV/WebM in final assets.
Existing orphan files are reported as an integrity failure, never silently deleted.

## Completed catalog audit (2026-10-05)

- 662 entries; 648 eligible/generated (97.9%); 14 excluded; zero generation errors.
- Duration: 727.95 seconds (12:07.95).
- WAV intermediates: 34,970,112 bytes. MP3: 7,847,712 bytes, mean 12,110.67 bytes.
- Opus/WebM: 2,785,251 bytes, mean 4,298.23 bytes. Bitrates differ (80 vs 32 kbps),
  so this is a size comparison, not an assertion of equal auditory quality.
- 42 generated entries flagged for internal G2P boundaries; all are available
  in the QA table. The previously incorrect spelling selections are avoided.
- Representative QA: 60 entries including the 40 POC entries and excluded 九.
- Fresh generation and a separate `--audit-only` run both validated all 648
  WAV/MP3/WebM files. Exact manifest coverage, stable IDs, no orphan/final WAVs,
  source-reading equality and MP3 SHA-256 checks passed.
- 14 Python unit tests and 797 Angular regression tests passed. Angular build
  passed with existing size budget warnings. Nothing is integrated into Angular.

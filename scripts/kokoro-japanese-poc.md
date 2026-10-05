# Local Japanese audio POC

No Angular integration or production dependencies. Reads 40 existing Vocabulary N5
entries without modifying them. Outputs WAV PCM16, 24 kHz, at normal speed using
the official `hexgrad/Kokoro-82M` weights and the main candidate `jf_alpha`.
**Displayed text = primaryWrittenForm; TTS input = primaryReading exclusively.**
The displayed spelling is never sent to the synthesizer or G2P. No NHK metadata
is used. The previous two-voice spelling/reading comparison is retained locally
as an archive, but this script cannot synthesize from spellings anymore.

Model loading, dataset parsing and pinned constants are shared in `kokoro_audio.py`
with the full catalog generator; see `generate-vocabulary-audio.md` for that tool.

## Reproduce (Python 3.12, PowerShell)

```powershell
python -m venv .cache/kokoro-poc/venv
.cache/kokoro-poc/venv/Scripts/python.exe -m pip install -r scripts/kokoro-japanese-poc-requirements.txt
.cache/kokoro-poc/venv/Scripts/python.exe -X utf8 scripts/kokoro-japanese-poc.py --list
.cache/kokoro-poc/venv/Scripts/python.exe -X utf8 scripts/kokoro-japanese-poc.py
# Once the official model has been cached, no network is needed:
.cache/kokoro-poc/venv/Scripts/python.exe -X utf8 scripts/kokoro-japanese-poc.py --offline
```

First inference downloads the official model/voices. Model cache, environment,
audio, CSV/JSON report and `listen.html` stay under the already ignored `.cache/`.
Open `.cache/kokoro-poc/audio-reading/listen.html` locally for the current 40-word
reading-only sample. It links to the original comparison. Its CSV/JSON reports
record spelling, expected reading, actual TTS input, voice, file, phonemes and
review flags, explicitly identifying the three previously problematic cases.
The 26 existing `jf_alpha` reading-input WAV files are referenced rather than
copied or resynthesized when their model revision, package versions and phonemes
match. The other 14 samples are generated in `audio-reading/`.
`report.json` records the exact official model SHA and package versions. The SHA
is pinned by default; use `--revision SHA` to choose another official revision. CPU inference,
seed 0, speed 1; bit-identical output across platforms is not guaranteed.

The stock `misaki[ja]` installation attempts to compile `pyopenjtalk` on this
Windows machine and fails without MSVC/nmake. This isolated environment uses
the documented drop-in `pyopenjtalk-plus` binary instead; Kokoro itself and
its Japanese G2P remain unchanged. No system compiler installation is needed.
The pinned requirements explicitly install the Japanese extras without asking
pip to compile the original `pyopenjtalk` package.

## Provenance / limitations

- Model and inference library: [official Kokoro model card](https://huggingface.co/hexgrad/Kokoro-82M)
  and [hexgrad/kokoro](https://github.com/hexgrad/kokoro), Apache-2.0.
- [Official voice list](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md)
  lists Japanese support, `jf_alpha` and `jf_gongitsune`. It associates the latter
  with a CC BY source, [koniwa's Gongitsune material](https://github.com/koniwa/koniwa/blob/master/source/tnc/tnc__gongitsune.txt).
  Preserve the upstream license/attribution if redistributing model/voice assets.
- [pyopenjtalk-plus](https://github.com/tsukumijima/pyopenjtalk-plus): MIT wrapper;
  Open JTalk has its own modified BSD license. This tool uses G2P, not its HTS voice.
- Upstream warns about short utterances and limited Japanese training data.
  `jf_alpha` is the provisional educational candidate because upstream reports
  more training data and a higher grade. This is NOT a listening evaluation.
- The report exposes the G2P output for the actual reading input, flags separators,
  unknown symbols and word boundaries, checks finite/non-silent audio and reports
  clipping. For the three previous errors it checks the known expected phonemes.
  This does not certify pronunciation,
  pitch accent, intelligibility or naturalness. Native-speaker listening review
  is required before choosing an educational voice or integrating Listening.

## Archived original comparison (2026-10-05)

- Official model SHA: `f3ff3571791e39611d31c381e3a41a3af07b4987`.
- 26 words × 2 voices × 2 input forms = 104 valid, non-silent WAV files.
  All reread successfully at 24 kHz; no clipped samples. Durations: 0.8–1.85 s.
- Spelling G2P differs from the dataset reference for `お母さん` (`ohahasan`
  instead of `okaasan`), `お父さん` (`ochichisan` instead of `otousan`), and
  `明日` (`asu` instead of the selected `ashita`). `asu` is another valid reading,
  but does not match this entry's `primaryReading`. These are frontend findings,
  not an acoustic transcription. The paired reading-input files are available.
- `学生` has a word-boundary space in the kana-input phonemes; review the paired
  files for an unwanted pause. Segmental equivalence alone does not validate timing.
- `jf_alpha` remains a provisional candidate based on upstream metadata only.
  Neither voice has received a native-speaker listening approval.
- Optional pyopenjtalk-plus ONNX/Nani prediction was not installed. Kokoro's
  default Japanese path uses Misaki/Cutlet; synthesis completed without it.
- Full installed dependency versions are preserved locally in
  `.cache/kokoro-poc/requirements.lock.txt`. Angular build passed with existing
  budget warnings; Angular dependencies and application files are unchanged.

## Reading-only validation (2026-10-05)

- 40 real entries, `jf_alpha` only, with literal `primaryReading` as TTS input.
- The three incorrect spelling selections disappear at the G2P level:
  `おかあさん → okaːsaɴ`, `おとうさん → otoːsaɴ`, `あした → aɕita`.
  This is not a claim of native-speaker acoustic approval.
- Covers sokuon (`あさって`, `切手`, `三つ`, `せっけん`, `ベッド`), nasal mora,
  katakana vowel length (`コーヒー`, `タクシー`), おう/えい, contracted sounds,
  kana-only entries, verbs, adjectives, polyphonic kanji and counters
  (`一つ`, `二人`, `三つ`, `二日`).
- The current dataset has no primaryReading containing `きゃ`/`キャ`. Its only
  `きゅ` example is `九`, whose primaryReading is literally `きゅう / く`.
  The POC deliberately sends that exact input and flags it as a negative case:
  G2P emits `kʲɨː / kɯ`; the slash is unsupported by the model and it is not one
  pronunciation. Do not use this sample as educational audio. No alternative
  has been selected silently and the dataset has not been changed.
- `学生` produces `ɡakɯ seː` and `ゆっくりと` produces `jɯʔkɯɾʲi to`, with
  boundaries requiring a possible-pause listening check. Long-vowel conversion
  `えい → eː` is expected; audio review is pending.
- All 40 referenced WAVs reread at 24 kHz, finite/non-silent and without clipping.
  26 were reused and 14 generated; no duplicate copies of earlier reading audio.
- Do not generate all 662 words until listening quality is approved and entries
  with multiple alternatives in primaryReading have an explicit editorial policy.

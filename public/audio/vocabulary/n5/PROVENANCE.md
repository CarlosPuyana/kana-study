# Vocabulary N5 synthetic audio provenance

Generated locally, not derived from NHK/Japanese 1500 recordings.

- Model: official [hexgrad/Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M),
  Kokoro v1.0, SHA `f3ff3571791e39611d31c381e3a41a3af07b4987`.
- Model weights and [inference library](https://github.com/hexgrad/kokoro): Apache-2.0.
- Voice: official `jf_alpha`; see the [upstream voice list](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md).
  Voice quality/training metadata does not certify pedagogical correctness.
- Kokoro Python 0.9.4, Misaki 0.9.4. Full versions are recorded in report.json.
- TTS pronunciation source: each existing VocabularyEntry.primaryReading exclusively.
  Written forms are display metadata; lists/alternative readings are excluded.
- Japanese G2P uses Misaki/Cutlet (MIT-derived) and dictionary data. The local
  Windows dependency pyopenjtalk-plus is MIT; Open JTalk is modified BSD.
- Encoding uses bundled FFmpeg through imageio-ffmpeg (BSD-2-Clause wrapper).
  Its Windows binary has its own FFmpeg GPL build license; no binary is included
  in the prepared audio catalog or application.

Retain upstream license/notices if distributing model, library or voice assets.
These MP3s are labeled synthetic. No model binaries accompany the catalog.
Acoustic/native-speaker approval is still pending; automatic validation does not
certify reading quality, prosody, pitch accent or suitability for learners.

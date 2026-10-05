"""Local-only Kokoro POC. See kokoro-japanese-poc.md for isolated installation."""
import argparse
import csv
import html
import json
from kokoro_audio import (WORK, MODEL, REVISION, POC_WORDS as WORDS,
                          vocabulary, load_pipeline, package_versions)
VOICES = ['jf_alpha']
PREVIOUS_CASES = {'お母さん': 'okaːsaɴ', 'お父さん': 'otoːsaɴ', '明日': 'aɕita'}


def entries():
    data = vocabulary()
    selected = []
    for word in WORDS:
        matches = [entry for entry in data if entry['primaryWrittenForm'] == word]
        if len(matches) != 1:
            raise ValueError(f'Expected one dataset entry for {word}, got {len(matches)}')
        selected.append(matches[0])
    return selected


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--revision', default=REVISION, help='Exact official HF commit')
    parser.add_argument('--offline', action='store_true', help='Use already downloaded official weights only')
    parser.add_argument('--list', action='store_true', help='Validate selection without dependencies or downloads')
    args = parser.parse_args()
    selected = entries()
    if args.list:
        for entry in selected:
            print(entry['primaryWrittenForm'], entry['primaryReading'])
        return

    import numpy as np
    import soundfile as sf
    import torch
    revision = args.revision
    pipeline, snapshot = load_pipeline(revision, args.offline, VOICES)
    output = WORK / 'audio-reading'
    output.mkdir(parents=True, exist_ok=True)
    previous_report = WORK / 'audio' / 'report.json'
    previous = json.loads(previous_report.read_text(encoding='utf-8')) if previous_report.exists() else {}
    packages = package_versions()
    reusable = (previous.get('model') == MODEL and previous.get('revision') == revision
                and previous.get('packages') == packages and previous.get('sampleRate') == 24000
                and previous.get('seed') == 0 and previous.get('speed') == 1
                and previous.get('device') == 'cpu')
    rows = []
    for voice in VOICES:
        voice_tensor = torch.load(snapshot / f'voices/{voice}.pt', weights_only=True, map_location='cpu')
        for index, entry in enumerate(selected, 1):
            word, reading = entry['primaryWrittenForm'], entry['primaryReading']
            # The displayed spelling is metadata ONLY. Never pass it to G2P/TTS.
            tts_input = reading
            reading_ps, _ = pipeline.g2p(reading)
            old = next((row for row in previous.get('rows', []) if reusable
                        and row['word'] == word and row['expectedReading'] == reading
                        and row['voice'] == voice and row['mode'] == 'reading'
                        and row['phonemes'] == reading_ps), None)
            if old and (previous_report.parent / old['file']).is_file():
                name = '../audio/' + old['file']
                audio, rate = sf.read(output / name)
                if rate != 24000:
                    raise RuntimeError(f'Unexpected cached audio sample rate: {word}')
                reused = True
            else:
                chunks = list(pipeline(tts_input, voice=voice_tensor, speed=1))
                if len(chunks) != 1 or chunks[0].phonemes != reading_ps:
                    raise RuntimeError(f'Unexpected G2P chunks: {word}')
                audio = chunks[0].audio.detach().cpu().numpy()
                name = f'{index:02d}-{entry["id"]}-{voice}-reading.wav'
                sf.write(output / name, audio, 24000, subtype='PCM_16')
                reused = False
            peak = float(np.max(np.abs(audio)))
            if not np.isfinite(audio).all() or peak < 0.0001:
                raise RuntimeError(f'Invalid or silent audio: {word}/{voice}')
            flags = []
            if any(char not in 'ー' and not ('ぁ' <= char <= 'ゖ' or 'ァ' <= char <= 'ヺ') for char in reading):
                flags.append('primaryReading contains alternatives/separators; not one pronunciation')
            if ' ' in reading_ps:
                flags.append('G2P word boundary: review possible pause')
            if '❓' in reading_ps or any(char not in pipeline.model.vocab for char in reading_ps):
                flags.append('Unknown/unsupported G2P symbols')
            fixed = reading_ps == PREVIOUS_CASES[word] if word in PREVIOUS_CASES else None
            if fixed is False:
                flags.append('Previous problematic case does not match expected phonemes')
            rows.append(dict(primaryWrittenForm=word, primaryReading=reading, ttsInput=tts_input,
                             voice=voice, file=name, phonemes=reading_ps,
                             previousProblematicCase=word in PREVIOUS_CASES,
                             previousReadingErrorRemoved=fixed, reviewFlags='; '.join(flags),
                             reused=reused, seconds=round(len(audio)/24000, 3), peak=round(peak, 5),
                             clippedSamples=int(np.count_nonzero(np.abs(audio) >= 1))))
            print(f'{word}\t{reading}\t{tts_input}\t{voice}\t{name}\t{reading_ps}\t{"; ".join(flags)}', flush=True)
    metadata = dict(model=MODEL, revision=revision, voices=VOICES, sampleRate=24000,
                    seed=0, speed=1, device='cpu',
                    pronunciationSource='primaryReading exclusively', packages=packages,
                    acousticReview='Not performed: listening and native-speaker review required', rows=rows)
    (output / 'report.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding='utf-8')
    with (output / 'report.csv').open('w', encoding='utf-8-sig', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    table = ''.join('<tr>' + ''.join(f'<td>{html.escape(str(row[key]))}</td>' for key in
                    ['primaryWrittenForm', 'primaryReading', 'ttsInput', 'voice', 'phonemes',
                     'previousProblematicCase', 'previousReadingErrorRemoved', 'reviewFlags']) +
                    f'<td><audio controls preload="none" src="{row["file"]}"></audio></td></tr>' for row in rows)
    (output / 'listen.html').write_text('<!doctype html><meta charset="utf-8"><title>Kokoro Japanese POC</title>'
        '<style>body{font:16px sans-serif;padding:20px}td,th{padding:8px;border-bottom:1px solid #aaa}'
        'table{border-collapse:collapse}audio{max-width:260px}</style><h1>Kokoro Japanese POC</h1>'
        '<p>Displayed text = primaryWrittenForm; TTS input = primaryReading only. '
        'Native-speaker listening/pitch-accent review is pending. '
        '<a href="../audio/listen.html">Previous spelling/reading comparison</a></p><table><thead><tr>'
        '<th>Word</th><th>Expected reading</th><th>Actual input</th><th>Voice</th><th>Phonemes</th>'
        '<th>Previous problem</th><th>Reading error removed (G2P)</th><th>Review flags</th>'
        '<th>Audio</th></tr></thead><tbody>' + table + '</tbody></table>', encoding='utf-8')
    print(f'{len(rows)} words: {sum(row["reused"] for row in rows)} reused reading files, '
          f'{sum(not row["reused"] for row in rows)} new WAV files in {output}; model revision {revision}')


if __name__ == '__main__':
    main()

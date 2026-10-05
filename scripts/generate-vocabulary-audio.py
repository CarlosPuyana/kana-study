"""Generate/audit local Vocabulary N5 audio; never synthesize from written forms."""
import argparse
import csv
import hashlib
import html
import json
from pathlib import Path
import shutil
import subprocess

from kokoro_audio import (ROOT, WORK, MODEL, REVISION, VOICE, RATE, POC_WORDS,
                          vocabulary, load_pipeline, package_versions,
                          eligibility_reason, g2p_flags, audio_metrics)

OUTPUT = ROOT / '.cache' / 'vocabulary-audio'


def write_json(path, data):
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True) + '\n', encoding='utf-8')
    temporary.replace(path)


def exclusion(entry):
    reason = eligibility_reason(entry['primaryReading'])
    return dict(id=entry['id'], word=entry['primaryWrittenForm'],
                primaryReading=entry['primaryReading'], reason=reason) if reason else None


def validate_manifest(entries, manifest, filenames):
    ids = {entry['id'] for entry in entries}
    if not set(manifest) <= ids:
        raise ValueError('Manifest contains nonexistent vocabulary IDs')
    if len(set(manifest.values())) != len(manifest):
        raise ValueError('Two IDs share one audio asset')
    if any(name != id + '.mp3' for id, name in manifest.items()):
        raise ValueError('Audio filename does not match stable entry ID')
    if set(filenames) != set(manifest.values()):
        raise ValueError('Missing or orphaned audio assets')


def qa_selection(entries, rows, target=60):
    chosen = [entry for word in POC_WORDS for entry in entries if entry['primaryWrittenForm'] == word]
    ids = {entry['id'] for entry in chosen}
    valid = {row['id'] for row in rows}
    candidates = sorted((e for e in entries if e['id'] in valid and e['id'] not in ids), key=lambda e: e['id'])
    groups = [
        lambda e: 'っ' in e['primaryReading'] or 'ッ' in e['primaryReading'],
        lambda e: 'ん' in e['primaryReading'] or 'ン' in e['primaryReading'],
        lambda e: 'おう' in e['primaryReading'], lambda e: 'えい' in e['primaryReading'],
        lambda e: all('ァ' <= c <= 'ヺ' or c == 'ー' for c in e['primaryReading']),
        lambda e: all('ぁ' <= c <= 'ゖ' for c in e['primaryWrittenForm']),
        lambda e: sum('\u4e00' <= c <= '\u9fff' for c in e['primaryWrittenForm']) >= 2,
        lambda e: len(e['primaryReading']) >= 8,
        *[lambda e, category=category: e['studyCategory'] == category
          for category in sorted({e['studyCategory'] for e in candidates})],
    ]
    for group in groups:
        item = next((e for e in candidates if e['id'] not in ids and group(e)), None)
        if item and len(chosen) < target:
            chosen.append(item)
            ids.add(item['id'])
    for item in candidates:
        if len(chosen) >= target:
            break
        if item['id'] not in ids:
            chosen.append(item)
            ids.add(item['id'])
    return chosen


def qa_html(entries, rows, excluded, errors):
    selected = qa_selection(entries, rows)
    audio = {row['id']: row for row in rows}
    failed = {row['id']: row.get('reason', row.get('error')) for row in excluded + errors}

    def table(items):
        result = []
        for entry in items:
            row = audio.get(entry['id'])
            flags = '; '.join(row['flags']) if row else failed.get(entry['id'], 'No audio')
            player = (f'<audio controls preload="none" src="catalog/{entry["id"]}.mp3"></audio>'
                      if row else '<strong>Excluded — no valid audio</strong>')
            cells = [entry['primaryWrittenForm'], entry['primaryReading'],
                     ' / '.join(entry['meanings']['es']), entry['id'], flags]
            result.append('<tr>' + ''.join(f'<td>{html.escape(text)}</td>' for text in cells)
                          + f'<td>{player}</td></tr>')
        return '<table><thead><tr><th>Palabra</th><th>primaryReading / entrada TTS</th>' \
               '<th>Significado</th><th>ID</th><th>Revisión</th><th>Audio MP3</th></tr></thead>' \
               '<tbody>' + ''.join(result) + '</tbody></table>'

    suspects = [e for e in entries if (e['id'] in audio and audio[e['id']]['flags']) or e['id'] in failed]
    return ('<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" '
            'content="width=device-width, initial-scale=1"><title>Vocabulary N5 — Audio QA</title>'
            '<style>body{font:16px system-ui;margin:20px}table{border-collapse:collapse;width:100%}'
            'td,th{padding:8px;text-align:left;border-bottom:1px solid #aaa}audio{width:240px}'
            '.scroll{overflow:auto}</style><h1>Vocabulary N5 — Audio QA</h1>'
            '<p>Voz: jf_alpha. Entrada TTS: primaryReading exclusivamente. '
            'No hay aprobación auditiva todavía; revisar lectura, ritmo, pausas y acento.</p>'
            '<p><a href="report.json">Informe completo</a> · <a href="exclusions.json">Exclusiones</a>'
            ' · <a href="catalog/manifest.json">Manifest</a></p>'
            f'<h2>Muestra representativa ({len(selected)} entradas)</h2><div class="scroll">' + table(selected)
            + '</div><h2>Todos los casos sospechosos y excluidos</h2><div class="scroll">'
            + table(suspects) + '</div></html>')


def ffmpeg_run(ffmpeg, arguments):
    return subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-nostdin', *arguments],
                          check=True, capture_output=True, timeout=120)


def decoded_audio(ffmpeg, file):
    import numpy as np
    result = ffmpeg_run(ffmpeg, ['-i', str(file), '-ac', '1', '-ar', str(RATE), '-f', 'f32le', 'pipe:1'])
    return np.frombuffer(result.stdout, dtype='<f4')


def reusable_poc(entries, fingerprint):
    found = {}
    for report_path in [WORK / 'audio-reading/report.json', WORK / 'audio/report.json']:
        if not report_path.exists():
            continue
        report = json.loads(report_path.read_text(encoding='utf-8'))
        if any(report.get(key) != fingerprint[key] for key in ['model', 'revision', 'packages', 'speed', 'seed', 'device', 'sampleRate']):
            continue
        by_word = {entry['primaryWrittenForm']: entry for entry in entries}
        for row in report['rows']:
            if 'mode' in row and row['mode'] != 'reading':
                continue
            word = row.get('primaryWrittenForm', row.get('word'))
            entry = by_word.get(word)
            if entry and row.get('primaryReading', row.get('expectedReading')) == entry['primaryReading'] and row['voice'] == VOICE:
                path = (report_path.parent / row['file']).resolve()
                if path.is_relative_to(WORK.resolve()) and path.is_file():
                    found[entry['id']] = (path, row['phonemes'])
    return found


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--offline', action='store_true', help='Use cached official model only')
    parser.add_argument('--audit-only', action='store_true', help='Revalidate existing WAV/MP3/WebM, do not synthesize/encode')
    args = parser.parse_args()
    entries = vocabulary()
    assert len(entries) == 662, 'Unexpected Vocabulary N5 count'
    excluded = [result for entry in entries if (result := exclusion(entry))]
    eligible = [entry for entry in entries if not eligibility_reason(entry['primaryReading'])]
    OUTPUT.mkdir(parents=True, exist_ok=True)
    intermediate, comparison, catalog = [OUTPUT / name for name in ['wav', 'webm-comparison', 'catalog']]
    for directory in [intermediate, comparison, catalog]:
        directory.mkdir(exist_ok=True)
    write_json(OUTPUT / 'exclusions.json', excluded)

    import numpy as np
    import soundfile as sf
    import torch
    import imageio_ffmpeg
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    ffmpeg_version = subprocess.run([ffmpeg, '-version'], capture_output=True, text=True, check=True).stdout.splitlines()[0]
    fingerprint = dict(model=MODEL, revision=REVISION, voice=VOICE, speed=1, seed=0, device='cpu',
                       sampleRate=RATE, packages=package_versions())
    old = reusable_poc(eligible, fingerprint)
    pipeline = snapshot = voice = None
    if not args.audit_only:
        pipeline, snapshot = load_pipeline(offline=args.offline)
        voice = torch.load(snapshot / f'voices/{VOICE}.pt', weights_only=True, map_location='cpu')
    rows, errors, manifest = [], [], {}
    for index, entry in enumerate(sorted(eligible, key=lambda e: e['id']), 1):
        id, reading = entry['id'], entry['primaryReading']
        wav, metadata = intermediate / f'{id}.wav', intermediate / f'{id}.json'
        mp3, webm = catalog / f'{id}.mp3', comparison / f'{id}.webm'
        try:
            expected = dict(**fingerprint, id=id, ttsInput=reading)
            cached = json.loads(metadata.read_text(encoding='utf-8')) if metadata.exists() else {}
            if wav.exists() and cached.get('fingerprint') == expected:
                audio, rate = sf.read(wav)
                phonemes = cached['phonemes']
                flags = cached['flags']
                reused = True
            elif args.audit_only:
                raise ValueError('No matching validated intermediate cache')
            else:
                phonemes, _ = pipeline.g2p(reading)
                flags = g2p_flags(reading, phonemes, pipeline.model.vocab)
                if 'Anomalous/unsupported G2P symbols' in flags:
                    raise ValueError('Anomalous/unsupported G2P symbols: ' + phonemes)
                if id in old and old[id][1] == phonemes:
                    audio, rate = sf.read(old[id][0])
                    reused = True
                else:
                    # Sole pronunciation input: exact primaryReading; no spelling fallback.
                    chunks = list(pipeline(reading, voice=voice, speed=1))
                    if len(chunks) != 1 or chunks[0].phonemes != phonemes:
                        raise ValueError('Unexpected/empty G2P chunks')
                    audio, rate, reused = chunks[0].audio.detach().cpu().numpy(), RATE, False
                audio_metrics(audio, rate)
                sf.write(wav, audio, RATE, subtype='PCM_16')
                write_json(metadata, dict(fingerprint=expected, phonemes=phonemes, flags=flags))
            metrics = audio_metrics(audio, rate)
            # Always encode both candidates from the same validated intermediate.
            if not args.audit_only:
                ffmpeg_run(ffmpeg, ['-y', '-i', str(wav), '-map_metadata', '-1', '-ac', '1', '-ar', str(RATE),
                                   '-c:a', 'libmp3lame', '-b:a', '80k', '-write_xing', '1', str(mp3)])
                ffmpeg_run(ffmpeg, ['-y', '-i', str(wav), '-map_metadata', '-1', '-ac', '1', '-c:a', 'libopus',
                                   '-b:a', '32k', '-vbr', 'on', '-application', 'voip', str(webm)])
            for file in [mp3, webm]:
                if not file.is_file() or not file.stat().st_size:
                    raise ValueError('Missing/empty encoded file: ' + file.name)
                decoded = audio_metrics(decoded_audio(ffmpeg, file))
                if abs(decoded['seconds'] - metrics['seconds']) > 0.12:
                    raise ValueError('Encoded duration mismatch: ' + file.name)
            manifest[id] = mp3.name
            rows.append(dict(id=id, word=entry['primaryWrittenForm'], primaryReading=reading, ttsInput=reading,
                             voice=VOICE, phonemes=phonemes, flags=flags, reused=reused, **metrics,
                             wavBytes=wav.stat().st_size, mp3Bytes=mp3.stat().st_size, webmBytes=webm.stat().st_size,
                             sha256=hashlib.sha256(mp3.read_bytes()).hexdigest()))
        except Exception as error:
            message = str(error)
            if isinstance(error, subprocess.CalledProcessError):
                message += ': ' + error.stderr.decode('utf-8', errors='replace')
            errors.append(dict(id=id, word=entry['primaryWrittenForm'], primaryReading=reading, error=message))
            # Only task-owned files with explicitly validated dataset IDs are removed.
            for file in [mp3, webm]:
                if file.exists() and file.parent in [catalog, comparison]:
                    file.unlink()
            print(f'ERROR {id}: {message}', flush=True)
        if index % 10 == 0 or index == len(eligible):
            print(f'{index}/{len(eligible)}: {len(rows)} OK, {len(errors)} errors', flush=True)
            write_json(OUTPUT / 'checkpoint.json', dict(completed=index, rows=rows, errors=errors))

    write_json(catalog / 'manifest.json', manifest)
    validate_manifest(entries, manifest, [p.name for p in catalog.glob('*.mp3')])
    if {row['id'] for row in rows} != set(manifest):
        raise ValueError('Generated coverage and manifest differ')
    if any(p.suffix in ['.wav', '.webm'] for p in catalog.iterdir()):
        raise ValueError('Intermediate/alternative audio present in final assets')
    report = dict(**fingerprint, total=len(entries), eligible=len(eligible), excluded=len(excluded),
                  generated=len(rows), errors=errors, durationSeconds=sum(row['seconds'] for row in rows),
                  format='mp3', ffmpeg=ffmpeg_version, wavBytes=sum(row['wavBytes'] for row in rows),
                  mp3Bytes=sum(row['mp3Bytes'] for row in rows), webmBytes=sum(row['webmBytes'] for row in rows),
                  meanMp3Bytes=sum(row['mp3Bytes'] for row in rows)/len(rows) if rows else 0,
                  meanWebmBytes=sum(row['webmBytes'] for row in rows)/len(rows) if rows else 0,
                  formatDecision='MP3 mono 24kHz 80kbps: broad Chrome/Safari compatibility. '
                                 'Opus/WebM mono 32kbps VBR retained only as size/QA comparison, not in final assets.',
                  browserReference='https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Containers',
                  qaStatus='Acoustic/pitch-accent listening review pending; automated checks are not pedagogical approval',
                  exclusions=excluded, rows=rows)
    write_json(OUTPUT / 'report.json', report)
    write_json(OUTPUT / 'suspects.json', [row for row in rows if row['flags']])
    with (OUTPUT / 'report.csv').open('w', encoding='utf-8-sig', newline='') as file:
        if rows:
            writer = csv.DictWriter(file, fieldnames=list(rows[0]))
            writer.writeheader()
            writer.writerows(rows)
    (OUTPUT / 'listen.html').write_text(qa_html(entries, rows, excluded, errors), encoding='utf-8')
    shutil.copyfile(ROOT / 'scripts/vocabulary-audio-license.md', catalog / 'PROVENANCE.md')
    report['catalogBytes'] = sum(file.stat().st_size for file in catalog.iterdir() if file.is_file())
    report['manifestIntegrity'] = 'passed: stable unique IDs, exact coverage, no orphan audio'
    write_json(OUTPUT / 'report.json', report)
    print(json.dumps({key: report[key] for key in ['total', 'eligible', 'excluded', 'generated', 'durationSeconds',
                     'wavBytes', 'mp3Bytes', 'webmBytes', 'meanMp3Bytes', 'meanWebmBytes']}, indent=2), flush=True)
    print(f'Errors: {len(errors)}; QA: {OUTPUT / "listen.html"}', flush=True)


if __name__ == '__main__':
    main()

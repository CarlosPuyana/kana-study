import array
import json
import math
import pathlib
import subprocess
import sys
import wave


def silence(wav):
    with wave.open(str(wav), 'rb') as stream:
        rate = stream.getframerate()
        pcm = array.array('h', stream.readframes(stream.getnframes()))
    step = rate // 100
    threshold = 32768 * 10 ** (-42 / 20)
    quiet = []
    for i in range(0, len(pcm), step):
        chunk = pcm[i:i + step]
        quiet.append(math.sqrt(sum(x * x for x in chunk) / len(chunk)) < threshold)
    voiced = [i for i, is_quiet in enumerate(quiet) if not is_quiet]
    if not voiced:
        raise ValueError('No audible sections detected')
    leading = voiced[0] / 100
    trailing = (len(quiet) - 1 - voiced[-1]) / 100
    interior = max((b - a - 1 for a, b in zip(voiced, voiced[1:])), default=0) / 100
    return {'thresholdDbfs': -42, 'windowMs': 10, 'leadingSeconds': leading,
            'trailingSeconds': trailing, 'maxInternalSeconds': interior,
            'needsListeningCheck': max(leading, trailing) > .35 or interior > .65}


def inspect(folder):
    probe = json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-select_streams', 'a:0', '-show_entries',
        'stream=codec_name,sample_rate,channels,bit_rate', '-of', 'json', str(folder / 'audio.mp3'),
    ]))['streams']
    if len(probe) != 1 or probe[0] != {
        'codec_name': 'mp3', 'sample_rate': '44100', 'channels': 1, 'bit_rate': '80000',
    }:
        raise ValueError('Unexpected MP3 codec or settings')
    query = json.loads((folder / 'query.json').read_bytes())
    phrases = [{
        'mora': ''.join(mora['text'] for mora in phrase['moras']),
        'accent': phrase.get('accent'),
        'question': phrase.get('is_interrogative', False),
        'pause': bool(phrase.get('pause_mora')),
    } for phrase in query['accent_phrases']]
    return {'format': probe[0], 'silence': silence(folder / 'original.wav'), 'accentPhrases': phrases,
            'humanListening': 'pending'}


if __name__ == '__main__':
    print(json.dumps(inspect(pathlib.Path(sys.argv[1])), ensure_ascii=False))

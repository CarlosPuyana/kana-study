"""Shared I3/I6 authoring primitives. Stdlib + installed FFmpeg; no network model downloads."""
import array, hashlib, json, math, pathlib, subprocess, urllib.parse, urllib.request, wave

MODEL_SHA = '6dabe29de5ec2c1715e12a430805e1bff6ec64a315cccec2d26fad029df83243'
SPEAKER_UUID = '561e4e59-3bc9-4726-9028-44a3c12a6f1d'
MODEL_UUID = '47e53151-a378-46f3-abee-ce13aa07feb1'

def sha(file):
    with pathlib.Path(file).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()

def wav_metrics(file):
    with wave.open(str(file), 'rb') as wav:
        if wav.getsampwidth() != 2 or wav.getnchannels() != 1 or wav.getframerate() != 44100:
            raise ValueError('Expected PCM16, mono, 44100 Hz')
        rate, count = wav.getframerate(), wav.getnframes()
        pcm = array.array('h', wav.readframes(count))
    if len(pcm) != count or count < rate*.2 or count > rate*120 or max(map(abs, pcm), default=0) <= 100:
        raise ValueError('Empty/silent, truncated or excessively long WAV')
    run = longest = 0
    for sample in pcm:
        run = run+1 if abs(sample) >= 32767 else 0
        longest = max(longest, run)
    if longest >= 3:
        raise ValueError('Sustained full-scale WAV samples')
    return {'sampleRate': rate, 'durationSeconds': count/rate, 'bytes': pathlib.Path(file).stat().st_size,
            'peak': max(map(abs, pcm))/32768, 'longestFullScaleRun': longest}

def encode_mp3(wav, output, ffmpeg='ffmpeg', sample_rate=44100):
    if not pathlib.Path(output).exists():
        subprocess.run([str(ffmpeg), '-hide_banner', '-loglevel', 'error', '-n', '-i', str(wav), '-map_metadata', '-1',
                        '-ac', '1', '-af', 'volume=-3dB', '-c:a', 'libmp3lame', '-b:a', '80k', str(output)], check=True)
    decoded = array.array('f', subprocess.check_output([str(ffmpeg), '-hide_banner', '-loglevel', 'error', '-i', str(output),
                          '-ac', '1', '-ar', str(sample_rate), '-f', 'f32le', '-']))
    with wave.open(str(wav), 'rb') as reader:
        source = array.array('h', reader.readframes(reader.getnframes()))
    gain = 10**(-3/20); count = min(len(source), len(decoded))
    power = sum((s/32768*gain)**2 for s in source[:count])
    error = sum((source[i]/32768*gain-decoded[i])**2 for i in range(count))
    snr = 10*math.log10(power/max(error, 1e-12)); peak = max(map(abs, decoded), default=0)
    duration = len(decoded)/sample_rate; difference = duration-len(source)/sample_rate
    if pathlib.Path(output).stat().st_size <= 1000 or abs(difference) >= .08 or peak >= 1 or snr <= 10:
        raise ValueError('MP3 decode/reference comparison failed')
    return {'decodedPeak': peak, 'comparisonSnrDb': snr, 'durationDifferenceSeconds': difference,
            'durationSeconds': duration, 'encodingGainDb': -3}

def synthesize(base, text, style_id, parameters=None):
    def request(url, data):
        return urllib.request.urlopen(urllib.request.Request(base+url, data=data, headers={'Content-Type':'application/json'}), timeout=600).read()
    raw = request('/audio_query?'+urllib.parse.urlencode({'text': text, 'speaker': style_id}), b'')
    if parameters:
        query = json.loads(raw)
        for key in ['speedScale', 'intonationScale', 'tempoDynamicsScale', 'pitchScale']:
            query[key] = parameters[key]
        query.update(outputSamplingRate=44100, outputStereo=False, volumeScale=1.0, prePhonemeLength=.1, postPhonemeLength=.1, pauseLength=None, pauseLengthScale=1.0)
        raw = (json.dumps(query, ensure_ascii=False)+'\n').encode('utf-8')
    return raw, request('/synthesis?speaker='+str(style_id), raw)

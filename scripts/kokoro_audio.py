"""Shared local Kokoro tooling; pronunciation is always entry.primaryReading."""
import importlib.metadata
import json
import os
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / '.cache' / 'kokoro-poc'
MODEL = 'hexgrad/Kokoro-82M'
REVISION = 'f3ff3571791e39611d31c381e3a41a3af07b4987'
VOICE = 'jf_alpha'
RATE = 24000
os.environ.setdefault('HF_HOME', str(WORK / 'huggingface'))
os.environ.setdefault('HF_HUB_DISABLE_XET', '1')
POC_WORDS = ['あさって', 'いつ', 'どこ', 'カメラ', 'テレビ', 'コーヒー',
             'タクシー', 'パン', '学校', '切手', '新聞', '先生', '学生',
             '図書館', '食べる', '飲む', '大きい', '小さい', 'お母さん',
             'お父さん', '水', '人', '今日', '明日', '上手', '一日',
             '映画', '英語', '牛乳', '去年', '教室', '郵便局', '一つ',
             '二人', '三つ', '二日', '九', 'せっけん', 'ゆっくりと', 'ベッド']


def vocabulary():
    source = (ROOT / 'src/app/data/vocabulary-n5.generated.ts').read_text(encoding='utf-8')
    result = json.loads('[' + source.split('=[', 1)[1].rstrip().removesuffix(';'))
    ids = [entry['id'] for entry in result]
    if len(ids) != len(set(ids)) or any(not re.fullmatch(r'n5-[a-z0-9]+', id) for id in ids):
        raise ValueError('Duplicate or unsafe vocabulary IDs')
    return result


def package_versions():
    return {p: importlib.metadata.version(p) for p in [
        'kokoro', 'misaki', 'torch', 'transformers', 'soundfile', 'pyopenjtalk-plus']}


def load_pipeline(revision=REVISION, offline=False, voices=(VOICE,)):
    import torch
    from huggingface_hub import snapshot_download
    from kokoro import KModel, KPipeline
    torch.manual_seed(0)
    torch.set_num_threads(min(4, os.cpu_count() or 1))
    snapshot = Path(snapshot_download(MODEL, revision=revision, allow_patterns=[
        'config.json', 'kokoro-v1_0.pth', 'LICENSE', 'README.md', 'VOICES.md',
        *[f'voices/{voice}.pt' for voice in voices],
    ], local_files_only=offline))
    model = KModel(repo_id=MODEL, config=str(snapshot / 'config.json'),
                   model=str(snapshot / 'kokoro-v1_0.pth')).eval().to('cpu')
    return KPipeline(lang_code='j', model=model, repo_id=MODEL), snapshot


def eligibility_reason(reading):
    if not isinstance(reading, str) or not reading:
        return 'Missing primaryReading'
    if any(char.isspace() or char in '/／,、;；|｜・\\' for char in reading):
        return 'Separators/whitespace: multiple readings or list; no automatic choice'
    if not re.fullmatch(r'[ぁ-ゖァ-ヺー]+', reading):
        return 'Unexpected characters/signs: not one unambiguous kana reading'
    return None


def g2p_flags(reading, phonemes, vocab):
    flags = []
    if len(reading) >= 10:
        flags.append('Long reading (10+ kana): review timing/prosody')
    if ' ' in phonemes:
        flags.append('G2P boundary: review internal pause')
    if not phonemes.strip() or '❓' in phonemes or any(char not in vocab for char in phonemes):
        flags.append('Anomalous/unsupported G2P symbols')
    return flags


def audio_metrics(audio, rate=RATE):
    import numpy as np
    audio = np.asarray(audio)
    if rate != RATE or audio.ndim != 1 or not audio.size or not np.isfinite(audio).all():
        raise ValueError('Empty/non-finite/non-mono audio or unexpected sample rate')
    peak = float(np.max(np.abs(audio)))
    rms = float(np.sqrt(np.mean(audio.astype(np.float64) ** 2)))
    if peak < 0.0001 or rms < 0.00001:
        raise ValueError('Silent/near-silent audio')
    clipped = np.abs(audio) >= 0.999
    runs = np.convolve(clipped.astype(int), np.ones(3, dtype=int), mode='valid') if len(audio) >= 3 else []
    if peak >= 1 or np.mean(clipped) > 0.001 or np.any(np.asarray(runs) == 3):
        raise ValueError('Evident clipping')
    return dict(seconds=len(audio)/rate, peak=peak, rms=rms, samples=len(audio),
                clippedSamples=int(np.count_nonzero(clipped)))

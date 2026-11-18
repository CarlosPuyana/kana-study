"""Publish only explicitly reviewed phrases with verified WAV -> MP3 comparisons."""
import array,hashlib,json,math,pathlib,shutil,subprocess
from phrase_islands_audio import encode_mp3
ROOT=pathlib.Path(__file__).resolve().parents[1];WORK=ROOT/'.cache/phrase-islands-i3';DATA=ROOT/'src/app/data/phrase-islands';PUBLIC=ROOT/'public/audio/phrase-islands/v1'
def sha(p):
 with p.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def save(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def main():
 import wave
 phrases=json.loads((DATA/'phrases.v1.json').read_text(encoding='utf-8'))['phrases'];reviews=json.loads((DATA/'editorial.v1.json').read_text(encoding='utf-8'))['records'];metrics={r['id']:r for r in json.loads((WORK/'generation.json').read_text(encoding='utf-8'))};assert phrases and len({p['id'] for p in phrases})==len(phrases)
 public={};report=[];ffmpeg=shutil.which('ffmpeg');assert ffmpeg
 save(WORK/'encoder.json',{'command':ffmpeg,'version':subprocess.check_output([ffmpeg,'-version']).decode().splitlines()[0],'sha256':sha(pathlib.Path(ffmpeg)),'bitrate':80000,'gainDb':-3})
 for phrase in phrases:
  id=phrase['id'];review=reviews[id];m=metrics[id]
  assert review['status']=='approved' and review['analyzedReading']==m['analyzedReading'] and review['text']==phrase['japanese'],'Unreviewed or changed content'
  wav=WORK/'masters'/(id+'.wav');assert sha(wav)==m['wavSha256']
  out=WORK/'encoded'/(id+'.mp3');out.parent.mkdir(exist_ok=True)
  # Validate/reuse an existing private encoding; never replace it under the same name.
  checked=encode_mp3(wav,out,ffmpeg,m['sampleRate']);peak=checked['decodedPeak'];snr=checked['comparisonSnrDb'];duration=checked['durationSeconds']
  digest=sha(out);name=id+'-'+digest[:16]+'.mp3';PUBLIC.mkdir(parents=True,exist_ok=True);
  if (PUBLIC/name).exists() and sha(PUBLIC/name)!=digest:raise RuntimeError('Immutable public URL conflict')
  if not (PUBLIC/name).exists():shutil.copyfile(out,PUBLIC/name)
  public[id]={'revision':'1','path':'audio/phrase-islands/v1/'+name,'sha256':digest,'bytes':out.stat().st_size,'durationSeconds':duration,'sampleRate':m['sampleRate'],'mime':'audio/mpeg','voice':'aida-shigeru-normal','engineVersion':'1.2.0','modelSha256':m['modelSha256']}
  report.append({**m,'editorialStatus':review['status'],'editorialReview':review,'mp3':public[id],'decodedPeak':peak,'comparisonSnrDb':snr,'durationDifferenceSeconds':duration-m['durationSeconds'],'encodingGainDb':-3})
 save(DATA/'audio.v1.json',public);save(WORK/'publication-audit.json',report);save(PUBLIC/'manifest.json',{'schemaVersion':1,'version':'1.0.0','voice':'AivisSpeech / 阿井田 茂 (Aida Shigeru), ノーマル','license':'ACML 1.0','resources':public})
 shutil.copyfile(ROOT/'.cache/phrase-islands-i2/licenses/ACML-1.0.md',PUBLIC/'ACML-1.0.md')
 (PUBLIC/'PROVENANCE.md').write_text('''# Islas de frases — audio sintético v1

Voz elegida: AivisSpeech / 阿井田 茂 (Aida Shigeru), ノーマル. Creador/intérprete del modelo: 古山キリヲ.
Motor local CPU AivisSpeech Engine 1.2.0; AIVMX 1.0.0, UUID 47e53151-a378-46f3-abee-ce13aa07feb1.
SHA-256 del modelo: 6dabe29de5ec2c1715e12a430805e1bff6ec64a315cccec2d26fad029df83243.
Fuente: https://hub.aivis-project.com/aivm-models/47e53151-a378-46f3-abee-ce13aa07feb1
Condiciones de voz/modelo: ACML 1.0, adjuntas. No es CC0 ni una licencia de reutilización sin condiciones.
Licencia oficial: https://github.com/Aivis-Project/ACML/blob/master/ACML-1.0.md
Se permite el uso comercial/no comercial dentro de sus condiciones, incluidas prohibiciones de suplantación y usos lesivos.
No se incluyen ilustraciones, modelos ni código del motor. El crédito se conserva voluntariamente.

Textos y revisión editorial propios de Kana Study. MP3 mono 80 kbit/s codificados con FFmpeg/libmp3lame desde WAV originales;
ganancia de codificación -3 dB para margen de pico. Manifiesto con hashes, duración y versión por archivo.
Consultas, WAV y controles de codificación quedan en la caché privada de autoría. No forman parte de estos assets.
Revisión editorial y técnica efectuada por el agente, sin certificación de escucha nativa ni de prosodia pedagógica.
''',encoding='utf-8')
 # Source content localizations remain synchronized with all editable dictionaries.
 for lang in ['es','en','ca']:
  p=ROOT/f'src/assets/i18n/{lang}.json';raw=p.read_bytes();text=raw.decode();data=json.loads(text)
  for phrase in phrases:
   for field,value in phrase['localizations'][lang].items():data['phraseIslands.content.'+phrase['id']+'.'+field]=value
  result=json.dumps(data,ensure_ascii=False,indent=2)+'\n';p.write_bytes(result.replace('\n','\r\n').encode() if b'\r\n' in raw else result.encode())
 print('Published',len(public),'MP3;',sum(r['bytes'] for r in public.values()),'bytes; min SNR',min(r['comparisonSnrDb'] for r in report))
if __name__=='__main__':main()

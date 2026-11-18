"""I3 authoring only: pinned Aivis CPU, immutable WAV/query, audited MP3 outside public."""
import array,hashlib,json,os,pathlib,subprocess,time,urllib.parse,urllib.request,wave
from phrase_islands_audio import synthesize
ROOT=pathlib.Path(__file__).resolve().parents[1];I2=ROOT/'.cache/phrase-islands-i2';WORK=ROOT/'.cache/phrase-islands-i3'
def sha(p):
 with p.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def save(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def request(path,data=None):return urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:10101'+path,data=data,headers={'Content-Type':'application/json'}),timeout=600).read()
def main():
 WORK.mkdir(parents=True,exist_ok=True)
 assert sha(I2/'downloads/aida-1.0.0.aivmx')=='6dabe29de5ec2c1715e12a430805e1bff6ec64a315cccec2d26fad029df83243'
 assert sha(I2/'engines/aivis/Windows-x64/run.exe')==json.loads((I2/'aivis-installed.json').read_text(encoding='utf-8'))['exeSha256']
 exe=I2/'engines/aivis/Windows-x64/run.exe';env=os.environ.copy();env.update(HF_HOME=str(I2/'huggingface'),HF_HUB_DISABLE_XET='1',OMP_NUM_THREADS='4',VV_CPU_NUM_THREADS='4')
 log=(WORK/'engine.log').open('wb');proc=subprocess.Popen([str(exe),'--host','127.0.0.1','--port','10101','--output_log_utf8','--disable_sentry'],cwd=exe.parent,env=env,stdout=log,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW)
 results=[]
 try:
  for _ in range(300):
   if proc.poll() is not None:raise RuntimeError('Engine stopped; see log')
   try:version=json.loads(request('/version'));break
   except Exception:time.sleep(1)
  else:raise RuntimeError('Engine did not start')
  assert version=='1.2.0'
  speaker=next(s for s in json.loads(request('/speakers')) if s['speaker_uuid']=='561e4e59-3bc9-4726-9028-44a3c12a6f1d');style=next(s for s in speaker['styles'] if s['name']=='ノーマル')
  save(WORK/'installed.json',{'version':version,'speaker':speaker,'style':style,'models':json.loads(request('/aivm_models'))})
  for row in json.loads((ROOT/'src/app/data/phrase-islands/phrases.v1.json').read_text(encoding='utf-8'))['phrases']:
   folder=WORK/'masters';folder.mkdir(exist_ok=True);wav=folder/(row['id']+'.wav');query=folder/(row['id']+'.query.json');metrics=folder/(row['id']+'.metrics.json')
   if wav.exists():
    old=json.loads(metrics.read_text(encoding='utf-8'));assert old['text']==row['japanese'] and sha(wav)==old['wavSha256'];results.append(old);continue
   start=time.perf_counter();q,pcm_bytes=synthesize('http://127.0.0.1:10101',row['japanese'],style['id']);query.write_bytes(q);wav.write_bytes(pcm_bytes);elapsed=time.perf_counter()-start
   with wave.open(str(wav),'rb') as w:
    assert w.getsampwidth()==2 and w.getnchannels()==1;rate=w.getframerate();n=w.getnframes();pcm=array.array('h',w.readframes(n))
   assert n>rate*.2 and max(map(abs,pcm))>100,'empty/silent'
   run=0;longest=0
   for s in pcm:
    run=run+1 if abs(s)>=32767 else 0;longest=max(longest,run)
   assert longest<3,'sustained clipping'
   decoded=json.loads(q);reading=''.join(m['text'] for p in decoded['accent_phrases'] for m in p['moras'])
   item={'id':row['id'],'text':row['japanese'],'expectedReading':row['reading'],'analyzedReading':reading,'engine':'AivisSpeech Engine','engineVersion':version,'voice':'阿井田 茂','style':style,'modelVersion':'1.0.0','modelSha256':'6dabe29de5ec2c1715e12a430805e1bff6ec64a315cccec2d26fad029df83243','wavSha256':sha(wav),'querySha256':sha(query),'durationSeconds':n/rate,'sampleRate':rate,'bytes':wav.stat().st_size,'generationSeconds':elapsed,'peak':max(map(abs,pcm))/32768,'longestFullScaleRun':longest,'editorialStatus':'pending-reading-review'}
   save(metrics,item);results.append(item);save(WORK/'generation.json',results);print(row['id'],reading,flush=True)
 finally:
  proc.terminate()
  try:proc.wait(timeout=15)
  except subprocess.TimeoutExpired:proc.kill()
  log.close();save(WORK/'generation.json',results)
if __name__=='__main__':main()

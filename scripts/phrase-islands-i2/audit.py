"""Recheck originals, archive model/dependency fingerprints and summarize this run."""
import array,csv,json,pathlib,wave
from generate import WORK,sha,save
data=json.loads((WORK/'manifest.json').read_text(encoding='utf-8'));summary={}
for engine in ['aivis','voicevox']:
    rows=[r for r in data['rows'] if r['engine']==engine];assert len(rows)==10
    for row in rows:
        assert sha(WORK/row['path'])==row['sha256']
        query=json.loads((WORK/row['query']).read_text(encoding='utf-8'))
        assert query['speedScale']==1 and query['pitchScale']==0
        row['querySha256']=sha(WORK/row['query'])
        with wave.open(str(WORK/row['path']),'rb') as w:
            assert w.getsampwidth()==2
            pcm=array.array('h',w.readframes(w.getnframes()))
        row['fullScaleSamples']=sum(abs(x)>=32767 for x in pcm)
        row['warnings']=['Human listening pending']
        if row['fullScaleSamples']:row['warnings'].append('Isolated full-scale PCM sample(s); listening review required, not proof of audible clipping')
    summary[engine]=dict(count=len(rows),seconds=sum(r['duration'] for r in rows),bytes=sum(r['bytes'] for r in rows),generationSeconds=sum(r['generationSeconds'] for r in rows),warmSecondsMean=sum(r['generationSeconds'] for r in rows[1:])/9,sampleRate=rows[0]['sampleRate'],peakMax=max(r['peak'] for r in rows))
    timeline=[WORK/r['path'] for r in rows[:3] for _ in range(2)]
    with wave.open(str(timeline[0]),'rb') as w:params=w.getparams()
    with wave.open(str(WORK/('track-'+engine+'.wav')),'wb') as out:
        out.setparams(params)
        for i,clip in enumerate(timeline):
            with wave.open(str(clip),'rb') as w:out.writeframes(w.readframes(w.getnframes()))
            if i<len(timeline)-1:out.writeframes(bytes(params.framerate*params.nchannels*params.sampwidth))
save(WORK/'manifest.json',data);save(WORK/'summary.json',summary)
files=[]
for folder in ['engines/voicevox/windows-cpu/model','profile/AivisSpeech-Engine/Models','huggingface']:
    for p in (WORK/folder).rglob('*'):
        if p.is_file():files.append(dict(path=p.relative_to(WORK).as_posix(),bytes=p.stat().st_size,sha256=sha(p)))
save(WORK/'model-files.json',files)
dependencies=[]
for p in (WORK/'engines').rglob('METADATA'):
    if '.dist-info' not in str(p):continue
    text=p.read_text(encoding='utf-8',errors='replace');lines=text.splitlines()
    dependencies.append(dict(path=p.relative_to(WORK).as_posix(),sha256=sha(p),package=next((l[6:] for l in lines if l.startswith('Name: ')),None),version=next((l[9:] for l in lines if l.startswith('Version: ')),None)))
save(WORK/'dependencies.json',dependencies)
with (WORK/'metrics.csv').open('w',encoding='utf-8-sig',newline='') as f:
    keys=['id','engine','version','voice','text','reading','duration','bytes','sampleRate','generationSeconds','sha256','querySha256','fullScaleSamples']
    writer=csv.DictWriter(f,keys,extrasaction='ignore');writer.writeheader();writer.writerows(data['rows'])
print(json.dumps(summary,indent=2))

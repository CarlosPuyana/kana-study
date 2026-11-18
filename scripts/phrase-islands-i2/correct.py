"""Documented optional second round. Requires the selected pinned engine running locally."""
import argparse,json,pathlib,time
from generate import WORK,request,save,sha
parser=argparse.ArgumentParser()
parser.add_argument('--engine',choices=['aivis','voicevox'],required=True)
parser.add_argument('--id',required=True);parser.add_argument('--query',type=pathlib.Path,required=True)
parser.add_argument('--reason',required=True);parser.add_argument('--reviewer',required=True)
args=parser.parse_args()
original=next(r for r in json.loads((WORK/'manifest.json').read_text(encoding='utf-8'))['rows'] if r['engine']==args.engine and r['id']==args.id)
port=10101 if args.engine=='aivis' else 50021;base=f'http://127.0.0.1:{port}'
assert json.loads(request(base,'/version'))==original['version']
query=json.loads(args.query.read_text(encoding='utf-8-sig'))
revision=time.strftime('%Y%m%d-%H%M%S');out=WORK/'samples'/args.engine/'corrected'/revision;out.mkdir(parents=True,exist_ok=False)
q=out/(args.id+'.query.json');save(q,query)
dest=out/(args.id+'.wav');start=time.perf_counter();dest.write_bytes(request(base,'/synthesis?speaker='+str(original['style']['id']),q.read_bytes()))
record={**original,'revision':revision,'path':dest.relative_to(WORK).as_posix(),'query':q.relative_to(WORK).as_posix(),'sha256':sha(dest),'generationSeconds':time.perf_counter()-start,'reason':args.reason,'reviewer':args.reviewer,'originalSha256':original['sha256']}
import wave
with wave.open(str(dest),'rb') as w:record.update(duration=w.getnframes()/w.getframerate(),sampleRate=w.getframerate(),channels=w.getnchannels(),bytes=dest.stat().st_size)
record['rtf']=record['generationSeconds']/record['duration'];record['peak']=None
save(out/(args.id+'.correction.json'),record)
p=WORK/'corrections.json';data=json.loads(p.read_text(encoding='utf-8')) if p.exists() else {'rows':[]}
data['rows']=[r for r in data['rows'] if (r['id'],r['engine'])!=(args.id,args.engine)]+[record];save(p,data)
print(dest)

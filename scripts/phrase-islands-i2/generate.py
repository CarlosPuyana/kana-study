"""Isolated I2 CPU lab. Never writes public assets or application progress."""
import array, csv, hashlib, json, os, pathlib, platform, subprocess, time, urllib.request, urllib.parse, wave, ctypes
ROOT = pathlib.Path(__file__).resolve().parents[2]
WORK = ROOT / '.cache/phrase-islands-i2'
def save(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding='utf-8')
def request(base, path, data=None, timeout=600):
    req = urllib.request.Request(base+path, data=data, headers={'Content-Type':'application/json'} if data is not None else {})
    return urllib.request.urlopen(req, timeout=timeout).read()
def sha(path):
    with path.open('rb') as f: return hashlib.file_digest(f,'sha256').hexdigest()
def corpus():
    rows=[]
    for line in (ROOT/'docs/phrase-islands-audio-research.md').read_text(encoding='utf-8').splitlines():
        if line.startswith('| I2-'):
            cells=[c.strip() for c in line.split('|')[1:-1]]
            rows.append(dict(id=cells[0],text=cells[1],reading=cells[2],checks=cells[3]))
    assert len(rows)==10
    return rows
def main():
    WORK.mkdir(parents=True, exist_ok=True)
    class Memory(ctypes.Structure):
        _fields_=[('length',ctypes.c_ulong),('load',ctypes.c_ulong),('physical',ctypes.c_ulonglong),('available',ctypes.c_ulonglong),('page',ctypes.c_ulonglong),('availpage',ctypes.c_ulonglong),('virtual',ctypes.c_ulonglong),('availvirtual',ctypes.c_ulonglong),('extended',ctypes.c_ulonglong)]
    m=Memory();m.length=ctypes.sizeof(m);ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(m))
    save(WORK/'machine.json',dict(platform=platform.platform(),processor=platform.processor(),logicalCpus=os.cpu_count(),ramBytes=m.physical,availableRamBytes=m.available,python=platform.python_version(),recordedAt=time.strftime('%Y-%m-%dT%H:%M:%S%z')))
    licenses={
      'ACML-1.0.md':'https://raw.githubusercontent.com/Aivis-Project/ACML/master/ACML-1.0.md',
      'aivis-LICENSE':'https://raw.githubusercontent.com/Aivis-Project/AivisSpeech-Engine/1.2.0/LICENSE',
      'voicevox-LICENSE':'https://raw.githubusercontent.com/VOICEVOX/voicevox_engine/0.26.2/LICENSE',
      'voicevox-resources.md':'https://raw.githubusercontent.com/VOICEVOX/voicevox_resource/main/core/README.md',
      'virvox.html':'https://virvoxproject.wixsite.com/official/voicevox%E3%81%AE%E5%88%A9%E7%94%A8%E8%A6%8F%E7%B4%84',
      'aida.html':'https://hub.aivis-project.com/aivm-models/47e53151-a378-46f3-abee-ce13aa07feb1'}
    evidence=[]
    for name,url in licenses.items():
        p=WORK/'licenses'/name;p.parent.mkdir(exist_ok=True)
        if not p.exists():
            try: urllib.request.urlretrieve(url,p)
            except Exception as e:
                evidence.append(dict(file=name,url=url,error=str(e)));continue
        evidence.append(dict(file=str(p.relative_to(WORK)),url=url,sha256=sha(p)))
    save(WORK/'licenses/index.json',evidence)
    model=WORK/'downloads/aida-1.0.0.aivmx'
    assert sha(model)=='6dabe29de5ec2c1715e12a430805e1bff6ec64a315cccec2d26fad029df83243'
    models=WORK/'profile/AivisSpeech-Engine/Models';models.mkdir(parents=True,exist_ok=True)
    import shutil
    if not (models/model.name).exists(): shutil.copyfile(model,models/model.name)
    rows=corpus();results=[];blocked=[]
    previous=json.loads((WORK/'manifest.json').read_text(encoding='utf-8'))['rows'] if (WORK/'manifest.json').exists() else []
    configs=[('aivis','1.2.0','aivis/Windows-x64',10101,'561e4e59-3bc9-4726-9028-44a3c12a6f1d','阿井田 茂'),('voicevox','0.26.2','voicevox/windows-cpu',50021,None,'玄野武宏')]
    for key,version,folder,port,uuid,name in configs:
        out=WORK/'samples'/key/'automatic';out.mkdir(parents=True,exist_ok=True)
        env=os.environ.copy();env['HF_HOME']=str(WORK/'huggingface');env['HF_HUB_DISABLE_XET']='1';env['OMP_NUM_THREADS']='4';env['VV_CPU_NUM_THREADS']='4'
        exe=WORK/'engines'/folder/'run.exe';log=(WORK/(key+'.log')).open('wb')
        args=[str(exe),'--host','127.0.0.1','--port',str(port)]
        if key=='aivis':args+=['--output_log_utf8','--disable_sentry']
        process=subprocess.Popen(args,cwd=exe.parent,env=env,stdout=log,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW)
        base=f'http://127.0.0.1:{port}';started=time.perf_counter()
        try:
            while True:
                if process.poll() is not None: raise RuntimeError(f'Engine exited {process.returncode}; see {key}.log')
                try: actual=json.loads(request(base,'/version',timeout=2));break
                except Exception:
                    if time.perf_counter()-started>600:raise RuntimeError('Startup timed out after 600s')
                    time.sleep(2)
            assert actual==version,(actual,version)
            speakers=json.loads(request(base,'/speakers'));save(WORK/(key+'-speakers.json'),speakers)
            speaker=next(s for s in speakers if (s['speaker_uuid']==uuid if uuid else s['name']==name))
            style=next(s for s in speaker['styles'] if s['name']=='ノーマル')
            metadata=dict(engine=key,version=actual,voice=speaker,style=style,startupSeconds=time.perf_counter()-started,cpuThreads=4,exeSha256=sha(exe),arguments=args)
            for endpoint in ['/engine_manifest','/speaker_info?speaker_uuid='+speaker['speaker_uuid']]:
                try: metadata[endpoint]=json.loads(request(base,endpoint))
                except Exception as e:metadata[endpoint]=str(e)
            if key=='aivis':metadata['aivm_info']=json.loads(request(base,'/aivm_models'))
            save(WORK/(key+'-installed.json'),metadata)
            for row in rows:
                dest=out/(row['id']+'.wav');qpath=out/(row['id']+'.query.json')
                if dest.exists():
                    existing=next(r for r in previous if r['engine']==key and r['id']==row['id'])
                    assert sha(dest)==existing['sha256'] and qpath.exists(),'Existing original changed'
                    results.append(existing);continue
                start=time.perf_counter();query=request(base,'/audio_query?'+urllib.parse.urlencode(dict(text=row['text'],speaker=style['id'])),b'')
                qpath.write_bytes(query);wav=request(base,'/synthesis?speaker='+str(style['id']),query);elapsed=time.perf_counter()-start;dest.write_bytes(wav)
                with wave.open(str(dest),'rb') as w:
                    duration=w.getnframes()/w.getframerate();rate=w.getframerate();channels=w.getnchannels();width=w.getsampwidth();pcm=w.readframes(w.getnframes())
                samples=array.array('h',pcm) if width==2 else []
                results.append(dict(**row,engine=key,version=version,voice=name,style=style,path=dest.relative_to(WORK).as_posix(),query=qpath.relative_to(WORK).as_posix(),duration=duration,bytes=len(wav),sampleRate=rate,channels=channels,sampleWidth=width,generationSeconds=elapsed,rtf=elapsed/duration,sha256=sha(dest),peak=max(map(abs,samples),default=0)/32768,warnings=['Human listening pending'],errors=[]))
                save(WORK/'manifest.json',dict(rows=results,blocked=blocked));print(key,row['id'],round(duration,2),round(elapsed,2),flush=True)
        except Exception as e:
            blocked.append(dict(engine=key,error=str(e)));print(key,'BLOCKED',str(e),flush=True)
        finally:
            process.terminate()
            try: process.wait(timeout=15)
            except subprocess.TimeoutExpired:process.kill()
            log.close()
            save(WORK/'manifest.json',dict(rows=results,blocked=blocked))
    # Precomposed track: first three phrases repeated twice with 1s PCM silence.
    for key,*_ in configs:
        clips=[WORK/r['path'] for r in results if r['engine']==key][:3]
        if not clips:continue
        dest=WORK/('track-'+key+'.wav')
        with wave.open(str(clips[0]),'rb') as w:params=w.getparams()
        with wave.open(str(dest),'wb') as output:
            output.setparams(params)
            for clip in clips:
                for _ in range(2):
                    with wave.open(str(clip),'rb') as w: output.writeframes(w.readframes(w.getnframes()))
                    output.writeframes(bytes(params.framerate*params.nchannels*params.sampwidth))
    with (WORK/'human-evaluation.csv').open('w',encoding='utf-8-sig',newline='') as f:
        writer=csv.writer(f);writer.writerow(['evaluator','phraseId','blindLabel','revision','naturalness1to5','pronunciation1to5','rhythm1to5','shadowingAccepted','notes'])
        for row in rows:
            for label in ['A','B']:writer.writerow(['',row['id'],label,'automatic','','','','',''])
if __name__=='__main__':main()

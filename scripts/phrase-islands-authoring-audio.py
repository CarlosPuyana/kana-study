"""One immutable revision, using the officially pinned I2 installation and shared I3 checks."""
import argparse, json, os, pathlib, shutil, socket, subprocess, time, urllib.request
from phrase_islands_audio import MODEL_SHA, MODEL_UUID, SPEAKER_UUID, sha, wav_metrics, encode_mp3, synthesize
ROOT = pathlib.Path(__file__).resolve().parents[1]
I2 = ROOT/'.cache/phrase-islands-i2'

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--job',required=True);args=parser.parse_args()
    job_file=pathlib.Path(args.job).resolve();job=json.loads(job_file.read_text(encoding='utf-8-sig'));out=pathlib.Path(job['outputDir']).resolve()
    if job_file.parent!=out or not out.is_dir():raise ValueError('Job/output directory mismatch')
    if any((out/f).exists() for f in ['original.wav','query.json','audio.mp3','result.json']):raise ValueError('Immutable revision already has artifacts')
    exe=I2/'engines/aivis/Windows-x64/run.exe';model=I2/'downloads/aida-1.0.0.aivmx'
    if sha(model)!=MODEL_SHA:raise ValueError('Aida model hash mismatch')
    pinned=json.loads((I2/'aivis-installed.json').read_text(encoding='utf-8'))
    if sha(exe)!=pinned['exeSha256']:raise ValueError('Aivis executable hash mismatch')
    if job['synthesis']['engineVersion']!='1.2.0' or job['synthesis']['voice']!='aida-shigeru-normal' or job['synthesis']['modelSha256']!=MODEL_SHA:raise ValueError('Unpinned synthesis requested')
    ffmpeg=shutil.which(job['ffmpeg'])
    if not ffmpeg:raise FileNotFoundError('FFmpeg not found; original catalog preserved')
    encoder={'version':subprocess.check_output([ffmpeg,'-version']).decode().splitlines()[0],'sha256':sha(ffmpeg)}
    profile=pathlib.Path(os.environ['APPDATA'])/'AivisSpeech-Engine';target=(I2/'profile/AivisSpeech-Engine').resolve()
    existed=os.path.lexists(profile)
    if existed and (not os.path.isjunction(profile) or profile.resolve()!=target):raise ValueError('Existing real Aivis profile preserved; use an isolated Windows account')
    if not existed:
        ps=pathlib.Path(os.environ['SystemRoot'])/'System32/WindowsPowerShell/v1.0/powershell.exe'
        subprocess.run([str(ps),'-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',str(ROOT/'scripts/phrase-islands-i2/profile.ps1')],check=True)
    proc=None;log=(out/'engine.log').open('wb')
    try:
        with socket.socket() as sock:sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
        base='http://127.0.0.1:'+str(port)
        env=os.environ.copy();env.update(HF_HOME=str(I2/'huggingface'),HF_HUB_DISABLE_XET='1',OMP_NUM_THREADS='4',VV_CPU_NUM_THREADS='4')
        proc=subprocess.Popen([str(exe),'--host','127.0.0.1','--port',str(port),'--output_log_utf8','--disable_sentry'],cwd=exe.parent,env=env,stdout=log,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW)
        def get(route):return json.loads(urllib.request.urlopen(base+route,timeout=5).read())
        for _ in range(300):
            if proc.poll() is not None:raise RuntimeError('Engine stopped; see revision engine.log')
            try:version=get('/version');break
            except Exception:time.sleep(1)
        else:raise TimeoutError('Engine startup timed out')
        if version!='1.2.0':raise ValueError('Wrong running engine version')
        speaker=next(s for s in get('/speakers') if s['speaker_uuid']==SPEAKER_UUID)
        style=next(s for s in speaker['styles'] if s['name']=='ノーマル')
        installed=get('/aivm_models')[MODEL_UUID];selected=installed['manifest']
        if sha(pathlib.Path(installed['file_path']))!=MODEL_SHA:raise ValueError('Actually installed model hash mismatch')
        license_file=I2/'licenses/ACML-1.0.md'
        normalize_license=lambda text:'\n'.join(line.rstrip() for line in text.replace('\r\n','\n').strip().splitlines())
        if selected['uuid']!=MODEL_UUID or selected['version']!='1.0.0' or normalize_license(selected['license'])!=normalize_license(license_file.read_text(encoding='utf8')):raise ValueError('Installed model/license metadata mismatch')
        (out/'ACML-1.0.md').write_bytes(license_file.read_bytes())
        (out/'model-manifest.json').write_text(json.dumps(selected,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
        (out/'voice-metadata.json').write_text(json.dumps(speaker,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
        started=time.perf_counter();query,wav=synthesize(base,job['phrase']['japanese'],style['id'],job['synthesis']);elapsed=time.perf_counter()-started
        (out/'query.json').write_bytes(query);(out/'original.wav').write_bytes(wav)
        metrics=wav_metrics(out/'original.wav');encoded=encode_mp3(out/'original.wav',out/'audio.mp3',ffmpeg,metrics['sampleRate'])
        digest=sha(out/'audio.mp3');q=json.loads(query);reading=''.join(m['text'] for p in q['accent_phrases'] for m in p['moras'])
        ref={'revision':job['revision'],'path':'audio/phrase-islands/v1/'+job['phrase']['id']+'-r'+job['revision']+'-'+digest[:16]+'.mp3','sha256':digest,'bytes':(out/'audio.mp3').stat().st_size,'durationSeconds':encoded['durationSeconds'],'sampleRate':44100,'mime':'audio/mpeg','voice':'aida-shigeru-normal','engineVersion':version,'modelSha256':MODEL_SHA,'synthesisFingerprint':job['synthesisFingerprint']}
        result={'synthesisFingerprint':job['synthesisFingerprint'],'reference':ref,'wavSha256':sha(out/'original.wav'),'querySha256':sha(out/'query.json'),'analyzedReading':reading,'expectedReading':job['phrase']['reading'],'metrics':{**metrics,**encoded,'generationSeconds':elapsed},'provenance':{'engineExeSha256':sha(exe),'modelVersion':'1.0.0','modelUuid':MODEL_UUID,'modelSource':'https://hub.aivis-project.com/aivm-models/'+MODEL_UUID,'speakerUuid':SPEAKER_UUID,'style':style,'licenseSha256':sha(license_file),'encoder':encoder}}
        (out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
        print('Generated ONE revision:',job['phrase']['id'],reading,flush=True)
    finally:
        if proc:
            proc.terminate()
            try:proc.wait(timeout=15)
            except subprocess.TimeoutExpired:proc.kill();proc.wait()
        log.close()
        if not existed and os.path.isjunction(profile) and profile.resolve()==target:os.rmdir(profile)
if __name__=='__main__':main()

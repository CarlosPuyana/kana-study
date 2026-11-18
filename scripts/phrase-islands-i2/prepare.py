"""Download pinned official CPU packages, verify them, extract only into I2 cache."""
import concurrent.futures,json,pathlib,subprocess,urllib.request
from generate import WORK,sha
HERE=pathlib.Path(__file__).resolve().parent
def download(asset):
    p=WORK/'downloads'/asset['name'];p.parent.mkdir(parents=True,exist_ok=True)
    if not p.exists():
        part=p.with_name(p.name+'.part');urllib.request.urlretrieve(asset['url'],part);part.rename(p)
    if sha(p)!=asset['sha256']:raise RuntimeError('Checksum mismatch: '+str(p))
    print('Verified',p.name,flush=True)
    return p
if __name__=='__main__':
    assets=json.loads((HERE/'assets.json').read_text())
    with concurrent.futures.ThreadPoolExecutor(2) as pool:archives=list(pool.map(download,assets))
    extractor=download(dict(name='7zr.exe',url='https://www.7-zip.org/a/7zr.exe',sha256='256feca8e274e5da655e2a284fabafd9f554365eb164862089dacd4e8276d282'))
    for archive,key in zip(archives,['aivis','voicevox']):
        target=WORK/'engines'/key
        if not target.exists():subprocess.run([str(extractor),'x',str(archive),'-o'+str(target),'-y'],check=True)
    download(dict(name='aida-1.0.0.aivmx',url='https://api.aivis-project.com/v1/aivm-models/47e53151-a378-46f3-abee-ce13aa07feb1/download?model_type=AIVMX',sha256='6dabe29de5ec2c1715e12a430805e1bff6ec64a315cccec2d26fad029df83243'))

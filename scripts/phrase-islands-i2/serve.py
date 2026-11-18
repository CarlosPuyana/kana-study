"""Loopback-only standalone laboratory; no access to app storage."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import shutil
ROOT=Path(__file__).resolve().parents[2]
WORK=ROOT/'.cache/phrase-islands-i2'
if __name__=='__main__':
    for name in ['index.html','lab.js']:
        shutil.copyfile(Path(__file__).parent/name,WORK/name)
    print('I2 laboratory: http://127.0.0.1:4438/ (Ctrl+C to stop)',flush=True)
    ThreadingHTTPServer(('127.0.0.1',4438),lambda *a,**kw:SimpleHTTPRequestHandler(*a,directory=str(WORK),**kw)).serve_forever()

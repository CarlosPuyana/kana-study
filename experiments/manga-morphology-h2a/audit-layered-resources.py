"""Read-only physical layout audit, no new dictionary export or compact-runtime claim."""
import hashlib
import json
import pathlib
import sqlite3
import time

root = pathlib.Path(__file__).resolve().parent
manifest = json.loads((root / 'reports/enriched-source.json').read_text(encoding='utf-8'))
database = root / 'resources/enriched/lexicon-v2.sqlite'
started = time.perf_counter()
with database.open('rb') as stream:
    digest = hashlib.file_digest(stream, 'sha256').hexdigest()
assert digest == manifest['databaseSha256']
db = sqlite3.connect(database.as_uri() + '?mode=ro', uri=True)
payload_bytes, entries = db.execute('SELECT SUM(length(body)),COUNT(*) FROM entries').fetchone()
form_rows, unique_forms = db.execute('SELECT COUNT(*),COUNT(DISTINCT form) FROM forms').fetchone()
try:
    layout = dict(db.execute('SELECT name,SUM(pgsize) FROM dbstat GROUP BY name'))
    layout_note = 'SQLite dbstat measured'
except sqlite3.OperationalError:
    layout = None
    layout_note = 'dbstat unavailable; not measured'
report = {'sourceDatabaseSha256': digest, 'sqliteBytes': database.stat().st_size,
          'gzipEntryPayloadBytes': payload_bytes, 'entries': entries,
          'formRows': form_rows, 'uniqueForms': unique_forms,
          'pageBytes': db.execute('PRAGMA page_size').fetchone()[0],
          'freePages': db.execute('PRAGMA freelist_count').fetchone()[0],
          'physicalTableBytes': layout, 'layoutNote': layout_note,
          'auditSeconds': time.perf_counter() - started,
          'prototypeImplemented': False,
          'note': 'Payload sums are measured. Payload-only size is not a functional index or browser resource.'}
db.close()
(root / 'reports/layered-resource-audit.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps(report))

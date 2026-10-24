"""Local-only JMdict XML -> indexed SQLite. No runtime/app dependency or exported lexicon.

Python standard library, no external entity resolver. Accept only the pinned source.
Entity codes are preserved, not reverse-guessed from expanded English descriptions.
"""
import gzip
import hashlib
import io
import json
import pathlib
import re
import sqlite3
import time
import urllib.request
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parent
RESOURCE = ROOT / 'resources/enriched'
PIN = json.loads((ROOT / 'enriched-source.json').read_text(encoding='utf-8'))
XML_LANG = '{http://www.w3.org/XML/1998/namespace}lang'
ADAPTER = 'jmdict-xml-sqlite-v1'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(data):
    return json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(',', ':'))


def values(element, tag):
    return [e.text or '' for e in element.findall(tag)]


def convert_entry(element, source_hash):
    entry_id = element.findtext('ent_seq')
    if not entry_id or not entry_id.isdecimal() or int(entry_id) <= 0:
        raise ValueError('Invalid ent_seq')
    spellings = [{'text': k.findtext('keb'), 'informationTags': values(k, 'ke_inf'),
                  'priority': values(k, 'ke_pri')} for k in element.findall('k_ele')]
    readings = [{'text': r.findtext('reb'), 'noKanji': r.find('re_nokanji') is not None,
                 'restrictedTo': values(r, 're_restr'), 'informationTags': values(r, 're_inf'),
                 'priority': values(r, 're_pri')} for r in element.findall('r_ele')]
    senses, inherited_pos = [], []
    for index, sense in enumerate(element.findall('sense')):
        own_pos = values(sense, 'pos')
        if own_pos:
            inherited_pos = own_pos
        senses.append({'sourceSenseReference': f'{source_hash}:{entry_id}:{index}',
                       'referenceStableAcrossRevisions': False,
                       'allowedSpellings': values(sense, 'stagk'),
                       'allowedReadings': values(sense, 'stagr'),
                       'partsOfSpeech': own_pos, 'effectivePOS': inherited_pos,
                       'domains': values(sense, 'field'), 'dialects': values(sense, 'dial'),
                       'misc': values(sense, 'misc'), 'information': values(sense, 's_inf'),
                       'crossReferences': values(sense, 'xref'), 'antonyms': values(sense, 'ant'),
                       'loanSources': [{'text': e.text or '', 'attributes': e.attrib}
                                       for e in sense.findall('lsource')],
                       'glosses': [{'text': ''.join(g.itertext()),
                                    'language': g.get(XML_LANG, 'eng'), 'attributes': g.attrib,
                                    'provenance': f'jmdict:{source_hash}:{entry_id}'}
                                   for g in sense.findall('gloss')]})
    content = {'entSeq': entry_id, 'spellings': spellings, 'readings': readings, 'senses': senses}
    return {**content, 'authority': 'jmdict', 'sourceDigest': source_hash,
            'dictionaryRevision': PIN['lastModified'], 'converterRevision': ADAPTER,
            'canonicalEntryDigest': sha(canonical(content).encode('utf-8'))}


def parse_xml(data):
    # Bound, hash-checked input only; never parse arbitrary uploads with this adapter.
    if re.search(br'<!ENTITY\s+[^>]*\b(?:SYSTEM|PUBLIC)\b', data[:30000]):
        raise ValueError('External entities forbidden')
    end = data.index(b']>') + 2
    header = re.sub(br'<!ENTITY\s+([\w-]+)\s+"[^"]*"\s*>',
                    lambda m: b'<!ENTITY ' + m[1] + b' "' + m[1] + b'">', data[:end])
    stream = io.BytesIO(header + data[end:])
    events = ET.iterparse(stream, events=('start', 'end'))
    _, root = next(events)
    for event, element in events:
        if event == 'end' and element.tag == 'entry':
            yield convert_entry(element, PIN['xmlSha256'])
            root.clear()


def main():
    RESOURCE.mkdir(exist_ok=True)
    compressed = RESOURCE / 'JMdict.gz'
    if not compressed.exists():
        with urllib.request.urlopen(PIN['url'], timeout=60) as response:
            compressed.write_bytes(response.read(PIN['compressedBytes'] + 1))
    raw = compressed.read_bytes()
    if len(raw) != PIN['compressedBytes'] or sha(raw) != PIN['sha256']:
        raise ValueError('Pinned source mismatch; never silently replace reference resource')
    started = time.perf_counter()
    data = gzip.decompress(raw)
    if len(data) != PIN['expandedBytes'] or sha(data) != PIN['xmlSha256']:
        raise ValueError('XML digest mismatch')
    target = RESOURCE / 'lexicon-v2.sqlite'
    if target.exists():
        raise FileExistsError('Index exists: use it, or explicitly choose a new local index version')
    db = sqlite3.connect(target)
    db.executescript('CREATE TABLE entries(id TEXT PRIMARY KEY, body BLOB NOT NULL);'
                     'CREATE TABLE forms(form TEXT NOT NULL,id TEXT NOT NULL,kind TEXT NOT NULL);'
                     'CREATE INDEX form_lookup ON forms(form);')
    counts = {'entries': 0, 'readingsRestricted': 0, 'noKanji': 0, 'senseStagk': 0, 'senseStagr': 0}
    languages = {}
    for entry in parse_xml(data):
        body = gzip.compress(canonical(entry).encode('utf-8'), mtime=0)
        db.execute('INSERT INTO entries VALUES (?,?)', (entry['entSeq'], body))
        forms = {(s['text'], 'spelling') for s in entry['spellings']}
        forms |= {(r['text'], 'reading') for r in entry['readings']}
        db.executemany('INSERT INTO forms VALUES (?,?,?)',
                       [(text, entry['entSeq'], kind) for text, kind in sorted(forms)])
        counts['entries'] += 1
        for reading in entry['readings']:
            counts['readingsRestricted'] += bool(reading['restrictedTo'])
            counts['noKanji'] += reading['noKanji']
        for sense in entry['senses']:
            counts['senseStagk'] += bool(sense['allowedSpellings'])
            counts['senseStagr'] += bool(sense['allowedReadings'])
            for gloss in sense['glosses']:
                languages[gloss['language']] = languages.get(gloss['language'], 0) + 1
    db.commit()
    db.close()
    manifest = {'schema': 1, 'adapter': ADAPTER, 'source': PIN,
                'adapterSha256': sha(pathlib.Path(__file__).read_bytes()),
                'databaseFile': target.name, 'entryEncoding': 'gzip-json-utf8',
                'databaseSha256': sha(target.read_bytes()), 'databaseBytes': target.stat().st_size,
                'counts': counts, 'glossLanguages': languages,
                'buildSeconds': time.perf_counter() - started,
                'note': 'Full multilingual lexicon remains ignored/local. No entry/gloss redistribution.'}
    (ROOT / 'reports/enriched-source.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(manifest))


if __name__ == '__main__':
    main()

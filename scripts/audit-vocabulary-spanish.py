"""Offline JMdict matcher for the Kana Study Vocabulary Spanish audit.
No dictionary download, automatic translation or production write is performed.
Usage: python scripts/audit-vocabulary-spanish.py --dictionary PATH --out PATH
The output is a PRIVATE working packet, not a linguistic review or distributable dictionary.
"""
import argparse, json, hashlib, unicodedata
from pathlib import Path

def catalog(path):
    text=Path(path).read_text(encoding='utf-8')
    return json.loads(text[text.index('=[')+1:].strip().rstrip(';'))

def n(s): return unicodedata.normalize('NFC',s)
def primary_pair(word, form, reading):
    readings=[r for r in word['kana'] if n(r['text'])==n(reading)]
    if not readings: return False
    if any(n(k['text'])==n(form) for k in word['kanji']):
        return any('*' in r['appliesToKanji'] or form in r['appliesToKanji'] for r in readings)
    return n(form)==n(reading) and any(n(r['text'])==n(form) for r in word['kana'])

def main():
    p=argparse.ArgumentParser();p.add_argument('--dictionary',required=True);p.add_argument('--out',required=True)
    args=p.parse_args();rows=catalog('src/app/data/vocabulary-n5.generated.ts')
    dictionary_bytes = Path(args.dictionary).read_bytes()
    # The verified release is recorded in the reviewed editorial source. Refuse a
    # different dictionary rather than silently reusing its sense indices.
    source = json.loads(Path('scripts/vocabulary-spanish-editorial.json').read_text(encoding='utf-8'))['source']
    digest = hashlib.sha256(dictionary_bytes).hexdigest()
    if digest != source['dictionarySha256']:
        raise ValueError('Dictionary differs from the reviewed, pinned JMdict release')
    dictionary=json.loads(dictionary_bytes)
    wanted={n(e['primaryReading']) for e in rows};index={}
    for w in dictionary['words']:
        for r in w['kana']:
            if n(r['text']) in wanted:index.setdefault(n(r['text']),[]).append(w)
    output=[]
    for i,e in enumerate(rows):
        candidates=[]
        for w in {w['id']:w for w in index.get(n(e['primaryReading']),[])}.values():
            exact=primary_pair(w,e['primaryWrittenForm'],e['primaryReading'])
            variant=any(primary_pair(w,f,e['primaryReading']) for f in e['writtenForms'])
            if not exact and not variant:continue
            senses=[]
            for number,s in enumerate(w['sense'],1):
                english=[g['text'] for g in s['gloss'] if g['lang']=='eng']
                if not english or not ('*' in s['appliesToKana'] or e['primaryReading'] in s['appliesToKana']):continue
                restricted=s['appliesToKanji']!=['*']
                applicable=not restricted or e['primaryWrittenForm'] in s['appliesToKanji']
                senses.append({'number':number,'pos':s['partOfSpeech'],'eng':english,'writtenRestrictions':s['appliesToKanji'],'readingRestrictions':s['appliesToKana'],'writtenApplicable':applicable,'misc':s['misc'],'field':s['field'],'info':s['info']})
            candidates.append({'id':w['id'],'pair':'primary' if exact else 'variant_only','forms':[k['text'] for k in w['kanji']],'readings':w['kana'],'englishSenses':senses,'spanishReference':[{'number':si,'gloss':[g['text'] for g in s['gloss'] if g['lang']=='spa']} for si,s in enumerate(w['sense'],1) if any(g['lang']=='spa' for g in s['gloss'])]})
        output.append({'index':i+1,'id':e['id'],'written':e['primaryWrittenForm'],'reading':e['primaryReading'],'pos':e['partOfSpeech'],'original':e['meanings']['es'],'quizOriginal':e['quizMeaning']['es'],'curriculumEnglish':e['meanings']['en'],'alternateReadings':e['readings'],'candidates':candidates,'reviewStatus':'NOT_REVIEWED'})
    root={'dictionary':{k:v for k,v in dictionary.items() if k not in ['words','tags']},'dictionarySha256':hashlib.sha256(Path(args.dictionary).read_bytes()).hexdigest(),'catalogSha256':hashlib.sha256(Path('src/app/data/vocabulary-n5.generated.ts').read_bytes()).hexdigest(),'entries':output}
    target=Path(args.out);target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(root,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'entries':len(output),'primaryUnique':sum(len([c for c in e['candidates'] if c['pair']=='primary'])==1 for e in output),'multipleCandidates':sum(len([c for c in e['candidates'] if c['pair']=='primary'])>1 for e in output),'noPrimary':sum(not any(c['pair']=='primary' for c in e['candidates']) for e in output),'withSpanishReference':sum(any(c['spanishReference'] for c in e['candidates']) for e in output)},ensure_ascii=False))
if __name__=='__main__':main()

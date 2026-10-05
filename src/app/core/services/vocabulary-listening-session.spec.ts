import {VOCABULARY_N5} from '../../data/vocabulary-n5.generated';
import {VOCABULARY_AUDIO_MANIFEST} from '../../data/vocabulary-audio-manifest.generated';
import {listeningOptions, VocabularyListeningSession} from './vocabulary-listening-session';

const entries=VOCABULARY_N5.filter(e=>Object.hasOwn(VOCABULARY_AUDIO_MANIFEST,e.id));
describe('Vocabulary Listening sessions',()=>{
  it('has exactly 606 approved eligible IDs and excludes ambiguous and flagged POC words',()=>{
    expect(entries).toHaveLength(606);
    for(const word of ['九','学生','ゆっくりと'])expect(entries.some(e=>e.primaryWrittenForm===word)).toBe(false);
    for(const word of ['お母さん','お父さん','明日'])expect(entries.some(e=>e.primaryWrittenForm===word)).toBe(true);
  });
  for(const language of ['es','en','ca'] as const)for(const kind of ['meaning','japanese'] as const){
    it(`${kind}/${language}: exactly four unique labels and one correct real entry`,()=>{
      for(const entry of entries){
        const options=listeningOptions(entry,kind,entries,language,()=>.4);
        expect(options).toHaveLength(4);expect(new Set(options.map(o=>o.label.normalize('NFKC').trim().toLowerCase())).size).toBe(4);
        expect(options.filter(o=>o.correct).map(o=>o.id)).toEqual([entry.id]);
        expect(options.find(o=>o.correct)?.label).toBe(kind==='meaning'?entry.quizMeaning[language]:entry.primaryWrittenForm);
      }
    });
  }
  it('prioritizes distractors of the same category',()=>{
    const entry=entries.find(e=>e.studyCategory==='verbs')!;
    const options=listeningOptions(entry,'japanese',entries,'es');
    expect(options.every(o=>entries.find(e=>e.id===o.id)?.studyCategory==='verbs')).toBe(true);
  });
  it('has no repetitions and keeps feedback until Continue',()=>{
    const session=new VocabularyListeningSession(entries,entries,'meaning','es'),seen:string[]=[];
    while(session.question){const q=session.question;seen.push(q.entry.id);session.answer(q.options.find(o=>o.correct)!.id);
      expect(session.question).toBe(q);expect(session.answer(q.options[0].id)).toBeNull();session.next();}
    expect(seen).toHaveLength(15);expect(new Set(seen).size).toBe(15);expect(session.answered).toBe(15);
  });
  it('mixed mode includes both kinds without duplicate words',()=>{
    const session=new VocabularyListeningSession(entries,entries,'mixed','es'),kinds=new Set<string>();
    while(session.question){kinds.add(session.question.kind);session.answer(session.question.options[0].id);session.next();}
    expect(kinds).toEqual(new Set(['meaning','japanese']));
  });
  it('skips a failed audio permanently and replaces it from available words without scoring an answer',()=>{
    const session=new VocabularyListeningSession(entries,entries,'japanese','es'),failed=session.question!.entry.id;
    session.skip();expect(session.answered).toBe(0);expect(session.failedIds.has(failed)).toBe(true);
    const seen:string[]=[];while(session.question){seen.push(session.question.entry.id);session.answer(session.question.options[0].id);session.next();}
    expect(seen).toHaveLength(15);expect(seen).not.toContain(failed);expect(new Set(seen).size).toBe(15);
  });
  it('handles a small pool and exhaustion after failures without infinite loops',()=>{
    const session=new VocabularyListeningSession(entries.slice(0,2),entries,'meaning','es');
    expect(session.total).toBe(2);session.skip();expect(session.total).toBe(1);session.skip();expect(session.question).toBeNull();expect(session.total).toBe(0);
  });
});

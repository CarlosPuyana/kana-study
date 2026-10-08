import { generateMangaReview, mangaContext } from './manga-review-generator';
import { MangaReviewEvent } from '../models/manga-review.model';
import { MangaStudySavedItem } from '../models/manga-study-saved.model';
import { VOCABULARY_N5 } from '../../data/vocabulary-n5.generated';

const saved = (n: number): MangaStudySavedItem[] => VOCABULARY_N5.filter(e=>e.enabled).slice(0,n).map(e=>({schemaVersion:1,id:`vocabulary:${e.id}`,vocabularyId:e.id,
  expression:e.primaryWrittenForm,reading:e.primaryReading,meaning:e.quizMeaning.en,kanji:[],source:{volumeId:'fixture',pageNumber:1},createdAt:1}));
const external: MangaStudySavedItem = {schemaVersion:1,id:'dictionary:dragon',expression:'龍',reading:'りゅう',meaning:'dragon',kanji:[],source:{volumeId:'fixture',pageNumber:1},createdAt:1};
const generate = (items=saved(12), patch: Partial<Parameters<typeof generateMangaReview>[0]>={}) => generateMangaReview({items,language:'es',mode:'mixed',count:5,history:[],seed:42,...patch});
describe('Manga review generator',()=>{
  it.each([5,10,'all'] as const)('selects %s real saved words',count=>{
    const questions=generate(saved(12),{count});expect(questions).toHaveLength(count==='all'?12:count);
    expect(new Set(questions.map(q=>q.item.id)).size).toBe(questions.length);
  });
  it('handles one word and an empty collection without invented words',()=>{expect(generate([external],{},)).toHaveLength(1);expect(generate([])).toEqual([]);});
  it('uses reading without meaning and excludes words with no evaluable data',()=>{
    const questions=generate([{...external,meaning:undefined},{...external,id:'empty',meaning:undefined,reading:undefined}]);
    expect(questions).toHaveLength(1);expect(questions[0]).toMatchObject({type:'reading',answer:'りゅう',options:[]});
  });
  it('uses external dictionary data without pretending it is translated',()=>{
    for(const language of ['es','en','ca'] as const){const q=generate([external],{language})[0];expect(q.originalMeaning).toBe(true);expect(q.options).toEqual([]);expect([q.prompt,q.answer]).toContain('dragon');}
  });
  it('is reproducible, independent of input order, and does not mutate snapshots',()=>{
    const items=saved(12),before=structuredClone(items);expect(generate(items)).toEqual(generate([...items].reverse()));expect(items).toEqual(before);
    const q=generate(items);q[0].item.expression='changed';expect(items).toEqual(before);
  });
  it('produces all four exercise types only when their data exists',()=>{
    const types=new Set<string>();const item={...saved(1)[0],surface:saved(1)[0].expression,context:`「${saved(1)[0].expression}！」`};
    for(let seed=0;seed<100;seed++)types.add(generate([item],{seed})[0].type);
    expect([...types].sort()).toEqual(['context','expression','meaning','reading']);
  });
  it('deduplicates normalized options and never uses a documented alternative as a wrong reading',()=>{
    for(let seed=0;seed<30;seed++)for(const q of generate(saved(30),{count:'all',seed})){
      expect(new Set(q.options.map(x=>x.normalize('NFC').trim().toLowerCase())).size).toBe(q.options.length);
      if(q.options.length)expect(q.options.filter(x=>x===q.answer)).toHaveLength(1);
      if(q.type==='reading'){const e=VOCABULARY_N5.find(e=>e.id===q.item.vocabularyId)!;expect(q.options.filter(x=>x!==q.answer).some(x=>e.readings.includes(x))).toBe(false);}
    }
  });
  it('rejects homophone and equivalent-meaning distractors regardless of catalog order',()=>{
    const base=VOCABULARY_N5.find(e=>e.enabled)!;
    const catalog=[base,{...base,id:'homophone',primaryWrittenForm:'箸',writtenForms:['箸']},{...base,id:'synonym',primaryWrittenForm:'橋',writtenForms:['橋'],primaryReading:'はし',readings:['はし']}];
    const items=catalog.map(e=>({...saved(1)[0],id:e.id,vocabularyId:e.id,expression:e.primaryWrittenForm,reading:e.primaryReading}));
    const input={items,language:'es' as const,mode:'mixed' as const,count:'all' as const,history:[],seed:1};
    expect(generateMangaReview(input,catalog).every(q=>!q.options.length)).toBe(true);
    expect(generateMangaReview(input,[...catalog].reverse())).toEqual(generateMangaReview(input,catalog));
  });
  it('prioritizes failures while reserving slots for unseen/older words',()=>{
    const items=saved(12),history:MangaReviewEvent[]=items.slice(0,6).map((item,i)=>({id:String(i),key:item.id,savedItemId:item.id,sessionId:'old',reviewedAt:'2026-10-08T00:00:00Z',exerciseType:'reading',correct:false,repetition:false,answerMode:'self-assessment',rating:'again'}));
    const questions=generate(items,{history});expect(questions[0].item.id).toBeOneOf(items.slice(0,6).map(i=>i.id));
    expect(questions.some(q=>items.slice(6).some(i=>i.id===q.item.id))).toBe(true);
  });
  it('does not treat Hiragana/Katakana variants of a homophone as incorrect readings',()=>{
    const base=VOCABULARY_N5.find(e=>e.enabled)!;
    const catalog=[{...base,id:'bridge',primaryWrittenForm:'橋',writtenForms:['橋'],primaryReading:'はし',readings:['はし'],quizMeaning:{es:'puente',en:'bridge',ca:'pont'},meanings:{es:['puente'],en:['bridge'],ca:['pont']}},
      {...base,id:'chopsticks',primaryWrittenForm:'箸',writtenForms:['箸'],primaryReading:'ハシ',readings:['ハシ'],quizMeaning:{es:'palillos',en:'chopsticks',ca:'bastonets'},meanings:{es:['palillos'],en:['chopsticks'],ca:['bastonets']}}];
    const items=catalog.map(e=>({...saved(1)[0],id:e.id,vocabularyId:e.id,expression:e.primaryWrittenForm,reading:e.primaryReading}));
    const questions=generateMangaReview({items,language:'es',mode:'mixed',count:'all',history:[],seed:3},catalog);
    expect(questions.every(q=>q.options.length===0)).toBe(true);
  });
  it('preserves inflected context, punctuation and Unicode without replacing the surface',()=>{
    const item={...external,expression:'食べる',surface:'食べなかった',context:'昨日何も食べなかった。😀'};
    const q=generate([item],{mode:'contextual'})[0];expect(q.type).toBe('context');
    expect(q.context).toEqual({before:'昨日何も',surface:'食べなかった',after:'。😀'});
    expect(q.context!.before+q.context!.surface+q.context!.after).toBe(item.context);
  });
  it.each([
    {surface:undefined,context:'龍。'}, {surface:'龍',context:'猫。'},
    {surface:'龍',context:'龍と龍。'}, {surface:'猫',context:'猫。'},
  ])('falls back for missing or ambiguous context %j',patch=>{
    expect(mangaContext({...external,...patch})).toBeUndefined();expect(generate([{...external,...patch}],{mode:'contextual'})[0].type).not.toBe('context');
  });
  it('keeps imported HTML as plain context data',()=>{
    const item={...external,surface:'龍',context:'<img src=x onerror=alert(1)>龍。'};
    const context=mangaContext(item)!;expect(context.before+context.surface+context.after).toBe(item.context);
  });
});

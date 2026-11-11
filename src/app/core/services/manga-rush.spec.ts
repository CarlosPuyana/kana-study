import { MANGA_RUSH_DEFAULTS, mangaRushExclusion, mangaRushPool, selectMangaRushCards } from './manga-rush';
import { rushIndex, rushWord } from './manga-rush.fixture';
import { MangaRushConfiguration } from '../models/manga-rush.model';

describe('Manga RUSH eligibility and finite selection, independent of knowledge links',()=>{
  const words=[rushWord(),rushWord('食べる','たべる',2,2,'lexical','known'),rushWord('に','に',3,4,'functional','learning'),
    rushWord('うん','うん',4,1,'lexical','unknown'),rushWord('いる','いる',5,2,'unclassified')];
  const pool=(config:Partial<MangaRushConfiguration>={})=>mangaRushPool(rushIndex(words),words,{...MANGA_RUSH_DEFAULTS,...config});
  it('defaults to all knowledge and lexical vocabulary, including freshly imported unlinked entries',()=>{
    const result=pool();expect(result.distinct).toBe(3);expect(result.availableCards).toBe(3);expect(result.selectedCards).toBe(3);
    expect(result.words.map(w=>w.state)).toEqual(['unlinked','known','unknown']);expect(result.unresolvedSpans).toBe(1);
  });
  it.each([['all',5],['known',1],['learning',1],['unknown',1],['unlinked',2],['familiar',2]] as const)(
    'filters knowledge %s without inferring it from category',(knowledge,count)=>expect(pool({category:'all',knowledge}).distinct).toBe(count));
  it.each([['lexical',3],['functional',1],['unclassified',1],['all',5]] as const)(
    'filters category %s using M1.6 evidence',(category,count)=>expect(pool({category}).distinct).toBe(count));
  it('ranks distinct words by frequency and shuffles distinct words without mutating the index',()=>{
    const before=JSON.stringify(words),config={...MANGA_RUSH_DEFAULTS,amount:'all' as const};
    const ranked=selectMangaRushCards('v1',pool(),config);
    expect(ranked.map(c=>c.lemma)).toEqual(['猫','食べる','うん']);
    const random=selectMangaRushCards('v1',pool(),{...config,selection:'random'},()=>0);
    expect(random.map(c=>c.lexicalKey)).not.toEqual(ranked.map(c=>c.lexicalKey));
    expect(new Set(random.map(c=>c.lexicalKey)).size).toBe(3);expect(JSON.stringify(words)).toBe(before);
  });
  it('weights by authentic occurrences with finite repetition, not an unbounded loop',()=>{
    const config:MangaRushConfiguration={...MANGA_RUSH_DEFAULTS,category:'all',selection:'weighted',amount:'all'};
    const result=pool(config),cards=selectMangaRushCards('v1',result,config,()=>0.25);
    expect(result.availableCards).toBe(12);expect(cards).toHaveLength(12);
    expect(cards.filter(c=>c.lemma==='猫')).toHaveLength(3);expect(cards.filter(c=>c.lemma==='に')).toHaveLength(4);
    expect(new Set(cards.map(c=>JSON.stringify([c.lexicalKey,c.occurrence]))).size).toBe(12);
    expect(selectMangaRushCards('v1',result,{...config,amount:10})).toHaveLength(10);
    expect(selectMangaRushCards('v1',result,{...config,amount:50})).toHaveLength(12);
  });
  it.each([10,20,50,'all'] as const)('caps amount %s at availability',amount=>{
    const many=Array.from({length:60},(_,i)=>rushWord('猫','ねこ',i+1,1));
    const config={...MANGA_RUSH_DEFAULTS,amount};const result=mangaRushPool(rushIndex(many),many,config);
    expect(result.selectedCards).toBe(amount==='all'?60:amount);expect(selectMangaRushCards('v1',result,config)).toHaveLength(result.selectedCards);
  });
  it('excludes unsafe identity, reading, meaning and source with separate reasons',()=>{
    const badIdentity=rushWord(),badReading=rushWord(),badMeaning=rushWord(),badSource=rushWord();
    badIdentity.entry.key='not a lexical identity';badReading.entry.reading='猫';badReading.entry.key=JSON.stringify(['fixture',1,'猫','猫']);
    badMeaning.entry.glosses=['','  '];badSource.entry.occurrences[0].context='別の文';
    const invalid=[badIdentity,badReading,badMeaning,badSource];
    expect(mangaRushPool(rushIndex(invalid),invalid,MANGA_RUSH_DEFAULTS).excluded).toEqual({identity:1,reading:1,meaning:1,source:1});
    expect(invalid.map(w=>mangaRushExclusion(w.entry,1))).toEqual(['identity','reading','meaning','source']);
  });
  it('allows explicit ambiguous/unclassified entries with all dictionary senses, but not invented identities',()=>{
    const ambiguous=rushWord('いる','いる',1,1,'unclassified');ambiguous.entry.glosses=['existir','continuación de una acción'];
    const index=rushIndex([ambiguous]),config={...MANGA_RUSH_DEFAULTS,category:'unclassified' as const};
    const card=selectMangaRushCards('v1',mangaRushPool(index,[ambiguous],config),config)[0];
    expect(card.answer).toEqual({kind:'dictionary',contextualized:false,meanings:ambiguous.entry.glosses});
    expect(card.occurrence.context).toBe('いる。');expect(card.category).toBe('unclassified');
  });
  it('reconstructs only a POS-validated surface reading and retains the lemma reading separately',()=>{
    const word=rushWord('食べる','たべる',1,1);word.entry.categoryEvidence=[{definitionTags:'v1',rules:'v1'}];
    word.entry.occurrences=[{pageIndex:0,blockIndex:0,lineIndex:0,start:0,end:3,surface:'食べた',context:'食べた。'}];
    const result=mangaRushPool(rushIndex([word]),[word],MANGA_RUSH_DEFAULTS);
    const card=selectMangaRushCards('v1',result,MANGA_RUSH_DEFAULTS)[0];
    expect(card.surfaceReading).toBe('たべた');expect(card.lemmaReading).toBe('たべる');
    word.entry.categoryEvidence=[];expect(selectMangaRushCards('v1',result,MANGA_RUSH_DEFAULTS)[0].surfaceReading).toBeUndefined();
  });
});

import { M16_DICTIONARY_ROWS } from './manga-linguistic-regression.fixture';
import { parseDictionaryTerm } from './yomitan-dictionary-parser';
import { analyzeMangaLine, mangaLexemeKey, mergeMangaLexemes } from './manga-vocabulary-analysis';
import { mangaDictionaryPosEvidence } from './manga-dictionary-pos-evidence';
import { classifyMangaPos, filterMangaWords } from './manga-vocabulary-presentation';
import { MangaLexeme } from '../models/manga-vocabulary-index.model';

const terms=M16_DICTIONARY_ROWS.map((r,i)=>parseDictionaryTerm(r,'m16-fixture',i));
const find=async(s:string)=>{const exact=terms.filter(t=>t.expression===s);return exact.length?exact:terms.filter(t=>t.reading===s);};
const location={pageIndex:0,blockIndex:0,lineIndex:0};
describe('M1.6 actual dictionary -> lexical identity -> POS regression',()=>{
  it('identifies written/read mother as one nominal lexeme, preserving both occurrences',async()=>{
    const result=await analyzeMangaLine('お母さん、おかあさん。',location,find);
    expect(result.issues).toEqual([]);expect(result.entries).toHaveLength(2);
    const merged=new Map<string,MangaLexeme>();mergeMangaLexemes(merged,result.entries);
    expect(merged.size).toBe(1);const entry=[...merged.values()][0];
    expect(entry.category).toBe('lexical');expect(entry.categoryEvidence?.[0].definitionTags).toBe('n pn');
    expect(entry.key).toBe(mangaLexemeKey(terms.find(t=>t.expression==='お母さん')!));
    expect(entry.occurrences.map(o=>o.surface)).toEqual(['お母さん','おかあさん']);
    expect(entry.reading).toBe('おかあさん');
  });
  it.each(['料理をする。','勉強する。','どうする？','映画を見る。','見てみる。','ここにいる。','歩いている。'])(
    'does not claim a contextual verb/auxiliary use absent syntax evidence: %s',async text=>{
      const result=await analyzeMangaLine(text,location,find);
      const verb=result.entries.find(e=>['する','見る','いる'].includes(e.lemma));
      expect(verb,text).toBeDefined();expect(verb?.category).toBe('unclassified');expect(verb?.categoryReason).toBe('conflicting-pos');
    });
  it('keeps lexical-only and auxiliary-only evidence distinct, never overridden by another sense',()=>{
    expect(classifyMangaPos([{definitionTags:'vs-i vt',rules:'vs'}]).category).toBe('lexical');
    expect(classifyMangaPos([{definitionTags:'aux-v',rules:'vs'}]).category).toBe('functional');
    expect(classifyMangaPos([{definitionTags:'vs-i vt',rules:'vs'},{definitionTags:'aux-v',rules:'vs'}]).category).toBe('unclassified');
  });
  it('detects missing grammatical alternatives for the exact shipped ha/to rows, without relinking identities',async()=>{
    for(const [surface,tags] of [['は','int'],['と','n']]){
      const term=terms.find(t=>t.expression===surface)!;expect(term.definitionTags).toBe(tags);
      const evidence=await mangaDictionaryPosEvidence(term);
      expect(evidence.alternatives?.some(a=>a.definitionTags.split(' ').includes('prt'))).toBe(true);
      expect(classifyMangaPos([evidence]).category).toBe('unclassified');
      // Same spelling/sequence with different content is not enough to apply this evidence.
      expect((await mangaDictionaryPosEvidence({...term,glossaries:['different content']})).alternatives).toBeUndefined();
    }
    const result=await analyzeMangaLine('私は行く。水と、葉と。',location,find);
    expect(result.entries.filter(e=>['は','と'].includes(e.lemma)).every(e=>e.category==='unclassified')).toBe(true);
    expect(result.entries.filter(e=>e.lemma==='と')).toHaveLength(2);
  });
  it('retains unambiguous particles and real interjection un, including OCR source context',async()=>{
    const result=await analyzeMangaLine('うん。に。が。の。',location,find);
    expect(result.issues).toEqual([]);
    expect(result.entries.map(e=>[e.lemma,e.category])).toEqual([['うん','lexical'],['に','functional'],['が','functional'],['の','functional']]);
    expect(result.entries[0].categoryEvidence?.[0].definitionTags).toBe('int');
    for(const e of result.entries)for(const o of e.occurrences)expect(o.context.slice(o.start,o.end)).toBe(o.surface);
  });
  it('keeps missing POS, conflicting categories and unresolved homographs separate without losing counted words',async()=>{
    const result=await analyzeMangaLine('うん。は。と。する。見る。いる。お母さん。',location,find);
    const words=result.entries.map(entry=>({entry,state:'unlinked' as const}));
    expect(words).toHaveLength(7);
    const sections=['lexical','functional','unclassified'] as const;
    expect(sections.reduce((n,c)=>n+filterMangaWords(words,c).length,0)).toBe(7);
    expect(filterMangaWords(words,'unclassified')).toHaveLength(5);
    const missing=classifyMangaPos([{definitionTags:'',rules:''}]);expect(missing.categoryReason).toBe('missing-pos');
    const mother=terms.find(t=>t.expression==='お母さん')!;
    const ambiguous=await analyzeMangaLine('おかあさん。',location,async()=>[mother,{...mother,id:'other',sequence:999}]);
    expect(ambiguous.entries).toEqual([]);expect(ambiguous.issues.some(i=>i.reason==='ambiguous')).toBe(true);
  });
});

import { classifyMangaPos, filterMangaWords, isMangaLexicalCandidate, mangaReadingAddsInformation } from './manga-vocabulary-presentation';
import { analyzeMangaLine, mergeMangaLexemes } from './manga-vocabulary-analysis';
import { DictionaryTerm } from '../models/dictionary.model';
import { MangaLexeme, MangaProjectedWord } from '../models/manga-vocabulary-index.model';

describe('M1.5 display-only readings and dictionary POS evidence',()=>{
  it.each([['に','に',false],['が','が',false],['うん','うん',false],['ウン','うん',false],
    ['ｶﾞ','が',false],['カ\u3099','が',false],['ガ','か\u3099',false],['学校','がっこう',true],
    ['は','わ',true],['コー','こう',true],['キヤ','きゃ',true],['ヰ','い',true],['ガ','か',true],['ヽ','ゝ',false],['ヾ','ゞ',false]])(
    'keeps an informative reading: %s / %s',(form,reading,expected)=>expect(mangaReadingAddsInformation(form,reading)).toBe(expected));
  it.each(['n','n-pr','n pn','pn','v1 vt','adj-i','adj-na','adv','adv-to','int','exp','v5k-s vi','vs-i'])('recognizes lexical evidence %s',definitionTags=>{
    expect(classifyMangaPos([{definitionTags,rules:''}]).category).toBe('lexical');
  });
  it.each(['prt','prt conj','cop aux-v','aux-v','aux-adj'])('recognizes functional evidence %s',definitionTags=>{
    expect(classifyMangaPos([{definitionTags,rules:'v1'}]).category).toBe('functional');
  });
  it('keeps missing, conflicting or unsupported categories explicit',()=>{
    for(const definitionTags of ['','unc','n prt','prt adj-i','mystery','vt vi','aux-v v1','aux-adj adj-i','vs-i vi vt suf aux-v'])
      expect(classifyMangaPos([{definitionTags,rules:'v1'}]).category).toBe('unclassified');
    expect(classifyMangaPos([{definitionTags:'n',rules:''},{definitionTags:'prt',rules:''}]).categoryReason).toBe('conflicting-pos');
    expect(classifyMangaPos([{definitionTags:'n',rules:''},{definitionTags:'',rules:''}]).category).toBe('unclassified');
  });
  it('preserves every frequency/context and keeps grammatical category independent of knowledge',async()=>{
    const term=(expression:string,reading:string,sequence:number,definitionTags:string):DictionaryTerm=>({id:String(sequence),dictionaryId:'d',expression,reading,sequence,definitionTags,rules:'',score:1,termTags:'',glossaries:['fixture']});
    const terms=[term('猫','ねこ',1,'n'),term('に','に',2,'prt'),term('です','です',3,'cop aux-v'),term('謎','なぞ',4,'')];
    const analyzed=await analyzeMangaLine('猫。に。猫。です。謎。',{pageIndex:0,blockIndex:0,lineIndex:0},async s=>terms.filter(t=>t.expression===s));
    const map=new Map<string,MangaLexeme>();mergeMangaLexemes(map,analyzed.entries);
    const words:MangaProjectedWord[]=[...map.values()].map((entry,i)=>({entry,state:i===0?'unlinked':'known'}));
    expect(words.reduce((n,w)=>n+w.entry.occurrences.length,0)).toBe(5);
    expect(filterMangaWords(words,'lexical').map(w=>w.entry.lemma)).toEqual(['猫']);
    expect(filterMangaWords(words,'functional','known')).toHaveLength(2);
    expect(filterMangaWords(words,'unclassified')).toHaveLength(1);
    expect(words.filter(w=>isMangaLexicalCandidate(w.entry))).toHaveLength(1);
    expect(isMangaLexicalCandidate({...words[0].entry,category:undefined})).toBe(false);
    expect(isMangaLexicalCandidate({...words[0].entry,glosses:[]})).toBe(false);
    const original=JSON.stringify(words);filterMangaWords(words,'functional','all',true);expect(JSON.stringify(words)).toBe(original);
    const cat=words[0].entry;mergeMangaLexemes(map,[{...cat,category:'functional',categoryEvidence:[{definitionTags:'prt',rules:''}],occurrences:[]}]);
    expect(map.get(cat.key)?.category).toBe('unclassified');
  });
});

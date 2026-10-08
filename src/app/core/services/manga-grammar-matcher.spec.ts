import { MANGA_GRAMMAR_RULES, mangaGrammarCatalog, mangaGrammarLinks, matchMangaGrammar, searchMangaGrammar } from './manga-grammar-matcher';
import { DictionaryLookup } from '../models/dictionary.model';
import { grammarTopicRound } from '../../features/grammar/services/grammar-interactive-catalog';
import { es,en,ca } from '../../../assets/i18n/dictionaries.generated';

describe('Manga local curated grammar matcher',()=>{
  for(const rule of MANGA_GRAMMAR_RULES)for(const form of rule.forms){
    it(`verifies only the complete documented phrase ${form}`,()=>{
      const result=matchMangaGrammar({selectedText:form+'。'});
      expect(result.matches.map(match=>[match.concept.id,match.confidence])).toEqual([[rule.conceptId,'verified']]);
      for(const text of ['前'+form,form+'もの','「'+form+'」',form.slice(1),'\n'+form+'\n別の文'])expect(matchMangaGrammar({selectedText:text}).matches).toEqual([]);
    });
  }
  it.each(['は','が','て','ない','ました','かばん','はし','がっこう','おてら','高かった','食べた','読んでいる','食べて','見てくださいと言った'])('does not invent a construction from %s',text=>{
    expect(matchMangaGrammar({selectedText:text}).matches).toEqual([]);
  });
  it('requires reliable selection boundaries before using a complete OCR context',()=>{
    const input={selectedText:'見て',contextText:'見てください。',start:0,end:2};
    expect(matchMangaGrammar(input).matches[0]?.confidence).toBe('verified');
    expect(matchMangaGrammar({...input,start:1,end:3}).matches).toEqual([]);
    expect(matchMangaGrammar({...input,contextText:'見てください。別の文。'}).matches).toEqual([]);
  });
  it.each([['食べて','食べる','v1'],['読んで','読む','v5']])('labels dictionary-backed %s as possible, never a full construction',(surface,baseForm,rules)=>{
    const dictionary:DictionaryLookup={installed:true,query:surface,surface,baseForm,reasons:['te'],terms:[{id:'verb',dictionaryId:'local',expression:baseForm,reading:baseForm,rules,glossaries:[],definitionTags:'',termTags:'',score:0,sequence:1}]};
    const input={selectedText:surface,surface,baseForm,dictionary};
    expect(matchMangaGrammar(input).matches.map(match=>[match.concept.id,match.confidence])).toEqual([['te-form-formation','possible']]);
    for(const changed of [{dictionary:undefined},{dictionary:{...dictionary,terms:[]}},{dictionary:{...dictionary,reasons:['past']}},{dictionary:{...dictionary,terms:[{...dictionary.terms[0],rules:'n'}]}},{baseForm:'見る'},{selectedText:surface+'いた'}]){
      expect(matchMangaGrammar({...input,...changed}).matches).toEqual([]);
    }
  });
  it('is bounded and preserves original text without normalization or mutations',()=>{
    for(const [text,state] of [['','empty'],['hello','non-japanese'],['あ'.repeat(1201),'too-long']] as const)expect(matchMangaGrammar({selectedText:text}).state).toBe(state);
    const input={selectedText:'書いてください。\n',contextText:'書いてください。\n'};const before=structuredClone(input);matchMangaGrammar(input);expect(input).toEqual(before);
    expect(matchMangaGrammar({selectedText:'<img src=x onerror=alert(1)>見てください'}).matches).toEqual([]);
  });
  it('uses only semantic concepts with valid lessons and existing exercise routes',()=>{
    expect(mangaGrammarCatalog.every(concept=>concept.topicId!=='00'&&concept.topicId!=='11')).toBe(true);
    for(const concept of mangaGrammarCatalog){const links=mangaGrammarLinks(concept.id)!;
      expect(links.lesson).toBe(`/grammar/n5/${concept.topicId}/${concept.id}`);
      expect(!!links.practice).toBe(grammarTopicRound(concept.topicId,concept.id).length>0);
    }
    expect(mangaGrammarLinks('invented')).toBeNull();
  });
  it.each([es,en,ca])('searches translated names/summaries and Japanese patterns locally with a limit',dictionary=>{
    const concept=mangaGrammarCatalog.find(concept=>concept.id==='te-kudasai')!;
    expect(searchMangaGrammar(dictionary[concept.titleKey],key=>dictionary[key]).map(row=>row.id)).toContain(concept.id);
    expect(searchMangaGrammar('ください',key=>dictionary[key]).length).toBeLessThanOrEqual(8);
    expect(searchMangaGrammar('',key=>dictionary[key])).toEqual([]);
  });
});

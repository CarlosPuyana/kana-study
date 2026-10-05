import {TestBed} from '@angular/core/testing';
import {DictionaryLookup} from '../models/dictionary.model';
import {VOCABULARY_N5} from '../../data/vocabulary-n5.generated';
import {JapaneseAudioService, JAPANESE_AUDIO_FACTORY} from './japanese-audio.service';
import {MangaStudyIntegrationService, matchMangaVocabulary, mangaWordCanBeWritten} from './manga-study-integration.service';

export function wordLookup(expression:string,reading=expression):DictionaryLookup {
  return {installed:true,query:expression,terms:[{id:'fixture',dictionaryId:'fixture',expression,reading,glossaries:['fixture meaning'],definitionTags:'',rules:'',score:0,sequence:1,termTags:''}]};
}
describe('Manga study integration',()=>{
  const factory=vi.fn();
  beforeEach(()=>{factory.mockClear();TestBed.configureTestingModule({providers:[{provide:JAPANESE_AUDIO_FACTORY,useValue:factory}]});});
  const match=(expression:string,reading=expression)=>TestBed.inject(MangaStudyIntegrationService).match(wordLookup(expression,reading));
  it('matches the exact written form and known reading',()=>expect(match('学校','がっこう').vocabulary?.primaryWrittenForm).toBe('学校'));
  it('uses the existing deinflected base instead of the surface',()=>{
    const result=TestBed.inject(MangaStudyIntegrationService).match({...wordLookup('食べる','たべる'),surface:'食べなかった',query:'食べなかった',baseForm:'食べる',reading:'たべる'});
    expect(result.vocabulary?.primaryWrittenForm).toBe('食べる');expect(result.kanji.map(k=>k.character)).toEqual(['食']);
  });
  it.each(['ここ','きれい'])('matches kana-only %s without a Kanji section',expression=>{expect(match(expression).vocabulary?.primaryWrittenForm).toBe(expression);expect(match(expression).kanji).toEqual([]);});
  it('uses documented orthographic variants',()=>expect(match('學校','がっこう').vocabulary?.primaryWrittenForm).toBe('学校'));
  it('supports a unique reading fallback',()=>expect(match('たべる').vocabulary?.primaryWrittenForm).toBe('食べる'));
  it('abstains when reading matches more than one word',()=>{
    const entry=VOCABULARY_N5.find(e=>e.primaryWrittenForm==='食べる')!;
    const catalog=[entry,{...entry,id:'homophone',primaryWrittenForm:'別語',writtenForms:['別語']}];
    expect(matchMangaVocabulary(wordLookup('たべる'),catalog)).toBeUndefined();
    expect(matchMangaVocabulary(wordLookup('食べる','たべる'),catalog)?.id).toBe(entry.id);
  });
  it('uses writing plus reading to disambiguate identical forms',()=>{
    const entry=VOCABULARY_N5.find(e=>e.primaryWrittenForm==='食べる')!;
    const catalog=[entry,{...entry,id:'other-reading',primaryReading:'べつ',readings:['べつ']}];
    expect(matchMangaVocabulary(wordLookup('食べる','たべる'),catalog)?.id).toBe(entry.id);
    expect(matchMangaVocabulary({...wordLookup('食べる'),terms:[{...wordLookup('食べる').terms[0],reading:''}]},catalog)).toBeUndefined();
  });
  it('does not alias a different Kanji word using its homophone',()=>expect(match('架空語','たべる').vocabulary).toBeUndefined());
  it('rejects inconsistent kana expression and reading',()=>expect(match('ぜんぜん','たべる').vocabulary).toBeUndefined());
  it('does not invent an absent vocabulary word',()=>expect(match('ありがとう').vocabulary).toBeUndefined());
  it('extracts multiple Kanji in order',()=>expect(match('学校','がっこう').kanji.map(k=>k.character)).toEqual(['学','校']));
  it('deduplicates and skips unavailable characters without needing vocabulary',()=>{
    const result=match('食べ学学校龍','しょく');expect(result.vocabulary).toBeUndefined();expect(result.kanji.map(k=>k.character)).toEqual(['食','学','校']);
  });
  it('handles a single Kanji and mixed kana correctly',()=>{expect(match('水','みず').kanji.map(k=>k.character)).toEqual(['水']);expect(match('お母さん','おかあさん').kanji.map(k=>k.character)).toEqual(['母']);});
  it('uses only the real audio manifest and never creates or plays audio during lookup',()=>{
    const audio=TestBed.inject(JapaneseAudioService),play=vi.spyOn(audio,'play');
    expect(match('食べる','たべる').audioAvailable).toBe(true);expect(match('九','きゅう').vocabulary?.id).toBe('n5-1o3ndsw');expect(match('九','きゅう').audioAvailable).toBe(false);
    expect(play).not.toHaveBeenCalled();expect(factory).not.toHaveBeenCalled();
  });
  it('requires an installed dictionary result',()=>expect(TestBed.inject(MangaStudyIntegrationService).match({installed:false,query:'学校',terms:[]}).kanji).toEqual([]));
  it('does not offer word writing for compound alternatives',()=>{
    expect(mangaWordCanBeWritten(VOCABULARY_N5.find(e=>e.primaryWrittenForm==='食べる')!)).toBe(true);
    expect(mangaWordCanBeWritten({...VOCABULARY_N5[0],primaryWrittenForm:'川/河'})).toBe(false);
  });
});

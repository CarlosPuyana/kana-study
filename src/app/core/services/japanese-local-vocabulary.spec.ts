import {VocabularyEntry} from '../models/vocabulary.model';
import {es,en,ca} from '../../../assets/i18n/dictionaries.generated';
import {GRAMMAR_LESSONS} from '../../features/grammar/data/grammar-catalog';
import {intendedVocabularyWords,localVocabularyWord,localVocabularyLookup,parseVocabularyWord,vocabularyMeanings} from './japanese-local-vocabulary';

describe('Exact local vocabulary reference',()=>{
  it('parses Japanese parentheses, preserves plain kana and deduplicates only identical editorial entries',()=>{
    expect(parseVocabularyWord(' 学生（がくせい） ')).toEqual({expression:'学生',reading:'がくせい'});
    expect(parseVocabularyWord('かわいい')).toEqual({expression:'かわいい',reading:''});
    expect(intendedVocabularyWords(['学生（がくせい）',' 学生（がくせい） ','学生（せいと）']).map(w=>w.raw)).toEqual(['学生（がくせい）','学生（せいと）']);
  });
  it.each(['es','en','ca'] as const)('uses reliable exact meanings in %s',language=>{
    const word=localVocabularyWord('学生（がくせい）');expect(word.entry).not.toBeNull();
    expect(vocabularyMeanings(word,language)).toEqual(word.entry!.meanings[language]);
    expect(vocabularyMeanings(localVocabularyWord('学生（せんせい）'),language)).toEqual([]);
    expect(vocabularyMeanings(localVocabularyWord('架空語'),language)).toEqual([]);
  });
  it('does not pick an arbitrary sense, partial form or homograph reading',()=>{
    const word=localVocabularyWord('学生（がくせい）'),entry=word.entry!;
    expect(localVocabularyWord('学生',[entry,{...entry,id:'ambiguous'}] as VocabularyEntry[]).entry).toBeNull();
    expect(localVocabularyWord('学生たち').entry).toBeNull();
    expect(localVocabularyWord('学生（がくせい）',[entry,{...entry,id:'other-reading',readings:['せいと']}]).entry).toBe(entry);
  });
  it('uses the reviewed pronoun gloss instead of the mistranslated organisation WHO in reference UI only',()=>{
    const word=localVocabularyWord('誰（だれ）');
    const original=structuredClone(word.entry!.meanings);
    expect(vocabularyMeanings(word,'es')).toEqual(['quién']);expect(vocabularyMeanings(word,'en')).toEqual(['who']);expect(vocabularyMeanings(word,'ca')).toEqual(['qui']);
    expect(word.entry!.meanings).toEqual(original); // Original study data is untouched.
  });
  it('accepts a unique exact dictionary reading and leaves ambiguous readings unresolved',()=>{
    const word=localVocabularyLookup('がくせい');expect(word.expression).toBe('学生');expect(word.reading).toBe('がくせい');expect(vocabularyMeanings(word,'en')).toEqual(['student']);
    const entry=word.entry!;expect(localVocabularyLookup('がくせい',[entry,{...entry,id:'ambiguous'}]).entry).toBeNull();
    expect(localVocabularyLookup('がくせいたち').entry).toBeNull();
  });
  it('reports reviewed unique coverage and keeps all three RUSH dictionaries complete',()=>{
    const words=intendedVocabularyWords(GRAMMAR_LESSONS.flatMap(l=>l.prerequisites.intendedVocabulary));
    const translated=words.filter(w=>w.entry).length;
    console.info(`Grammar intended vocabulary: ${words.length} unique; ${translated} exact N5; ${words.length-translated} without N5 coverage`);
    expect(translated).toBeGreaterThan(0);
    for(const dictionary of [es,en,ca]){
      expect(dictionary['kanji.level.N5']).toContain('N5');
      const keys=['content.hiragana','content.katakana',...Object.keys(dictionary).filter(k=>/^vocabulary\.(category|questionType)\./u.test(k)),'kanji.questionType.kanji-to-meaning','kanji.questionType.meaning-to-kanji'];
      for(const key of keys)expect(dictionary[key],key).toBeTruthy();
    }
  });
});

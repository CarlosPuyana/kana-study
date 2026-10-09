import {JAPANESE_1500_ENTRIES} from '../../../data/japanese-1500.generated';
import {intendedVocabularyWords,localVocabularyWord,vocabularyMeanings,LOCAL_VOCABULARY_GLOSS_CORRECTIONS} from '../../../core/services/japanese-local-vocabulary';
import {GRAMMAR_LESSONS} from './grammar-catalog';
import {GRAMMAR_VOCABULARY_REFERENCE,grammarReferenceMeaning} from './grammar-vocabulary-reference';
describe('Reviewed supplemental Grammar vocabulary',()=>{
  it('preserves exact existing ES/EN glosses, rejects ambiguous deck matches and supplies Catalan for every reference',()=>{
    for(const reference of [...GRAMMAR_VOCABULARY_REFERENCE,...LOCAL_VOCABULARY_GLOSS_CORRECTIONS]){
      const matches=JAPANESE_1500_ENTRIES.filter(entry=>entry.word===reference.expression && entry.reading===reference.reading);
      expect(matches).toHaveLength(1);expect(matches[0].id).toBe(reference.sourceId);
      expect(reference.meanings.es).toBe(matches[0].meaning.es);expect(reference.meanings.en).toBe(matches[0].meaning.en);
      expect(reference.meanings.ca).toBeTruthy();
      if(GRAMMAR_VOCABULARY_REFERENCE.includes(reference))expect(grammarReferenceMeaning(localVocabularyWord(`${reference.expression}（${reference.reading}）`),'ca')).toBe(reference.meanings.ca);
      else for(const language of ['es','en','ca'] as const)expect(vocabularyMeanings(localVocabularyWord(`${reference.expression}（${reference.reading}）`),language)).toEqual([reference.meanings[language]]);
    }
    expect(grammarReferenceMeaning(localVocabularyWord('早い（はやい）'),'es')).toBe('');
    expect(grammarReferenceMeaning(localVocabularyWord('私（わたくし）'),'es')).toBe('');
  });
  it('accounts for all unique editorial entries without dropping uncovered words',()=>{
    const words=intendedVocabularyWords(GRAMMAR_LESSONS.flatMap(lesson=>lesson.prerequisites.intendedVocabulary));
    expect(words).toHaveLength(134);expect(words.filter(word=>word.entry)).toHaveLength(112);
    expect(words.filter(word=>!word.entry && grammarReferenceMeaning(word,'es'))).toHaveLength(7);
    expect(words.filter(word=>!word.entry && !grammarReferenceMeaning(word,'es'))).toHaveLength(15);
  });
});

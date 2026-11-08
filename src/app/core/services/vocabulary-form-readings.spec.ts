import {VOCABULARY_N5} from '../../data/vocabulary-n5.generated';
import {DictionaryLookup} from '../models/dictionary.model';
import {vocabularyFormAllowsReading, vocabularyFormForReading, vocabularyReadingForForm, vocabularyReadingVariants} from './vocabulary-form-readings';
import {localVocabularyLookup, localVocabularyWord} from './japanese-local-vocabulary';
import {matchMangaVocabulary} from './manga-study-integration.service';
import {mangaRecallEvidence} from './manga-review-generator';
import {MangaStudySavedItem} from '../models/manga-study-saved.model';

const entry = (form: string) => VOCABULARY_N5.find(row => row.primaryWrittenForm === form)!;
const lookup = (expression: string, reading: string): DictionaryLookup => ({installed: true, query: expression,
  terms: [{id: 'fixture', dictionaryId: 'fixture', expression, reading, glossaries: [], definitionTags: '', rules: '', score: 0, sequence: 1, termTags: ''}]});

describe('reviewed Vocabulary form/reading restrictions', () => {
  it('keeps 鶏肉/けいにく and 鳥肉/ちょうにく without attributing either reading to とり肉', () => {
    const chicken = entry('とり肉');
    expect(vocabularyFormAllowsReading(chicken, '鶏肉', 'けいにく')).toBe(true);
    expect(vocabularyFormAllowsReading(chicken, '鳥肉', 'ちょうにく')).toBe(true);
    expect(vocabularyFormAllowsReading(chicken, 'とり肉', 'けいにく')).toBe(false);
    expect(vocabularyFormAllowsReading(chicken, '鶏肉', 'ちょうにく')).toBe(false);
    expect(vocabularyReadingVariants(chicken)).toEqual(['鶏肉（けいにく）', '鳥肉（ちょうにく）']);
  });

  it('preserves valid alternate spellings but rejects the former homonyms', () => {
    expect(localVocabularyWord('箸（はし）').entry?.id).toBe(entry('はし').id);
    expect(localVocabularyWord('橋（はし）').entry?.id).toBe(entry('橋').id);
    expect(localVocabularyWord('掃く（はく）').entry).toBeNull();
    expect(localVocabularyWord('履く（はく）').entry?.id).toBe(entry('はく').id);
    expect(localVocabularyWord('下番（かばん）').entry).toBeNull();
    expect(localVocabularyWord('鞄（かばん）').entry?.id).toBe(entry('かばん').id);
    expect(localVocabularyWord('点ける（つける）').entry?.id).toBe(entry('つける').id);
    expect(localVocabularyWord('就ける（つける）').entry).toBeNull();
  });

  it('does not create false pairs in exact or reading-only dictionary fallbacks', () => {
    expect(localVocabularyWord('とり肉（けいにく）').entry).toBeNull();
    expect(localVocabularyWord('鶏肉（けいにく）').entry?.id).toBe(entry('とり肉').id);
    expect(localVocabularyLookup('けいにく').expression).toBe('鶏肉');
    expect(localVocabularyLookup('メガネ').reading).toBe('メガネ');
    expect(vocabularyReadingForForm(entry('上着'), '上衣')).toBe('うわぎ');
    expect(vocabularyFormForReading(entry('上着'), 'じょうい')).toBe('上衣');
  });

  it('preserves kana spellings and same-sound annotations without accepting a different kanji reading', () => {
    const glasses = entry('眼鏡');
    expect(vocabularyFormAllowsReading(glasses, '眼鏡', 'めがね')).toBe(true);
    expect(vocabularyFormAllowsReading(glasses, '眼鏡', 'メガネ')).toBe(true);
    expect(vocabularyFormAllowsReading(glasses, 'メガネ', 'メガネ')).toBe(true);
    expect(vocabularyFormAllowsReading(glasses, 'メガネ', 'めがね')).toBe(true);
    expect(vocabularyFormAllowsReading(glasses, '眼鏡', 'めがみ')).toBe(false);
    expect(vocabularyReadingVariants(glasses)).toEqual([]); // メガネ remains a written variant, not another sound.
    expect(vocabularyFormAllowsReading(entry('絵'), '絵', 'が')).toBe(false);
    expect(vocabularyFormAllowsReading(entry('絵'), '画', 'が')).toBe(true);
    expect(vocabularyFormAllowsReading(entry('百'), '百', 'はく')).toBe(false);
    expect(vocabularyFormAllowsReading(entry('百'), '陌', 'はく')).toBe(true);
    expect(vocabularyFormAllowsReading(entry('百'), '百', 'ヒャク')).toBe(true);
    expect(vocabularyFormAllowsReading(entry('百'), '百', 'ハク')).toBe(false);
  });

  it('uses the same restrictions when Manga consumes this Vocabulary catalog', () => {
    expect(matchMangaVocabulary(lookup('とり肉', 'けいにく'), VOCABULARY_N5)).toBeUndefined();
    expect(matchMangaVocabulary(lookup('鶏肉', 'けいにく'), VOCABULARY_N5)?.id).toBe(entry('とり肉').id);
    expect(matchMangaVocabulary(lookup('絵', 'が'), VOCABULARY_N5)).toBeUndefined();
    expect(matchMangaVocabulary(lookup('画', 'が'), VOCABULARY_N5)?.id).toBe(entry('絵').id);
    expect(matchMangaVocabulary(lookup('眼鏡', 'メガネ'), VOCABULARY_N5)?.id).toBe(entry('眼鏡').id);
    expect(matchMangaVocabulary(lookup('メガネ', 'めがね'), VOCABULARY_N5)?.id).toBe(entry('眼鏡').id);
    const saved: MangaStudySavedItem = {schemaVersion: 1, id: 'fixture', vocabularyId: entry('とり肉').id,
      expression: '鶏肉', reading: 'ケイニク', meaning: 'external-fallback', kanji: [], source: {volumeId: 'fixture', pageNumber: 1}, createdAt: 1};
    expect(mangaRecallEvidence(saved, 'es').meaning).toBe('carne de pollo');
    expect(mangaRecallEvidence({...saved, expression: 'とり肉', reading: 'けいにく'}, 'es').meaning).toBe('external-fallback');
  });
});

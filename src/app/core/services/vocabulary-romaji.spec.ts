import {romanizeVocabularyReading,vocabularyRomaji,VOCABULARY_LEVEL_CAPABILITIES} from './vocabulary-romaji';
import {VOCABULARY_N5} from '../../data/vocabulary-n5.generated';

describe('Vocabulary reading romanization and level capabilities',()=>{
  it.each([['たべる','taberu'],['きょう','kyou'],['がっこう','gakkou'],['しんぶん','shinbun'],['ぱん','pan'],['きゃく','kyaku'],['きゅう','kyuu'],['きって','kitte'],['まっちゃ','matcha'],['コーヒー','koohii'],['パーティー','paatii'],['しんよう','shin\'you']])('romanizes %s from Kana as %s',(reading,expected)=>expect(romanizeVocabularyReading(reading)).toBe(expected));
  const entry=VOCABULARY_N5.find(e=>e.primaryWrittenForm==='食べる')!;
  it('uses primaryReading rather than ambiguous Kanji spelling',()=>expect(vocabularyRomaji({...entry,primaryWrittenForm:'明日',primaryReading:'あした'})).toBe('ashita'));
  it('enables N5 and hides future levels by default',()=>{expect(vocabularyRomaji(entry)).toBe('taberu');for(const level of ['N4','N3','N2','N1'] as const)expect(vocabularyRomaji({...entry,jlptApproxLevel:level})).toBeNull();});
  it('honors showRomaji=false without changing display components',()=>expect(vocabularyRomaji(entry,{...VOCABULARY_LEVEL_CAPABILITIES,N5:{showRomaji:false}})).toBeNull());
});

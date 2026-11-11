import { MangaLexeme, MangaProjectedWord, MangaVocabularyIndex, MangaWordKnowledge } from '../models/manga-vocabulary-index.model';

/** Synthetic M1-shaped content only. Never imported by production. */
export function rushWord(lemma='猫', reading='ねこ', sequence=1, count=3,
  category: MangaLexeme['category']='lexical', state: MangaWordKnowledge='unlinked'): MangaProjectedWord {
  return {state,entry:{key:JSON.stringify(['fixture',sequence,lemma,reading]),dictionaryId:'fixture',sequence,lemma,reading,
    category,categoryReason:category==='unclassified'?'conflicting-pos':'dictionary-pos',
    categoryEvidence:[{definitionTags:category==='functional'?'prt':category==='unclassified'?'v1 aux-v':'n',rules:''}],
    glosses:['gato','felino'],occurrences:Array.from({length:count},(_,lineIndex)=>({pageIndex:0,blockIndex:0,lineIndex,
      start:0,end:lemma.length,surface:lemma,context:lemma+'。'}))}};
}
export function rushIndex(words: readonly MangaProjectedWord[],volumeId='v1'): MangaVocabularyIndex {
  return {schemaVersion:1,volumeId,sourceStamp:'fixture',analyzerStamp:'fixture',pageCount:1,status:'partial',
    entries:words.map(w=>w.entry),occurrences:words.reduce((n,w)=>n+w.entry.occurrences.length,0),
    issues:[{pageIndex:0,reason:'unresolved',context:'fixture OCR gap'}]};
}

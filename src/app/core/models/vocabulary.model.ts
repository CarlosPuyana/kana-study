export type VocabularyJlptApproxLevel='N5'|'N4'|'N3'|'N2'|'N1';
export type VocabularyPartOfSpeech='noun'|'godan-verb'|'ichidan-verb'|'irregular-verb'|'i-adjective'|'na-adjective'|'adverb'|'pronoun'|'determiner'|'number'|'counter'|'particle'|'conjunction'|'interjection'|'prefix'|'suffix'|'expression'|'other';
export type VocabularyStudyCategory='nouns'|'verbs'|'adjectives'|'adverbs'|'pronouns-demonstratives'|'numbers-counters'|'function-words'|'expressions-other';
export type VocabularyQuestionType='japanese-to-meaning'|'meaning-to-japanese'|'japanese-to-reading'|'reading-to-japanese';
export interface LocalizedVocabularyText{readonly es:string;readonly en:string;readonly ca:string}
export interface FuriganaSegment{readonly text:string;readonly reading?:string}
export interface VocabularyExample{readonly japanese:string;readonly reading:string;readonly romaji?:string;readonly translations:LocalizedVocabularyText;readonly targetSurface:string;readonly source?:{readonly type:'tatoeba';readonly id:string}|{readonly type:'curated'}}
export interface VocabularyEntry{readonly id:string;readonly primaryWrittenForm:string;readonly writtenForms:readonly string[];readonly primaryReading:string;readonly furigana:readonly FuriganaSegment[];readonly readings:readonly string[];readonly meanings:{readonly es:readonly string[];readonly en:readonly string[];readonly ca:readonly string[]};readonly quizMeaning:LocalizedVocabularyText;readonly partOfSpeech:readonly VocabularyPartOfSpeech[];readonly studyCategory:VocabularyStudyCategory;readonly jlptApproxLevel:VocabularyJlptApproxLevel;readonly kanjiCharacters:readonly string[];readonly examples:readonly VocabularyExample[];readonly enabled:boolean}
export interface VocabularyStudyUnit{readonly key:string;readonly entryId:string;readonly questionType:VocabularyQuestionType}
export const VOCABULARY_QUESTION_TYPES:readonly VocabularyQuestionType[]=['japanese-to-meaning','meaning-to-japanese','japanese-to-reading','reading-to-japanese'];
export const VOCABULARY_CATEGORIES:readonly VocabularyStudyCategory[]=['nouns','verbs','adjectives','adverbs','pronouns-demonstratives','numbers-counters','function-words','expressions-other'];
export const VOCABULARY_PARTS_OF_SPEECH:readonly VocabularyPartOfSpeech[]=['noun','godan-verb','ichidan-verb','irregular-verb','i-adjective','na-adjective','adverb','pronoun','determiner','number','counter','particle','conjunction','interjection','prefix','suffix','expression','other'];



import {AppLanguage} from '../models/settings.model';
import {VocabularyEntry} from '../models/vocabulary.model';
import {VOCABULARY_N5} from '../../data/vocabulary-n5.generated';

export interface LocalVocabularyWord {raw:string;expression:string;reading:string;entry:VocabularyEntry|null}
/** Reviewed local corrections to automatic glosses and verb forms. Exact
 * Japanese 1500 references provide ES/EN; Catalan is curated for this UI. */
export const LOCAL_VOCABULARY_GLOSS_CORRECTIONS=[{
  expression:'誰',reading:'だれ',sourceId:'n-jp1500-en-h)X7$_VYv-',
  meanings:{es:'quién',en:'who',ca:'qui'},
},
  {expression:'降る',reading:'ふる',sourceId:'n-jp1500-en-dSt%onWY{3',meanings:{es:'caer (lluvia, nieve, etc.)',en:'to fall (e.g. rain)',ca:'caure (pluja, neu, etc.)'}},
  {expression:'来る',reading:'くる',sourceId:'n-jp1500-en-y|bOVbGbo!',meanings:{es:'venir',en:'come',ca:'venir'}},
  {expression:'待つ',reading:'まつ',sourceId:'n-jp1500-en-cJ,<%6gB?v',meanings:{es:'esperar',en:'wait',ca:'esperar'}},
  {expression:'働く',reading:'はたらく',sourceId:'n-jp1500-en-p3SA]:02ck',meanings:{es:'trabajar',en:'to work',ca:'treballar'}},
  {expression:'開く',reading:'あく',sourceId:'n-jp1500-en-QB~@x4NB|i',meanings:{es:'abrirse (algo)',en:'to open',ca:'obrir-se (alguna cosa)'}},
  {expression:'開ける',reading:'あける',sourceId:'n-jp1500-en-t6Zn:*/upQ',meanings:{es:'abrir, destapar',en:'to open, to unlock',ca:'obrir, destapar'}},
  {expression:'好き',reading:'すき',sourceId:'n-jp1500-en-J2=BL5C>P9',meanings:{es:'gustar, ser aficionado a',en:'like, fond of',ca:'agradar, ser aficionat a'}},
  {expression:'大変',reading:'たいへん',sourceId:'n-jp1500-en-fjkQe}a%<L',meanings:{es:'terrible, grave, serio',en:'terrible, serious, grave',ca:'terrible, greu, seriós'}},
] as const;
export function parseVocabularyWord(raw:string):{expression:string;reading:string} {
  const value=raw.trim(),match=/^([^（）]+)（([^（）]+)）$/u.exec(value);
  return {expression:match?.[1].trim()??value,reading:match?.[2].trim()??''};
}
/** Exact form and, when supplied, reading. Ambiguous catalogue matches stay unresolved. */
export function localVocabularyWord(raw:string,catalog:readonly VocabularyEntry[]=VOCABULARY_N5):LocalVocabularyWord {
  const parsed=parseVocabularyWord(raw);
  const matches=catalog.filter(entry=>entry.writtenForms.includes(parsed.expression) && (!parsed.reading || entry.readings.includes(parsed.reading)));
  const entry=matches.length===1?matches[0]:null;
  return {raw:raw.trim(),...parsed,reading:parsed.reading || entry?.primaryReading || '',entry};
}
export function vocabularyMeanings(word:LocalVocabularyWord,language:AppLanguage):readonly string[] {
  const correction=LOCAL_VOCABULARY_GLOSS_CORRECTIONS.find(entry=>entry.expression===word.expression && entry.reading===word.reading);
  if(word.entry && correction)return [correction.meanings[language]];
  return word.entry?word.entry.meanings[language].length?word.entry.meanings[language]:[word.entry.quizMeaning[language]]:[];
}
/** Dictionary fallback also accepts a unique exact reading, without fuzzy or
 * morphological matching. The editorial list keeps its original written form. */
export function localVocabularyLookup(query:string,catalog:readonly VocabularyEntry[]=VOCABULARY_N5):LocalVocabularyWord {
  const word=localVocabularyWord(query,catalog);
  if(word.entry || parseVocabularyWord(query).reading)return word;
  const matches=catalog.filter(entry=>entry.readings.includes(word.expression));
  if(matches.length!==1)return word;
  const entry=matches[0];return {...word,expression:entry.primaryWrittenForm,reading:query.trim(),entry};
}
export function intendedVocabularyWords(raw:readonly string[]):LocalVocabularyWord[] {
  return [...new Set(raw.map(value=>value.trim()))].map(value=>localVocabularyWord(value));
}

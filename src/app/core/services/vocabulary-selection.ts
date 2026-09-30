import { VocabularyEntry, VOCABULARY_CATEGORIES, VOCABULARY_QUESTION_TYPES, VocabularyStudyUnit } from '../models/vocabulary.model';
import { VocabularySelection } from '../models/vocabulary-study.model';
export const DEFAULT_VOCABULARY_SELECTION:VocabularySelection={levels:{N5:true},categories:Object.fromEntries(VOCABULARY_CATEGORIES.map(c=>[c,true])) as Record<(typeof VOCABULARY_CATEGORIES)[number],boolean>,questionTypes:['japanese-to-meaning']};
export function isReadingQuestionEligible(entry:VocabularyEntry):boolean{return normalize(entry.primaryWrittenForm)!==normalize(entry.primaryReading)}
export function vocabularyStudyUnits(entries:readonly VocabularyEntry[],selection:VocabularySelection):readonly VocabularyStudyUnit[]{return entries.filter(e=>e.enabled&&e.jlptApproxLevel==='N5'&&selection.levels.N5&&selection.categories[e.studyCategory]).flatMap(entry=>selection.questionTypes.filter(type=>!type.includes('reading')||isReadingQuestionEligible(entry)).map(questionType=>({key:`vocab:${entry.id}:${questionType}`,entryId:entry.id,questionType})))}
export function isValidVocabularySelection(selection:VocabularySelection):boolean{return selection.levels.N5&&VOCABULARY_CATEGORIES.some(c=>selection.categories[c])&&VOCABULARY_QUESTION_TYPES.some(t=>selection.questionTypes.includes(t))}
function normalize(value:string){return value.normalize('NFKC').trim()}

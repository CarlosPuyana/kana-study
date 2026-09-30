import { KANJI_LEVELS, KANJI_QUESTION_TYPES, Kanji, KanjiStudyUnit } from '../models/kanji.model';
import { KanjiSelection } from '../models/kanji-study.model';

export const DEFAULT_KANJI_SELECTION: KanjiSelection = { levels:{N5:true}, questionTypes:['kanji-to-meaning'] };
export function kanjiStudyUnits(kanji:readonly Kanji[],selection:KanjiSelection):readonly KanjiStudyUnit[]{return kanji.filter(item=>item.enabled&&item.jlptApproxLevel==='N5'&&selection.levels.N5).flatMap(item=>selection.questionTypes.map(questionType=>({key:`kanji:${item.id}:${questionType}`,kanjiId:item.id,questionType})));}
export function isValidKanjiSelection(selection:KanjiSelection):boolean{return selection.levels.N5&&KANJI_QUESTION_TYPES.some(type=>selection.questionTypes.includes(type));}

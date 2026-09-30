import { Kanji, KanjiStudyUnit } from './kanji.model';
import { LearningMode, SessionItem } from './learning-session.model';

export interface KanjiLearningSession { readonly id:string; readonly startedAt:string; completedAt:string|null; readonly mode:LearningMode; readonly sessionSize:number; readonly units:readonly KanjiStudyUnit[]; readonly items:SessionItem[]; attempts:number; }
export interface KanjiQuestionOption { readonly id:string; readonly label:string; readonly character:string|null; readonly correct:boolean; }
export interface KanjiSessionFeedback { readonly correct:boolean; readonly selectedId:string; readonly correctId:string; }
export interface KanjiQuestion { readonly kanji:Kanji; readonly options:readonly KanjiQuestionOption[]; }

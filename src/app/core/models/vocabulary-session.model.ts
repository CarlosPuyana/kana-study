import { LearningMode, SessionItem } from './learning-session.model';
import { VocabularyStudyUnit } from './vocabulary.model';
export interface VocabularyLearningSession { readonly id:string; readonly startedAt:string; completedAt:string|null; readonly mode:LearningMode; readonly sessionSize:number; readonly units:readonly VocabularyStudyUnit[]; readonly items:SessionItem[]; attempts:number }
export interface VocabularyQuestionOption { readonly id:string; readonly label:string; readonly correct:boolean }
export interface VocabularySessionFeedback { readonly correct:boolean; readonly selectedId:string; readonly correctId:string }

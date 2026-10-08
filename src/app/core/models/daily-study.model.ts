import { CompletedSessionSummary } from './learning-session.model';
import { LocalWorkspaceId } from './account.model';
import { WeaknessRecord } from './weakness.model';

export type DailyStudyModule = 'kana'|'kanji'|'vocabulary'|'grammar'|'anki'|'manga';
export type DailyStudyDuration = 5|15|30;
export interface DailyUnitSnapshot { readonly key:string; readonly itemId:string; readonly questionType:string; readonly due:number|null }
export interface DailyNormalSnapshot {
  readonly module:'kana'|'kanji'|'vocabulary'; readonly units:readonly DailyUnitSnapshot[];
  readonly completedToday:boolean;
}
export interface DailyGrammarSnapshot {
  readonly id:string; readonly titleKey:string; readonly path:string;
  readonly completed:boolean; readonly completedAt?:string; readonly answersToday:number; readonly difficult:boolean; readonly optional?:boolean;
}
export interface DailyDeckSnapshot {
  readonly id:string; readonly titleKey:string; readonly due:number; readonly fresh:number;
  readonly completedToday:boolean; readonly reviewsToday:number; readonly nextDue:number|null;
}
export interface DailyWeaknessSnapshot { readonly record:WeaknessRecord; readonly titleKey:string; readonly path:string }
export interface DailyStudySnapshot {
  readonly workspace:LocalWorkspaceId; readonly now:number; readonly day:string;
  readonly normal:readonly DailyNormalSnapshot[]; readonly grammar:readonly DailyGrammarSnapshot[];
  readonly grammarContinuePath:string|null; readonly weaknesses:readonly DailyWeaknessSnapshot[];
  readonly decks:readonly DailyDeckSnapshot[];
  readonly manga:{readonly enabled:boolean; readonly due:number; readonly fresh:number; readonly nextDue:number|null; readonly eventsToday:number; readonly completedSessionIds:readonly string[]};
  readonly sessions:readonly CompletedSessionSummary[];
}
export interface DailyStudyActivity {
  readonly id:string; readonly module:DailyStudyModule; readonly titleKey:string; readonly detail?:string;
  readonly reasonKey:string; readonly priority:number; readonly state:'available'|'pending'|'completed';
  readonly pendingCount:number; readonly path?:string; readonly panel?:'kana'|'kanji'|'vocabulary';
  readonly evidence?:readonly string[];
}
export interface DailyStudyPerformed { readonly id:string; readonly module:DailyStudyModule; readonly titleKey:string; readonly count:number; readonly completed:boolean }
export interface DailyStudyPlan { readonly recommended:readonly DailyStudyActivity[]; readonly available:readonly DailyStudyActivity[]; readonly pending:readonly DailyStudyActivity[]; readonly performed:readonly DailyStudyPerformed[] }

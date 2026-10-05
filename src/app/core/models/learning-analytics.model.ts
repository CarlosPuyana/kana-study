import {WeaknessActivity, WeaknessModule} from './weakness.model';

export interface LearningPerformance {
  readonly attempts:number;
  readonly successes:number;
  readonly failures:number;
  /** Percentage derived exclusively from attempts/failures, or null without attempts. */
  readonly accuracy:number|null;
  readonly weakCount:number;
}
export interface LearningDirection extends LearningPerformance {
  readonly module:WeaknessModule;
  readonly questionType:string;
}
export interface RecordedActivity {
  readonly sessions:number;
  readonly exercises:number;
  readonly seconds:number;
  readonly firstTrySuccesses:number;
  readonly firstTryAccuracy:number|null;
}
export interface LearningRecommendation {
  readonly key:string;
  readonly activity?:WeaknessActivity;
  readonly direction?:LearningDirection;
}
export interface LearningAnalytics {
  readonly summary:{readonly streak:number;readonly sessions:number;readonly seconds:number;readonly weakCount:number};
  readonly modules:readonly (LearningPerformance & {readonly module:WeaknessModule})[];
  readonly skills:readonly (LearningPerformance & {readonly activity:WeaknessActivity})[];
  readonly difficult:readonly LearningDirection[];
  readonly strengths:readonly LearningDirection[];
  readonly grammarConcepts:readonly (LearningPerformance & {readonly itemId:string})[];
  readonly recent:readonly (RecordedActivity & {readonly days:7|30})[];
  readonly recommendations:readonly LearningRecommendation[];
}

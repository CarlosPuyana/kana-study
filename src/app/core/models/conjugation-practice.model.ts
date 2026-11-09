import {ConjugationPracticeIntent} from './conjugations.model';

export const ADJECTIVE_TRANSFORMATIONS=['negative','past','negativePast','te','adverbial'] as const;
export type AdjectiveTransformation=typeof ADJECTIVE_TRANSFORMATIONS[number];
export type AdjectiveCategory='adjective-i'|'adjective-na';
export interface AcceptedConjugationAnswers {
  readonly romaji:readonly string[];
  readonly kana:readonly string[];
  readonly kanji:readonly string[];
}
export interface ConjugationAdjective {
  readonly id:string;
  readonly type:'i'|'na';
  readonly japanese:string;
  readonly kana:string;
  readonly meaningKey:string;
  readonly conjugations:Readonly<Record<AdjectiveTransformation,AcceptedConjugationAnswers>>;
}
export interface AdjectiveQuestion {
  readonly id:string;
  readonly adjective:ConjugationAdjective;
  readonly transformation:AdjectiveTransformation;
  readonly answers:AcceptedConjugationAnswers;
}
export interface ConjugationCounters {attempts:number;correct:number;wrong:number;bestStreak:number;}
export type ConjugationStatsBucket=AdjectiveCategory|'mixed';
export interface ConjugationStats {version:1;buckets:Record<ConjugationStatsBucket,ConjugationCounters>;}
export interface AdjectivePractice {
  readonly intent:ConjugationPracticeIntent;
  readonly questions:readonly AdjectiveQuestion[];
  readonly epoch:number;
  readonly index:number;
  readonly streak:number;
  readonly correct:number;
  readonly feedback:'correct'|'wrong'|'unknown'|null;
  readonly complete:boolean;
}

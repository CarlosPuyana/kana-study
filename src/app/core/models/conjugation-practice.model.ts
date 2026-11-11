import {ConjugationPracticeIntent} from './conjugations.model';

export const ADJECTIVE_TRANSFORMATIONS=['negative','past','negativePast','te','adverbial'] as const;
export type AdjectiveTransformation=typeof ADJECTIVE_TRANSFORMATIONS[number];
export const ADJECTIVE_CATEGORIES=['adjective-negative','adjective-past','adjective-negative-past','adjective-te','adjective-adverbial'] as const;
export type AdjectiveCategory=typeof ADJECTIVE_CATEGORIES[number];
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
  readonly word:ConjugationAdjective;
  readonly transformation:AdjectiveTransformation;
  readonly answers:AcceptedConjugationAnswers;
}
export interface ConjugationCounters {
  attempts:number;correct:number;wrong:number;bestStreak:number;
  /** Absent for legacy counters whose study duration was never measured. */
  durationSeconds?:number;
  /** Coverage: a legacy bucket can have fewer timed attempts than total attempts. */
  timedAttempts?:number;
}
export const VERB_CATEGORIES=['verb-negative','verb-past','verb-negative-past','verb-te','verb-continuous','verb-desire','verb-polite','verb-conditional-tara','verb-conditional-ba','verb-volitional','verb-potential','verb-passive','verb-causative','verb-causative-passive','verb-imperative','verb-prohibitive'] as const;
export type VerbCategory=typeof VERB_CATEGORIES[number];
export type VerbTransformation=Exclude<AdjectiveTransformation,'adverbial'>|'continuous'|'desire'|'polite'|'conditionalTara'|'conditionalBa'|'volitional'|'potential'|'passive'|'causative'|'causativePassive'|'imperative'|'prohibitive';
export interface ConjugationVerb {
  readonly id:string;
  readonly type:'godan'|'ichidan'|'irregular';
  readonly japanese:string;
  readonly kana:string;
  readonly meaningKey:string;
  readonly conjugations:Readonly<Record<Exclude<AdjectiveTransformation,'adverbial'>,AcceptedConjugationAnswers>&Partial<Record<'continuous'|'desire'|'polite'|'conditionalTara'|'conditionalBa'|'volitional'|'potential'|'passive'|'causative'|'causativePassive'|'imperative'|'prohibitive',AcceptedConjugationAnswers>>>;
}
export const COPULA_CATEGORIES=['copula-plain','copula-polite'] as const;
export type CopulaCategory=typeof COPULA_CATEGORIES[number];
export const COPULA_TRANSFORMATIONS=['affirmative','negative','past','negativePast'] as const;
export type CopulaTransformation=typeof COPULA_TRANSFORMATIONS[number];
export interface CopulaWord {readonly id:string;readonly type:'noun'|'na-predicate';readonly japanese:string;readonly kana:string;readonly meaningKey:string;}
export interface ConjugationCopula {
  readonly id:string;readonly type:CopulaWord['type'];readonly meaningKey:string;
  readonly registers:Readonly<Record<'plain'|'polite',{readonly japanese:string;readonly kana:string;readonly conjugations:Readonly<Record<CopulaTransformation,AcceptedConjugationAnswers>>}>>;
}
export interface ConjugationQuestion {
  readonly id:string;
  readonly word:ConjugationAdjective|ConjugationVerb|CopulaWord;
  readonly transformation:AdjectiveTransformation|VerbTransformation|CopulaTransformation;
  readonly register?:'plain'|'polite';
  readonly answers:AcceptedConjugationAnswers;
}
export type ConjugationStatsBucket=AdjectiveCategory|VerbCategory|CopulaCategory|'adjective-i'|'adjective-na'|'mixed';
export interface ConjugationStats {version:1;buckets:Record<ConjugationStatsBucket,ConjugationCounters>;}
export interface ConjugationPractice {
  readonly intent:ConjugationPracticeIntent;
  readonly questions:readonly ConjugationQuestion[];
  readonly epoch:number;
  readonly index:number;
  readonly streak:number;
  readonly correct:number;
  readonly feedback:'correct'|'wrong'|'unknown'|null;
  readonly complete:boolean;
}

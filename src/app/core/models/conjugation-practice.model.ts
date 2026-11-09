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
  readonly word:ConjugationAdjective;
  readonly transformation:AdjectiveTransformation;
  readonly answers:AcceptedConjugationAnswers;
}
export interface ConjugationCounters {attempts:number;correct:number;wrong:number;bestStreak:number;}
export const VERB_CATEGORIES=['verb-negative','verb-past','verb-negative-past','verb-te'] as const;
export type VerbCategory=typeof VERB_CATEGORIES[number];
export type VerbTransformation=Exclude<AdjectiveTransformation,'adverbial'>;
export interface ConjugationVerb {
  readonly id:string;
  readonly type:'godan'|'ichidan'|'irregular';
  readonly japanese:string;
  readonly kana:string;
  readonly meaningKey:string;
  readonly conjugations:Readonly<Record<VerbTransformation,AcceptedConjugationAnswers>>;
}
export interface ConjugationQuestion {
  readonly id:string;
  readonly word:ConjugationAdjective|ConjugationVerb;
  readonly transformation:AdjectiveTransformation;
  readonly answers:AcceptedConjugationAnswers;
}
export type ConjugationStatsBucket=AdjectiveCategory|VerbCategory|'mixed';
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

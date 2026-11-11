export const CONJUGATION_CATEGORY_IDS = [
  'verb-negative','verb-past','verb-negative-past','verb-te','verb-continuous',
  'verb-potential','verb-passive','verb-causative','verb-causative-passive',
  'verb-volitional','verb-imperative','verb-desire','verb-conditional-ba',
  'verb-conditional-tara','verb-polite','adjective-negative','adjective-past','adjective-negative-past','adjective-te','adjective-adverbial','copula-plain',
  'copula-polite','verb-prohibitive',
] as const;
export type ConjugationCategoryId = typeof CONJUGATION_CATEGORY_IDS[number]|'adjective-i'|'adjective-na';
export type ConjugationGroup = 'verb'|'adjective'|'copula';
/** Pedagogical orientation, not a JLPT certification. */
export type ConjugationDifficulty = 'basic'|'intermediate'|'advanced';
export type ConjugationRuleFamily = 'verb-plain'|'verb-te'|'verb-voice'|'verb-mood'|'verb-conditional'|'verb-polite'|'adjective-i'|'adjective-na'|'copula-plain'|'copula-polite';
export interface ConjugationCategory {
  readonly id:ConjugationCategoryId;
  readonly titleKey:string;
  readonly japanese:string;
  readonly group:ConjugationGroup;
  readonly difficulty:ConjugationDifficulty;
  readonly order:number;
  readonly descriptionKey:string;
  readonly availability:'planned'|'available';
  readonly wordCount?:number;
  readonly ruleFamily:ConjugationRuleFamily;
  readonly example?:{readonly base:string;readonly result?:string};
}
export interface ConjugationSelection {
  readonly version:1|2|3|4|5|6;
  readonly adjectiveTypes?:Readonly<Record<string,'i'|'na'|'both'>>;
  readonly autoKana?:boolean;
  readonly unlockedIds?:readonly ConjugationCategoryId[];
  readonly categoryIds:readonly ConjugationCategoryId[];
}
/** Selection request; only available categories may start a practice. */
export interface ConjugationPracticeIntent {
  readonly mode:'single'|'mixed';
  readonly adjectiveTypes?:Readonly<Record<string,'i'|'na'|'both'>>;
  readonly categoryIds:readonly ConjugationCategoryId[];
}

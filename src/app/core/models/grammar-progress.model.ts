export const GRAMMAR_PROGRESS_KEY = 'kana-study.grammar-progress.v1';
export type GrammarProgressStatus = 'not-started' | 'in-progress' | 'completed';
export interface GrammarAnswer { correct: boolean; answeredAt: string }
export interface GrammarConceptProgress {
  conceptId: string; topicId: string; status: GrammarProgressStatus;
  startedAt: string; updatedAt: string; completedAt?: string;
  answers: Record<string, GrammarAnswer>; lastExerciseIndex: number;
}
export interface GrammarPracticeProgress {
  topicId: string; attemptedAt: string; updatedAt: string;
  score: number; total: number; errorConceptIds: string[];
}
export interface GrammarDifficulty {
  conceptId: string; topicId: string; active: boolean; updatedAt: string;
  flaggedAt?: string; clearedAt?: string; lastFailedExerciseId?: string;
}
export interface GrammarResume { path: string; conceptId: string; exerciseIndex: number; updatedAt: string }
export interface GrammarProgressStateV1 {
  version: 1;
  concepts: Record<string, GrammarConceptProgress>;
  practices: Record<string, GrammarPracticeProgress>;
  review: Record<string, GrammarDifficulty>;
  resume?: GrammarResume;
}
export const emptyGrammarProgress = (): GrammarProgressStateV1 => ({version: 1, concepts: {}, practices: {}, review: {}});

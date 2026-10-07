import {GrammarExercise} from '../../features/grammar/models/grammar.model';

export interface GrammarExample { japanese: string; reading?: string; meaningKey: string; noteKey?: string }
export interface GrammarLessonContent {
  ideaKey: string;
  formation: readonly {labelKey: string; pattern: string; noteKey?: string}[];
  examples: readonly GrammarExample[];
  contrasts?: readonly {left: string; right: string; explanationKey: string}[];
  mistakes?: readonly {wrong: string; correction: string; explanationKey: string}[];
  tables?: readonly {captionKey: string; headerKeys: readonly string[]; rows: readonly {labelKey: string; cells: readonly string[]}[]}[];
  detailedExplanation: readonly {id: string; titleKey: string; bodyKey: string; examples?: readonly GrammarExample[]}[];
}
export interface GrammarConcept {
  id: string; level: 'N5'; track: 'core' | 'bridge'; topicId: string; order: number;
  titleKey: string; summaryKey: string; goalKey: string;
  prerequisiteIds: readonly string[]; relatedIds: readonly string[];
  lesson: GrammarLessonContent;
  exercises: readonly GrammarExercise[];
}
export const GRAMMAR_PROGRESS_V2_KEY = 'kana-study.grammar-progress.v2';
export interface GrammarV2Answer {correct: boolean; solved: boolean; attempts: number; correctCount: number; answeredAt: string}
/** UI activity IDs are deliberately separate from semantic concept IDs. */
export interface GrammarIntegrationSection {
  id: string; titleKey: string; bodyKey: string; track: 'core' | 'bridge'; exercises: readonly GrammarExercise[];
}
export interface GrammarIntegrationProgress {
  openedAt?: string;
  activities: Record<string, {openedAt: string; updatedAt: string; answers: Record<string, GrammarV2Answer>}>;
  resumeActivityId?: string;
}
export interface GrammarV2ConceptProgress {
  conceptId: string; topicId: string; status: 'not-started' | 'in-progress' | 'completed';
  attempts: number; correct: number; answers: Record<string, GrammarV2Answer>;
  startedAt: string; openedAt?: string; updatedAt: string; completedAt?: string; lastExerciseIndex: number;
}

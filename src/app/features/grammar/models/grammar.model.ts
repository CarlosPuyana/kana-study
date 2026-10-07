// Translation keys point to prototype copy; rich text is authored locally and sanitized by Angular.
export interface GrammarTheoryBlock { readonly symbol: string; readonly titleKey: string; readonly bodyKey: string }
export interface GrammarLessonPrerequisites {
  readonly requiredKana: readonly string[];
  readonly intendedVocabulary: readonly string[];
  readonly allowedKanji: readonly string[];
  readonly introducedKanji?: readonly string[];
  readonly inlineExplanations?: readonly {term:string;reading:string;meaningKey:string}[];
}
export interface GrammarKanjiExample { readonly segments: readonly {text:string;reading?:string}[]; readonly meaningKey:string }
export interface GrammarDirection {
  readonly fromKey: string; readonly toKey: string; readonly actionKey: string;
  readonly captionKey: string; readonly arrow: '→' | '←'; readonly focus: 'from' | 'to';
}
export type GrammarExerciseType = 'particle' | 'fill-gap' | 'sentence-order' | 'conjugation';
interface GrammarExerciseBase {
  readonly version?: 2;
  readonly skill?: 'recognition' | 'formation' | 'usage' | 'contrast' | 'ordering' | 'error-detection';
  readonly difficulty?: 1 | 2 | 3;
  readonly exerciseType?: GrammarExerciseType;
  readonly topicId?: string;
  readonly lessonId?: string;
  readonly id: string;
  readonly labelKey: string;
  readonly topicKey: string;
  readonly questionKey: string;
  readonly promptKey: string;
  readonly successKey: string;
  readonly errorKey: string;
  readonly conceptId?: string;
  readonly errorCategoryKey?: string;
  readonly contextKey?: string;
  readonly direction?: GrammarDirection;
  readonly controlledVocabulary?: readonly string[];
  readonly learningStage?: number;
  readonly editorialIntent?: string;
  readonly orderPolicy?: 'constrained';
}
export interface GrammarChoiceExercise extends GrammarExerciseBase {
  readonly options?: readonly {id: string; textKey: string; feedbackKey: string; grammarStatus?: 'valid' | 'invalid'}[];
  readonly kind: 'multiple-choice' | 'detect-error' | 'select-segment';
  readonly optionKeys: readonly string[]; readonly answer: number;
}
export interface GrammarSequenceExercise extends GrammarExerciseBase {
  readonly kind: 'sentence-builder' | 'sentence-order';
  readonly tokenKeys: readonly string[]; readonly solution: readonly number[];
  readonly acceptedOrders?: readonly (readonly number[])[];
}
export interface GrammarFillExercise extends GrammarExerciseBase {
  readonly kind: 'fill-gap'; readonly acceptedAnswers: readonly string[]; readonly solutionKey: string;
  readonly kanaBank?: readonly string[];
}
export interface GrammarMatchingExercise extends GrammarExerciseBase {
  readonly kind: 'matching'; readonly pairs: readonly {leftKey:string;rightKey:string}[];
  readonly rightOrder?: readonly number[];
}
export type GrammarExercise = GrammarChoiceExercise | GrammarSequenceExercise | GrammarFillExercise | GrammarMatchingExercise;
export type GrammarExerciseKind = GrammarExercise['kind'];
export interface GrammarStudySession {
  readonly id: string; readonly topicId: string; readonly position: number;
  readonly titleKey: string; readonly lessonIds: readonly string[];
  readonly learningMode: 'recognition' | 'manipulation' | 'production';
  readonly recognitionReasonKey?: string;
  readonly prerequisites: GrammarLessonPrerequisites;
}
export interface GrammarLessonSummary {
  readonly id: string; readonly titleKey: string; readonly bodyKey: string;
  readonly icon: string; readonly color: string; readonly examplesKey: string; readonly path: string | null;
}
export interface GrammarSummary { readonly eyebrowKey: string; readonly titleKey: string; readonly bodyKey: string }
export interface GrammarTopic {
  readonly id: string; readonly level: 'N5'; readonly titleKey: string; readonly descriptionKey: string;
  readonly kickerKey: string; readonly icon: string; readonly metaKeys: readonly string[];
  readonly goal: GrammarSummary; readonly visualKey: string; readonly lessons: readonly GrammarLessonSummary[];
  readonly end: GrammarSummary;
  readonly journey: (GrammarSummary & { readonly links: readonly {labelKey: string; path: string}[] }) | null;
  readonly stage: { readonly color: string; readonly icon: string; readonly bulletKeys: readonly string[] };
}
export interface GrammarLesson {
  readonly concept?: import('../../../core/models/grammar-v2.model').GrammarConcept;
  readonly id: string; readonly topicId: string; readonly titleKey: string; readonly descriptionKey: string;
  readonly icon: string; readonly position: number; readonly total: number; readonly theory: readonly GrammarTheoryBlock[];
  readonly ideaKey: string; readonly notes: readonly (GrammarSummary & { readonly icon: string })[];
  readonly previousPath: string; readonly nextPath: string; readonly exercise: GrammarExercise;
  readonly additionalExercises?: readonly GrammarExercise[];
  readonly exercisePlan?: { readonly category:string; readonly minimum:number };
  readonly prerequisites: GrammarLessonPrerequisites;
  readonly direction?: GrammarDirection;
  readonly kanjiExamples?: readonly GrammarKanjiExample[];
}
export interface GrammarPractice {
  readonly topicId: string; readonly icon: string; readonly intro: GrammarSummary;
  readonly stats: readonly {value: string; labelKey: string}[]; readonly philosophyKeys: readonly string[];
  readonly tip: GrammarSummary; readonly resultEyebrowKey: string;
  readonly areas: readonly (GrammarTheoryBlock)[]; readonly nextPath: string; readonly nextLabelKey: string;
  readonly exercises: readonly GrammarExercise[];
}
export interface GrammarRoadmap { readonly subtitleKey: string; readonly pillKeys: readonly string[]; readonly panelKeys: readonly string[] }
export function grammarLessonExercises(lesson:GrammarLesson):readonly GrammarExercise[]{
  return [lesson.exercise,...lesson.additionalExercises??[]].sort((a,b)=>(a.learningStage??3)-(b.learningStage??3));
}

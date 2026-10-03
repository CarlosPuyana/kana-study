// Translation keys point to prototype copy; rich text is authored locally and sanitized by Angular.
export interface GrammarTheoryBlock { readonly symbol: string; readonly titleKey: string; readonly bodyKey: string }
export interface GrammarExercise {
  readonly id: string;
  readonly kind: 'multiple-choice';
  readonly labelKey: string;
  readonly topicKey: string;
  readonly questionKey: string;
  readonly promptKey: string;
  readonly optionKeys: readonly string[];
  readonly answer: number;
  readonly successKey: string;
  readonly errorKey: string;
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
  readonly id: string; readonly topicId: string; readonly titleKey: string; readonly descriptionKey: string;
  readonly icon: string; readonly position: number; readonly total: number; readonly theory: readonly GrammarTheoryBlock[];
  readonly ideaKey: string; readonly notes: readonly (GrammarSummary & { readonly icon: string })[];
  readonly previousPath: string; readonly nextPath: string; readonly exercise: GrammarExercise;
}
export interface GrammarPractice {
  readonly topicId: string; readonly icon: string; readonly intro: GrammarSummary;
  readonly stats: readonly {value: string; labelKey: string}[]; readonly philosophyKeys: readonly string[];
  readonly tip: GrammarSummary; readonly resultEyebrowKey: string;
  readonly areas: readonly (GrammarTheoryBlock)[]; readonly nextPath: string; readonly nextLabelKey: string;
  readonly exercises: readonly GrammarExercise[];
}
export interface GrammarRoadmap { readonly subtitleKey: string; readonly pillKeys: readonly string[]; readonly panelKeys: readonly string[] }

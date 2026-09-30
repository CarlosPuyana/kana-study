export interface JapaneseDeckFuriganaSegment {
  readonly text: string;
  readonly reading?: string;
}

export interface JapaneseSentenceSegment extends JapaneseDeckFuriganaSegment {
  readonly highlighted: boolean;
  readonly lineBreak?: boolean;
}

export interface JapaneseWordDeckEntry {
  readonly id: string;
  readonly guid: string;
  readonly order: number;
  readonly word: string;
  readonly reading: string;
  readonly meaning: {
    readonly es: string;
    readonly en: string;
  };
  readonly wordFurigana: string;
  readonly wordSegments: readonly JapaneseDeckFuriganaSegment[];
  /** Original source markup retained as metadata. It must never be rendered directly. */
  readonly sentenceHtml: string;
  /** Original source markup retained as metadata. It must never be rendered directly. */
  readonly sentenceFuriganaHtml: string;
  readonly sentenceSegments: readonly JapaneseSentenceSegment[];
  readonly sentenceMeaning: {
    readonly es: string;
    readonly en: string;
  };
  readonly notes: {
    readonly es?: string | null;
    readonly en?: string | null;
  };
  /** Preserved for a future structured pitch-accent renderer. */
  readonly pitchAccentHtml?: string | null;
  readonly pitchAccentNotesEn?: string | null;
  readonly frequencyRank: number;
  readonly media: {
    readonly wordAudio?: string | null;
    readonly sentenceAudio?: string | null;
    readonly picture?: string | null;
  };
  readonly source: string;
}

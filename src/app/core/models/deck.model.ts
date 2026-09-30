export type DesiredRetention = number;
export type NewCardOrder = 'mixed' | 'after-reviews' | 'before-reviews';
export type StudyDeckContentType = 'japanese-word';

export interface DeckSettings {
  readonly desiredRetention: DesiredRetention;
  readonly newCardsPerDay: number;
  readonly newCardOrder: NewCardOrder;
}

export interface StudyDeck {
  readonly id: string;
  readonly nameKey: string;
  readonly cardCount: number;
  readonly contentType: StudyDeckContentType;
  readonly settings: DeckSettings;
}

// `newCardsPerDay` is persistent configuration. A future `todayNewCardOverride`
// will be a date-scoped scheduling concern and is intentionally not modelled yet.

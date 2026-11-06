export type DesiredRetention = number;
export const CUSTOM_DECK_NEW_CARDS_MAX = 10_000;
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

// `newCardsPerDay` is the usual limit. Date-scoped overrides live in DeckDailyState.

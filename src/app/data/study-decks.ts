import { StudyDeck } from '../core/models/deck.model';
import { JAPANESE_1500_METADATA } from './japanese-1500.metadata.generated';

export const STUDY_DECKS: readonly StudyDeck[] = [
  {
    ...JAPANESE_1500_METADATA,
    settings: { desiredRetention: 0.90, newCardsPerDay: 10, newCardOrder: 'mixed' },
  },
];

export function findStudyDeck(id: string | null): StudyDeck | null {
  return STUDY_DECKS.find(deck => deck.id === id) ?? null;
}

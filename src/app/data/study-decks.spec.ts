import { findStudyDeck, STUDY_DECKS } from './study-decks';

describe('study deck catalogue', () => {
  it('contains exactly one visual mock deck with a stable identity and count', () => {
    expect(STUDY_DECKS).toHaveLength(1);
    expect(STUDY_DECKS[0]).toEqual(expect.objectContaining({
      id: 'japanese-1500',
      cardCount: 1500,
      contentType: 'japanese-word',
    }));
    expect(findStudyDeck('japanese-1500')).toBe(STUDY_DECKS[0]);
  });

  it('starts with the requested future-facing settings', () => {
    expect(STUDY_DECKS[0].settings).toEqual({
      desiredRetention: 0.9,
      newCardsPerDay: 10,
      newCardOrder: 'mixed',
    });
  });
});

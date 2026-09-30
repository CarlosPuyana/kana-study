import { JAPANESE_1500_ENTRIES } from '../../data/japanese-1500.generated';
import { deckContentLanguage } from '../../core/services/deck-content-language';
import { japaneseDeckEntryMatchesQuery } from './anki-cards.page';

describe('Japanese deck card search', () => {
  it.each(['食べる', 'たべる', 'comer', 'eat'])('finds 食べる using %s', query => {
    expect(matches(query).some(entry => entry.word === '食べる' && entry.order === 124)).toBe(true);
  });

  it('searches Japanese sentences and their Spanish and English translations', () => {
    expect(matches('タイカレー').some(entry => entry.order === 124)).toBe(true);
    expect(matches('curry tailandés').some(entry => entry.order === 124)).toBe(true);
    expect(matches('Thai curry yesterday').some(entry => entry.order === 124)).toBe(true);
  });

  it('supports an exact pedagogical order query', () => {
    expect(matches('#124').map(entry => entry.order)).toEqual([124]);
  });

  it('returns both senses of a duplicated written form', () => {
    const results = matches('高い').filter(entry => entry.word === '高い');
    expect(results).toHaveLength(2);
    expect(results.map(entry => entry.meaning.en)).toEqual(['expensive', 'high, tall']);
  });

  it('restores all entries in their original order when the query is cleared', () => {
    const results = matches('   ');
    expect(results).toHaveLength(1500);
    expect(results[0].order).toBe(1);
    expect(results.at(-1)?.order).toBe(1500);
  });

  it('uses Spanish deck content as the documented Catalan fallback', () => {
    expect(deckContentLanguage('es')).toBe('es');
    expect(deckContentLanguage('en')).toBe('en');
    expect(deckContentLanguage('ca')).toBe('es');
  });
});

function matches(query: string) {
  return JAPANESE_1500_ENTRIES.filter(entry => japaneseDeckEntryMatchesQuery(entry, query));
}

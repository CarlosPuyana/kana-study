import { JAPANESE_1500_ENTRIES } from './japanese-1500.generated';
import { JAPANESE_1500_METADATA } from './japanese-1500.metadata.generated';
import { JAPANESE_1500_INDEX } from './japanese-1500.index.generated';

describe('Japanese 1500 generated deck content', () => {
  it('contains exactly 1500 entries and matching lightweight metadata', () => {
    expect(JAPANESE_1500_ENTRIES).toHaveLength(1500);
    expect(JAPANESE_1500_METADATA).toEqual({
      id: 'japanese-1500',
      nameKey: 'anki.deck.japanese1500.name',
      cardCount: 1500,
      contentType: 'japanese-word',
    });
    expect(JAPANESE_1500_INDEX).toEqual(
      JAPANESE_1500_ENTRIES.map(({ id, order }) => ({ id, order })),
    );
  });

  it('preserves every id and guid as a unique stable identifier', () => {
    expect(new Set(JAPANESE_1500_ENTRIES.map(entry => entry.id)).size).toBe(1500);
    expect(new Set(JAPANESE_1500_ENTRIES.map(entry => entry.guid)).size).toBe(1500);
  });

  it('preserves the complete pedagogical order from 1 through 1500', () => {
    expect(JAPANESE_1500_ENTRIES.map(entry => entry.order))
      .toEqual(Array.from({ length: 1500 }, (_, index) => index + 1));
  });

  it('has every required word, meaning, sentence and frequency field', () => {
    for (const entry of JAPANESE_1500_ENTRIES) {
      expect(entry.word.trim()).not.toBe('');
      expect(entry.reading.trim()).not.toBe('');
      expect(entry.meaning.es.trim()).not.toBe('');
      expect(entry.meaning.en.trim()).not.toBe('');
      expect(entry.wordFurigana.trim()).not.toBe('');
      expect(entry.sentenceHtml.trim()).not.toBe('');
      expect(entry.sentenceFuriganaHtml.trim()).not.toBe('');
      expect(entry.sentenceSegments.length).toBeGreaterThan(0);
      expect(entry.sentenceMeaning.es.trim()).not.toBe('');
      expect(entry.sentenceMeaning.en.trim()).not.toBe('');
      expect(Number.isFinite(entry.frequencyRank)).toBe(true);
      expect(entry.wordSegments.map(segment => segment.text).join('')).toBe(entry.word);
      expect(entry.sentenceSegments.map(segment => segment.text).join(''))
        .toBe(sourceSentenceText(entry.sentenceFuriganaHtml));
    }
  });

  it('builds word furigana at generation time for 食べる, 先生 and 何', () => {
    expect(entry('食べる').wordSegments).toEqual([
      { text: '食', reading: 'た' }, { text: 'べる' },
    ]);
    expect(entry('先生').wordSegments).toEqual([
      { text: '先', reading: 'せん' }, { text: '生', reading: 'せい' },
    ]);
    expect(entry('何').wordSegments).toEqual([{ text: '何', reading: 'なに・なん' }]);
  });

  it('does not create redundant ruby readings for kana-only entries', () => {
    expect(entry('これ').wordSegments).toEqual([{ text: 'これ' }]);
  });

  it('creates safe sentence segments with highlights and line breaks', () => {
    const teacher = entry('先生');
    expect(teacher.sentenceSegments.filter(segment => segment.highlighted).map(segment => segment.text).join(''))
      .toBe('先生');
    expect(entry('何').sentenceSegments.some(segment => segment.lineBreak)).toBe(true);
    expect(entry('何').sentenceMeaning.es).toContain('\n');
  });

  it('preserves the expected optional metadata coverage', () => {
    expect(JAPANESE_1500_ENTRIES.filter(entry => entry.media.picture)).toHaveLength(1500);
    expect(JAPANESE_1500_ENTRIES.filter(entry => entry.media.sentenceAudio)).toHaveLength(1500);
    expect(JAPANESE_1500_ENTRIES.filter(entry => entry.media.wordAudio)).toHaveLength(1499);
    expect(JAPANESE_1500_ENTRIES.filter(entry => entry.pitchAccentHtml)).toHaveLength(1499);
    expect(JAPANESE_1500_ENTRIES.filter(entry => entry.notes.es)).toHaveLength(50);
  });

  it('keeps duplicate written forms as separate senses', () => {
    const expensiveAndTall = JAPANESE_1500_ENTRIES.filter(item => item.word === '高い');
    expect(expensiveAndTall).toHaveLength(2);
    expect(expensiveAndTall.map(item => item.meaning.es)).toEqual(['caro', 'alto']);
    expect(new Set(expensiveAndTall.map(item => item.id)).size).toBe(2);
    expect(new Set(JAPANESE_1500_ENTRIES.map(item => item.word)).size).toBe(1476);
  });

  it('does not import scheduler or progress fields from the source', () => {
    const serialized = JSON.stringify(JAPANESE_1500_ENTRIES[0]);
    for (const field of ['stability', 'difficulty', 'elapsed_days', 'scheduled_days', 'learning_steps', 'reps', 'lapses']) {
      expect(serialized).not.toContain(`"${field}"`);
    }
  });
});

function entry(word: string) {
  const result = JAPANESE_1500_ENTRIES.find(item => item.word === word);
  if (!result) throw new Error(`Missing test entry: ${word}`);
  return result;
}

function sourceSentenceText(source: string): string {
  return source
    .replace(/<br\s*\/?>/gi, '')
    .replace(/<\/?b>/gi, '')
    .replace(/\[[^\]]+\]/g, '')
    .replace(/&nbsp;/gi, '')
    .replace(/\s+/g, '');
}

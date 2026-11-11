import { analyzeMangaLine, mangaLexemeKey, mergeMangaLexemes } from './manga-vocabulary-analysis';
import { DictionaryTerm } from '../models/dictionary.model';
import { MangaLexeme } from '../models/manga-vocabulary-index.model';

export const mangaTestTerm = (expression: string, reading: string, sequence: number, rules = ''): DictionaryTerm =>
  ({id: `d:${sequence}`, dictionaryId: 'd', expression, reading, sequence, rules, score: 1,
    glossaries: ['fixture'], definitionTags: '', termTags: ''});
const terms = [mangaTestTerm('猫', 'ねこ', 1), mangaTestTerm('食べる', 'たべる', 2, 'v1'),
  mangaTestTerm('生', 'せい', 3), mangaTestTerm('生', 'なま', 4), mangaTestTerm('太郎', 'たろう', 5)];
const find = async (s: string) => terms.filter(t => t.expression === s);
const location = {pageIndex: 0, blockIndex: 0, lineIndex: 0};
describe('M1 conservative local vocabulary analysis', () => {
  it('counts repeats, merges validated inflections, retains exact UTF-16 contexts', async () => {
    const result = await analyzeMangaLine('猫、猫。食べた。食べなかった。食べる。', location, find);
    const merged = new Map<string, MangaLexeme>(); mergeMangaLexemes(merged, result.entries);
    expect([...merged.values()].map(e => [e.lemma, e.occurrences.length])).toEqual([['猫', 2], ['食べる', 3]]);
    expect(result.issues).toEqual([]);
    for (const entry of result.entries) for (const o of entry.occurrences) expect(o.context.slice(o.start, o.end)).toBe(o.surface);
  });
  it('does not select the highest ranked homograph or invent an unknown name', async () => {
    const result = await analyzeMangaLine('生。太郎。謎名。', location, find);
    expect(result.entries.map(e => e.lemma)).toEqual(['太郎']);
    expect(result.issues.some(i => i.reason === 'ambiguous')).toBe(true);
    expect(result.issues.some(i => i.reason === 'unresolved')).toBe(true);
    expect(mangaLexemeKey(terms[2])).not.toBe(mangaLexemeKey(terms[3]));
    expect(mangaLexemeKey({...terms[2], sequence: 9})).not.toBe(mangaLexemeKey(terms[2]));
  });
  it('never counts punctuation, Latin OCR noise or digits as words', async () => {
    const result = await analyzeMangaLine('!!! abc 123 … 猫', location, find);
    expect(result.entries).toHaveLength(1);
  });
  it('falls back to an explicit unresolved analysis without Segmenter', async () => {
    const original = Intl.Segmenter;
    Object.defineProperty(Intl, 'Segmenter', {configurable: true, value: undefined});
    try {
      const result = await analyzeMangaLine('猫', location, find);
      expect(result.entries).toEqual([]); expect(result.issues[0].reason).toBe('segmenter');
    } finally {Object.defineProperty(Intl, 'Segmenter', {configurable: true, value: original});}
  });
});

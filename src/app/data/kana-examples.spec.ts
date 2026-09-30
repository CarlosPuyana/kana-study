import { Kana } from '../core/models/kana.model';
import { ALL_KANA } from './kana';
import { attachExamples, getKanaExampleCoverage, KanaWithoutExamples } from './kana-examples';

describe('Kana examples dataset', () => {
  it('defines an examples array for every kana', () => {
    expect(ALL_KANA).toHaveLength(210);
    expect(ALL_KANA.every(kana => Array.isArray(kana.examples))).toBe(true);
  });

  it('contains complete, non-blank examples with all three translations', () => {
    for (const kana of ALL_KANA) {
      for (const example of kana.examples) {
        expect(example.japanese.trim()).not.toBe('');
        expect(example.romaji.trim()).not.toBe('');
        expect(Object.keys(example.translations).sort()).toEqual(['ca', 'en', 'es']);
        expect(example.translations.es.trim()).not.toBe('');
        expect(example.translations.en.trim()).not.toBe('');
        expect(example.translations.ca.trim()).not.toBe('');
      }
    }
  });

  it('uses words that contain the complete kana being illustrated', () => {
    for (const kana of ALL_KANA) {
      for (const example of kana.examples) {
        expect(example.japanese, `${kana.id} must contain ${kana.character}`)
          .toContain(kana.character);
      }
    }
  });

  it('reports coverage without treating deliberate omissions as invalid', () => {
    const coverage = getKanaExampleCoverage(ALL_KANA);
    expect(coverage.withExamples + coverage.withoutExamples).toBe(ALL_KANA.length);
    expect(coverage.withExamples).toBeGreaterThan(0);
    expect(coverage.withoutExamples).toBeGreaterThan(0);
  });

  it('attaches examples without changing stable kana identity fields', () => {
    const source: KanaWithoutExamples = {
      id: 'hira-h-ho', character: 'ほ', romaji: 'ho', type: 'hiragana',
      group: 'h', variant: 'basic', order: 30,
    };
    const [result] = attachExamples([source], {
      ほ: {
        japanese: 'ほし', romaji: 'hoshi',
        translations: { es: 'estrella', en: 'star', ca: 'estrella' },
      },
    });
    const { examples: _examples, ...identity } = result as Kana;
    expect(identity).toEqual(source);
  });
});

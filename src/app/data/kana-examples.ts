import { Kana, KanaExample } from '../core/models/kana.model';

export type KanaWithoutExamples = Omit<Kana, 'examples'>;
export type ExampleSeed = readonly [
  japanese: string,
  romaji: string,
  es: string,
  en: string,
  ca: string,
];

export function createExample(seed: ExampleSeed): KanaExample {
  const [japanese, romaji, es, en, ca] = seed;
  return { japanese, romaji, translations: { es, en, ca } };
}

export function attachExamples(
  kana: readonly KanaWithoutExamples[],
  examplesByCharacter: Readonly<Record<string, KanaExample>>,
): readonly Kana[] {
  return kana.map(item => ({
    ...item,
    examples: examplesByCharacter[item.character]
      ? [examplesByCharacter[item.character]] : [],
  }));
}

export function assignExamples<TKey extends string>(
  words: Readonly<Record<TKey, KanaExample>>,
  assignments: Readonly<Record<string, TKey>>,
): Readonly<Record<string, KanaExample>> {
  return Object.fromEntries(
    Object.entries(assignments).map(([character, key]) => [character, words[key as TKey]]),
  );
}

export function getKanaExampleCoverage(kana: readonly Kana[]): {
  readonly withExamples: number;
  readonly withoutExamples: number;
} {
  const withExamples = kana.filter(item => item.examples.length > 0).length;
  return { withExamples, withoutExamples: kana.length - withExamples };
}

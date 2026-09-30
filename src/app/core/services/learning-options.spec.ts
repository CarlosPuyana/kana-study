import { ALL_KANA } from '../../data/kana';
import { buildQuestionOptions } from './learning-options';

describe('buildQuestionOptions', () => {
  it('builds four unique Hiragana options with exactly one correct answer', () => {
    const kana = ALL_KANA.find(item => item.id === 'hira-h-ho')!;
    const options = buildQuestionOptions(kana, 'romaji-to-kana', ALL_KANA, 'session-1');

    expect(options).toHaveLength(4);
    expect(new Set(options).size).toBe(4);
    expect(options.filter(option => option === kana.character)).toHaveLength(1);
    expect(options.every(option => ALL_KANA.some(item =>
      item.type === 'hiragana' && item.character === option,
    ))).toBe(true);
  });

  it('prioritizes distractors from the same group', () => {
    const kana = ALL_KANA.find(item => item.id === 'hira-h-ho')!;
    const options = buildQuestionOptions(kana, 'romaji-to-kana', ALL_KANA, 'session-2');
    const distractors = options
      .filter(option => option !== kana.character)
      .map(option => ALL_KANA.find(item => item.character === option)!);

    expect(distractors.every(option => option.group === kana.group)).toBe(true);
  });

  it('never mixes Hiragana into Katakana answer options', () => {
    const kana = ALL_KANA.find(item => item.id === 'kata-h-ho')!;
    const options = buildQuestionOptions(kana, 'romaji-to-kana', ALL_KANA, 'session-3');

    expect(options).toHaveLength(4);
    expect(options.every(option => ALL_KANA.some(item =>
      item.type === 'katakana' && item.character === option,
    ))).toBe(true);
  });

  it('keeps romaji options unique when several kana share a reading', () => {
    const kana = ALL_KANA.find(item => item.id === 'hira-z-ji')!;
    const options = buildQuestionOptions(kana, 'kana-to-romaji', ALL_KANA, 'session-4');

    expect(options).toHaveLength(4);
    expect(new Set(options).size).toBe(4);
    expect(options.filter(option => option === 'ji')).toHaveLength(1);
  });
});

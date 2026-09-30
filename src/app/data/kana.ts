import { Kana } from '../core/models/kana.model';
import { HIRAGANA } from './hiragana';
import { KATAKANA } from './katakana';

export const ALL_KANA: readonly Kana[] = [...HIRAGANA, ...KATAKANA];

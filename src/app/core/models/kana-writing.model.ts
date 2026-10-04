import { KanaType, KanaVariant } from './kana.model';

export interface WritingPoint { readonly x: number; readonly y: number; readonly pressure: number; readonly timestamp: number; }
export type WritingStroke = readonly WritingPoint[];
export interface KanaStrokePath { readonly id: string; readonly value: string; }
export interface KanaStrokeGlyph { readonly character: string; readonly strokes: readonly KanaStrokePath[]; readonly clipPaths: readonly KanaStrokePath[]; }
export interface WritingConfiguration { readonly type: KanaType | 'both'; readonly variants: readonly KanaVariant[]; readonly guide: boolean; }

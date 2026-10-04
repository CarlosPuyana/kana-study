import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { KanaStrokeGlyph } from '../models/kana-writing.model';

@Injectable({providedIn: 'root'})
export class KanaStrokesService {
  private readonly document = inject(DOCUMENT);
  private pending?: Promise<readonly KanaStrokeGlyph[]>;
  async load(character: string): Promise<readonly KanaStrokeGlyph[]> {
    this.pending ??= fetch(new URL('kana-writing/strokes.json', this.document.baseURI)).then(async response => {
      if (!response.ok) throw new Error('Kana stroke data unavailable');
      return await response.json() as readonly KanaStrokeGlyph[];
    }).catch(error => {this.pending = undefined; throw error;});
    const data = await this.pending;
    return [...character].map(char => {
      const glyph = data.find(g => g.character === char);
      if (!glyph) throw new Error('Missing kana strokes');
      return glyph;
    });
  }
}

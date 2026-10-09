import {ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, output, signal} from '@angular/core';
import {KanaStrokeGlyph} from '../../../core/models/kana-writing.model';
import {JapaneseGlyphService} from '../../../core/services/japanese-glyph.service';
import {TranslationService} from '../../../core/services/translation.service';
import {KanaWritingCanvas} from '../kana-writing-canvas/kana-writing-canvas';

/** Ephemeral drawing only: assessment remains with the parent learning session. */
@Component({selector:'app-learning-writing-prompt',imports:[KanaWritingCanvas],
  template:`<p>{{i18n.t(instructionsKey())}}</p>
    <app-japanese-writing-canvas [character]="character()" [resetKey]="occurrence()"
      [suppliedGlyphs]="glyphs()" [guide]="revealed()" [helpAvailable]="revealed()"/>
    @if(missing()){<p role="status">{{i18n.t('vocabularyWriting.missing')}}</p>}
    @if(quick() && !optionsVisible()){
      <div class="actions"><button type="button" (click)="continued.emit()">{{i18n.t('learningWriting.options')}}</button>
      <button type="button" (click)="continued.emit()">{{i18n.t('learningWriting.skip')}}</button></div>
    }`,
  styles:`:host{display:block;width:min(100%,25rem);min-width:0;margin:1rem auto;text-align:center;color:var(--text-secondary)}
    .actions{display:flex;flex-wrap:wrap;gap:.5rem;margin:1rem 0;justify-content:center}
    button{min-height:44px;max-width:100%;padding:.6rem 1rem;border:1px solid var(--border);border-radius:.6rem;background:var(--surface);color:var(--text-primary);font:inherit;cursor:pointer}
    button:focus-visible{outline:3px solid var(--accent);outline-offset:3px}`,
  changeDetection:ChangeDetectionStrategy.OnPush})
export class LearningWritingPrompt {
  readonly instructionsKey=input('learningWriting.instructions');
  readonly character=input.required<string>(); readonly occurrence=input.required<string>();
  readonly kanji=input(false); readonly revealed=input(false); readonly quick=input(false); readonly optionsVisible=input(false);
  readonly continued=output<void>(); readonly i18n=inject(TranslationService);
  readonly glyphs=signal<readonly KanaStrokeGlyph[]|null>(null); readonly missing=signal(false);
  private readonly provider=inject(JapaneseGlyphService); private generation=0;
  constructor(){
    effect(()=>{
      const character=this.character(),kanji=this.kanji(),generation=++this.generation;
      this.missing.set(false);this.glyphs.set(kanji?[]:null);
      if(kanji)void this.provider.load(character).then(glyphs=>{
        if(generation!==this.generation)return;
        this.glyphs.set(glyphs);this.missing.set(!glyphs.some(g=>g.strokes.length));
      }).catch(()=>{if(generation===this.generation)this.missing.set(true);});
    });
    inject(DestroyRef).onDestroy(()=>this.generation++);
  }
}

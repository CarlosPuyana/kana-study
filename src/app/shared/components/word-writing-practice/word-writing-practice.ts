import {ChangeDetectionStrategy,Component,DestroyRef,computed,effect,inject,input,output,signal,viewChild} from '@angular/core';
import {WritingGlyph,WritingStroke} from '../../../core/models/kana-writing.model';
import {JapaneseGlyphService,splitWritingWord} from '../../../core/services/japanese-glyph.service';
import {TranslationService} from '../../../core/services/translation.service';
import {KanaWritingCanvas} from '../kana-writing-canvas/kana-writing-canvas';

@Component({selector:'app-word-writing-practice',imports:[KanaWritingCanvas],templateUrl:'./word-writing-practice.html',styleUrl:'./word-writing-practice.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class WordWritingPractice {
  readonly Math=Math;readonly word=input.required<string>();readonly guide=input(true);readonly revealWord=input(true);
  readonly completed=output<boolean>();readonly i18n=inject(TranslationService);
  private readonly provider=inject(JapaneseGlyphService);private readonly destroy=inject(DestroyRef);
  readonly characters=computed(()=>splitWritingWord(this.word()));readonly index=signal(0);
  readonly drawings=signal<readonly (readonly WritingStroke[])[]>([]);
  readonly initial=computed(()=>this.drawings()[this.index()]??[]);
  readonly glyphs=signal<readonly WritingGlyph[]|null>(null);readonly loadError=signal(false);
  readonly canvas=viewChild(KanaWritingCanvas);private generation=0;
  constructor(){
    effect(()=>{this.word();this.index.set(0);this.drawings.set([]);this.completed.emit(false);});
    effect(()=>{
      const character=this.characters()[this.index()],generation=++this.generation;
      this.glyphs.set(null);this.loadError.set(false);if(!character)return;
      void this.provider.load(character).then(g=>{if(generation===this.generation)this.glyphs.set(g);}).catch(()=>{if(generation===this.generation){this.loadError.set(true);this.glyphs.set([{character,strokes:[],clipPaths:[]}]);}});
    });
    this.destroy.onDestroy(()=>this.generation++);
  }
  move(next:number):void{
    if(next<0||next>this.characters().length)return;
    const current=this.index();if(current<this.characters().length){const strokes=this.canvas()?.strokes()??[];this.drawings.update(d=>{const copy=[...d];copy[current]=strokes;return copy;});}
    this.index.set(next);this.completed.emit(next===this.characters().length);
  }
  restart():void{this.drawings.set([]);this.index.set(0);this.canvas()?.clear();this.completed.emit(false);}
}

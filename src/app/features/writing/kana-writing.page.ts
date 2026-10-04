import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { WeaknessService } from '../../core/services/weakness.service';
import { KanaType, KanaVariant } from '../../core/models/kana.model';
import { TranslationService } from '../../core/services/translation.service';
import { KanaWritingSession, writingPool } from '../../core/services/kana-writing-session';
import { ALL_KANA } from '../../data/kana';
import { KanaWritingCanvas } from '../../shared/components/kana-writing-canvas/kana-writing-canvas';

@Component({selector:'app-kana-writing-page',imports:[RouterLink,KanaWritingCanvas],templateUrl:'./kana-writing.page.html',styleUrl:'./kana-writing.page.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class KanaWritingPage {
  readonly i18n=inject(TranslationService);
  private readonly weaknesses=inject(WeaknessService);
  readonly weakMode=signal(false);
  readonly types=['hiragana','katakana','both'] as const;
  readonly categories:readonly KanaVariant[]=['basic','dakuten','handakuten','combination'];
  readonly type=signal<KanaType|'both'>('hiragana');
  readonly variants=signal<readonly KanaVariant[]>(['basic']);
  readonly withGuide=signal(true); readonly revealed=signal(false);
  readonly session=signal<KanaWritingSession|null>(null);
  readonly current=signal<ReturnType<typeof writingPool>[number]|null>(null);
  readonly resolved=signal(0);
  readonly canvas=viewChild(KanaWritingCanvas);
  readonly pool=computed(()=>writingPool(ALL_KANA,{type:this.type(),variants:this.variants(),guide:this.withGuide()}));
  constructor(){this.weakMode.set(inject(ActivatedRoute).snapshot.queryParamMap.get('weak')==='1');if(this.weakMode())this.start();}
  toggle(variant:KanaVariant):void{this.variants.update(v=>v.includes(variant)?v.filter(x=>x!==variant):[...v,variant]);}
  start():void{const pool=this.weakMode()?this.weaknesses.items('kana',ALL_KANA,10):this.pool();if(!pool.length&&!this.weakMode())return;const session=new KanaWritingSession(pool);this.session.set(session);this.current.set(session.current);this.resolved.set(0);this.revealed.set(false);}
  answer(correct:boolean):void{
    if(!this.revealed())return;
    const session=this.session();if(!session)return;
    if(!session.current)return;
    this.weaknesses.record('kana',session.current.id,correct);
    session.answer(correct);this.canvas()?.clear();this.revealed.set(false);this.current.set(session.current);this.resolved.set(session.resolved);
  }
  configure():void{if(this.weakMode()){this.start();return;}this.session.set(null);this.current.set(null);}
}

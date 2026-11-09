import {KanjiAnswerIntent,KanjiAnswerStore} from '../../core/services/kanji-answer-store';
import {WorkspaceService} from '../../core/services/workspace.service';
import {safeReturnUrl} from '../../core/services/return-navigation';
import {ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal, viewChild} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Kanji} from '../../core/models/kanji.model';
import {WritingGlyph} from '../../core/models/kana-writing.model';
import {JapaneseGlyphService} from '../../core/services/japanese-glyph.service';
import {KanjiSettingsService} from '../../core/services/kanji-settings.service';
import {KanjiWritingSession} from '../../core/services/kanji-writing-session';
import {TranslationService} from '../../core/services/translation.service';
import {KANJI_N5} from '../../data/kanji-n5.generated';
import {KANJI_N5_CATEGORIES, KANJI_THEME_BY_CHARACTER, KanjiTheme} from '../../data/kanji-n5-categories';
import {KanaWritingCanvas} from '../../shared/components/kana-writing-canvas/kana-writing-canvas';
import {WeaknessService} from '../../core/services/weakness.service';

@Component({selector:'app-kanji-writing-page', imports:[RouterLink, KanaWritingCanvas],
  templateUrl:'./kanji-writing.page.html', styleUrls:['../writing/kana-writing.page.scss','./kanji-writing.page.scss'],
  changeDetection:ChangeDetectionStrategy.OnPush})
export class KanjiWritingPage {
  private readonly router=inject(Router);
  readonly returnLink=computed(()=>this.router.parseUrl(this.returnRoute()));
  readonly i18n = inject(TranslationService);
  private readonly workspace=inject(WorkspaceService);
  readonly integrity=inject(KanjiAnswerStore);
  private owner=this.workspace.active();
  private epoch=this.workspace.activationRevision();
  private sessionGeneration=0;
  private sessionId='';
  private ordinal=0;
  private readonly seen=new Set<string>();
  private pending:{intent:KanjiAnswerIntent;correct:boolean}|null=null;
  private choice:{correct:boolean;at:string}|null=null;
  readonly saving=signal(false);
  readonly saveError=signal(false);
  private readonly weaknesses = inject(WeaknessService);
  readonly weakMode = signal(false);
  readonly returnRoute=signal('/kanji');
  readonly settings = inject(KanjiSettingsService);
  private readonly provider = inject(JapaneseGlyphService);
  private readonly destroy = inject(DestroyRef);
  readonly categories = KANJI_N5_CATEGORIES;
  readonly selected = signal<readonly KanjiTheme[]>(this.categories.map(c => c.theme));
  readonly withGuide = signal(true);
  readonly pool = computed(() => KANJI_N5.filter(k => k.enabled && k.jlptApproxLevel === 'N5'
    && this.settings.selection().levels.N5 && this.selected().includes(KANJI_THEME_BY_CHARACTER[k.character])));
  readonly individual = signal<Kanji|null>(null);
  readonly session = signal<KanjiWritingSession|null>(null);
  readonly current = signal<Kanji|null>(null);
  readonly active = computed(() => this.epoch===this.workspace.activationRevision()&&this.owner===this.workspace.active()?(this.individual() ?? this.current()):null);
  readonly resolved = signal(0);
  readonly revealed = signal(false);
  readonly glyphs = signal<readonly WritingGlyph[]|null>(null);
  readonly loadError = signal(false);
  readonly canvas = viewChild(KanaWritingCanvas);
  private generation = 0;
  constructor() {
    inject(ActivatedRoute).queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.weakMode.set(params.get('weak') === '1');
      this.individual.set(this.weakMode() ? null : KANJI_N5.find(k => k.id === params.get('entry')) ?? null);
      this.returnRoute.set(safeReturnUrl(params.get('return'),this.weakMode()?'/weaknesses':this.individual()?'/kanji/all':'/kanji'));
      this.configure();
    });
    effect(()=>{const owner=this.workspace.active(),epoch=this.workspace.activationRevision();if(this.owner!==owner||this.epoch!==epoch)this.invalidate();});
    effect(() => {
      const entry = this.active(), generation = ++this.generation;
      const epoch=this.workspace.activationRevision();
      this.glyphs.set(null); this.loadError.set(false);
      if (!entry) return;
      void this.provider.load(entry.character).then(glyphs => {
        if (generation === this.generation&&epoch===this.workspace.activationRevision()) this.glyphs.set(glyphs);
      }).catch(() => {
        if (generation === this.generation&&epoch===this.workspace.activationRevision()) {
          this.loadError.set(true);
          this.glyphs.set([{character:entry.character, strokes:[], clipPaths:[]}]);
        }
      });
    });
    this.destroy.onDestroy(() => this.invalidate());
  }
  meaning(entry: Kanji): string { return entry.meanings[this.i18n.language()].join(' · '); }
  toggle(theme: KanjiTheme): void { this.selected.update(s => s.includes(theme) ? s.filter(t => t !== theme) : [...s, theme]); }
  start(): void {
    if(this.saving())return;
    try{if(this.integrity.hasPending()){this.saveError.set(true);return;}}catch{this.saveError.set(true);return;}
    this.owner=this.workspace.active();this.epoch=this.workspace.activationRevision();++this.sessionGeneration;
    const pool = this.weakMode() ? this.weaknesses.items('kanji',KANJI_N5.filter(k=>k.enabled),10) : this.pool();
    if (!pool.length && !this.weakMode()) return;
    const session = new KanjiWritingSession(pool);
    this.sessionId=crypto.randomUUID();this.ordinal=0;this.seen.clear();this.pending=null;this.choice=null;this.saveError.set(false);
    this.session.set(session); this.current.set(session.current); this.resolved.set(0); this.revealed.set(false);
  }
  async answer(correct: boolean): Promise<void> {
    if(this.owner!==this.workspace.active()||this.epoch!==this.workspace.activationRevision()){this.invalidate();return;}
    if(this.saving())return;
    if (!this.revealed() || !this.session()) return;
    const entry=this.session()!.current;if(!entry)return;
    const choice=this.choice??{correct,at:new Date().toISOString()};if(choice.correct!==correct)return;this.choice=choice;
    const generation=this.sessionGeneration,epoch=this.epoch;
    this.saving.set(true);
    try{
      if(!this.pending)this.pending={correct,intent:this.integrity.prepare({rating:correct?'good':'again',progress:'none',attempt:{version:1,id:this.sessionId+':kanji:writing:'+(this.ordinal+1),occurredAt:choice.at,module:'kanji',activity:'writing',itemId:entry.id,sessionId:this.sessionId,firstAttempt:!this.seen.has(entry.id),result:{source:'self',rating:correct?'good':'again'}}})};
      if(this.pending.correct!==correct)return;
      await this.integrity.commit(this.pending.intent,epoch);
      if(generation!==this.sessionGeneration||epoch!==this.workspace.activationRevision()||this.owner!==this.workspace.active())return;
      this.ordinal++;this.seen.add(entry.id);this.pending=null;this.choice=null;this.saveError.set(false);
      this.session()!.answer(correct); this.canvas()?.clear();
      this.current.set(this.session()!.current); this.resolved.set(this.session()!.resolved); this.revealed.set(false);
    }catch{if(generation===this.sessionGeneration&&epoch===this.workspace.activationRevision())this.saveError.set(true);}
    finally{if(generation===this.sessionGeneration)this.saving.set(false);}
  }
  async retrySave():Promise<void>{if(this.saving())return;if(this.choice){await this.answer(this.choice.correct);return;}const epoch=this.workspace.activationRevision();try{await this.integrity.recover();if(epoch===this.workspace.activationRevision())this.start();}catch{if(epoch===this.workspace.activationRevision())this.saveError.set(true);}}
  configure(): void {if(this.saving()||this.choice)return;this.owner=this.workspace.active();this.epoch=this.workspace.activationRevision();++this.sessionGeneration;if(this.weakMode()){this.start();return;}this.session.set(null); this.current.set(null); this.revealed.set(false); }
  restart(): void { this.canvas()?.clear(); }
  private invalidate():void {++this.generation;++this.sessionGeneration;this.canvas()?.clear();this.pending=null;this.choice=null;this.session.set(null);this.current.set(null);this.individual.set(null);this.glyphs.set(null);this.resolved.set(0);this.revealed.set(false);this.saving.set(false);this.saveError.set(false);}
}

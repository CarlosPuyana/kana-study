import {safeReturnUrl} from '../../core/services/return-navigation';
import {ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal, viewChild} from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
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
  readonly i18n = inject(TranslationService);
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
  readonly active = computed(() => this.individual() ?? this.current());
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
    effect(() => {
      const entry = this.active(), generation = ++this.generation;
      this.glyphs.set(null); this.loadError.set(false);
      if (!entry) return;
      void this.provider.load(entry.character).then(glyphs => {
        if (generation === this.generation) this.glyphs.set(glyphs);
      }).catch(() => {
        if (generation === this.generation) {
          this.loadError.set(true);
          this.glyphs.set([{character:entry.character, strokes:[], clipPaths:[]}]);
        }
      });
    });
    this.destroy.onDestroy(() => this.generation++);
  }
  meaning(entry: Kanji): string { return entry.meanings[this.i18n.language()].join(' · '); }
  toggle(theme: KanjiTheme): void { this.selected.update(s => s.includes(theme) ? s.filter(t => t !== theme) : [...s, theme]); }
  start(): void {
    const pool = this.weakMode() ? this.weaknesses.items('kanji',KANJI_N5.filter(k=>k.enabled),10) : this.pool();
    if (!pool.length && !this.weakMode()) return;
    const session = new KanjiWritingSession(pool);
    this.session.set(session); this.current.set(session.current); this.resolved.set(0); this.revealed.set(false);
  }
  answer(correct: boolean): void {
    if (!this.revealed() || !this.session()) return;
    if (!this.session()!.current) return;
    this.weaknesses.record('kanji',this.session()!.current!.id,correct);
    this.session()!.answer(correct); this.canvas()?.clear();
    this.current.set(this.session()!.current); this.resolved.set(this.session()!.resolved); this.revealed.set(false);
  }
  configure(): void { if(this.weakMode()){this.start();return;}this.session.set(null); this.current.set(null); this.revealed.set(false); }
  restart(): void { this.canvas()?.clear(); }
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { KANJI_N5 } from '../../data/kanji-n5.generated';
import { Kanji, KanjiQuestionType } from '../../core/models/kanji.model';
import { KanjiProgressService } from '../../core/services/kanji-progress.service';
import { TranslationService } from '../../core/services/translation.service';
import { KANJI_N5_CATEGORIES, KANJI_THEME_BY_CHARACTER } from '../../data/kanji-n5-categories';
@Component({selector:'app-kanji-all-page',templateUrl:'./kanji-all.page.html',styleUrl:'./kanji-all.page.scss',changeDetection:ChangeDetectionStrategy.OnPush,host:{'(document:keydown.escape)':'closeOverlay()'}})
export class KanjiAllPage {
  readonly viewModes = ['all', 'stroke', 'theme'] as const;
  readonly viewMode = signal<'all' | 'stroke' | 'theme'>('all');
  readonly groupedByStroke = computed(() => {
    const groups = new Map<number, Kanji[]>();
    for (const kanji of this.filtered()) {
      const group = groups.get(kanji.strokeCount) ?? [];
      group.push(kanji); groups.set(kanji.strokeCount, group);
    }
    return [...groups].sort(([a], [b]) => a - b).map(([count, items]) => ({
      id: String(count), title: this.i18n.t(count === 1 ? 'kanji.all.stroke.one' : 'kanji.all.stroke.other', {count}), items,
    }));
  });
  readonly groupedByTheme = computed(() => KANJI_N5_CATEGORIES.map(category => ({
    id: category.theme, title: this.i18n.t('kanji.all.theme.' + category.theme),
    items: this.filtered().filter(kanji => KANJI_THEME_BY_CHARACTER[kanji.character] === category.theme),
  })).filter(group => group.items.length));
  readonly groups = computed(() => this.viewMode() === 'stroke' ? this.groupedByStroke()
    : this.viewMode() === 'theme' ? this.groupedByTheme() : [{id: 'all', title: '', items: this.filtered()}]);readonly i18n=inject(TranslationService);readonly progress=inject(KanjiProgressService);readonly searching=signal(false);readonly query=signal('');readonly selected=signal<Kanji|null>(null);private readonly router=inject(Router);private readonly route=inject(ActivatedRoute);readonly filtered=computed(()=>{const q=this.normalize(this.query());return KANJI_N5.filter(k=>!q||[k.character,'N5',String(k.strokeCount),...Object.values(k.meanings).flat(),...k.onyomi,...k.kunyomi,...k.examples.flatMap(e=>[e.word,e.reading,e.romaji,...Object.values(e.translations)])].some(v=>this.normalize(v).includes(q)))});back(){void this.router.navigateByUrl('/kanji')}setQuery(event:Event){this.query.set((event.target as HTMLInputElement).value)}closeOverlay(){if(this.selected())this.selected.set(null);else if(this.searching()){this.searching.set(false);this.query.set('')}}meaning(k:Kanji){return k.meanings[this.i18n.language()].join(' · ')}statusKey(k:Kanji,type:KanjiQuestionType){const p=this.progress.get(`kanji:${k.id}:${type}`);if(!p)return'home.new';return p.fsrs.state==='review'?'home.memorized':'home.pending'}constructor(){const character=this.route.snapshot.queryParamMap.get('selected');if(character)this.selected.set(KANJI_N5.find(k=>k.character===character)??null)}private normalize(v:string){return v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}}


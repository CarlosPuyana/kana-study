import * as rushCopy from '../../../assets/i18n/manga-rush.generated';
import * as analysisCopy from '../../../assets/i18n/manga-analysis.generated';
import { StudyPrimaryAction } from '../../shared/keyboard/study-primary-action';
import { studyKeyboardAvailable, studyModalOpen } from '../../shared/keyboard/study-shortcuts';
import { Component, DestroyRef, ElementRef, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslationService } from '../../core/services/translation.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { MangaVocabularyIndexService } from '../../core/services/manga-vocabulary-index.service';
import { LexicalKnowledgeProjectionService } from '../../core/services/lexical-knowledge-projection.service';
import { CustomDeckRepository } from '../../core/services/custom-deck.repository';
import { projectMangaVocabulary } from '../../core/services/manga-vocabulary-knowledge';
import { mangaReadingAddsInformation } from '../../core/services/manga-vocabulary-presentation';
import { MangaRushSessionService } from '../../core/services/manga-rush-session.service';
import { MANGA_RUSH_DEFAULTS, mangaRushPool, selectMangaRushCards } from '../../core/services/manga-rush';
import { MangaRushAmount, MangaRushCategory, MangaRushConfiguration, MangaRushExclusion, MangaRushKnowledge, MangaRushSelection } from '../../core/models/manga-rush.model';
import { MangaProjectedWord, MangaVocabularyIndex } from '../../core/models/manga-vocabulary-index.model';

@Component({selector:'app-manga-rush', imports:[FormsModule,RouterLink,StudyPrimaryAction], providers:[MangaRushSessionService],
  host:{'(document:keydown)':'key($event)'},
  templateUrl:'./manga-rush.page.html',styleUrl:'./manga-rush.page.scss'})
export class MangaRushPage {
  readonly i18n = inject(TranslationService);
  readonly rush = inject(MangaRushSessionService);
  private readonly workspace = inject(WorkspaceService);
  private readonly indexService = inject(MangaVocabularyIndexService);
  private readonly knowledge = inject(LexicalKnowledgeProjectionService);
  private readonly custom = inject(CustomDeckRepository);
  private readonly router = inject(Router);
  private readonly params = toSignal(inject(ActivatedRoute).paramMap);
  readonly volumeId = computed(() => this.params()?.get('volumeId') ?? '');
  readonly index = signal<MangaVocabularyIndex | null>(null);
  readonly loading = signal(true);
  readonly knowledgeLoading = signal(false);
  readonly knowledgeFailed = signal(false);
  readonly unavailable = signal(false);
  readonly words = signal<MangaProjectedWord[]>([]);
  readonly config = signal<MangaRushConfiguration>({...MANGA_RUSH_DEFAULTS});
  readonly pool = computed(() => {const index = this.index(); return index ? mangaRushPool(index, this.words(), this.config()) : null;});
  readonly exclusions = computed(() => Object.entries(this.pool()?.excluded ?? {}).filter(([,count]) => count > 0) as [MangaRushExclusion,number][]);
  readonly knows: MangaRushKnowledge[] = ['all','known','learning','unknown','unlinked','familiar'];
  readonly categories: MangaRushCategory[] = ['lexical','functional','unclassified','all'];
  readonly selections: MangaRushSelection[] = ['frequency','random','weighted'];
  readonly amounts: MangaRushAmount[] = [10,20,50,'all'];
  readonly addsReading = mangaReadingAddsInformation;
  private readonly revealButton = viewChild<ElementRef<HTMLButtonElement>>('revealButton');
  private readonly knownButton = viewChild<ElementRef<HTMLButtonElement>>('knownButton');
  private readonly summaryHeading = viewChild<ElementRef<HTMLHeadingElement>>('summaryHeading');
  private readonly startButton = viewChild<ElementRef<HTMLButtonElement>>('startButton');
  private scope: {id:string; owner:string; epoch:number} | null = null;
  private alive = true;
  constructor() {
    this.i18n.useStudyCopy(analysisCopy); this.i18n.useStudyCopy(rushCopy);
    inject(DestroyRef).onDestroy(() => {this.alive = false; this.rush.clear();});
    effect(onCleanup => {
      const id = this.volumeId(), owner = this.workspace.active(), epoch = this.workspace.activationRevision(); this.workspace.dataRevision();
      const controller = new AbortController(); onCleanup(() => controller.abort());
      untracked(() => {
        this.rush.clear(); this.scope = null; this.index.set(null); this.words.set([]);
        this.config.set({...MANGA_RUSH_DEFAULTS}); this.loading.set(true); this.unavailable.set(false);
      });
      void this.indexService.cached(id,controller.signal).then(index => {
        if (controller.signal.aborted) return;
        if (!index) {this.unavailable.set(true); return;}
        this.scope = {id,owner,epoch}; this.index.set(index);
      }).catch(() => {if (!controller.signal.aborted) this.unavailable.set(true);})
        .finally(() => {if (!controller.signal.aborted) this.loading.set(false);});
    });
    effect(onCleanup => {
      const index = this.index(), key = this.knowledge.cacheKey(), owner = this.workspace.active();
      let alive = true; onCleanup(() => {alive = false;});
      untracked(() => {
        this.knowledgeFailed.set(false); this.knowledgeLoading.set(!!index);
        this.words.set(index?.entries.map(entry => ({entry,state:'unlinked'})) ?? []);
      });
      if (!index) return;
      void Promise.all([this.knowledge.load(),this.custom.mangaConfirmations(owner)]).then(([snapshot,receipts]) => {
        if (alive && owner === this.workspace.active() && key === this.knowledge.cacheKey()) this.words.set(projectMangaVocabulary(index,snapshot,receipts));
      }).catch(() => {if (alive) this.knowledgeFailed.set(true);}).finally(() => {if (alive) this.knowledgeLoading.set(false);});
    });
  }
  update<K extends keyof MangaRushConfiguration>(key: K, value: MangaRushConfiguration[K]): void {
    if (!this.rush.session()) this.config.update(c => ({...c,[key]:value}));
  }
  key(event: KeyboardEvent): void {
    if (!this.validScope() || !this.rush.current() || studyModalOpen()) return;
    // Numeric ratings may be used from our focused study buttons; other controls own their keys.
    const numeric = event.key === '1' || event.key === '2';
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest('button[studyPrimaryAction]');
    if (numeric && button && !event.repeat && !event.isComposing && !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey && !event.defaultPrevented) {
      if (this.rush.session()?.revealed) {event.preventDefault();this.rate(event.key === '2');} return;
    }
    if (!studyKeyboardAvailable(event)) return;
    if (!this.rush.session()?.revealed && (event.key === 'Enter' || event.key === ' ' || event.code === 'Space')) {event.preventDefault();this.reveal();}
    else if (numeric && this.rush.session()?.revealed) {event.preventDefault();this.rate(event.key === '2');}
  }
  private validScope(): boolean {
    return !!this.scope && this.scope.id === this.volumeId() && this.scope.owner === this.workspace.active() && this.scope.epoch === this.workspace.activationRevision();
  }
  start(): void {
    const pool = this.pool();
    if (!this.validScope() || !pool?.selectedCards || this.loading() || this.knowledgeLoading()) return;
    if (this.rush.start(this.volumeId(),selectMangaRushCards(this.volumeId(),pool,this.config()))) this.focusCard();
  }
  reveal(): void { if (this.validScope()) {this.rush.reveal(this.volumeId()); this.focusCard();} }
  rate(knew: boolean): void { if (this.validScope()) {this.rush.rate(this.volumeId(),knew); this.focusCard();} }
  another(): void { this.rush.clear(); this.focusCard(); }
  exit(): void { this.rush.clear(); void this.router.navigate(['/manga/analysis',this.volumeId()]); }
  private focusCard(): void {
    setTimeout(() => {
      if (!this.alive || !this.validScope()) return;
      const target = this.rush.summary() ? this.summaryHeading() : this.rush.current()
        ? this.rush.session()?.revealed ? this.knownButton() : this.revealButton() : this.startButton();
      target?.nativeElement.focus();
    },0);
  }
}

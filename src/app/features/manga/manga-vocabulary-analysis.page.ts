import * as mangaAnalysisCopy from '../../../assets/i18n/manga-analysis.generated';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslationService } from '../../core/services/translation.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { MangaVocabularyIndexService } from '../../core/services/manga-vocabulary-index.service';
import { LexicalKnowledgeProjectionService } from '../../core/services/lexical-knowledge-projection.service';
import { CustomDeckRepository } from '../../core/services/custom-deck.repository';
import { MangaVocabularyIndex, MangaProjectedWord, MangaWordKnowledge, MangaLexicalCategory } from '../../core/models/manga-vocabulary-index.model';
import { filterMangaWords, mangaCategory, mangaReadingAddsInformation } from '../../core/services/manga-vocabulary-presentation';
import { mangaVocabularyMetrics, projectMangaVocabulary } from '../../core/services/manga-vocabulary-knowledge';

@Component({selector: 'app-manga-vocabulary-analysis', imports: [RouterLink, FormsModule, DecimalPipe],
  templateUrl: './manga-vocabulary-analysis.page.html', styleUrl: './manga-vocabulary-analysis.page.scss'})
export class MangaVocabularyAnalysisPage {
  readonly i18n = inject(TranslationService);
  private readonly workspace = inject(WorkspaceService);
  private readonly service = inject(MangaVocabularyIndexService);
  private readonly knowledge = inject(LexicalKnowledgeProjectionService);
  private readonly custom = inject(CustomDeckRepository);
  private readonly params = toSignal(inject(ActivatedRoute).paramMap);
  readonly volumeId = computed(() => this.params()?.get('volumeId') ?? '');
  readonly index = signal<MangaVocabularyIndex | null>(null);
  readonly failed = signal(false);
  readonly knowledgeFailed = signal(false);
  readonly words = signal<MangaProjectedWord[]>([]);
  readonly state = signal<MangaWordKnowledge | 'all'>('all');
  readonly ascending = signal(false);
  readonly limit = signal(100);
  readonly metrics = computed(() => mangaVocabularyMetrics(this.words()));
  readonly category = signal<MangaLexicalCategory>('lexical');
  readonly categories: MangaLexicalCategory[] = ['lexical', 'functional', 'unclassified'];
  readonly sectionCounts = computed(() => Object.fromEntries(this.categories.map(c => [c, this.words().filter(w => mangaCategory(w.entry) === c).length])));
  readonly unidentified = computed(() => this.index()?.issues.filter(issue => issue.reason === 'ambiguous' || issue.reason === 'unresolved') ?? []);
  readonly ambiguousCategories = computed(() => this.words().filter(w => mangaCategory(w.entry) === 'unclassified' && w.entry.categoryReason === 'conflicting-pos').length);
  readonly insufficientCategories = computed(() => (this.sectionCounts()['unclassified'] ?? 0) - this.ambiguousCategories());
  readonly filtered = computed(() => filterMangaWords(this.words(), this.category(), this.state(), this.ascending()));
  readonly readingAddsInformation = mangaReadingAddsInformation;
  readonly categoryOf = mangaCategory;
  readonly visible = computed(() => this.filtered().slice(0, this.limit()));
  readonly states: MangaWordKnowledge[] = ['known', 'learning', 'unknown', 'unlinked'];
  readonly retry = signal(0);
  reload(): void { this.retry.update(n => n + 1); }
  constructor() {
    this.i18n.useStudyCopy(mangaAnalysisCopy);
    effect(onCleanup => {
      const id = this.volumeId(); this.workspace.active(); this.workspace.activationRevision(); this.workspace.dataRevision(); this.retry();
      const controller = new AbortController(); onCleanup(() => controller.abort());
      untracked(() => {this.index.set(null); this.failed.set(false); this.words.set([]); this.limit.set(100); this.category.set('lexical'); this.state.set('all');});
      if (!id) return;
      void this.service.load(id, controller.signal).then(index => {
        if (!controller.signal.aborted) this.index.set(index);
      }).catch(() => {if (!controller.signal.aborted) this.failed.set(true);});
    });
    effect(onCleanup => {
      const index = this.index(), key = this.knowledge.cacheKey(), owner = this.workspace.active();
      let alive = true; onCleanup(() => {alive = false;});
      untracked(() => {
        this.knowledgeFailed.set(false);
        this.words.set(index?.entries.map(entry => ({entry, state: 'unlinked'})) ?? []);
      });
      if (!index) return;
      void Promise.all([this.knowledge.load(), this.custom.mangaConfirmations(owner)]).then(([snapshot, confirmations]) => {
        if (alive && key === this.knowledge.cacheKey() && owner === this.workspace.active()) this.words.set(projectMangaVocabulary(index, snapshot, confirmations));
      }).catch(() => {if (alive) this.knowledgeFailed.set(true);});
    });
  }
}

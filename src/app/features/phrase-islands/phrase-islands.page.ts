import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { PHRASE_ISLANDS_CATALOG } from '../../data/phrase-islands/phrase-islands-catalog';
import { PhraseAudioService } from '../../core/services/phrase-audio.service';
import { CatalogPhrase } from '../../core/models/phrase-island.model';
import { FuriganaText } from '../../shared/components/furigana-text/furigana-text';
import { TranslationService } from '../../core/services/translation.service';
import { PageHeader } from '../../shared/components/page-header/page-header';
import * as copy from '../../../assets/i18n/phrase-islands.generated';

// Topic IDs are shared with the versioned phrase catalog.
const TOPICS = [
  { id: 'everyday', icon: 'M3 10 12 3l9 7M5 9v12h14V9M9 21v-8h6v8' },
  { id: 'conversation', icon: 'M21 11a8 8 0 0 1-8 8H8l-5 3V11a9 9 0 0 1 18 0ZM7 10h10M7 14h6' },
  { id: 'work', icon: 'M8 6V3h8v3M3 7h18v14H3ZM3 12l9 4 9-4M10 14v3h4v-3' },
  { id: 'shopping', icon: 'M5 8h14l2 13H3ZM8 8V6a4 4 0 0 1 8 0v2' },
  { id: 'travel', icon: 'm3 8 18-5-5 18-4-9ZM12 12l9-9' },
  { id: 'hobbies', icon: 'm12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z' },
] as const;
type TopicId = typeof TOPICS[number]['id'];

@Component({
  selector: 'app-phrase-islands-page',
  imports: [PageHeader, FuriganaText, RouterLink],
  providers: [PhraseAudioService],
  templateUrl: './phrase-islands.page.html',
  styleUrl: './phrase-islands.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhraseIslandsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly exploring = this.route.snapshot.data['explore'] === true;
  readonly query = computed(() => ({topics: [...this.selected()].join(',') || null}));
  readonly i18n = inject(TranslationService);
  readonly topics = TOPICS;
  readonly audio = inject(PhraseAudioService);
  readonly catalog = PHRASE_ISLANDS_CATALOG;
  readonly phrases = computed(() => this.catalog.filter(phrase => this.selected().has(phrase.topicId)));
  count(topicId: TopicId): number { return this.catalog.filter(phrase => phrase.topicId === topicId).length; }
  content(phrase: CatalogPhrase, field: 'natural' | 'structural' | 'explanation'): string {
    return this.i18n.t('phraseIslands.content.' + phrase.id + '.' + field);
  }
  licenseUrl(): string { return new URL('audio/phrase-islands/v1/PROVENANCE.md', document.baseURI).href; }
  readonly modes = [
    { id: 'listen', icon: 'M3 14v-3a9 9 0 0 1 18 0v3M3 12h4v8H3ZM17 12h4v8h-4' },
    { id: 'shadowing', icon: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3ZM5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8' },
    { id: 'recall', icon: 'M9 18h6M9 21h6M8 15a7 7 0 1 1 8 0c-1 1-1 2-1 3H9c0-1 0-2-1-3Z' },
  ] as const;
  readonly selected = signal<ReadonlySet<TopicId>>(new Set());

  constructor() {
    this.i18n.useStudyCopy(copy);
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => {
      const valid = (params.get('topics') ?? '').split(',').filter((id): id is TopicId => TOPICS.some(topic => topic.id === id));
      this.selected.set(new Set(valid));
    });
    effect(() => {
      const currentId = this.audio.currentId();
      if (currentId && !this.phrases().some(phrase => phrase.id === currentId)) this.audio.stop();
    });
  }

  startMode(mode: string): void { if (this.selected().size) void this.router.navigate(['/anki/islands', mode], {queryParams: this.query()}); }

  toggleTopic(id: TopicId): void {
    this.selected.update(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    void this.router.navigate([], {relativeTo: this.route, queryParams: this.query()});
  }
}

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';
import { PageHeader } from '../../shared/components/page-header/page-header';
import * as copy from '../../../assets/i18n/phrase-islands.generated';

// Presentation examples only. These IDs are not persisted study/content identifiers.
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
  imports: [PageHeader],
  templateUrl: './phrase-islands.page.html',
  styleUrl: './phrase-islands.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhraseIslandsPage {
  readonly i18n = inject(TranslationService);
  readonly topics = TOPICS;
  readonly modes = [
    { id: 'listen', icon: 'M3 14v-3a9 9 0 0 1 18 0v3M3 12h4v8H3ZM17 12h4v8h-4' },
    { id: 'shadowing', icon: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3ZM5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8' },
    { id: 'recall', icon: 'M9 18h6M9 21h6M8 15a7 7 0 1 1 8 0c-1 1-1 2-1 3H9c0-1 0-2-1-3Z' },
  ] as const;
  readonly selected = signal<ReadonlySet<TopicId>>(new Set());

  constructor() { this.i18n.useStudyCopy(copy); }

  toggleTopic(id: TopicId): void {
    this.selected.update(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
}

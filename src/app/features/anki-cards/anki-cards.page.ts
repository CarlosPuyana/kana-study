import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { JapaneseWordDeckEntry } from '../../core/models/japanese-word-deck-entry.model';
import { deckContentLanguage } from '../../core/services/deck-content-language';
import { TranslationService } from '../../core/services/translation.service';
import { JAPANESE_1500_ENTRIES } from '../../data/japanese-1500.generated';
import { findStudyDeck } from '../../data/study-decks';
import { FuriganaText } from '../../shared/components/furigana-text/furigana-text';
import { DeckSentenceText } from './components/deck-sentence-text/deck-sentence-text';

@Component({
  selector: 'app-anki-cards-page',
  imports: [RouterLink, FuriganaText, DeckSentenceText],
  templateUrl: './anki-cards.page.html',
  styleUrl: './anki-cards.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closeOverlay()' },
})
export class AnkiCardsPage {
  private readonly route = inject(ActivatedRoute);
  readonly i18n = inject(TranslationService);
  readonly deck = findStudyDeck(this.route.snapshot.paramMap.get('deckId'));
  readonly query = signal('');
  readonly visibleLimit = signal(120);
  readonly selected = signal<JapaneseWordDeckEntry | null>(null);
  readonly cards = computed(() => JAPANESE_1500_ENTRIES.filter(entry =>
    japaneseDeckEntryMatchesQuery(entry, this.query()),
  ));
  readonly visibleCards = computed(() => this.cards().slice(0, this.visibleLimit()));
  readonly hasMore = computed(() => this.visibleLimit() < this.cards().length);

  updateQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.visibleLimit.set(120);
  }

  showMore(): void {
    this.visibleLimit.update(limit => limit + 120);
  }

  closeOverlay(): void {
    this.selected.set(null);
  }

  meaning(entry: JapaneseWordDeckEntry): string {
    return entry.meaning[deckContentLanguage(this.i18n.language())];
  }

  sentenceMeaning(entry: JapaneseWordDeckEntry): string {
    return entry.sentenceMeaning[deckContentLanguage(this.i18n.language())];
  }

  note(entry: JapaneseWordDeckEntry): string | null {
    return entry.notes[deckContentLanguage(this.i18n.language())] ?? null;
  }
}

export function japaneseDeckEntryMatchesQuery(entry: JapaneseWordDeckEntry, query: string): boolean {
  const normalized = normalizeDeckSearch(query);
  if (!normalized) return true;
  if (/^#\d+$/.test(normalized)) return entry.order === Number(normalized.slice(1));
  const sentence = entry.sentenceSegments.map(segment => segment.text).join('');
  return [
    entry.word,
    entry.reading,
    entry.meaning.es,
    entry.meaning.en,
    sentence,
    entry.sentenceMeaning.es,
    entry.sentenceMeaning.en,
  ].some(value => normalizeDeckSearch(value).includes(normalized));
}

function normalizeDeckSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

import { ChangeDetectionStrategy, Component, computed, effect, inject, untracked, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { JapaneseWordDeckEntry } from '../../core/models/japanese-word-deck-entry.model';
import { deckContentLanguage } from '../../core/services/deck-content-language';
import { TranslationService } from '../../core/services/translation.service';
import { BUILTIN_DECK_CONTENT } from '../../core/services/builtin-deck-content';
import { createDeckRouteResource, entryMeaning } from '../../core/services/deck-route-resource';
import { isCustomEntry, DeckStudyEntryView } from '../../core/models/deck-catalog.model';
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
  readonly i18n = inject(TranslationService);
  readonly resource = createDeckRouteResource(BUILTIN_DECK_CONTENT);
  get deck() { return this.resource.deck; }
  readonly isCustom = isCustomEntry;
  title(): string { return this.resource.title(this.i18n); }
  readonly query = signal('');
  readonly visibleLimit = signal(120);
  readonly selected = signal<DeckStudyEntryView | null>(null);
  readonly cards = computed(() => (this.resource.content?.entries() ?? []).filter(entry =>
    isCustomEntry(entry) ? [entry.word,entry.reading,...entry.glosses.map(g=>g.text),entry.context?.text ?? ''].some(v=>normalizeDeckSearch(v).includes(normalizeDeckSearch(this.query()))) : japaneseDeckEntryMatchesQuery(entry, this.query()),
  ));
  readonly visibleCards = computed(() => this.cards().slice(0, this.visibleLimit()));
  readonly hasMore = computed(() => this.visibleLimit() < this.cards().length);

  constructor(){
    let state=this.resource.state(),owner=this.resource.catalog.owner();
    effect(()=>{
      const nextState=this.resource.state(),nextOwner=this.resource.catalog.owner();
      if(state!==nextState||owner!==nextOwner)untracked(()=>this.selected.set(null));
      state=nextState;owner=nextOwner;
    });
  }

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

  meaning(entry: DeckStudyEntryView): string {
    return entryMeaning(entry, this.i18n.language());
  }

  sentenceMeaning(entry: DeckStudyEntryView): string {
    return isCustomEntry(entry) ? '' : entry.sentenceMeaning[deckContentLanguage(this.i18n.language())];
  }

  note(entry: DeckStudyEntryView): string | null {
    return isCustomEntry(entry) ? null : entry.notes[deckContentLanguage(this.i18n.language())] ?? null;
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

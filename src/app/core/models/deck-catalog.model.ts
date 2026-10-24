import { DeckSettings, StudyDeck } from './deck.model';
import { DeckEntryIndexItem, DeckCardProgress, DeckDailyState, DeckReviewEvent } from './deck-study.model';
import { JapaneseWordDeckEntry } from './japanese-word-deck-entry.model';
export type DeckDisplayName = {
    readonly kind: 'i18n';
    readonly key: string;
} | {
    readonly kind: 'literal';
    readonly text: string;
};
/** Scheduling metadata contains neither editorial content nor an FSRS snapshot. */
export type DeckDefinition = Pick<StudyDeck, 'id' | 'cardCount' | 'contentType' | 'settings'>;
export interface CatalogDeck extends DeckDefinition {
    readonly kind: 'builtin' | 'custom';
    readonly displayName: DeckDisplayName;
}
export interface LexicalAnchor {
    readonly authority: 'jmdict' | 'kana-study-curated';
    readonly entryId: string;
    readonly canonicalReading: string;
    readonly homographGroup: string;
}
export interface LexicalIdentity {
    readonly schemaVersion: 1;
    readonly key: string;
    readonly anchor: LexicalAnchor;
    readonly spellings: readonly string[];
    readonly evidenceVersion: string;
}
export interface DeckGloss {
    readonly text: string;
    readonly language: 'es' | 'en' | 'ca';
    readonly source: {
        readonly kind: 'curated' | 'dictionary' | 'user';
        readonly sourceId: string;
        readonly revision: string;
    };
}
export interface CustomDeck {
    readonly schemaVersion: 1;
    readonly id: string;
    readonly title: string;
    readonly contentType: 'japanese-word';
    readonly settings: DeckSettings;
    readonly status: 'active' | 'archived';
    readonly createdAt: string;
    readonly updatedAt: string;
}
export interface CustomDeckCard {
    readonly schemaVersion: 1;
    readonly id: string;
    readonly deckId: string;
    readonly lexicalIdentity: LexicalIdentity;
    readonly direction: 'japanese-to-meaning';
    readonly word: string;
    readonly reading: string;
    readonly glosses: readonly DeckGloss[];
    readonly context?: {
        readonly text: string;
        readonly sourceTitle?: string;
        readonly pageNumber?: number;
    };
    readonly order: number;
    readonly contentVersion: number;
    readonly createdAt: string;
    readonly updatedAt: string;
}
export interface CustomDeckEntryView {
    readonly kind: 'custom';
    readonly id: string;
    readonly order: number;
    readonly word: string;
    readonly reading: string;
    readonly glosses: readonly DeckGloss[];
    readonly context?: CustomDeckCard['context'];
}
export type DeckStudyEntryView = JapaneseWordDeckEntry | CustomDeckEntryView;
export function isCustomEntry(entry: DeckStudyEntryView): entry is CustomDeckEntryView { return 'kind' in entry && entry.kind === 'custom'; }
export interface DeckContentProvider {
    readonly kind: 'builtin' | 'custom';
    readonly deckId: string;
    readonly index: readonly DeckEntryIndexItem[];
    entries(): readonly DeckStudyEntryView[];
    entry(id: string): DeckStudyEntryView | null;
}
export type DeckLoadState<T> = {
    readonly status: 'loading';
} | {
    readonly status: 'missing';
} | {
    readonly status: 'error';
    readonly error: unknown;
} | {
    readonly status: 'ready';
    readonly value: T;
};
export interface LoadedDeck {
    readonly deck: CatalogDeck;
    readonly content: DeckContentProvider;
}
export interface CustomCatalogOperation {
    readonly schemaVersion: 1;
    readonly id: string;
    readonly workspace: string;
    readonly kind: 'create' | 'edit-card' | 'settings' | 'review' | 'undo' | 'daily' | 'manga-confirmation' | 'delete' | 'restore' | 'archive';
    readonly entityId: string;
    readonly createdAt: string;
    readonly localRevision: number;
    readonly state: 'committed';
    readonly request: string;
    readonly payload: unknown;
    readonly context?: {
        readonly deck?: CustomDeck;
        readonly card?: CustomDeckCard;
        readonly beforeHead: string | null;
        readonly before: DeckCardProgress['card'] | null;
        readonly daily?: DeckDailyState;
    };
}
/** Bound to a captured workspace for the entire asynchronous scheduling operation. */
export interface DeckPersistence {
    readonly workspace: string;
    getDeckProgress(deckId: string): Promise<DeckCardProgress[]>;
    getDeckReviewEvents(deckId: string): Promise<DeckReviewEvent[]>;
    getDailyState(deckId: string, day: string): Promise<DeckDailyState | null>;
    writeDailyState(state: DeckDailyState): Promise<void>;
    commitReview(progress: DeckCardProgress, event: DeckReviewEvent, daily: DeckDailyState): Promise<void>;
    undoReview(event: DeckReviewEvent, daily: DeckDailyState): Promise<void>;
    assertOwner(): void;
}

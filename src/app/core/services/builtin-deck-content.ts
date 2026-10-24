import { JAPANESE_1500_ENTRIES } from '../../data/japanese-1500.generated';
import { JAPANESE_1500_INDEX } from '../../data/japanese-1500.index.generated';
import { DeckContentProvider } from '../models/deck-catalog.model';
const byId = new Map(JAPANESE_1500_ENTRIES.map(e => [e.id, e]));
/** Original editorial objects, identifiers, media and index; no projection or migration. */
export const BUILTIN_DECK_CONTENT: DeckContentProvider = { kind: 'builtin', deckId: 'japanese-1500', index: JAPANESE_1500_INDEX, entries: () => JAPANESE_1500_ENTRIES, entry: id => byId.get(id) ?? null };

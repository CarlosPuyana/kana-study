// Test fixtures only; never imported by the application.
import { CustomDeck, CustomDeckCard } from '../models/deck-catalog.model';
import { lexicalIdentity } from './custom-deck-validation';
const NOW = new Date('2026-10-21T12:00:00.000Z');
export const customDeck = (deckId = 'md-試験'): CustomDeck => ({ schemaVersion: 1, id: deckId, title: 'anki.title <研究> "\\', contentType: 'japanese-word', settings: { desiredRetention: .9, newCardsPerDay: 10, newCardOrder: 'mixed' }, status: 'active', createdAt: NOW.toISOString(), updatedAt: NOW.toISOString() });
export async function customCard(deckId = 'md-試験', cardId = 'card-猫'): Promise<CustomDeckCard> { return { schemaVersion: 1, id: cardId, deckId, lexicalIdentity: await lexicalIdentity({ authority: 'jmdict', entryId: '1467640', canonicalReading: 'ねこ', homographGroup: 'noun' }, ['猫'], 'fixture-1'), direction: 'japanese-to-meaning', word: '猫', reading: 'ねこ', glosses: [{ text: 'gato <script> "\\', language: 'es', source: { kind: 'curated', sourceId: 'fixture', revision: '1' } }], context: { text: '猫がいる。', sourceTitle: '原文' }, order: 1, contentVersion: 1, createdAt: NOW.toISOString(), updatedAt: NOW.toISOString() }; }

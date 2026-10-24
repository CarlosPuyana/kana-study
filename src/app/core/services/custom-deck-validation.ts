import { CustomDeck, CustomDeckCard, LexicalAnchor, LexicalIdentity } from '../models/deck-catalog.model';
import { DeckSettings } from '../models/deck.model';
import { DeckCardProgress, DeckDailyState, DeckReviewEvent, SerializedFsrsCard } from '../models/deck-study.model';
export class CustomDeckError extends Error {
}
const utf8 = new TextEncoder();
export function canonical(value: unknown): string { if (Array.isArray(value))
    return '[' + value.map(canonical).join(',') + ']'; if (value && typeof value === 'object')
    return '{' + Object.keys(value).filter(k => (value as Record<string, unknown>)[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + canonical((value as Record<string, unknown>)[k])).join(',') + '}'; return JSON.stringify(value); }
export async function digest(prefix: string, value: unknown): Promise<string> { const bytes = await crypto.subtle.digest('SHA-256', utf8.encode(canonical(value))); return prefix + Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2, '0')).join(''); }
export function text(value: unknown, maxBytes: number): value is string { return typeof value === 'string' && !!value.trim() && utf8.encode(value).length <= maxBytes && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value) && !/[\uD800-\uDFFF]/u.test(value); }
export function id(value: unknown): value is string { return text(value, 256); }
export function settingsValid(s: DeckSettings): boolean { return !!s && Number.isFinite(s.desiredRetention) && s.desiredRetention > 0 && s.desiredRetention < 1 && Number.isSafeInteger(s.newCardsPerDay) && s.newCardsPerDay >= 0 && s.newCardsPerDay <= 10000 && ['mixed', 'before-reviews', 'after-reviews'].includes(s.newCardOrder); }
const date = (s: unknown) => typeof s === 'string' && Number.isFinite(Date.parse(s)) && new Date(s).toISOString() === s;
function need(value: unknown): asserts value { if (!value)
    throw new CustomDeckError('Invalid custom deck data'); }
export function validateDeck(v: CustomDeck): CustomDeck { need(v && v.schemaVersion === 1 && id(v.id) && v.id.startsWith('md-') && text(v.title, 640) && v.title.length <= 160 && v.contentType === 'japanese-word' && settingsValid(v.settings) && ['active', 'archived'].includes(v.status) && date(v.createdAt) && date(v.updatedAt)); return { schemaVersion: 1, id: v.id, title: v.title, contentType: v.contentType, settings: { desiredRetention: v.settings.desiredRetention, newCardsPerDay: v.settings.newCardsPerDay, newCardOrder: v.settings.newCardOrder }, status: v.status, createdAt: v.createdAt, updatedAt: v.updatedAt }; }
function anchorValid(a: LexicalAnchor): boolean { return !!a && ['jmdict', 'kana-study-curated'].includes(a.authority) && text(a.entryId, 256) && (a.authority !== 'jmdict' || /^\d+$/u.test(a.entryId)) && text(a.canonicalReading, 1024) && a.canonicalReading === a.canonicalReading.normalize('NFC') && text(a.homographGroup, 256); }
export async function lexicalIdentity(anchor: LexicalAnchor, spellings: readonly string[], evidenceVersion: string): Promise<LexicalIdentity> { need(anchorValid(anchor)); const a = { authority: anchor.authority, entryId: anchor.entryId, canonicalReading: anchor.canonicalReading, homographGroup: anchor.homographGroup }; return { schemaVersion: 1, key: await digest('lex1-', a), anchor: a, spellings: [...spellings], evidenceVersion }; }
export async function validateCard(v: CustomDeckCard): Promise<CustomDeckCard> {
    need(v && v.schemaVersion === 1 && id(v.id) && id(v.deckId) && v.deckId.startsWith('md-') && v.direction === 'japanese-to-meaning' && text(v.word, 1024) && v.word.length <= 256 && text(v.reading, 1024) && v.reading.length <= 256 && Number.isSafeInteger(v.order) && v.order >= 0 && Number.isSafeInteger(v.contentVersion) && v.contentVersion >= 1 && date(v.createdAt) && date(v.updatedAt));
    const l = v.lexicalIdentity;
    need(l && l.schemaVersion === 1 && anchorValid(l.anchor) && Array.isArray(l.spellings) && l.spellings.length > 0 && l.spellings.length <= 32 && l.spellings.every(s => text(s, 1024)) && l.spellings.includes(v.word) && v.reading.normalize('NFC') === l.anchor.canonicalReading && text(l.evidenceVersion, 256));
    const identity = await lexicalIdentity(l.anchor, l.spellings, l.evidenceVersion);
    need(l.key === identity.key);
    need(Array.isArray(v.glosses) && v.glosses.length > 0 && v.glosses.length <= 3 && new Set(v.glosses.map(g => g.language)).size === v.glosses.length);
    const glosses = v.glosses.map(g => { need(g && ['es', 'en', 'ca'].includes(g.language) && text(g.text, 8000) && g.text.length <= 2000 && g.source && ['curated', 'dictionary', 'user'].includes(g.source.kind) && text(g.source.sourceId, 256) && text(g.source.revision, 256)); return { text: g.text, language: g.language, source: { kind: g.source.kind, sourceId: g.source.sourceId, revision: g.source.revision } }; });
    let context: CustomDeckCard['context'];
    if (v.context !== undefined) {
        need(text(v.context.text, 4800) && v.context.text.length <= 1200 && (v.context.sourceTitle === undefined || text(v.context.sourceTitle, 640)) && (v.context.pageNumber === undefined || Number.isSafeInteger(v.context.pageNumber) && v.context.pageNumber > 0));
        context = { text: v.context.text, ...(v.context.sourceTitle ? { sourceTitle: v.context.sourceTitle } : {}), ...(v.context.pageNumber ? { pageNumber: v.context.pageNumber } : {}) };
    }
    const card: CustomDeckCard = { schemaVersion: 1, id: v.id, deckId: v.deckId, lexicalIdentity: identity, direction: v.direction, word: v.word, reading: v.reading, glosses, ...(context ? { context } : {}), order: v.order, contentVersion: v.contentVersion, createdAt: v.createdAt, updatedAt: v.updatedAt };
    need(utf8.encode(JSON.stringify(card)).length <= 32768);
    return card;
}
const finite = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0;
const integer = (n: unknown) => finite(n) && Number.isSafeInteger(n);
export function fsrsValid(c: SerializedFsrsCard): boolean { return !!c && [c.due, c.stability, c.difficulty, c.elapsedDays, c.scheduledDays].every(finite) && c.difficulty <= 10 && [c.learningSteps, c.reps, c.lapses].every(integer) && [0, 1, 2, 3].includes(c.state) && (c.lastReview === null || finite(c.lastReview)); }
export function progressValid(p: DeckCardProgress): boolean { return !!p && id(p.deckId) && id(p.entryId) && fsrsValid(p.card) && p.state === p.card.state && p.due === p.card.due; }
export function dailyValid(d: DeckDailyState): boolean { return !!d && id(d.deckId) && /^\d{4}-\d{2}-\d{2}$/u.test(d.localDate) && Number.isFinite(Date.parse(d.localDate + 'T00:00:00Z')) && new Date(d.localDate + 'T00:00:00Z').toISOString().slice(0, 10) === d.localDate && Array.isArray(d.introducedEntryIds) && d.introducedEntryIds.every(id) && new Set(d.introducedEntryIds).size === d.introducedEntryIds.length && (d.newLimitOverride === null || integer(d.newLimitOverride)) && (d.completedAt == null || finite(d.completedAt)); }
export function eventValid(e: DeckReviewEvent): boolean { return !!e && id(e.id) && id(e.deckId) && id(e.entryId) && finite(e.reviewedAt) && ['again', 'good'].includes(e.rating) && e.fsrsRating === (e.rating === 'again' ? 1 : 3) && [e.dueBefore, e.dueAfter, e.stabilityBefore, e.stabilityAfter, e.difficultyBefore, e.difficultyAfter, e.elapsedAnswerMs, e.desiredRetention].every(finite) && e.elapsedAnswerMs <= 10000 && e.desiredRetention > 0 && e.desiredRetention < 1 && [0, 1, 2, 3].includes(e.stateBefore) && [0, 1, 2, 3].includes(e.stateAfter) && (e.cardBefore === null || fsrsValid(e.cardBefore)) && (e.retrievabilityBefore === null || finite(e.retrievabilityBefore) && e.retrievabilityBefore <= 1) && !!e.fsrsLog && [e.fsrsLog.rating, e.fsrsLog.state, e.fsrsLog.due, e.fsrsLog.stability, e.fsrsLog.difficulty, e.fsrsLog.elapsedDays, e.fsrsLog.lastElapsedDays, e.fsrsLog.scheduledDays, e.fsrsLog.learningSteps, e.fsrsLog.review].every(finite) && e.fsrsLog.rating === e.fsrsRating; }
export function requireValid(value: unknown): asserts value { need(value); }

import { MangaCardConfirmation, MangaCardSource, MangaConfirmedCardOperation, MangaCuratedEntity, MangaDictionaryProposal } from '../models/manga-deck-confirmation.model';
import { DictionaryTerm } from '../models/dictionary.model';
import { canonical, digest, lexicalIdentity, requireValid, text, validateCard, validateDeck } from './custom-deck-validation';

export const MANGA_CURATED_POLICY = 'manga-user-entity-v1';
export const mangaVolumeDeckId = (volumeId: string) => digest('md-', ['manga-assisted-v1', volumeId]);
export const mangaSourceReference = (source: MangaCardSource) => digest('ocr-', {
  volumeId: source.volumeId, page: source.pageNumber, block: source.blockIndex,
  line: source.lineIndex, range: source.range, fragment: source.fragment, surface: source.surface,
});
export const mangaEntityId = (registryNamespace: string, originReference: string, word: string, reading: string, branch: string) =>
  digest('mce-', { registryNamespace, originReference, word, reading, branch, policy: MANGA_CURATED_POLICY });

export function validateMangaCardSource(s: MangaCardSource): void {
  requireValid(s && text(s.volumeId, 4096) && text(s.volumeTitle, 640) &&
    Number.isSafeInteger(s.pageNumber) && s.pageNumber > 0 &&
    Number.isSafeInteger(s.blockIndex) && s.blockIndex >= 0 &&
    Number.isSafeInteger(s.lineIndex) && s.lineIndex >= 0 &&
    text(s.fragment, 4800) && s.fragment.length <= 1200 && text(s.surface, 1024) &&
    Array.isArray(s.range) && s.range.length === 2 && s.range.every(Number.isSafeInteger) &&
    s.range[0] >= 0 && s.range[1] > s.range[0] && s.range[1] <= s.fragment.length &&
    s.fragment.slice(s.range[0], s.range[1]) === s.surface &&
    (s.savedItemId === undefined || text(s.savedItemId, 20000)));
}

export function dictionaryProposal(t: DictionaryTerm): MangaDictionaryProposal {
  const p: MangaDictionaryProposal = { localId: t.id, dictionaryId: t.dictionaryId,
    expression: t.expression, reading: t.reading, sequence: t.sequence,
    glosses: t.glossaries.slice(0, 4), glossLanguage: 'es', totalGlosses: t.glossaries.length };
  validateProposal(p); return p;
}
function validateProposal(p: MangaDictionaryProposal): void {
  requireValid(p && text(p.localId, 4096) && text(p.dictionaryId, 256) &&
    text(p.expression, 1024) && text(p.reading, 1024) && Number.isSafeInteger(p.sequence) &&
    p.glossLanguage === 'es' && Array.isArray(p.glosses) && p.glosses.length <= 4 &&
    p.glosses.every(g => text(g, 8000) && g.length <= 2000) && Number.isSafeInteger(p.totalGlosses) && p.totalGlosses >= p.glosses.length);
}

export async function validateCuratedEntity(e: MangaCuratedEntity): Promise<void> {
  requireValid(e && e.schemaVersion === 1 && e.origin === 'explicit-user-confirmation' && e.expertCertified === false &&
    text(e.word, 1024) && e.word.length <= 256 && /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(e.word) &&
    text(e.reading, 1024) && e.reading.length <= 256 && e.reading === e.reading.normalize('NFC') &&
    /^ocr-[a-f0-9]{64}$/u.test(e.originReference) && text(e.branch, 128) &&
    /^[a-f0-9-]{36}$/u.test(e.registryNamespace));
  requireValid(e.id === await mangaEntityId(e.registryNamespace, e.originReference, e.word, e.reading, e.branch));
  const identity = await lexicalIdentity({ authority: 'kana-study-curated', entryId: e.id,
    canonicalReading: e.reading, homographGroup: MANGA_CURATED_POLICY }, [e.word], MANGA_CURATED_POLICY);
  requireValid(canonical(identity) === canonical(e.identity));
}

export async function validateMangaConfirmation(c: MangaCardConfirmation): Promise<void> {
  requireValid(c && c.schemaVersion === 1 && text(c.id, 256) && c.expertCertified === false &&
    (c.workspace === 'guest' || c.workspace.startsWith('user:')) && c.actor?.kind === 'local-workspace-user' &&
    c.actor.workspace === c.workspace && Number.isFinite(Date.parse(c.confirmedAt)) && new Date(c.confirmedAt).toISOString() === c.confirmedAt &&
    text(c.confirmedMeaning, 8000) && c.confirmedMeaning.length <= 2000 && ['es', 'en', 'ca'].includes(c.meaningLanguage) &&
    typeof c.reusedEntity === 'boolean' && Array.isArray(c.alternatives) && c.alternatives.length <= 16 &&
    Number.isSafeInteger(c.totalAlternatives) && c.totalAlternatives >= c.alternatives.length);
  validateMangaCardSource(c.source); await validateCuratedEntity(c.entity);
  c.alternatives.forEach(validateProposal); if (c.selectedProposal) validateProposal(c.selectedProposal);
  if (!c.reusedEntity) requireValid(c.entity.originReference === await mangaSourceReference(c.source));
  requireValid(new TextEncoder().encode(canonical(c)).length <= 262144);
}

export async function validateMangaConfirmedOperation(p: MangaConfirmedCardOperation): Promise<void> {
  requireValid(p?.schemaVersion === 1);
  validateDeck(p.deck); await validateCard(p.card); await validateMangaConfirmation(p.confirmation);
  const c = p.confirmation;
  requireValid(p.deck.id === await mangaVolumeDeckId(c.source.volumeId) && p.card.deckId === p.deck.id &&
    p.card.id === await digest('mc-', [p.deck.id, c.entity.identity.key, 'japanese-to-meaning']) &&
    canonical(p.card.lexicalIdentity) === canonical(c.entity.identity) && p.card.word === c.entity.word && p.card.reading === c.entity.reading &&
    p.card.glosses.length === 1 && p.card.glosses[0].language === c.meaningLanguage && p.card.glosses[0].text === c.confirmedMeaning &&
    canonical(p.card.glosses[0].source) === canonical({kind:'user', sourceId:c.id, revision:'receipt-v1'}) &&
    canonical(p.card.context) === canonical({text:c.source.fragment, sourceTitle:c.source.volumeTitle, pageNumber:c.source.pageNumber}) &&
    (p.expectedContentVersion === null ? p.card.contentVersion === 1 :
      Number.isSafeInteger(p.expectedContentVersion) && p.expectedContentVersion >= 1 && p.card.contentVersion === p.expectedContentVersion + 1));
}

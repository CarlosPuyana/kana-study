import {CustomDeckAccess} from './custom-deck-access';
import { inject, Injectable } from '@angular/core';
import { LocalWorkspaceId } from '../models/account.model';
import { DictionaryLookup, OcrLookupPoint } from '../models/dictionary.model';
import { MangaCardSource, MangaConfirmedCardOperation, MangaCuratedEntity, MangaDictionaryProposal } from '../models/manga-deck-confirmation.model';
import { CUSTOM_DECKS_ENABLED, CustomDeckRepository } from './custom-deck.repository';
import { WorkspaceService } from './workspace.service';
import { MANGA_DECK_ASSISTED_ENABLED } from './manga-deck-gate';
import { digest, lexicalIdentity, requireValid, text } from './custom-deck-validation';
import { dictionaryProposal, mangaEntityId, mangaSourceReference, mangaVolumeDeckId, MANGA_CURATED_POLICY, validateMangaCardSource, validateMangaConfirmedOperation } from './manga-deck-confirmation';

export interface MangaCardDraft {
  readonly owner: LocalWorkspaceId;
  readonly activationRevision: number;
  readonly source: MangaCardSource;
  readonly proposals: readonly MangaDictionaryProposal[];
  readonly totalAlternatives: number;
  readonly entities: readonly MangaCuratedEntity[];
  readonly entityDescriptions: Readonly<Record<string,string>>;
}
export interface MangaCardEdits {
  readonly word: string;
  readonly reading: string;
  readonly meaning: string;
  readonly language: 'es' | 'en' | 'ca';
  readonly proposalIndex: number | null;
  readonly reuseEntityId: string | null;
  readonly newIdentity: boolean;
  readonly reviewed: boolean;
}

@Injectable({providedIn:'root'})
export class MangaDeckAssistedService {
  private readonly access=inject(CustomDeckAccess);
  private readonly workspace = inject(WorkspaceService);
  private readonly repository = inject(CustomDeckRepository);
  private readonly customEnabled = inject(CUSTOM_DECKS_ENABLED);
  readonly enabled = inject(MANGA_DECK_ASSISTED_ENABLED);
  private guard(owner: LocalWorkspaceId, epoch: number): void {
    requireValid(this.access.permitted()&&this.enabled() && this.customEnabled() && this.workspace.active() === owner && this.workspace.activationRevision() === epoch);
  }
  async open(volumeId: string, volumeTitle: string, pageNumber: number, point: OcrLookupPoint,
    result: DictionaryLookup, savedItemId?: string): Promise<MangaCardDraft> {
    const owner = this.workspace.active(), epoch = this.workspace.activationRevision(); this.guard(owner, epoch);
    requireValid(point.blockIndex !== undefined && point.lineIndex !== undefined &&
      (point.endBlockIndex === undefined || point.endBlockIndex === point.blockIndex));
    let start = point.startOffset ?? point.offset, end = point.endOffset;
    if (point.mode !== 'selection') {
      const surface = result.surface || result.query;
      const found = surface ? point.text.indexOf(surface, Math.max(0, point.offset - surface.length + 1)) : -1;
      if (found >= 0 && point.offset >= found && point.offset < found + surface.length) { start = found; end = found + surface.length; }
      else end = start + String.fromCodePoint(point.text.codePointAt(start) ?? 0).length;
    }
    requireValid(end !== undefined);
    const source: MangaCardSource = {volumeId, volumeTitle, pageNumber, blockIndex:point.blockIndex,
      lineIndex:point.lineIndex, range:[start,end], fragment:point.text, surface:point.text.slice(start,end),
      ...(savedItemId ? {savedItemId} : {})};
    validateMangaCardSource(source);
    if (point.mode === 'selection') requireValid(source.surface.trim() === point.selectedText?.trim());
    const history = await this.repository.mangaConfirmations(owner); this.guard(owner, epoch);
    const proposals: MangaDictionaryProposal[] = [];
    // Unsupported oversized proposals do not become silently truncated evidence.
    for (const term of result.terms.slice(0, 16)) {
      try { proposals.push(dictionaryProposal(term)); } catch { /* Manual correction remains available. */ }
    }
    return {owner, activationRevision:epoch, source, proposals, totalAlternatives:result.terms.length,
      entities:[...new Map(history.map(c => [c.entity.id, c.entity])).values()],
      entityDescriptions:Object.fromEntries(history.map(c => [c.entity.id,
        `${c.confirmedMeaning} (${c.meaningLanguage.toUpperCase()}) · ${c.source.volumeTitle}`]))};
  }
  async preview(draft: MangaCardDraft, edit: MangaCardEdits): Promise<MangaConfirmedCardOperation> {
    const guard=()=>this.guard(draft.owner,draft.activationRevision);
    guard(); validateMangaCardSource(draft.source);
    requireValid(edit.reviewed && text(edit.word, 1024) && text(edit.reading, 1024) && text(edit.meaning, 8000) &&
      ['es','en','ca'].includes(edit.language) && !(edit.reuseEntityId && edit.newIdentity));
    const history = await this.repository.mangaConfirmations(draft.owner); guard();
    const word = edit.word.trim().normalize('NFC'), reading = edit.reading.trim().normalize('NFC');
    const originReference = await mangaSourceReference(draft.source);
    const localNamespace=await this.repository.localRegistryNamespace(draft.owner);guard();
    const registryNamespace = localNamespace ?? history[0]?.entity.registryNamespace ?? crypto.randomUUID();
    let entity: MangaCuratedEntity;
    if (edit.reuseEntityId) {
      const registered = history.find(c => c.entity.id === edit.reuseEntityId)?.entity;
      requireValid(registered && registered.word === word && registered.reading === reading);
      entity = registered;
    } else {
      const branch = edit.newIdentity ? crypto.randomUUID() : 'initial';
      const id = await mangaEntityId(registryNamespace, originReference, word, reading, branch);
      const identity = await lexicalIdentity({authority:'kana-study-curated', entryId:id,
        canonicalReading:reading, homographGroup:MANGA_CURATED_POLICY}, [word], MANGA_CURATED_POLICY);
      entity = {schemaVersion:1,id,identity,word,reading,origin:'explicit-user-confirmation',
        expertCertified:false,originReference,branch,registryNamespace};
    }
    const deckId = await mangaVolumeDeckId(draft.source.volumeId);
    const cardId = await digest('mc-', [deckId, entity.identity.key, 'japanese-to-meaning']);
    const cards = await this.repository.content(deckId, draft.owner); guard();
    const previous = cards.find(c => c.id === cardId);
    const timestamp = new Date().toISOString(), confirmationId = crypto.randomUUID();
    const selectedProposal = edit.proposalIndex === null ? null : draft.proposals[edit.proposalIndex];
    requireValid(selectedProposal !== undefined);
    const confirmation = {schemaVersion:1 as const, id:confirmationId, workspace:draft.owner,
      actor:{kind:'local-workspace-user' as const,workspace:draft.owner}, confirmedAt:timestamp,
      source:structuredClone(draft.source), entity, selectedProposal,
      alternatives:draft.proposals, totalAlternatives:draft.totalAlternatives,
      confirmedMeaning:edit.meaning.trim(), meaningLanguage:edit.language,
      reusedEntity:!!edit.reuseEntityId, expertCertified:false as const};
    const operation: MangaConfirmedCardOperation = {schemaVersion:1, expectedContentVersion:previous?.contentVersion ?? null,
      deck:{schemaVersion:1,id:deckId,title:draft.source.volumeTitle,contentType:'japanese-word',
        settings:{desiredRetention:.9,newCardsPerDay:10,newCardOrder:'mixed'},status:'active',createdAt:timestamp,updatedAt:timestamp},
      card:{schemaVersion:1,id:cardId,deckId,lexicalIdentity:entity.identity,direction:'japanese-to-meaning',
        word,reading,glosses:[{text:confirmation.confirmedMeaning,language:edit.language,
          source:{kind:'user',sourceId:confirmationId,revision:'receipt-v1'}}],
        context:{text:draft.source.fragment,sourceTitle:draft.source.volumeTitle,pageNumber:draft.source.pageNumber},
        order:previous?.order ?? 0,contentVersion:(previous?.contentVersion ?? 0)+1,
        createdAt:previous?.createdAt ?? timestamp,updatedAt:timestamp}, confirmation};
    await validateMangaConfirmedOperation(operation); guard();
    return operation;
  }
  async confirm(preview: MangaConfirmedCardOperation, current:()=>void=()=>{}): Promise<string> {
    const owner = preview.confirmation.workspace,epoch=this.workspace.activationRevision();
    const guard=()=>{this.guard(owner,epoch);current();};guard();
    await this.repository.confirmMangaCard(preview, owner, guard); guard();
    return preview.deck.id;
  }
}

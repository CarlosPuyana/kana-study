import {CustomDeckAccess} from './custom-deck-access';
import { inject, Injectable } from '@angular/core';
import { CustomDeckRepository } from './custom-deck.repository';
import { WorkspaceService } from './workspace.service';
import { canonical, requireValid, validateCard, validateDeck } from './custom-deck-validation';
import { validateMangaConfirmedOperation } from './manga-deck-confirmation';
import { classifyLexicalCard } from './lexical-knowledge';
import { VolumeVocabulary, VolumeVocabularyEntry } from './manga-volume-vocabulary';

/** Local confirmed cards only. No dictionary, global lexical inventory, cloud or study writes. */
@Injectable({providedIn:'root'})
export class MangaVolumeVocabularyService {
  private readonly repository=inject(CustomDeckRepository);
  private readonly access=inject(CustomDeckAccess);
  private readonly workspace=inject(WorkspaceService);
  async load(volumeId:string):Promise<VolumeVocabulary> {
    const owner=this.workspace.active(),epoch=this.workspace.activationRevision();
    const guard=()=>requireValid(this.access.permitted()&&owner===this.workspace.active()&&epoch===this.workspace.activationRevision());
    const inventory=await this.repository.confirmedVocabularyInventory(owner);guard();
    const entries:VolumeVocabularyEntry[]=[];
    let incomplete=false;
    const links=inventory.links.filter(l=>l.value?.volumeId===volumeId);
    const receipts=inventory.confirmations.filter(r=>r.value?.confirmation?.source?.volumeId===volumeId);
    // Missing associations are explicit; never guess them from a title or a digest.
    if(receipts.some(r=>!links.some(l=>l.value.deckId===r.value.deck.id)))incomplete=true;
    for(const link of links) {
      try {
        requireValid(link.workspace===owner&&link.value.schemaVersion===1);
        const stored=inventory.decks.find(d=>d.value?.id===link.value.deckId);
        requireValid(stored&&stored.workspace===owner);
        const deck=validateDeck(stored.value);
        const cards=inventory.cards.filter(c=>c.value?.deckId===deck.id);
        requireValid(stored.count===cards.length);
        const valid=[];
        for(const receipt of receipts.filter(r=>r.value.deck.id===deck.id)) {
          try {
            const p=receipt.value;await validateMangaConfirmedOperation(p);guard();
            requireValid(receipt.workspace===owner&&
              (p.confirmation.workspace===owner||p.confirmation.workspace==='guest'&&receipt.binding?.destination===owner)&&
              inventory.identities.some(e=>e.workspace===owner&&canonical(e.value)===canonical(p.confirmation.entity)));
            valid.push(p);
          }catch{guard();incomplete=true;}
        }
        for(const row of cards) {
          try {
            const card=await validateCard(row.value);guard();requireValid(row.workspace===owner);
            const confirmations=valid.filter(p=>p.card.id===card.id&&
              canonical(p.card.lexicalIdentity)===canonical(card.lexicalIdentity)).map(p=>p.confirmation)
              .sort((a,b)=>a.source.pageNumber-b.source.pageNumber||a.confirmedAt.localeCompare(b.confirmedAt)||a.id.localeCompare(b.id));
            if(!confirmations.length){incomplete=true;continue;}
            const progress=inventory.progress.find(p=>p.value?.deckId===deck.id&&p.value.entryId===card.id);
            const events=inventory.events.filter(e=>e.value?.deckId===deck.id&&e.value.entryId===card.id&&e.canonical!==false&&!e.voidedBy);
            // A malformed row with no association cannot be safely attributed. Associated
            // corruption is validated per card by H3A, without poisoning other cards.
            const readable=(!progress||progress.workspace===owner)&&events.every(e=>e.workspace===owner)&&
              inventory.progress.every(p=>p.value===null||!!p.value.deckId&&!!p.value.entryId)&&
              inventory.events.every(e=>!!e.value?.deckId&&!!e.value.entryId);
            const classification=classifyLexicalCard({deckId:deck.id,cardId:card.id,identityKey:card.lexicalIdentity.key,
              archived:deck.status==='archived',progress:progress?.value??null,events:events.map(e=>e.value),readable});
            entries.push({card,deck,confirmations,classification});
          }catch{guard();incomplete=true;}
        }
      }catch{guard();incomplete=true;}
    }
    guard();return {entries,incomplete};
  }
}

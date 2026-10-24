import { computed, DestroyRef, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { LexicalCardEvidence, LexicalKnowledge, LexicalKnowledgeSnapshot, LexicalQuery, ProvenLexicalIdentity } from '../models/lexical-knowledge.model';
import { DeckCatalogService } from './deck-catalog.service';
import { DeckDatabaseService } from './deck-database.service';
import { CustomDeckRepository } from './custom-deck.repository';
import { WorkspaceService } from './workspace.service';
import { canonical, digest, eventValid, progressValid, requireValid } from './custom-deck-validation';
import { LexicalEvidenceService } from './lexical-evidence.service';
import { projectLexicalKnowledge } from './lexical-knowledge';

@Injectable({providedIn:'root'})
export class LexicalKnowledgeProjectionService {
  private readonly workspace = inject(WorkspaceService);
  private readonly catalog = inject(DeckCatalogService);
  private readonly builtin = inject(DeckDatabaseService);
  private readonly custom = inject(CustomDeckRepository);
  private readonly registry = inject(LexicalEvidenceService);
  private readonly refreshRevision = signal(0);
  readonly cacheKey = computed(() => canonical({owner:this.workspace.active(),workspace:this.workspace.dataRevision(),
    builtin:this.builtin.revision(),catalog:this.catalog.revision(),custom:this.custom.progressRevision(),
    manifest:this.registry.revision(),refresh:this.refreshRevision()}));
  private readonly value = signal<LexicalKnowledgeSnapshot|null>(null);
  readonly snapshot = computed(() => this.value()?.cacheKey === this.cacheKey() ? this.value() : null);
  readonly error = signal(false);
  private pending: {key:string;promise:Promise<LexicalKnowledgeSnapshot>}|null = null;
  private alive = true;
  constructor() {
    inject(DestroyRef).onDestroy(()=>{this.alive=false;this.value.set(null);});
    // No component/render loop, no OCR dependency. Instantiated only by an internal consumer.
    effect(()=>{this.cacheKey();untracked(()=>{void this.load().catch(()=>undefined);});});
  }
  /** External storage changes (e.g. another tab) must explicitly refresh until H4 has a revision feed. */
  invalidate(): void { this.refreshRevision.update(n=>n+1); }
  async load(): Promise<LexicalKnowledgeSnapshot> {
    const cached=this.snapshot(); if(cached)return cached;
    const key=this.cacheKey();
    if(this.pending?.key===key)return this.pending.promise;
    const promise=this.read(key);
    this.pending={key,promise};
    try{return await promise;}finally{if(this.pending?.promise===promise)this.pending=null;}
  }
  async query(query: LexicalQuery): Promise<LexicalKnowledge> {
    const snapshot=await this.load();
    requireValid(snapshot.cacheKey===this.cacheKey() && this.alive);
    const unlinked=(reason:string):LexicalKnowledge=>({state:'unlinked',identityKey:null,groupKey:null,
      identities:[],equivalenceIds:[],cards:[],inventoryComplete:snapshot.inventoryComplete,reasons:[reason]});
    if(query.kind==='proposal') return unlinked(query.possibleKeys?.length?'possible-equivalence-unproved':'no-verified-link');
    const result=snapshot.units.find(u=>u.identityKey===query.identity.key);
    if(!result || !result.identities.some(i=>canonical(i.identity)===canonical(query.identity)))return unlinked('identity-not-registered');
    return result;
  }
  private async read(key:string): Promise<LexicalKnowledgeSnapshot> {
    const owner=this.workspace.active();
    const guard=()=>requireValid(this.alive && owner===this.workspace.active() && key===this.cacheKey());
    try {
      const manifest=await this.registry.load(); guard();
      const inventory=await this.catalog.knowledgeInventory(owner); guard();
      const identities=new Map<string,ProvenLexicalIdentity>(manifest.identities.map(row=>[row.identity.key,{identity:row.identity,proof:{kind:'verified',evidence:row.evidence}}]));
      const cards:LexicalCardEvidence[]=[],issues:string[]=[];
      let unmappedCards=0;
      const receipts=await this.custom.mangaConfirmations(owner); guard();
      for(const c of receipts) {
        requireValid(c.workspace===owner);
        const prior=identities.get(c.entity.identity.key);
        if(prior)requireValid(canonical(prior.identity)===canonical(c.entity.identity));
        else identities.set(c.entity.identity.key,{identity:c.entity.identity,proof:{kind:'local-confirmation',
          workspace:owner,namespace:c.entity.registryNamespace,receiptId:c.id}});
      }
      for(const deck of [...inventory.builtin,...inventory.custom]) {
        guard();
        const builtin='kind' in deck;
        let content:readonly {id:string;identityKey:string|null}[]=[];
        try {
          if(builtin) {
            const loaded=await this.catalog.load(deck.id); guard();
            requireValid(loaded.status==='ready');
            content=await Promise.all(loaded.value.content.entries().map(async entry=>{
              const mapping=manifest.mappings.find(m=>m.deckId===deck.id&&m.entryId===entry.id&&!m.revoked);
              const mappedIdentity=mapping?identities.get(mapping.identityKey)?.identity:undefined;
              const valid=mapping && mappedIdentity?.spellings.includes(entry.word) &&
                mappedIdentity.anchor.canonicalReading===entry.reading.normalize('NFC') && mapping.contentDigest===await digest('entry-',entry);
              if(mapping&&!valid)issues.push(`mapping-content-mismatch:${deck.id}:${entry.id}`);
              return {id:entry.id,identityKey:valid?mapping.identityKey:null};
            }));
          } else {
            content=(await this.custom.content(deck.id,owner)).map(c=>{
              const identity=identities.get(c.lexicalIdentity.key);
              return {id:c.id,identityKey:identity&&canonical(identity.identity)===canonical(c.lexicalIdentity)?identity.identity.key:null};
            });
          }
        } catch { guard();issues.push(`content-unreadable:${deck.id}`);continue; }
        guard();
        unmappedCards+=content.filter(c=>!c.identityKey).length;
        let progress:Awaited<ReturnType<DeckDatabaseService['getDeckProgress']>>=[],events:Awaited<ReturnType<DeckDatabaseService['getDeckReviewEvents']>>=[],readable=true;
        try {
          [progress,events]=await Promise.all(builtin?
            [this.builtin.getDeckProgress(deck.id),this.builtin.getDeckReviewEvents(deck.id)]:
            [this.custom.getDeckProgress(deck.id,owner),this.custom.getDeckReviewEvents(deck.id,owner)]);
          requireValid(Array.isArray(progress)&&Array.isArray(events)&&progress.every(progressValid)&&events.every(eventValid));
        }catch{guard();progress=[];events=[];readable=false;issues.push(`history-unreadable:${deck.id}`);}
        guard();
        for(const card of content)if(card.identityKey)cards.push({deckId:deck.id,cardId:card.id,identityKey:card.identityKey,
          archived:!builtin&&deck.status==='archived',progress:progress.find(p=>p.entryId===card.id)??null,
          events:events.filter(e=>e.entryId===card.id),readable});
        // No iteration over progress/event IDs: a deleted card cannot reappear from residual history.
      }
      const inventoryComplete=unmappedCards===0&&issues.length===0;
      const result:LexicalKnowledgeSnapshot={workspace:owner,cacheKey:key,manifestRevision:manifest.revision,
        inventoryComplete,unmappedCards,issues,units:projectLexicalKnowledge([...identities.values()],cards,manifest.equivalences,inventoryComplete)};
      guard(); const frozen=freeze(result);this.value.set(frozen);this.error.set(false);return frozen;
    }catch(error){if(this.alive&&key===this.cacheKey()){this.value.set(null);this.error.set(true);}throw error;}
  }
}
function freeze<T>(value:T):T {
  if(value&&typeof value==='object'&&!Object.isFrozen(value)){
    Object.freeze(value);for(const child of Object.values(value))freeze(child);
  }return value;
}

import { computed, inject, Injectable, signal } from '@angular/core';
import { LocalWorkspaceId } from '../models/account.model';
import { CustomRemoteEntity, CustomRemoteReceipt } from '../models/custom-deck-sync.model';
import { CustomReconciliationState, CustomPublication } from '../models/custom-deck-reconciliation.model';
import { MangaConfirmedCardOperation } from '../models/manga-deck-confirmation.model';
import { CustomDeckCard } from '../models/deck-catalog.model';
import { CustomDeckRepository } from './custom-deck.repository';
import { WorkspaceService } from './workspace.service';
import { canonical, dailyValid, eventValid, progressValid, requireValid, validateCard, validateDeck } from './custom-deck-validation';
import { customBundleReadiness, materializeCustomBundle, validServerRevision, validateCustomRemoteOperation } from './custom-deck-sync-contract';
import { validateCuratedEntity, validateMangaConfirmation, validateMangaConfirmedOperation } from './manga-deck-confirmation';
import { CUSTOM_DECK_SYNC_ENABLED, CUSTOM_DECK_TRANSPORT, CustomOwned, CustomRemoteStoredReceipt } from './custom-deck-sync-transport';
import { mergeCustomEntities, prepareCustomOperation, remoteKey } from './custom-deck-sync-protocol';
import { DeckCardProgress, DeckDailyState, DeckReviewEvent } from '../models/deck-study.model';

export type CustomSyncStatus='pending'|'offline'|'error'|'conflict'|'synced';
@Injectable({providedIn:'root'})
export class CustomDeckSyncAdapter {
  readonly enabled=inject(CUSTOM_DECK_SYNC_ENABLED);
  private readonly repo=inject(CustomDeckRepository);
  private readonly workspace=inject(WorkspaceService);
  private readonly transport=inject(CUSTOM_DECK_TRANSPORT);
  private readonly statusState=signal<CustomSyncStatus>('pending');
  private readonly statusScope=signal('');
  private readonly settledJournalRevision=signal(-1);
  readonly status=computed(()=>this.enabled()&&this.statusScope()===`${this.workspace.active()}:${this.workspace.activationRevision()}`?
    this.statusState()==='synced'&&this.settledJournalRevision()!==this.repo.journalRevision()?'pending':this.statusState():'pending');
  readonly failure=signal<unknown>(null);
  private running:Promise<boolean>|null=null;
  async conflicts(){return (await this.repo.syncSnapshot(this.workspace.active())).state.conflicts;}
  syncNow():Promise<boolean>{
    if(this.running)return this.running;
    const run=this.run();this.running=run;void run.finally(()=>{if(this.running===run)this.running=null;}).catch(()=>{});return run;
  }
  private async run():Promise<boolean>{
    const owner=this.workspace.active(),epoch=this.workspace.activationRevision(),principal=this.transport.principal();
    const guard=()=>requireValid(this.enabled()&&owner===`user:${principal}`&&principal!==null&&this.transport.principal()===principal&&this.workspace.active()===owner&&this.workspace.activationRevision()===epoch);
    this.statusScope.set(`${owner}:${epoch}`);
    if(!this.enabled()){this.statusState.set('pending');return false;}
    const receive=async<T>(promise:Promise<CustomOwned<T>>)=>{const response=await promise;guard();requireValid(response.owner===principal);return response.value;};
    const commit=async(state:CustomReconciliationState,journal:string|null=null,publication?:CustomPublication)=>{
      guard();await this.repo.syncCommit(owner,state.version,journal,state,guard,publication);guard();state.version++;
    };
    try{
      guard();this.failure.set(null);this.statusState.set('pending');let snapshot=await this.repo.syncSnapshot(owner);guard();let state=snapshot.state;
      requireValid(state.consent?.version===1&&state.consent.accepted);const consentRevision=state.consent.revision;
      if(Object.values(state.transfers??{}).some(t=>!['published','complete','cancelled'].includes(t.state)||t.kind==='guest-import'&&t.state==='published'&&!t.localPublished)||state.guestChoice!=='account'&&Object.values(state.imports??{}).some(p=>!p.supersededBy&&(p.status!=='complete'||p.sourceChanged))){
        this.statusState.set(Object.keys(state.conflicts).length?'conflict':'pending');return false;
      }
      for(const source of snapshot.journal){
        guard();if(Object.keys(state.conflicts).length)break;
        if(state.suppressed?.[source.id])continue;
        let prepared=state.prepared[source.id];
        if(prepared){requireValid(canonical(prepared.source)===canonical(source));if(prepared.receipt)continue;}
        else{
          const context=await this.repo.syncContext(owner,source);guard();const op=await prepareCustomOperation(source,state,context);guard();await validateCustomRemoteOperation(op);guard();
          prepared={source,operation:op};state.prepared[source.id]=prepared;await commit(state);
        }
        let stored=await receive(this.transport.receipt(principal!,source.id));
        if(!stored){const live=await this.repo.syncSnapshot(owner);guard();requireValid(live.state.consent?.accepted&&live.state.consent.revision===consentRevision);
          const response=await receive(this.transport.apply(principal!,prepared.operation));this.validateReceipt(response,source.id);
          stored=await receive(this.transport.receipt(principal!,source.id));requireValid(stored&&canonical(stored.result)===canonical(response));}
        this.verifyStored(stored,principal!,prepared.operation);
        prepared.receipt=stored.result;
        if(stored.result.status==='conflict')state.conflicts[source.id]=structuredClone(prepared);
        else state.entities=mergeCustomEntities(state.entities,stored.result.entities);
        await commit(state);
      }
      if(Object.keys(state.conflicts).length){this.statusState.set('conflict');return false;}
      // Always stage from cursor zero: H4A feed contains latest rows, not an immutable log.
      // Checkpoints survive crashes for diagnosis; a new cycle deliberately rebuilds generation.
      state.stage={cursor:'0',generation:null,entities:[]};await commit(state);
      let pages=0;
      while(true){
        requireValid(++pages<=10000);const stage=state.stage!;
        const page=await receive(this.transport.changes(principal!,stage.cursor,100));
        requireValid(page.schemaVersion===1&&validServerRevision(page.serverRevision)&&Array.isArray(page.entities));
        if(stage.generation===null)stage.generation=page.serverRevision;else if(stage.generation!==page.serverRevision){state.stage=null;await commit(state);this.statusState.set('pending');return false;}
        let cursor=BigInt(stage.cursor);for(const e of page.entities){this.validateEntityEnvelope(e);requireValid(BigInt(e.revision)>cursor&&BigInt(e.revision)<=BigInt(page.serverRevision));cursor=BigInt(e.revision);}
        stage.entities=mergeCustomEntities(stage.entities,page.entities);stage.cursor=String(cursor);await commit(state);
        if(!page.entities.length)break;
      }
      const entities=state.stage!.entities;
      for(const known of state.entities)requireValid(entities.some(e=>remoteKey(e)===remoteKey(known)&&BigInt(e.revision)>=BigInt(known.revision)));
      // Validate every published deck against a fresh single-statement server bundle.
      for(const manifest of entities.filter(e=>e.kind==='manifest'&&!e.deleted)){
        const deck=entities.find(e=>e.kind==='deck'&&e.id===manifest.id);if(deck?.deleted)continue;
        const bundle=materializeCustomBundle(await receive(this.transport.bundle(principal!,manifest.id)),manifest,entities);requireValid(bundle&&customBundleReadiness(bundle)==='ready');
        if(canonical(bundle.manifest)!==canonical(manifest)||bundle.entities.some(e=>canonical(entities.find(x=>remoteKey(x)===remoteKey(e)))!==canonical(e))){state.stage=null;await commit(state);this.statusState.set('pending');return false;}
      }
      const tail=await receive(this.transport.changes(principal!,state.stage!.cursor,1));
      if(tail.serverRevision!==state.stage!.generation||tail.entities.length){state.stage=null;await commit(state);this.statusState.set('pending');return false;}
      const publication=await this.validatePublication(entities,principal!,receive,guard);
      snapshot=await this.repo.syncSnapshot(owner);guard();requireValid(snapshot.state.version===state.version);
      const pending=snapshot.journal.some(o=>!state.prepared[o.id]?.receipt&&!state.suppressed?.[o.id]);
      state.stage=null;
      if(Object.keys(state.conflicts).length){await commit(state);this.statusState.set('conflict');return false;}
      if(pending){await commit(state);this.statusState.set('pending');return false;}
      state.entities=entities;
      for(const plan of Object.values(state.imports??{}))if(plan.status==='complete'&&!plan.sourceChanged)plan.published=true;
      await commit(state,canonical(snapshot.journal),publication);
      // A tab may append after publication: never claim its work as acknowledged.
      const journalRevision=this.repo.journalRevision();const after=await this.repo.syncSnapshot(owner);guard();
      if(after.journal.some(o=>!after.state.prepared[o.id]?.receipt&&!after.state.suppressed?.[o.id])){this.statusState.set('pending');return false;}
      this.settledJournalRevision.set(journalRevision);this.statusState.set('synced');return this.status()==='synced';
    }catch(error){
      if(this.workspace.active()===owner&&this.workspace.activationRevision()===epoch){this.failure.set(error);this.statusState.set(typeof navigator!=='undefined'&&!navigator.onLine?'offline':'error');}
      return false;
    }
  }
  /** Read-only canonical inspection for explicit import/resolution. Never acknowledges a local mutation. */
  async inspectRemote():Promise<CustomPublication>{
    const owner=this.workspace.active(),epoch=this.workspace.activationRevision(),principal=this.transport.principal();
    const guard=()=>requireValid(this.enabled()&&principal&&owner===`user:${principal}`&&this.workspace.active()===owner&&this.workspace.activationRevision()===epoch&&this.transport.principal()===principal);
    const receive=async<T>(p:Promise<CustomOwned<T>>)=>{const r=await p;guard();requireValid(r.owner===principal);return r.value;};guard();
    let cursor='0',generation:string|null=null,es:CustomRemoteEntity[]=[];
    for(let count=0;count<10000;count++){
      const page=await receive(this.transport.changes(principal!,cursor,100));requireValid(page.schemaVersion===1&&validServerRevision(page.serverRevision));
      requireValid(generation===null||generation===page.serverRevision);generation=page.serverRevision;
      for(const e of page.entities){this.validateEntityEnvelope(e);requireValid(BigInt(e.revision)>BigInt(cursor));cursor=e.revision;}
      es=mergeCustomEntities(es,page.entities);if(!page.entities.length)break;requireValid(count<9999);
    }
    for(const m of es.filter(e=>e.kind==='manifest'&&!e.deleted&&!es.some(d=>d.kind==='deck'&&d.id===e.id&&d.deleted))){
      const b=materializeCustomBundle(await receive(this.transport.bundle(principal!,m.id)),m,es);requireValid(b&&customBundleReadiness(b)==='ready'&&canonical(b.manifest)===canonical(m));
      requireValid(b.entities.every(e=>canonical(es.find(x=>remoteKey(x)===remoteKey(e)))===canonical(e)));
    }
    const publication=await this.validatePublication(es,principal!,receive,guard);
    const tail=await receive(this.transport.changes(principal!,cursor,1));requireValid(tail.serverRevision===generation&&!tail.entities.length);return {...publication,serverRevision:generation!};
  }
  private validateEntityEnvelope(e:CustomRemoteEntity){requireValid(e&&validServerRevision(e.revision)&&typeof e.id==='string'&&typeof e.deleted==='boolean'&&typeof e.archived==='boolean'&&(e.head===null||typeof e.head==='string')&&(e.voidedBy===null||typeof e.voidedBy==='string'));}
  private validateReceipt(r:CustomRemoteReceipt,id:string){requireValid(r?.schemaVersion===1&&r.operationId===id&&['accepted','conflict'].includes(r.status)&&validServerRevision(r.serverRevision)&&Array.isArray(r.entities));for(const e of r.entities)this.validateEntityEnvelope(e);}
  private verifyStored(stored:CustomRemoteStoredReceipt,owner:string,op:CustomRemoteStoredReceipt['request']){requireValid(stored.user_id===owner&&canonical(stored.request)===canonical(op));this.validateReceipt(stored.result,op.operationId);}
  private async validatePublication(es:CustomRemoteEntity[],owner:string,receive:<T>(p:Promise<CustomOwned<T>>)=>Promise<T>,guard:()=>void):Promise<CustomPublication>{
    const confirmations:MangaConfirmedCardOperation[]=[];
    const live=es.filter(e=>!e.deleted),published=new Set(live.filter(e=>e.kind==='manifest').map(e=>e.id));
    // Quarantine staged content or orphan progress by refusing publication, retaining last complete view.
    for(const e of live){
      if(e.kind==='deck')requireValid(published.has(e.id));
      if(e.kind==='deck')validateDeck(e.payload as never);
      if(e.kind==='card'){const c=await validateCard(e.payload as never);guard();requireValid(published.has(c.deckId));}
      if(e.kind==='identity'){await validateCuratedEntity(e.payload as never);guard();}
      if(e.kind==='confirmation'){
        await validateMangaConfirmation(e.payload as never);guard();let receipt=await receive(this.transport.receipt(owner,e.id));
        if((!receipt||receipt.result.status!=='accepted'||receipt.request.intent?.confirmation.id!==e.id)&&this.transport.confirmationReceipt)receipt=await receive(this.transport.confirmationReceipt(owner,e.id));
        requireValid(receipt&&receipt.user_id===owner&&receipt.result.status==='accepted'&&receipt.request.intent?.confirmation.id===e.id);
        this.validateReceipt(receipt.result,receipt.request.operationId);await validateCustomRemoteOperation(receipt.request);guard();
        requireValid(receipt.result.entities.some(x=>x.kind==='confirmation'&&x.id===e.id&&canonical(x.payload)===canonical(e.payload)));
        const intent=receipt.request.intent;await validateMangaConfirmedOperation(intent);guard();requireValid(canonical(intent.confirmation)===canonical(e.payload)&&(intent.confirmation.workspace===`user:${owner}`||intent.confirmation.workspace==='guest'));
        confirmations.push(intent);
      }
      if(e.kind==='progress'&&e.payload!==null)requireValid(progressValid(e.payload as DeckCardProgress));
      if(e.kind==='review-event')requireValid(eventValid(e.payload as DeckReviewEvent));
      if(e.kind==='daily')requireValid(dailyValid(e.payload as DeckDailyState));
      if(e.kind==='progress'||e.kind==='review-event'){
        const card=live.find(c=>c.kind==='card'&&c.id===(e.kind==='progress'?e.id:(e.payload as DeckReviewEvent).entryId));
        // Retained history belonging to tombstones is private evidence, not available study content.
        requireValid(card||es.some(c=>c.kind==='card'&&c.deleted&&c.id===(e.kind==='progress'?e.id:(e.payload as DeckReviewEvent).entryId)));
      }
    }
    return {entities:es,confirmations};
  }
}


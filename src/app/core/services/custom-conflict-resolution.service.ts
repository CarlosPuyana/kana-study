import {inject,Injectable,signal} from '@angular/core';
import {CustomGuestImportService,classifyCustomConflict,guestConfirmations} from './custom-guest-import.service';
import {CustomCatalogOperation,CustomDeckCard} from '../models/deck-catalog.model';
import {CustomRemoteEntity,CustomRemoteOperation,CustomRemoteChange,CustomRemoteKind,CustomPublicationManifest} from '../models/custom-deck-sync.model';
import {CustomResolution} from '../models/custom-guest-import.model';
import {MangaConfirmedCardOperation} from '../models/manga-deck-confirmation.model';
import {DeckReviewEvent} from '../models/deck-study.model';
import {canonical,requireValid} from './custom-deck-validation';
import {mergeCustomEntities} from './custom-deck-sync-protocol';
import {validateMangaConfirmedOperation} from './manga-deck-confirmation';

@Injectable({providedIn:'root'})
export class CustomConflictResolutionService {
 readonly transfer=inject(CustomGuestImportService);readonly failure=signal<unknown>(null);
 async list(){const c=this.transfer.capture(),snapshot=await this.transfer.repo.syncSnapshot(c.owner);c.guard();
  const live=Object.keys(snapshot.state.conflicts).length?(await this.transfer.adapter.inspectRemote()).entities:snapshot.state.entities;c.guard();
  return Object.entries(snapshot.state.conflicts).map(([id,evidence])=>({id,evidence,kind:snapshot.state.conflictDetails?.[id]?.kind??classifyCustomConflict(evidence),
   canonical:live,origin:snapshot.state.conflictDetails?.[id]?.origin??'local'}));}
 async resolve(conflictId:string,mode:'keep'|'rebase'|'restore',confirmed:boolean):Promise<boolean>{
  const c=this.transfer.capture();this.failure.set(null);
  try{
   requireValid(confirmed);const snapshot=await this.transfer.repo.syncSnapshot(c.owner);c.guard();const evidence=snapshot.state.conflicts[conflictId];requireValid(evidence);
   const consent=snapshot.state.consent;requireValid(consent?.accepted);
   let attempt=Object.values(snapshot.state.resolutions??{}).find(r=>r.conflictId===conflictId&&r.mode===mode&&!r.receipt);
   if(!attempt){
    const remote=await this.transfer.adapter.inspectRemote();c.guard();const es=remote.entities;
    const find=(kind:CustomRemoteKind,id:string)=>es.find(e=>e.kind===kind&&e.id===id);
    const change=(e:CustomRemoteEntity,payload=e.payload):CustomRemoteChange=>({kind:e.kind,id:e.id,baseRevision:e.revision,payload});
    const incoming=evidence.operation.changes.find(e=>e.kind==='card'),event=evidence.operation.changes.find(e=>e.kind==='review-event');
    const cardId=incoming?.id??(event?.payload as DeckReviewEvent|undefined)?.entryId??evidence.operation.changes.find(e=>e.kind==='progress')?.id;
    const card=cardId?find('card',cardId):undefined;
    const deckId=(card?.payload as CustomDeckCard|undefined)?.deckId??(incoming?.payload as CustomDeckCard|undefined)?.deckId??evidence.source.entityId;
    const manifest=find('manifest',deckId),deleted=card?.deleted?card:find('deck',deckId)?.deleted?find('deck',deckId):undefined;
    const id='resolve-'+crypto.randomUUID();let op:CustomRemoteOperation;
    if(mode==='keep'){
     if(deleted)op={schemaVersion:1,operationId:id,action:'delete',resolvesOperationId:conflictId,changes:[change(deleted,null)]};
     else if(manifest&&!manifest.deleted)op={schemaVersion:1,operationId:id,action:'publish',resolvesOperationId:conflictId,changes:[change(manifest,{schemaVersion:1,deckId,cardIds:(manifest.payload as CustomPublicationManifest).cardIds})]};
     else {const anchor=es.find(e=>e.kind==='identity'&&!e.deleted&&e.id===evidence.operation.intent?.confirmation.entity.id);requireValid(anchor);op={schemaVersion:1,operationId:id,action:'stage',resolvesOperationId:conflictId,changes:[change(anchor)]};}
    }else if(mode==='restore'){
     requireValid(deleted?.payload&&deleted.kind==='card'&&manifest&&!find('deck',deckId)?.deleted);
     op={schemaVersion:1,operationId:id,action:'restore',resolvesOperationId:conflictId,changes:[change(deleted)]};
    }else{
     requireValid(incoming&&card&&!card.deleted&&manifest&&!manifest.deleted&&canonical((card.payload as CustomDeckCard).lexicalIdentity)===canonical((incoming.payload as CustomDeckCard).lexicalIdentity));
     const detail=snapshot.state.conflictDetails?.[conflictId],plan=detail?.importId?snapshot.state.imports?.[detail.importId]:undefined;
     const original=plan?guestConfirmations(plan.inventory).find(p=>p.confirmation.id===(incoming.payload as CustomDeckCard).glosses[0].source.sourceId):evidence.operation.intent;
     requireValid(original);const current=card.payload as CustomDeckCard;
     const intent:MangaConfirmedCardOperation={...original,expectedContentVersion:current.contentVersion,card:{...original.card,contentVersion:current.contentVersion+1,order:current.order,createdAt:current.createdAt}};
     await validateMangaConfirmedOperation(intent);c.guard();
     const confirmation=find('confirmation',intent.confirmation.id);
     op={schemaVersion:1,operationId:id,action:'publish',resolvesOperationId:conflictId,intent,changes:[change(card,intent.card),
      {kind:'confirmation',id:intent.confirmation.id,payload:intent.confirmation,baseRevision:confirmation?.revision??'0'},
      change(manifest,{schemaVersion:1,deckId,cardIds:(manifest.payload as CustomPublicationManifest).cardIds})]};
    }
    const suppressed:Record<string,CustomCatalogOperation>={};
    for(const source of snapshot.journal){
     const p=source.payload as {card?:CustomDeckCard;event?:DeckReviewEvent};
     if(source.id===evidence.source.id||mode==='keep'&&source.localRevision>=evidence.source.localRevision&&!!cardId&&(p.card?.id===cardId||p.event?.entryId===cardId))suppressed[source.id]=source;
    }
    const draft:CustomResolution={id,conflictId,mode,operation:op,suppressed};
    attempt=await this.transfer.repo.changeCoordination(c.owner,c.guard,s=>{
     requireValid(s.conflicts[conflictId]);const pending=Object.values(s.resolutions??{}).find(r=>r.conflictId===conflictId&&r.mode===mode&&!r.receipt);
     if(pending)return pending;(s.resolutions??={})[id]=draft;return draft;
    });
   }
   const receipt=await this.transfer.execute(attempt.operation,c,consent.revision);c.guard();
   const detail=snapshot.state.conflictDetails?.[conflictId];
   await this.transfer.repo.changeCoordination(c.owner,c.guard,s=>{
    s.resolutions![attempt!.id].receipt=receipt;if(receipt.status!=='accepted')return;
    const conflict=s.conflicts[conflictId];if(!conflict)return;
    (s.closedConflicts??={})[conflictId]={evidence:conflict,...(s.conflictDetails?.[conflictId]?{detail:s.conflictDetails[conflictId]}:{}),resolutionId:attempt!.id};
    delete s.conflicts[conflictId];for(const [id,source]of Object.entries(attempt!.suppressed))(s.suppressed??={})[id]={source,resolutionId:attempt!.id};
    s.entities=mergeCustomEntities(s.entities,receipt.entities);
    const plan=detail?.importId?s.imports?.[detail.importId]:undefined;
    if(plan){const step=plan.steps.find(x=>x.conflictId===conflictId);if(step)for(const other of plan.steps)if(other===step||step.cardId&&other.cardId===step.cardId&&(mode==='keep'||other.kind==='content'))other.done=true;plan.status='pending';plan.blocked=[];}
   });
   if(receipt.status!=='accepted')return false;
   return detail?.importId?this.transfer.resume(detail.importId):this.transfer.adapter.syncNow();
  }catch(error){this.failure.set(error);return false;}
 }
}

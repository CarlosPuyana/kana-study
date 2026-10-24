import {inject,Injectable} from '@angular/core';
import {CustomConflictRecovery,CustomRemoteConflictEvidence} from '../models/custom-conflict-recovery.model';
import {CustomDeckCard} from '../models/deck-catalog.model';
import {DeckReviewEvent,DeckCardProgress} from '../models/deck-study.model';
import {CustomDeckSyncAdapter} from './custom-deck-sync-adapter';
import {CUSTOM_DECK_TRANSPORT,CUSTOM_DECK_SYNC_ENABLED,CustomOwned,CustomRemoteStoredReceipt} from './custom-deck-sync-transport';
import {WorkspaceService} from './workspace.service';
import {canonical,requireValid} from './custom-deck-validation';
import {validateCustomRemoteOperation,validServerRevision,customSyncJsonBytes} from './custom-deck-sync-contract';
import {CustomBranchArchiveService} from './custom-branch-archive.service';
/** Read-only evidence export. Never writes local state, ACKs an operation, applies progress or claims an unsent tail. */
@Injectable({providedIn:'root'})
export class CustomConflictRecoveryService {
 readonly archives=inject(CustomBranchArchiveService);
 private readonly transport=inject(CUSTOM_DECK_TRANSPORT);private readonly adapter=inject(CustomDeckSyncAdapter);
 private readonly workspace=inject(WorkspaceService);private readonly enabled=inject(CUSTOM_DECK_SYNC_ENABLED);
 async inspect():Promise<CustomConflictRecovery>{
  const owner=this.transport.principal(),workspace=this.workspace.active(),epoch=this.workspace.activationRevision();
  const guard=()=>requireValid(this.enabled()&&owner&&workspace===`user:${owner}`&&this.transport.principal()===owner&&this.workspace.active()===workspace&&this.workspace.activationRevision()===epoch);
  const receive=async<T>(p:Promise<CustomOwned<T>>)=>{const r=await p;guard();requireValid(r.owner===owner);return r.value;};guard();
  requireValid(this.transport.conflictEvidence&&this.transport.conflictResolutions);
  const canonicalState=await this.adapter.inspectRemote();guard();const evidence:CustomRemoteConflictEvidence[]=[],seen=new Set<string>();let cursor:string|null=null,bytes=customSyncJsonBytes(canonicalState);requireValid(bytes<=32*1024*1024);
  const consume=(value:unknown)=>{bytes+=customSyncJsonBytes(value);requireValid(bytes<=32*1024*1024);};
  for(let page=0;page<1000;page++){
   const rows:CustomRemoteConflictEvidence[]=await receive(this.transport.conflictEvidence(owner!,cursor,8));requireValid(Array.isArray(rows)&&rows.length<=8);
   if(!rows.length)break;
   for(const row of rows){requireValid(row.user_id===owner&&row.operation_id===row.evidence.operationId&&!seen.has(row.operation_id));seen.add(row.operation_id);bytes+=customSyncJsonBytes(row);requireValid(bytes<=32*1024*1024);evidence.push(row);}
   cursor=rows.at(-1)!.operation_id;requireValid(page<999);
  }
  const verified:CustomRemoteStoredReceipt[]=[];
  for(const row of evidence){
   await validateCustomRemoteOperation(row.evidence);guard();const receipt=await receive(this.transport.receipt(owner!,row.operation_id));consume(receipt);
   requireValid(receipt&&receipt.user_id===owner&&canonical(receipt.request)===canonical(row.evidence)&&receipt.result.schemaVersion===1&&receipt.result.operationId===row.operation_id&&receipt.result.status==='conflict'&&receipt.result.reason===row.reason&&validServerRevision(receipt.result.serverRevision));verified.push(receipt);
  }
  const conflicts:CustomConflictRecovery['conflicts'][number][]=[];
  for(let index=0;index<evidence.length;index++){
   const row=evidence[index],events=row.evidence.changes.filter(c=>c.kind==='review-event').map(c=>c.payload as DeckReviewEvent);if(!events.length)continue;
   const card=canonicalState.entities.find(e=>e.kind==='card'&&e.id===events[0].entryId);requireValid(card?.payload);const provenance=card.payload as CustomDeckCard;
   requireValid(events.every(e=>e.entryId===provenance.id&&e.deckId===provenance.deckId));
   const proposed=row.evidence.changes.find(c=>c.kind==='card');if(proposed)requireValid(canonical((proposed.payload as CustomDeckCard).lexicalIdentity)===canonical(provenance.lexicalIdentity));
   const parents=new Set<string>();if(row.evidence.action==='review'||row.evidence.action==='undo'){if(row.evidence.expectedHead)parents.add(row.evidence.expectedHead);}for(const c of row.evidence.changes)if(c.parentHead)parents.add(c.parentHead);
   const missingParents:string[]=[],ancestors:DeckReviewEvent[]=[],visited=new Set<string>(),queue=[...parents];
   while(queue.length){const id=queue.pop()!;if(visited.has(id))continue;visited.add(id);
    const existing=canonicalState.entities.find(e=>e.kind==='review-event'&&e.id===id&&(e.payload as DeckReviewEvent).entryId===provenance.id);
    const submitted=verified.find(r=>r.request.changes.some(c=>c.kind==='review-event'&&c.id===id&&(c.payload as DeckReviewEvent).entryId===provenance.id));
    const item=existing?.payload??submitted?.request.changes.find(c=>c.kind==='review-event'&&c.id===id)?.payload;
    if(!item){missingParents.push(id);continue;}ancestors.push(item as DeckReviewEvent);
    const next=existing?existing.head:submitted!.request.action==='review'?submitted!.request.expectedHead:submitted!.request.changes.find(c=>c.kind==='review-event'&&c.id===id)?.parentHead;
    if(next)queue.push(next);
   }
   const progress=canonicalState.entities.find(e=>e.kind==='progress'&&e.id===provenance.id);
   const resolutions=await receive(this.transport.conflictResolutions(owner!,row.operation_id));requireValid(Array.isArray(resolutions)&&resolutions.length<=100);consume(resolutions);
   for(const resolution of resolutions){await validateCustomRemoteOperation(resolution.request);guard();const proof=await receive(this.transport.receipt(owner!,resolution.request.operationId));requireValid(resolution.user_id===owner&&resolution.request.resolvesOperationId===row.operation_id&&resolution.result.schemaVersion===1&&resolution.result.operationId===resolution.request.operationId&&validServerRevision(resolution.result.serverRevision)&&resolution.result.status==='accepted'&&proof&&canonical(proof)===canonical(resolution));}
   conflicts.push({operation:row.evidence,receipt:verified[index],reason:row.reason,provenance,deleted:card.deleted,events,ancestors,canonicalProgress:(progress?.payload??null) as DeckCardProgress|null,canonicalHead:progress?.head??null,missingParents,resolutions,provenanceScope:'current-or-tombstoned-confirmed-card',applied:false,localTail:'unknown'});
  }
  guard();return {owner:owner!,coverage:'observed-submitted-operations',consistentSnapshot:false,conflicts};
 }
}

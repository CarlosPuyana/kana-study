import {inject,Injectable} from '@angular/core';
import {CustomDeckSyncAdapter} from './custom-deck-sync-adapter';
import {CustomTransferCoordinator} from './custom-transfer-coordinator';
import {prepareCustomOperation} from './custom-deck-sync-protocol';
import {freezeTransferRecords} from './custom-guest-transfer-builder';
import {canonical,digest,requireValid} from './custom-deck-validation';
import {CustomBranchManifestV2,CustomTransferRecordV2} from '../models/custom-transfer-v2.model';
import {DeckReviewEvent} from '../models/deck-study.model';
import {CustomRemoteChange} from '../models/custom-deck-sync.model';
import {validateCustomRemoteOperation} from './custom-deck-sync-contract';

@Injectable({providedIn:'root'})
export class CustomBranchArchiveService {
 readonly transfers=inject(CustomTransferCoordinator);private readonly adapter=inject(CustomDeckSyncAdapter);
 async archive(conflictId:string,confirmed:boolean){
  requireValid(confirmed);const c=this.transfers.capture(),snapshot=await this.transfers.repo.syncSnapshot(c.workspace);c.guard();requireValid(snapshot.state.consent?.accepted);
  const anchor=snapshot.state.conflicts[conflictId]??snapshot.state.closedConflicts?.[conflictId]?.evidence;requireValid(anchor&&['review','undo'].includes(anchor.operation.action));
  const cardId=(anchor.operation.changes.find(x=>x.kind==='review-event')?.payload as DeckReviewEvent)?.entryId;requireValid(cardId);
  const remote=await this.adapter.inspectRemote();c.guard();const card=remote.entities.find(e=>e.kind==='card'&&e.id===cardId);requireValid(card);
  const queue=snapshot.journal.filter(o=>o.localRevision>anchor.source.localRevision&&['review','undo'].includes(o.kind)&&(o.payload as {event:DeckReviewEvent}).event.entryId===cardId);
  const records:CustomTransferRecordV2[]=[],ancestorIds:string[]=[],ancestors:CustomRemoteChange[]=[];let cursor=anchor.operation.expectedHead??null;
  while(cursor){requireValid(ancestors.length<8192&&!ancestorIds.includes(cursor));const e=remote.entities.find(e=>e.kind==='review-event'&&e.id===cursor);requireValid(e);ancestors.unshift({kind:'review-event',id:e.id,baseRevision:e.revision,payload:e.payload,parentHead:e.head,voidedBy:e.voidedBy});ancestorIds.unshift(e.id);cursor=e.head;}
  records.push(...ancestors.map(value=>({type:'ancestor' as const,value:value as CustomRemoteChange&{parentHead:string|null;voidedBy:string|null}})));
  const operations=[anchor.operation];for(const source of queue)operations.push(snapshot.state.prepared[source.id]?.operation??await prepareCustomOperation(source,snapshot.state));c.guard();
  const parents=new Map(ancestors.map(e=>[e.id,e.parentHead??null]));let head=anchor.operation.expectedHead??null;
  for(const op of operations){requireValid(op.expectedHead===head);const event=op.changes.find(e=>e.kind==='review-event');requireValid(event);if(op.action==='review'){parents.set(event.id,head);head=event.id;}else {requireValid(parents.has(event.id));head=parents.get(event.id)!;}records.push({type:'operation',value:op});}
  const id=await digest('br2-',[c.owner,conflictId,operations]);c.guard();
  const manifest:Omit<CustomBranchManifestV2,'chunks'>={schemaVersion:2,cardId,identityKey:(card.payload as {lexicalIdentity:{key:string}}).lexicalIdentity.key,baseHead:anchor.operation.expectedHead??null,head,conflictOperationId:conflictId,operationIds:operations.map(o=>o.operationId),ancestorIds,resolutionIds:[]};
  await this.transfers.save(await freezeTransferRecords(id,c.owner,'branch-archive',manifest,records));c.guard();const state=await this.transfers.run(id);c.guard();
  const after=await this.transfers.repo.syncSnapshot(c.workspace);c.guard();const tail=after.journal.filter(o=>o.localRevision>anchor.source.localRevision&&['review','undo'].includes(o.kind)&&(o.payload as {event:DeckReviewEvent}).event.entryId===cardId);
  return {id,complete:state==='complete'&&canonical(tail)===canonical(queue),sourceChanged:canonical(tail)!==canonical(queue)};
 }
 async inspect(id:string){
  const c=this.transfers.capture(),archive=await this.transfers.inspect(id);c.guard();if(!archive)return null;requireValid(archive.view.kind==='branch-archive');
  const m=archive.view.manifest as CustomBranchManifestV2,records=[...archive.bodies.values()].flatMap(body=>JSON.parse(body) as CustomTransferRecordV2[]),operations=records.filter(r=>r.type==='operation').map(r=>r.value);
  const verified=archive.complete&&archive.view.state==='complete';if(verified){requireValid(canonical(operations.map(o=>o.operationId))===canonical(m.operationIds));requireValid(canonical(records.filter(r=>r.type==='ancestor').map(r=>r.value.id))===canonical(m.ancestorIds));}
  for(const op of operations){await validateCustomRemoteOperation(op);c.guard();}
  const canonicalState=await this.adapter.inspectRemote();c.guard();const card=canonicalState.entities.find(e=>e.kind==='card'&&e.id===m.cardId);requireValid(card&&(card.payload as {lexicalIdentity:{key:string}}).lexicalIdentity.key===m.identityKey);
  const transport=this.transfers.transport;requireValid(transport.conflictResolutions);const response=await transport.conflictResolutions(c.owner,m.conflictOperationId);c.guard();requireValid(response.owner===c.owner&&response.value.length<=100&&response.value.every(r=>r.user_id===c.owner&&r.result.status==='accepted'&&r.request.resolvesOperationId===m.conflictOperationId));
  for(const resolution of response.value){const proof=await transport.receipt(c.owner,resolution.request.operationId);c.guard();requireValid(proof.owner===c.owner&&proof.value&&canonical(proof.value)===canonical(resolution));await validateCustomRemoteOperation(resolution.request);c.guard();}
  return {id,state:archive.view.state,verified,operations,missing:m.chunks.filter(d=>!archive.bodies.has(d.index)).length,card,canonicalProgress:canonicalState.entities.find(e=>e.kind==='progress'&&e.id===m.cardId)??null,resolutions:response.value.length,applied:false as const};
 }
}

import {CustomGuestInventory} from '../models/custom-guest-import.model';
import {CustomCatalogOperation,CustomDeckCard} from '../models/deck-catalog.model';
import {CustomRemoteEntity,CustomRemoteOperation} from '../models/custom-deck-sync.model';
import {CustomReconciliationState} from '../models/custom-deck-reconciliation.model';
import {CustomGuestManifestV2,CustomTransferCheckpointV2,CustomTransferRecordV2} from '../models/custom-transfer-v2.model';
import {DeckCardProgress,DeckReviewEvent} from '../models/deck-study.model';
import {canonical,requireValid} from './custom-deck-validation';
import {inventoryRows,guestConfirmations} from './custom-guest-import-helpers';
import {prepareCustomOperation} from './custom-deck-sync-protocol';
import {prepareCustomTransferChunkV2,assertCustomTransferEnvelopeV2} from './custom-transfer-v2-contract';

/** Predict server revisions only. Copies original journal snapshots; never schedules or invents a review. */
export function projectTransferOperation(op:CustomRemoteOperation,rows:CustomRemoteEntity[],start:bigint){
 let clock=start;const event=op.changes.find(c=>c.kind==='review-event'),previous=event?rows.find(e=>e.kind==='review-event'&&e.id===event.id):undefined;
 for(const c of op.changes){const old=rows.find(e=>e.kind===c.kind&&e.id===c.id);
  requireValid((old?.revision??'0')===c.baseRevision&&!old?.deleted);
  if(['identity','confirmation','volume-link'].includes(c.kind)&&old&&canonical(old.payload)===canonical(c.payload))continue;
  let payload=structuredClone(c.payload);
  if(c.kind==='card'){const card=payload as CustomDeckCard;payload={...card,order:old?(old.payload as CustomDeckCard).order:Math.max(0,...rows.filter(e=>e.kind==='card'&&(e.payload as CustomDeckCard).deckId===card.deckId).map(e=>(e.payload as CustomDeckCard).order))+1};}
  const head=c.kind==='progress'?(op.action==='undo'?previous?.head??null:event?.id??op.expectedHead??null):c.kind==='review-event'?(op.action==='undo'?previous?.head??null:c.parentHead??op.expectedHead??null):null;
  const next:CustomRemoteEntity={kind:c.kind,id:c.id,payload,revision:String(++clock),deleted:false,archived:false,head,voidedBy:c.kind==='review-event'?(op.action==='undo'?op.operationId:c.voidedBy??null):null};
  const i=rows.findIndex(e=>e.kind===c.kind&&e.id===c.id);if(i<0)rows.push(next);else rows[i]=next;
 }
 return clock;
}
export async function freezeTransferRecords(id:string,owner:string,kind:CustomTransferCheckpointV2['kind'],manifest:Omit<CustomGuestManifestV2,'chunks'>|Omit<import('../models/custom-transfer-v2.model').CustomBranchManifestV2,'chunks'>,records:CustomTransferRecordV2[]):Promise<CustomTransferCheckpointV2>{
 const bodies:string[]=[],chunks:CustomGuestManifestV2['chunks']=[];let group:CustomTransferRecordV2[]=[];
 const phase=(r:CustomTransferRecordV2)=>r.type==='ancestor'?'ancestor':['publish','stage'].includes(r.value.action)?'content':'history';
 const prepare=async(items:CustomTransferRecordV2[])=>{const p=await prepareCustomTransferChunkV2(items,bodies.length);assertCustomTransferEnvelopeV2({schemaVersion:2,operationId:id+':chunk:127',transferId:id,expectedRevision:'9223372036854775807',action:'chunk',index:bodies.length,body:p.body});return p;};
 const flush=async()=>{if(!group.length)return;const p=await prepare(group);bodies.push(p.body);chunks.push(p.descriptor);group=[];};
 // Pack whole operations in source order. A 65-change operation fails even when sent alone.
 for(const record of records){if(group.length&&phase(group[0])!==phase(record))await flush();try{await prepare([...group,record]);}catch(error){if(!group.length)throw error;await flush();await prepare([record]);}group.push(record);}await flush();
 if(!bodies.length||bodies.length>128||chunks.reduce((n,c)=>n+c.bytes,0)>8388608)throw new Error('transfer-limit');
 return {protocolVersion:2,id,owner,workspace:`user:${owner}`,kind,manifest:{...manifest,chunks} as CustomGuestManifestV2,bodies,requests:[],receipts:{},revision:'0',state:'staging',localPublished:false};
}
export async function buildGuestTransfer(id:string,owner:string,inventory:CustomGuestInventory,remote:CustomRemoteEntity[],generation:string){
 const journal=inventoryRows(inventory,'journal').map(r=>r.value as CustomCatalogOperation).sort((a,b)=>a.localRevision-b.localRevision);
 const cards=inventoryRows(inventory,'cards').map(r=>r.value as CustomDeckCard),confirmations=guestConfirmations(inventory);
 requireValid(cards.length>0&&cards.length<=1000&&journal.length>0&&new Set(journal.map(o=>o.localRevision)).size===journal.length);
 const prior=inventoryRows(inventory,'reconciliation')[0]?.value as CustomReconciliationState|undefined;
 requireValid(!prior?.entities.some(e=>e.deleted||e.kind==='equivalence')&&!Object.keys(prior?.conflicts??{}).length);
 requireValid(!Object.keys(prior?.prepared??{}).length);
 requireValid(cards.every(c=>confirmations.some(p=>p.card.id===c.id)));
 const namespaces=new Set(confirmations.map(p=>p.confirmation.entity.registryNamespace));requireValid(namespaces.size===1);
 if(remote.some(e=>e.kind==='card'&&cards.some(c=>c.id===e.id)))throw new Error('destination-content-exists');
 const rows=structuredClone(remote),records:CustomTransferRecordV2[]=[],entities=new Map<string,{kind:CustomRemoteEntity['kind'];id:string}>();let clock=BigInt(generation);
 for(const source of journal){
  requireValid(source.workspace==='guest'&&source.context&&!['create','delete','restore','archive','edit-card'].includes(source.kind));
  const fingerprintPayload=source.kind==='review'||source.kind==='undo'?{event:(source.payload as {event:DeckReviewEvent}).event}:source.payload;
  requireValid(source.schemaVersion===1&&source.state==='committed'&&Number.isSafeInteger(source.localRevision)&&source.localRevision>0&&source.request===canonical({kind:source.kind,entityId:source.entityId,payload:fingerprintPayload}));
  let op=await prepareCustomOperation(source,{entities:rows} as CustomReconciliationState);
  if(op.action==='daily')op={...op,action:'import-history'};
  clock=projectTransferOperation(op,rows,clock);records.push({type:'operation',value:op});
  for(const c of op.changes)entities.set(c.kind+':'+c.id,{kind:c.kind,id:c.id});
 }
 const declarations:CustomGuestManifestV2['cards']=[];
 for(const card of cards){const current=rows.find(e=>e.kind==='card'&&e.id===card.id);requireValid(current&&canonical({...current.payload as CustomDeckCard,order:card.order})===canonical(card));
  const progressRow=inventoryRows(inventory,'progress').find(r=>r.key===JSON.stringify([card.deckId,card.id])),events=inventoryRows(inventory,'events').filter(r=>(r.value as DeckReviewEvent).entryId===card.id);
  const hasHistory=!!progressRow||events.length>0||journal.some(o=>['review','undo'].includes(o.kind)&&(o.payload as {event:DeckReviewEvent}).event.entryId===card.id);
  const projected=rows.find(e=>e.kind==='progress'&&e.id===card.id);
  if(hasHistory)requireValid(progressRow&&projected&&canonical(projected.payload)===canonical(progressRow.value)&&projected.head===(progressRow.head??null));else requireValid(!projected);
  const actual=rows.filter(e=>e.kind==='review-event'&&(e.payload as DeckReviewEvent).entryId===card.id);requireValid(actual.length===events.length);
  for(const e of events){const v=actual.find(x=>x.id===e.key);requireValid(v&&canonical(v.payload)===canonical(e.value)&&v.head===(e.head??null)&&v.voidedBy===(e.voidedBy??null));}
  declarations.push({id:card.id,deckId:card.deckId,identityKey:card.lexicalIdentity.key,contentVersion:card.contentVersion,confirmationId:card.glosses[0].source.sourceId,history:hasHistory?'history':'new',snapshot:(progressRow?.value??null) as DeckCardProgress|null,head:progressRow?.head??null,eventIds:events.map(e=>e.key)});
 }
 for(const store of ['daily','decks'])for(const source of inventoryRows(inventory,store)){const value=source.value as {id?:string;deckId?:string;localDate?:string};const expected=store==='decks'?rows.find(e=>e.kind==='deck'&&e.id===value.id):rows.find(e=>e.kind==='daily'&&(e.payload as typeof value).deckId===value.deckId&&(e.payload as typeof value).localDate===value.localDate);requireValid(expected&&canonical(expected.payload)===canonical(source.value));}
 for(const store of ['identities','confirmations','volume-links'])for(const source of inventoryRows(inventory,store)){const kind=store==='identities'?'identity':store==='confirmations'?'confirmation':'volume-link',expected=rows.find(e=>e.kind===kind&&e.id===source.key),payload=store==='confirmations'?(source.value as {confirmation:unknown}).confirmation:source.value;requireValid(expected&&canonical(expected.payload)===canonical(payload));}
 return freezeTransferRecords(id,owner,'guest-import',{schemaVersion:2,source:'guest',namespace:[...namespaces][0],baseServerRevision:generation,cards:declarations,entities:[...entities.values()]},records);
}

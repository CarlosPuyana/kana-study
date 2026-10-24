import {inject,Injectable,signal,computed} from '@angular/core';
import {CustomGuestImport} from '../models/custom-guest-import.model';
import {CustomRemoteOperation} from '../models/custom-deck-sync.model';
import {CustomGuestManifestV2} from '../models/custom-transfer-v2.model';
import {CustomDeckRepository} from './custom-deck.repository';
import {CustomDeckSyncAdapter} from './custom-deck-sync-adapter';
import {CUSTOM_DECK_TRANSPORT,CUSTOM_DECK_SYNC_ENABLED} from './custom-deck-sync-transport';
import {WorkspaceService} from './workspace.service';
import {canonical,digest,requireValid} from './custom-deck-validation';
import {validateCustomRemoteOperation} from './custom-deck-sync-contract';
import {guestHasData,guestFingerprint,inventoryRows} from './custom-guest-import-helpers';
import {CustomDeckCard} from '../models/deck-catalog.model';
import {DeckReviewEvent} from '../models/deck-study.model';
import {buildGuestTransfer} from './custom-guest-transfer-builder';
import {CustomTransferCoordinator} from './custom-transfer-coordinator';
export {inventoryRows,guestConfirmations,guestHasData,guestFingerprint,classifyCustomConflict} from './custom-guest-import-helpers';
@Injectable({providedIn:'root'})
export class CustomGuestImportService {
 readonly repo=inject(CustomDeckRepository);readonly adapter=inject(CustomDeckSyncAdapter);readonly coordinator=inject(CustomTransferCoordinator);
 readonly transport=inject(CUSTOM_DECK_TRANSPORT);readonly enabled=inject(CUSTOM_DECK_SYNC_ENABLED);readonly workspace=inject(WorkspaceService);
 private readonly statusState=signal<'idle'|'running'|'pending'|'blocked'|'complete'|'error'>('idle');private readonly statusScope=signal('');readonly status=computed(()=>this.statusScope()===this.workspace.active()+':'+this.workspace.activationRevision()?this.statusState():'idle');readonly failure=signal<unknown>(null);
 private running:Promise<boolean>|null=null;
 inventory(){return this.repo.guestInventory();}
 capture(){const c=this.coordinator.capture();return {owner:c.workspace,principal:c.owner,guard:c.guard};}
 async consent(accepted:boolean){const c=this.capture();await this.repo.setCustomConsent(c.owner,accepted,c.guard);c.guard();}
 async chooseAccount(){const c=this.capture();await this.repo.changeCoordination(c.owner,c.guard,s=>{s.guestChoice='account';});this.statusState.set('idle');}
 async plans(){const c=this.capture();const s=await this.repo.syncSnapshot(c.owner);c.guard();return s.state.imports??{};}
 async completeForCurrentSource(){const c=this.capture(),fp=await guestFingerprint(await this.inventory());c.guard();const s=await this.repo.syncSnapshot(c.owner);c.guard();return !Object.keys(s.state.conflicts).length&&Object.values(s.state.imports??{}).some(p=>p.status==='complete'&&p.published&&!p.sourceChanged&&p.fingerprint===fp);}
 start(confirmed:boolean):Promise<boolean>{if(this.running)return this.running;const p=this.begin(confirmed);this.running=p;void p.finally(()=>{if(this.running===p)this.running=null;}).catch(()=>{});return p;}
 private async begin(confirmed:boolean){
  try{requireValid(confirmed);const c=this.capture(),inventory=await this.inventory();c.guard();requireValid(guestHasData(inventory));
   const fingerprint=await guestFingerprint(inventory),id=await digest('gi-',[c.principal,fingerprint]);c.guard();
   await this.repo.changeCoordination(c.owner,c.guard,s=>{requireValid(s.consent?.version===1&&s.consent.accepted);s.guestChoice='merge';s.imports??={};if(!s.imports[id])s.imports[id]={id,protocolVersion:2,transferId:id,source:'guest',destination:c.principal,fingerprint,inventory,status:'pending',steps:[],createdCards:[],blocked:[],sourceChanged:false};});return this.resume(id);
  }catch(error){this.failure.set(error);this.statusState.set('error');return false;}
 }
 async resume(id:string):Promise<boolean>{
  const c=this.capture();this.statusScope.set(c.owner+':'+this.workspace.activationRevision());this.statusState.set('running');this.failure.set(null);
  try{let snapshot=await this.repo.syncSnapshot(c.owner);c.guard();const plan=snapshot.state.imports?.[id];requireValid(plan&&plan.destination===c.principal);
   if(plan.status==='complete'&&plan.published&&!plan.sourceChanged&&await guestFingerprint(await this.inventory())===plan.fingerprint){c.guard();this.statusState.set('complete');return true;}
   if(plan.protocolVersion!==2)throw new Error('legacy-v1-checkpoint-preserved');requireValid(snapshot.state.consent?.accepted);const consent=snapshot.state.consent.revision;
   let checkpoint=snapshot.state.transfers?.[id];if(!checkpoint){const remote=await this.adapter.inspectRemote();c.guard();const draft=await buildGuestTransfer(id,c.principal,plan.inventory,remote.entities,remote.serverRevision!);c.guard();checkpoint=await this.coordinator.save(draft);}
   const state=await this.coordinator.run(id,async()=>{if(await guestFingerprint(await this.inventory())!==plan.fingerprint)throw new Error('source-changed');c.guard();});c.guard();if(state!=='published'){await this.mark(id,c,'blocked',state);return false;}
   const publication=await this.adapter.inspectRemote();c.guard();const manifest=checkpoint.manifest as CustomGuestManifestV2;
   for(const card of manifest.cards){const p=publication.entities.find(e=>e.kind==='progress'&&e.id===card.id),content=publication.entities.find(e=>e.kind==='card'&&e.id===card.id),expected=inventoryRows(plan.inventory,'cards').find(r=>(r.value as CustomDeckCard).id===card.id)?.value as CustomDeckCard|undefined;
    requireValid(content&&!content.deleted&&expected&&canonical({...content.payload as CustomDeckCard,order:expected.order})===canonical(expected));
    requireValid(card.history==='new'?!p:!!p&&canonical(p.payload)===canonical(card.snapshot)&&p.head===card.head);
    const actual=publication.entities.filter(e=>e.kind==='review-event'&&(e.payload as DeckReviewEvent).entryId===card.id);requireValid(actual.length===card.eventIds.length);
   }
   for(const row of inventoryRows(plan.inventory,'events')){const event=publication.entities.find(e=>e.kind==='review-event'&&e.id===row.key);requireValid(event&&canonical(event.payload)===canonical(row.value)&&event.head===(row.head??null)&&event.voidedBy===(row.voidedBy??null));}
   for(const row of inventoryRows(plan.inventory,'daily')){const expected=row.value as {deckId:string;localDate:string};requireValid(publication.entities.some(e=>e.kind==='daily'&&canonical(e.payload)===canonical(expected)));}
   const sourceChanged=await guestFingerprint(await this.inventory())!==plan.fingerprint;c.guard();if(sourceChanged)throw new Error('source-changed');
   snapshot=await this.repo.syncSnapshot(c.owner);c.guard();requireValid(snapshot.state.consent?.accepted&&snapshot.state.consent.revision===consent&&!Object.keys(snapshot.state.conflicts).length&&snapshot.journal.every(o=>snapshot.state.prepared[o.id]?.receipt?.status==='accepted'||snapshot.state.suppressed?.[o.id]));
   const local=snapshot.state.imports![id];local.status='complete';local.published=true;local.sourceChanged=false;local.blocked=[];snapshot.state.entities=publication.entities;snapshot.state.transfers![id].localPublished=true;
   await this.repo.syncCommit(c.owner,snapshot.state.version,canonical(snapshot.journal),snapshot.state,c.guard,publication);c.guard();if(await guestFingerprint(await this.inventory())!==plan.fingerprint){await this.mark(id,c,'blocked','source-changed');return false;}this.statusState.set('complete');return true;
  }catch(error){if(this.workspace.active()===c.owner){try{c.guard();this.failure.set(error);const detail=error as {code?:string;message?:string;name?:string};let reason=detail?.message??'transfer-error';if(detail?.name==='QuotaExceededError')reason='local-quota';else if(detail?.code==='54000'||reason.includes('custom_transfer_usage_v2'))reason='remote-quota';else if(['PGRST202','42883','42P01'].includes(detail?.code??''))reason='v2-unavailable';await this.mark(id,c,'blocked',reason);}catch{/* An activation change must not publish into another workspace. */}}return false;}
 }
 private async mark(id:string,c:ReturnType<CustomGuestImportService['capture']>,status:CustomGuestImport['status'],reason:string){await this.repo.changeCoordination(c.owner,c.guard,s=>{const p=s.imports?.[id];if(p){p.status=status;p.blocked=[['legacy-v1-checkpoint-preserved','destination-content-exists','transfer-limit','local-quota','remote-quota','v2-unavailable'].includes(reason)?reason:reason.includes('V2')?'v2-unavailable':'v2-transfer-blocked'];p.sourceChanged||=reason==='source-changed';}});this.statusState.set('blocked');}
 /** Ordinary V1 conflict resolutions only. Guest never falls back here. */
 async execute(op:CustomRemoteOperation,c:ReturnType<CustomGuestImportService['capture']>,revision:number){
  await validateCustomRemoteOperation(op);c.guard();let owned=await this.transport.receipt(c.principal,op.operationId);c.guard();requireValid(owned.owner===c.principal);let stored=owned.value;
  if(!stored){const live=await this.repo.syncSnapshot(c.owner);c.guard();requireValid(live.state.consent?.accepted&&live.state.consent.revision===revision);const response=await this.transport.apply(c.principal,op);c.guard();owned=await this.transport.receipt(c.principal,op.operationId);c.guard();requireValid(owned.owner===c.principal&&response.owner===c.principal&&owned.value&&canonical(owned.value.result)===canonical(response.value));stored=owned.value;}requireValid(stored.user_id===c.principal&&canonical(stored.request)===canonical(op)&&stored.result.schemaVersion===1&&stored.result.operationId===op.operationId);return stored.result;
 }
}


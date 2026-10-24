import {inject,Injectable} from '@angular/core';
import {CustomTransferCheckpointV2,CustomTransferRequestV2,CustomTransferReceiptV2,CustomTransferViewV2} from '../models/custom-transfer-v2.model';
import {CustomDeckRepository} from './custom-deck.repository';
import {WorkspaceService} from './workspace.service';
import {CUSTOM_DECK_SYNC_ENABLED,CUSTOM_DECK_TRANSPORT,CustomOwned} from './custom-deck-sync-transport';
import {canonical,requireValid} from './custom-deck-validation';
import {validServerRevision,customSyncJsonBytes} from './custom-deck-sync-contract';
import {assertCustomTransferEnvelopeV2,customTransferTextHashV2,transferRequestJsonbTextV2} from './custom-transfer-v2-contract';

@Injectable({providedIn:'root'})
export class CustomTransferCoordinator {
 readonly repo=inject(CustomDeckRepository);readonly workspace=inject(WorkspaceService);readonly transport=inject(CUSTOM_DECK_TRANSPORT);readonly enabled=inject(CUSTOM_DECK_SYNC_ENABLED);
 capture(){const owner=this.transport.principal(),workspace=this.workspace.active(),epoch=this.workspace.activationRevision();
  const guard=()=>requireValid(this.enabled()&&owner&&workspace===`user:${owner}`&&this.transport.principal()===owner&&this.workspace.active()===workspace&&this.workspace.activationRevision()===epoch);
  guard();return {owner:owner!,workspace,guard};}
 private async receive<T>(c:ReturnType<CustomTransferCoordinator['capture']>,promise:Promise<CustomOwned<T>>){const r=await promise;c.guard();requireValid(r.owner===c.owner);return r.value;}
 async checkpoint(id:string){const c=this.capture(),s=await this.repo.syncSnapshot(c.workspace);c.guard();return s.state.transfers?.[id];}
 async save(draft:CustomTransferCheckpointV2){const c=this.capture();requireValid(draft.owner===c.owner&&draft.workspace===c.workspace);
  return this.repo.changeCoordination(c.workspace,c.guard,s=>{const old=s.transfers?.[draft.id];if(old){requireValid(canonical(old.manifest)===canonical(draft.manifest)&&canonical(old.bodies)===canonical(draft.bodies));return old;}(s.transfers??={})[draft.id]=draft;return draft;});}
 /** Explicit known-ID lookup only. Immutable manifest/chunks are verified even for partial archives. */
 async inspect(id:string){
  const c=this.capture();if(!this.transport.transferGet)throw new Error('V2 migration/transport unavailable');let view:CustomTransferViewV2|null=null;const bodies=new Map<number,string>();
  let after=-1,bytes=0;
  for(let n=0;n<=128;n++){
   const page=await this.receive(c,this.transport.transferGet(c.owner,id,after));if(!page){requireValid(n===0);return null;}
   requireValid(page.schemaVersion===2&&page.transferId===id&&validServerRevision(page.revision)&&['guest-import','branch-archive'].includes(page.kind)&&['staging','ready-to-publish','published','complete','blocked','cancelled'].includes(page.state));
   requireValid(page.manifest?.schemaVersion===2&&Array.isArray(page.manifest.chunks)&&page.manifest.chunks.length>0&&page.manifest.chunks.length<=128&&customSyncJsonBytes(page.manifest)<=524288);
   if(view)requireValid(page.kind===view.kind&&canonical(page.manifest)===canonical(view.manifest)&&BigInt(page.revision)>=BigInt(view.revision));view=page;
   if(!page.chunk)break;const ch=page.chunk,d=page.manifest.chunks[ch.index];
   requireValid(Number.isInteger(ch.index)&&ch.index>after&&d?.index===ch.index&&d.sha256===ch.sha256&&new TextEncoder().encode(ch.body).length===d.bytes&&await customTransferTextHashV2(ch.body)===d.sha256);c.guard();
   bytes+=d.bytes;requireValid(bytes<=8388608);bodies.set(ch.index,ch.body);after=ch.index;requireValid(n<128);
  }
  const complete=view!.manifest.chunks.every((d,i)=>d.index===i&&bodies.has(i));
  requireValid(!['complete','published','ready-to-publish'].includes(view!.state)||complete);
  return {view:view!,bodies,complete};
 }
 private async send(id:string,action:CustomTransferRequestV2['action'],extra:Record<string,unknown>={}){
  const c=this.capture();if(!this.transport.transferApply||!this.transport.transferReceipt)throw new Error('V2 migration/transport unavailable');
  const snapshot=await this.repo.syncSnapshot(c.workspace);c.guard();const consent=snapshot.state.consent;requireValid(consent?.version===1&&consent.accepted);
  const request=await this.repo.changeCoordination(c.workspace,c.guard,s=>{
   const p=s.transfers?.[id];requireValid(p&&p.owner===c.owner&&p.workspace===c.workspace);
   const pending=p.requests.find(r=>!p.receipts[r.operationId]&&(action!=='cancel'||r.action==='cancel'));if(pending)return pending;
   const op={schemaVersion:2,transferId:id,operationId:id+':'+p.requests.length,expectedRevision:p.revision,action,...extra} as CustomTransferRequestV2;
   assertCustomTransferEnvelopeV2(op);p.requests.push(op);return op;
  });c.guard();
  let stored=await this.receive(c,this.transport.transferReceipt(c.owner,request.operationId));
  if(!stored){const live=await this.repo.syncSnapshot(c.workspace);c.guard();requireValid(live.state.consent?.accepted&&live.state.consent.revision===consent.revision);
   const response=await this.receive(c,this.transport.transferApply(c.owner,request));
   stored=await this.receive(c,this.transport.transferReceipt(c.owner,request.operationId));requireValid(stored&&canonical(stored.result)===canonical(response));
  }
  const result=stored.result;requireValid(stored.user_id===c.owner&&stored.operation_id===request.operationId&&stored.request_hash===await customTransferTextHashV2(transferRequestJsonbTextV2(request)));c.guard();
  requireValid(result.schemaVersion===2&&result.transferId===id&&result.operationId===request.operationId&&validServerRevision(result.revision)&&BigInt(result.revision)===BigInt(request.expectedRevision)+1n&&['staging','ready-to-publish','published','complete','blocked','cancelled'].includes(result.state));
  await this.repo.changeCoordination(c.workspace,c.guard,s=>{const p=s.transfers![id];requireValid(result.kind===p.kind);p.receipts[request.operationId]=result;if(BigInt(result.revision)>BigInt(p.revision)){p.revision=result.revision;p.state=result.state;if(result.reason)p.failure=result.reason;else delete p.failure;}});
  return result;
 }
 async run(id:string,beforePublish?:()=>Promise<void>):Promise<CustomTransferReceiptV2['state']>{
  const c=this.capture();let p=await this.checkpoint(id);requireValid(p&&p.protocolVersion===2&&p.owner===c.owner&&p.workspace===c.workspace&&p.bodies.length===p.manifest.chunks.length);
  for(let i=0;i<p.bodies.length;i++){const d=p.manifest.chunks[i];requireValid(d.index===i&&new TextEncoder().encode(p.bodies[i]).length===d.bytes&&await customTransferTextHashV2(p.bodies[i])===d.sha256);c.guard();}
  for(const request of p.requests)assertCustomTransferEnvelopeV2(request);
  let remote=await this.inspect(id);c.guard();
  if(remote){requireValid(canonical(remote.view.manifest)===canonical(p.manifest));for(const [i,body]of remote.bodies)requireValid(body===p.bodies[i]);}
  // A frozen request must be recovered/verified even if its ACK was lost after a terminal commit.
  if(p.requests.some(r=>!p!.receipts[r.operationId])){await this.send(id,'begin');p=await this.checkpoint(id);remote=await this.inspect(id);}
  if(!remote){await this.send(id,'begin',{kind:p!.kind,manifest:p!.manifest});remote=await this.inspect(id);}
  requireValid(remote);await this.repo.changeCoordination(c.workspace,c.guard,s=>{const x=s.transfers![id];x.revision=remote!.view.revision;x.state=remote!.view.state;});
  if(['published','complete','cancelled'].includes(remote.view.state))return remote.view.state;
  requireValid(remote.view.state!=='blocked'||remote.view.reason==='incomplete-chunks');
  for(let i=0;i<p!.bodies.length;i++)if(!remote.bodies.has(i)){c.guard();await this.send(id,'chunk',{index:i,body:p!.bodies[i]});c.guard();}
  c.guard();
  if(p!.kind==='branch-archive')return (await this.send(id,'complete')).state;
  let current=await this.inspect(id);requireValid(current);
  if(current.view.state!=='ready-to-publish'){const r=await this.send(id,'validate');if(r.state!=='ready-to-publish')return r.state;}
  c.guard();if(beforePublish)await beforePublish();c.guard();return (await this.send(id,'publish')).state;
 }
 async cancel(id:string){const c=this.capture(),remote=await this.inspect(id);c.guard();requireValid(remote&&!['published','complete','cancelled'].includes(remote.view.state));await this.repo.changeCoordination(c.workspace,c.guard,s=>{const p=s.transfers?.[id];requireValid(p);p.revision=remote.view.revision;p.state=remote.view.state;});return this.send(id,'cancel');}
}

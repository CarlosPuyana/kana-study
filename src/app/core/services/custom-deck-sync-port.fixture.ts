import {CustomDeckTransport,CustomRemoteStoredReceipt} from './custom-deck-sync-transport';
import {CustomRemoteBundle,CustomRemoteEntity,CustomRemoteOperation,CustomRemoteReceipt} from '../models/custom-deck-sync.model';
import {CustomTransferRequestV2,CustomTransferReceiptV2,CustomTransferStoredReceiptV2,CustomTransferViewV2} from '../models/custom-transfer-v2.model';
import {customTransferTextHashV2,transferRequestJsonbTextV2} from './custom-transfer-v2-contract';
import {projectTransferOperation} from './custom-guest-transfer-builder';
/** Deliberately small transport double. SQL behavior is verified separately in the real browser harness. */
export class Port implements CustomDeckTransport {
  user:string|null="00000000-0000-0000-0000-000000000001";rows:CustomRemoteEntity[]=[];clock=0;calls=0;lose=false;wrong=false;
  receipts=new Map<string,CustomRemoteStoredReceipt>();
  transferCalls=0;transferLose:string|undefined;transfers=new Map<string,{view:CustomTransferViewV2;bodies:Map<number,string>}>();transferReceipts=new Map<string,CustomTransferStoredReceiptV2>();
  async transferReceipt(owner:string,id:string){return this.owned(owner,this.transferReceipts.get(id)??null);}
  async transferGet(owner:string,id:string,after:number){const t=this.transfers.get(id);return this.owned(owner,t?{...t.view,chunk:[...t.bodies].filter(([i])=>i>after).sort(([a],[b])=>a-b).map(([index,body])=>({index,body,sha256:t.view.manifest.chunks[index].sha256}))[0]??null}:null);}
  async transferApply(owner:string,op:CustomTransferRequestV2){
   this.transferCalls++;const hash=await customTransferTextHashV2(transferRequestJsonbTextV2(op)),old=this.transferReceipts.get(op.operationId);if(old){if(old.request_hash!==hash)throw new Error('request changed');return this.owned(owner,old.result);}
   let t=this.transfers.get(op.transferId);if((t?.view.revision??'0')!==op.expectedRevision)throw new Error('transfer CAS');
   if(op.action==='begin'){t={view:{schemaVersion:2,transferId:op.transferId,kind:op.kind,state:'staging',revision:'1',reason:null,manifest:structuredClone(op.manifest),chunk:null},bodies:new Map()};this.transfers.set(op.transferId,t);}
   else{if(!t)throw new Error('missing transfer');
    if(op.action==='chunk')t.bodies.set(op.index,op.body);
    else if(op.action==='cancel')t.view.state='cancelled';
    else if(op.action==='complete')t.view.state='complete';
    else{
     const before={rows:structuredClone(this.rows),clock:this.clock,receipts:new Map(this.receipts)};
     try{
      if(t.view.manifest.chunks.length!==t.bodies.size)throw new Error('incomplete');
      if(t.view.kind==='guest-import'&&'baseServerRevision'in t.view.manifest&&t.view.manifest.baseServerRevision!==String(this.clock))throw new Error('generation changed');
      for(const [,body]of [...t.bodies].sort(([a],[b])=>a-b))for(const r of JSON.parse(body))if(r.type==='operation'){
       const operation=r.value as CustomRemoteOperation;if(this.receipts.has(operation.operationId))throw new Error('operation used');
       const start=this.clock;this.clock=Number(projectTransferOperation(operation,this.rows,BigInt(start)));
       for(const m of this.rows.filter(e=>e.kind==='manifest'))(m.payload as {references:unknown}).references=this.rows.filter(e=>e.kind!=='manifest').map(e=>({kind:e.kind,id:e.id,revision:e.revision}));
       this.receipts.set(operation.operationId,{user_id:owner,request:structuredClone(operation),result:{schemaVersion:1,operationId:operation.operationId,status:'accepted',reason:null,serverRevision:String(this.clock),entities:structuredClone(this.rows.filter(e=>BigInt(e.revision)>BigInt(start)))}});
      }
      t.view.state=op.action==='validate'?'ready-to-publish':'published';
     }catch{t.view.state='blocked';}
     if(op.action==='validate'||t.view.state==='blocked'){this.rows=before.rows;this.clock=before.clock;this.receipts=before.receipts;}
    }t.view.revision=String(BigInt(t.view.revision)+1n);
   }
   const result={...t!.view,operationId:op.operationId} as CustomTransferReceiptV2;this.transferReceipts.set(op.operationId,{user_id:owner,operation_id:op.operationId,request_hash:hash,result:structuredClone(result)});
   if(this.transferLose===op.action){this.transferLose=undefined;throw new Error('V2 ACK lost');}return this.owned(owner,result);
  }
  principal=()=>this.user;
  owned<T>(owner:string,value:T){return {owner:this.wrong?'wrong-owner':owner,value:structuredClone(value)};}
  async receipt(owner:string,id:string){return this.owned(owner,this.receipts.get(id)??null);}
  async apply(owner:string,op:CustomRemoteOperation){
    this.calls++;let receipt=this.receipts.get(op.operationId);
    if(!receipt){
      const conflict=op.changes.some(c=>(this.rows.find(e=>e.kind===c.kind&&e.id===c.id)?.revision??'0')!==c.baseRevision);
      const entities:CustomRemoteEntity[]=[];
      if(!conflict)for(const c of op.changes){const e:CustomRemoteEntity={...c,payload:structuredClone(c.kind==='card'?{...c.payload as never as Record<string,unknown>,order:1} as never:c.payload),revision:String(++this.clock),deleted:false,archived:false,head:null,voidedBy:null};
        this.rows=this.rows.filter(x=>x.kind!==e.kind||x.id!==e.id);this.rows.push(e);entities.push(e);
      }
      const manifest=this.rows.find(e=>e.kind==='manifest');if(manifest){const m=manifest.payload as {references:unknown};m.references=this.rows.filter(e=>e.kind!=='manifest').map(e=>({kind:e.kind,id:e.id,revision:e.revision}));}
      const result:CustomRemoteReceipt={schemaVersion:1,operationId:op.operationId,status:conflict?'conflict':'accepted',reason:conflict?'revision-conflict':null,serverRevision:String(this.clock),entities};
      receipt={user_id:owner,request:structuredClone(op),result:structuredClone(result)};this.receipts.set(op.operationId,receipt);
    }
    if(this.lose){this.lose=false;throw new Error('Response lost after commit');}return this.owned(owner,receipt.result);
  }
  async changes(owner:string,cursor:string,size:number){return this.owned(owner,{schemaVersion:1 as const,serverRevision:String(this.clock),entities:this.rows.filter(e=>BigInt(e.revision)>BigInt(cursor)).sort((a,b)=>Number(BigInt(a.revision)-BigInt(b.revision))).slice(0,size)});}
  async bundle(owner:string,id:string){const manifest=this.rows.find(e=>e.kind==='manifest'&&e.id===id);return this.owned(owner,manifest?{schemaVersion:1,status:'complete',manifest,entities:this.rows.filter(e=>e.kind!=='manifest')} as CustomRemoteBundle:null);}
}

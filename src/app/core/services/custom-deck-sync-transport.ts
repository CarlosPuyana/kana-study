import { inject, Injectable, InjectionToken, signal } from '@angular/core';
import { CustomRemoteBundle, CustomRemoteChangesPage, CustomRemoteOperation, CustomRemoteReceipt, CustomRemoteStoredReceipt } from '../models/custom-deck-sync.model';
import { AuthService } from './auth.service';
import { SupabaseClientService } from './supabase-client.service';
import { requireValid } from './custom-deck-validation';
import type {CustomRemoteConflictEvidence} from '../models/custom-conflict-recovery.model';
import type {CustomTransferRequestV2,CustomTransferReceiptV2,CustomTransferViewV2,CustomTransferStoredReceiptV2} from '../models/custom-transfer-v2.model';

export interface CustomOwned<T> { owner:string; value:T; }
export type {CustomRemoteStoredReceipt} from '../models/custom-deck-sync.model';
export interface CustomDeckTransport {
  principal():string|null;
  apply(owner:string,operation:CustomRemoteOperation):Promise<CustomOwned<CustomRemoteReceipt>>;
  receipt(owner:string,id:string):Promise<CustomOwned<CustomRemoteStoredReceipt|null>>;
  confirmationReceipt?(owner:string,id:string):Promise<CustomOwned<CustomRemoteStoredReceipt|null>>;
  changes(owner:string,cursor:string,size:number):Promise<CustomOwned<CustomRemoteChangesPage>>;
  bundle(owner:string,deckId:string):Promise<CustomOwned<CustomRemoteBundle|null>>;
  conflictEvidence?(owner:string,after:string|null,size:number):Promise<CustomOwned<CustomRemoteConflictEvidence[]>>;
  conflictResolutions?(owner:string,id:string):Promise<CustomOwned<CustomRemoteStoredReceipt[]>>;
  transferApply?(owner:string,op:CustomTransferRequestV2):Promise<CustomOwned<CustomTransferReceiptV2>>;
  transferGet?(owner:string,id:string,after:number):Promise<CustomOwned<CustomTransferViewV2|null>>;
  transferReceipt?(owner:string,id:string):Promise<CustomOwned<CustomTransferStoredReceiptV2|null>>;
}
import {CUSTOM_REMOTE_UPLOAD_APPROVED} from './custom-deck-gates';
export {CUSTOM_DECK_SYNC_ENABLED,CUSTOM_REMOTE_UPLOAD_APPROVED} from './custom-deck-gates';
/** No scheduling, account activation or development token is part of this transport. */
@Injectable({providedIn:'root'})
export class SupabaseCustomDeckTransport implements CustomDeckTransport {
  private readonly auth=inject(AuthService);
  private readonly supabase=inject(SupabaseClientService);
  private readonly uploadApproved=inject(CUSTOM_REMOTE_UPLOAD_APPROVED);
  principal(){return this.auth.user()?.id??null;}
  private async client(owner:string){
    requireValid(this.principal()===owner);const client=await this.supabase.getClient();requireValid(client&&this.principal()===owner);
    const {data,error}=await client.auth.getSession();requireValid(!error&&data.session?.user.id===owner&&this.principal()===owner&&data.session.access_token);return {client,accessToken:data.session.access_token};
  }
  private async rpc<T>(owner:string,name:string,args:Record<string,unknown>):Promise<CustomOwned<T>>{
    const {client,accessToken}=await this.client(owner);requireValid(this.principal()===owner);const {data,error}=await client.rpc(name,args).setHeader('Authorization',`Bearer ${accessToken}`);requireValid(this.principal()===owner);if(error)throw error;return {owner,value:data as T};
  }
  apply(owner:string,op:CustomRemoteOperation){requireValid(this.uploadApproved);return this.rpc<CustomRemoteReceipt>(owner,'apply_custom_deck_operation_v1',{op});}
  changes(owner:string,cursor:string,size:number){return this.rpc<CustomRemoteChangesPage>(owner,'get_custom_deck_changes_v1',{after_revision:cursor,page_size:size});}
  bundle(owner:string,deck:string){return this.rpc<CustomRemoteBundle|null>(owner,'get_custom_deck_bundle_v1',{deck});}
  transferApply(owner:string,op:CustomTransferRequestV2){requireValid(this.uploadApproved);return this.rpc<CustomTransferReceiptV2>(owner,'apply_custom_transfer_v2',{op});}
  transferGet(owner:string,id:string,after:number){return this.rpc<CustomTransferViewV2|null>(owner,'get_custom_transfer_v2',{transfer_id:id,after_index:after});}
  async transferReceipt(owner:string,id:string):Promise<CustomOwned<CustomTransferStoredReceiptV2|null>>{
    const {client,accessToken}=await this.client(owner);const {data,error}=await client.from('custom_transfer_receipts_v2').select('user_id,operation_id,request_hash,result').eq('user_id',owner).eq('operation_id',id).maybeSingle().setHeader('Authorization',`Bearer ${accessToken}`);
    requireValid(this.principal()===owner);if(error)throw error;return {owner,value:data as CustomTransferStoredReceiptV2|null};
  }
  async receipt(owner:string,id:string):Promise<CustomOwned<CustomRemoteStoredReceipt|null>>{
    const {client,accessToken}=await this.client(owner);requireValid(this.principal()===owner);const {data,error}=await client.from('custom_sync_receipts_v1').select('user_id,request,result').eq('user_id',owner).eq('operation_id',id).maybeSingle().setHeader('Authorization',`Bearer ${accessToken}`);
    requireValid(this.principal()===owner);if(error)throw error;return {owner,value:data as CustomRemoteStoredReceipt|null};
  }
  async confirmationReceipt(owner:string,id:string):Promise<CustomOwned<CustomRemoteStoredReceipt|null>>{
    const {client,accessToken}=await this.client(owner);requireValid(this.principal()===owner);
    const {data,error}=await client.from('custom_sync_receipts_v1').select('user_id,request,result').eq('user_id',owner)
      .contains('request',{changes:[{kind:'confirmation',id}]}).eq('result->>status','accepted').limit(1).setHeader('Authorization',`Bearer ${accessToken}`);
    requireValid(this.principal()===owner);if(error)throw error;return {owner,value:(data?.[0]??null) as CustomRemoteStoredReceipt|null};
  }
  async conflictEvidence(owner:string,after:string|null,size:number):Promise<CustomOwned<CustomRemoteConflictEvidence[]>>{
    requireValid(Number.isInteger(size)&&size>=1&&size<=8);
    const {client,accessToken}=await this.client(owner);
    let query=client.from('custom_sync_conflicts_v1').select('user_id,operation_id,reason,evidence').eq('user_id',owner).order('operation_id').limit(size);
    if(after!==null)query=query.gt('operation_id',after);
    const {data,error}=await query.setHeader('Authorization',`Bearer ${accessToken}`);requireValid(this.principal()===owner);if(error)throw error;return {owner,value:data as CustomRemoteConflictEvidence[]};
  }
  async conflictResolutions(owner:string,id:string):Promise<CustomOwned<CustomRemoteStoredReceipt[]>>{
    const {client,accessToken}=await this.client(owner);
    const {data,error}=await client.from('custom_sync_receipts_v1').select('user_id,request,result').eq('user_id',owner).contains('request',{resolvesOperationId:id}).eq('result->>status','accepted').limit(101).setHeader('Authorization',`Bearer ${accessToken}`);
    requireValid(this.principal()===owner);if(error)throw error;return {owner,value:data as CustomRemoteStoredReceipt[]};
  }
}
export const CUSTOM_DECK_TRANSPORT=new InjectionToken<CustomDeckTransport>('custom deck transport',{providedIn:'root',factory:()=>inject(SupabaseCustomDeckTransport)});

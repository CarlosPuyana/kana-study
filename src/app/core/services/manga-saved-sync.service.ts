import {inject, Injectable} from '@angular/core';
import type {SupabaseClient} from '@supabase/supabase-js';
import {SyncOutboxItem} from '../models/account.model';
import {MangaSavedChange, MangaSavedRemoteRow, validateMangaSavedItem} from '../models/manga-study-saved.model';
import {SyncDiagnosticsService} from './sync-diagnostics.service';
import {MangaStudySavedRepository} from './manga-study-saved.repository';
import {WorkspaceService} from './workspace.service';

/** A narrow adapter: the general sync runner still owns serialization and status. */
@Injectable({providedIn:'root'})
export class MangaSavedSyncService {
  private readonly saved=inject(MangaStudySavedRepository);
  private readonly workspace=inject(WorkspaceService);
  private readonly diagnostics=inject(SyncDiagnosticsService);
  private guard(userId:string):void {
    if(this.workspace.userId()!==userId)throw new Error('Manga sync workspace changed');
  }
  private async rows(client:SupabaseClient,userId:string,phase:'prepare'|'pull'='pull'):Promise<MangaSavedRemoteRow[]> {
    const rows:MangaSavedRemoteRow[]=[];
    for(let offset=0;;offset+=500){
      this.guard(userId);
      const data=await this.diagnostics.run(phase,'manga_saved_items',async()=>{
        const {data,error}=await client.from('manga_saved_items').select('*').eq('user_id',userId).order('item_id',{ascending:true}).range(offset,offset+499);
        if(error)throw error;return data;
      });this.guard(userId);
      rows.push(...(data??[]) as MangaSavedRemoteRow[]);
      if((data?.length??0)<500)return rows;
    }
  }
  async prepare(client:SupabaseClient,userId:string):Promise<void> {
    const rows=await this.rows(client,userId,'prepare'),workspace=`user:${userId}` as const;
    this.guard(userId);
    await this.saved.bootstrap(rows,workspace);this.guard(userId);
    await this.saved.mergeFromCloud(rows,workspace);this.guard(userId);
    await this.diagnostics.run('journal-recovery','manga-indexeddb',()=>this.saved.recoverPending(workspace));this.guard(userId);
  }
  async push(client:SupabaseClient,userId:string,items:readonly SyncOutboxItem[]):Promise<void> {
    const workspace=`user:${userId}` as const;
    for(const item of items.filter(item=>item.entityType==='manga-saved-item')){
      this.guard(userId);
      const state=(await this.saved.pending(workspace)).find(state=>state.id===item.entityKey);
      this.guard(userId);
      if(state?.pending&&state.pending.token!==item.revision)continue;
      // A previous RPC may have cleared the journal before outbox cleanup failed.
      // Verify that durable operation again instead of assuming it was confirmed.
      const change=state?.pending??item.payload as MangaSavedChange;
      if(!change||change.token!==item.revision||!Number.isSafeInteger(change.baseRevision)||change.baseRevision<0||!['explicit','bootstrap','import'].includes(change.kind))throw new Error('Invalid Manga operation');
      if(change.item!==null&&validateMangaSavedItem(change.item).id!==item.entityKey)throw new Error('Invalid Manga identity');
      await this.diagnostics.run('push','apply_manga_saved_change_v1',async()=>{
      const {data,error}=await client.rpc('apply_manga_saved_change_v1',{
        p_item_id:item.entityKey,p_expected_revision:change.baseRevision,p_operation:change.token,
        p_payload:change.item,p_delete:change.item===null,p_initial:change.kind!=='explicit',
      });
      this.diagnostics.responded(item);
      if(error)throw error;this.guard(userId);
      const row=(Array.isArray(data)?data[0]:data) as MangaSavedRemoteRow | undefined;
      if(!row||row.item_id!==item.entityKey)throw new Error('Manga change was not confirmed');
      await this.diagnostics.run('manga-ack','manga-indexeddb',()=>this.saved.mergeFromCloud([row],workspace,new Map([[item.entityKey,change.token]])));this.guard(userId);
      this.diagnostics.confirmed(item);
      },item);
    }
  }
  async pull(client:SupabaseClient,userId:string):Promise<void> {
    const rows=await this.rows(client,userId);this.guard(userId);
    await this.saved.mergeFromCloud(rows,`user:${userId}`);this.guard(userId);
  }
}

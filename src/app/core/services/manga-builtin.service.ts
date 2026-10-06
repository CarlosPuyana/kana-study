import {DOCUMENT} from '@angular/common';
import {inject, Injectable, isDevMode} from '@angular/core';
import {LocalWorkspaceId} from '../models/account.model';
import {MangaRepository} from './manga.repository';
import {MangaImportService} from './manga-import.service';
import {WorkspaceService} from './workspace.service';

export const BUILTIN_MANGA_ID='builtin:hajimete-no-irai:v1';
export const BUILTIN_MANGA_ASSET='manga/default/hajimete-no-irai.zip';

/** Invoked only by Manga library; no constructor/boot-time network work. */
@Injectable({providedIn:'root'})
export class MangaBuiltinService {
  private readonly repository=inject(MangaRepository);
  private readonly importer=inject(MangaImportService);
  private readonly workspace=inject(WorkspaceService);
  private readonly document=inject(DOCUMENT);
  private readonly pending=new Map<LocalWorkspaceId,Promise<boolean>>();
  ensure(workspace=this.workspace.active()):Promise<boolean>{
    const existing=this.pending.get(workspace);if(existing)return existing;
    const operation=()=>this.provision(workspace);
    // Serialize the check/download across tabs too, independently of the import lock.
    const task=navigator.locks?.request?navigator.locks.request(`kana-study-manga-builtin:${workspace}`,operation):operation();
    this.pending.set(workspace,task);
    void task.finally(()=>{this.pending.delete(workspace);}).catch(()=>undefined);
    return task;
  }
  private async provision(workspace:LocalWorkspaceId):Promise<boolean>{
    let stage='IndexedDB';
    const url=new URL(BUILTIN_MANGA_ASSET,this.document.baseURI);
    try{
      const state=await this.repository.provisioningState(BUILTIN_MANGA_ID,workspace);
      if(state?.deletedAt)return false;
      const volume=await this.repository.volume(BUILTIN_MANGA_ID,workspace);
      if(volume?.complete){if(!state?.provisionedAt)await this.repository.completeBuiltin(volume,workspace);return false;}
      // Legacy marker without a stored volume is a failed installation, not an explicit deletion.
      stage='fetch';
      const response=await fetch(url);
      if(!response.ok)throw new Error(`Included manga HTTP ${response.status}: ${url.pathname}`);
      const blob=await response.blob();stage='ZIP/Mokuro/IndexedDB import';
      await this.importer.importBuiltin(blob,BUILTIN_MANGA_ID,workspace,'はじめての依頼 — Vol. 1');
      stage='IndexedDB verification';
      if(!(await this.repository.volume(BUILTIN_MANGA_ID,workspace))?.complete)throw new Error('Included manga was not persisted');
      return true;
    }catch(error){
      if(isDevMode())console.error('[Manga builtin] Provisioning failed',{stage,workspace,database:this.workspace.databaseName('kana-study-manga',workspace),url:url.href,error});
      throw error;
    }
  }
}

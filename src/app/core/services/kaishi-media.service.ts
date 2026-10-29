import { DestroyRef, Injectable, InjectionToken, effect, inject, signal, untracked } from '@angular/core';
import { KAISHI_PACKAGE, KaishiErrorCode, KaishiImportPhase, KaishiInstallation } from '../models/kaishi-media.model';
import { KaishiMediaStore } from './kaishi-media-store';
import { WorkspaceService } from './workspace.service';
export const KAISHI_MEDIA_STORE=new InjectionToken<KaishiMediaStore>('kaishi device media',{providedIn:'root',factory:()=>new KaishiMediaStore()});
export const KAISHI_MEDIA_WORKER=new InjectionToken<()=>Worker>('kaishi worker',{providedIn:'root',factory:()=>()=>new Worker(new URL('./kaishi-media.worker',import.meta.url),{type:'module'})});
const PENDING='kana-study.kaishi.pending.v1',PITCH='kana-study.kaishi-pitch.v1',AUTO='kana-study.kaishi-auto-audio.v1';
@Injectable({providedIn:'root'})
export class KaishiMediaService {
  readonly store=inject(KAISHI_MEDIA_STORE);
  private readonly makeWorker=inject(KAISHI_MEDIA_WORKER);
  private readonly workspace=inject(WorkspaceService);
  readonly phase=signal<KaishiImportPhase>('idle');readonly count=signal(0);readonly error=signal<KaishiErrorCode|null>(null);
  readonly installation=signal<KaishiInstallation|null>(null);readonly revision=signal(0);readonly pitch=signal(this.readPitch());readonly preferenceError=signal(false);readonly autoAudio=signal(this.readAutoAudio());
  private worker?:Worker;private operation?:string;private serial=0;
  private readonly channel=typeof BroadcastChannel==='undefined'?null:new BroadcastChannel('kana-study-kaishi-media-v1');
  readonly busy=()=>this.phase()==='checking'||this.phase()==='installing';
  constructor(){
    this.channel?.addEventListener('message',()=>{void this.refresh();});
    let activation=this.workspace.activationRevision();
    effect(()=>{this.workspace.active();const next=this.workspace.activationRevision();untracked(()=>{this.pitch.set(this.readPitch());this.autoAudio.set(this.readAutoAudio());if(next!==activation&&this.busy())void this.cancel();activation=next;});});
    const pagehide=()=>{this.worker?.terminate();};window.addEventListener('pagehide',pagehide);
    inject(DestroyRef).onDestroy(()=>{this.serial++;this.worker?.terminate();if(this.operation)void this.store.discard(this.operation).finally(()=>this.store.close()).catch(()=>{});else this.store.close();this.channel?.close();window.removeEventListener('pagehide',pagehide);});
    void this.recover().then(()=>this.refresh());
  }
  private readPitch():boolean {try{return localStorage.getItem(this.workspace.storageKey(PITCH))!=='false';}catch{return true;}}
  setPitch(value:boolean):void {try{localStorage.setItem(this.workspace.storageKey(PITCH),String(value));this.pitch.set(value);this.preferenceError.set(false);}catch{this.preferenceError.set(true);}}
  private readAutoAudio():boolean {try{return localStorage.getItem(this.workspace.storageKey(AUTO))!=='false';}catch{return true;}}
  setAutoAudio(value:boolean):void {try{localStorage.setItem(this.workspace.storageKey(AUTO),String(value));this.autoAudio.set(value);this.preferenceError.set(false);}catch{this.preferenceError.set(true);}}
  async refresh():Promise<void>{try{this.installation.set(await this.store.active());this.revision.update(n=>n+1);}catch{this.error.set('storage');}}
  private async recover():Promise<void>{
    try{const id=sessionStorage.getItem(PENDING);if(!id||!/^[a-f0-9-]{36}$/.test(id))return;
      if(navigator.locks)await navigator.locks.request('kaishi-media:'+id,{ifAvailable:true},async lock=>{if(lock)await this.store.discard(id);});
      else if((performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined)?.type==='reload')await this.store.discard(id);
      sessionStorage.removeItem(PENDING);
    }catch{/* An unavailable session store cannot make staged content visible. */}
  }
  async start(file:File):Promise<void>{
    if(this.busy())return;if(this.operation){await this.cancel();if(this.operation){this.fail('storage');return;}}const serial=++this.serial;this.phase.set('checking');this.error.set(null);this.count.set(0);
    if(file.size!==KAISHI_PACKAGE.bytes){this.fail('package');return;}
    try{
      const estimate=await navigator.storage?.estimate?.().catch(()=>undefined);
      if(serial!==this.serial)return;
      if(estimate?.quota!=null&&estimate.usage!=null&&estimate.quota-estimate.usage<Math.ceil(KAISHI_PACKAGE.unpackedBytes*1.15)){this.fail('quota');return;}
      const id=crypto.randomUUID();this.operation=id;
      try{sessionStorage.setItem(PENDING,id);}catch{}
      this.worker=this.makeWorker();
      this.worker.onmessage=event=>{if(serial!==this.serial)return;const message=event.data as {phase:KaishiImportPhase;count?:number;code?:KaishiErrorCode};
        if(message.phase==='installing'){this.phase.set('installing');this.count.set(message.count??0);}
        else if(message.phase==='installed'){this.phase.set('installed');this.count.set(KAISHI_PACKAGE.resources);this.operation=undefined;this.clearPending();void this.refresh();this.channel?.postMessage('changed');}
        else if(message.phase==='error'){void this.cancel().then(()=>this.fail(message.code??'storage'));}
      };
      this.worker.onerror=()=>{if(serial===this.serial)void this.cancel().then(()=>this.fail('worker'));};
      this.worker.postMessage({id,file});
    }catch{await this.cancel();this.fail('worker');}
  }
  private fail(code:KaishiErrorCode):void{this.error.set(code);this.phase.set('error');}
  private clearPending():void{try{sessionStorage.removeItem(PENDING);}catch{}}
  async cancel():Promise<void>{
    ++this.serial;this.worker?.terminate();this.worker=undefined;const id=this.operation;this.operation=undefined;
    let discarded=true;if(id)try{await this.store.discard(id);}catch{discarded=false;this.operation=id;this.error.set('storage');}
    if(discarded)this.clearPending();await this.refresh();this.phase.set(id!=null&&this.installation()?.id===id?'installed':'cancelled');
  }
  async remove():Promise<void>{if(this.busy())return;try{const active=await this.store.active();if(active)await this.store.discard(active.id,true);this.phase.set('idle');this.error.set(null);await this.refresh();this.channel?.postMessage('changed');}catch{this.fail('storage');}}
}

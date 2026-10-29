import * as studyCopy from '../../../../assets/i18n/deck-study.generated';
import {ChangeDetectionStrategy,Component,effect,inject,input,signal,untracked} from '@angular/core';
import {JapaneseWordDeckEntry} from '../../../core/models/japanese-word-deck-entry.model';
import {KaishiMediaKind} from '../../../core/models/kaishi-media.model';
import {KaishiStaticResource,kaishiResourceAllowed} from '../../../core/models/kaishi-static-media.model';
import {KaishiMediaService} from '../../../core/services/kaishi-media.service';
import {KaishiStaticMediaService} from '../../../core/services/kaishi-static-media.service';
import {WorkspaceService} from '../../../core/services/workspace.service';
import {TranslationService} from '../../../core/services/translation.service';
import {kaishiPitch} from '../../../core/services/kaishi-pitch';
type Source={blob?:Blob;remote?:KaishiStaticResource};
@Component({selector:'app-kaishi-card-media',templateUrl:'./kaishi-card-media.html',styleUrl:'./kaishi-card-media.scss',changeDetection:ChangeDetectionStrategy.OnPush,host:{'[class.practice-media]':"layout()==='practice'",'(window:pagehide)':'cancelAutomatic()', '(document:visibilitychange)':'visibilityChanged()'}})
export class KaishiCardMedia {
 readonly layout=input<'study'|'practice'>('study');readonly entry=input.required<JapaneseWordDeckEntry>();readonly active=input(true);readonly automatic=input(true);readonly media=inject(KaishiMediaService);readonly i18n=inject(TranslationService);
 private readonly remote=inject(KaishiStaticMediaService);private readonly workspace=inject(WorkspaceService);
 readonly urls=signal<Partial<Record<KaishiMediaKind,string>>>({});readonly sources=signal<Partial<Record<KaishiMediaKind,Source>>>({});
 readonly playing=signal<KaishiMediaKind|null>(null);readonly preparing=signal<KaishiMediaKind|null>(null);readonly audioError=signal<'blocked'|'failed'|null>(null);readonly failed=signal(false);readonly loading=signal(true);readonly testResources=signal(false);readonly blocked=signal(false);
 readonly parts=()=>this.media.pitch()?kaishiPitch(this.entry().pitchAccentHtml):[];
 private readonly refresh=signal(0);private explicitRetry=false;private reload=false;private generation=0;private playback=0;
 private appearanceKey='';private autoConsumed=false;private finishAudio?: (value:boolean)=>void;
 private audio:HTMLAudioElement|null=null;private audioRequest?:AbortController;private owned=new Set<string>();
 constructor(){this.i18n.useStudyCopy?.(studyCopy);effect(onCleanup=>{
  const id=this.entry().id,key=id+':'+this.workspace.active()+':'+this.workspace.activationRevision();this.media.revision();this.refresh();
  if(key!==this.appearanceKey){this.appearanceKey=key;this.autoConsumed=false;}
  const generation=++this.generation,controller=new AbortController(),owned=new Set<string>();this.owned=owned;
  this.reload=this.explicitRetry;this.explicitRetry=false;this.stop();this.urls.set({});this.sources.set({});this.failed.set(false);this.loading.set(true);this.blocked.set(false);this.testResources.set(false);
  void this.load(id,generation,controller.signal,this.reload);
  onCleanup(()=>{controller.abort();++this.generation;this.stop();for(const url of owned)URL.revokeObjectURL(url);});
 });
 effect(()=>{const enabled=this.media.autoAudio(),active=this.active();if(!enabled||!active)untracked(()=>this.cancelAutomatic());});
 }
 private async load(id:string,generation:number,signal:AbortSignal,retry:boolean):Promise<void>{
  const kinds=(['wordAudio','sentenceAudio','picture'] as const).filter(kind=>kaishiResourceAllowed(id,kind));
  try{
   const local=await Promise.all(kinds.map(async kind=>({kind,blob:await this.media.store.resource(id,kind).catch(()=>null)})));
   if(signal.aborted||generation!==this.generation)return;
   const sources:Partial<Record<KaishiMediaKind,Source>>={};for(const item of local)if(item.blob)sources[item.kind]={blob:item.blob};this.sources.set({...sources});

   if(kinds.some(kind=>!sources[kind])){
    try{const result=await this.remote.card(id,signal,retry);if(signal.aborted||generation!==this.generation)return;
    this.blocked.set(result.catalog.publication==='blocked');let usedStatic=false;
    for(const kind of kinds){const ref=result.card?.resources[kind];if(!sources[kind]&&ref){sources[kind]={remote:ref};usedStatic=true;}}
    this.testResources.set(usedStatic&&result.catalog.dataset==='test');this.sources.set({...sources});
    }catch(error){if(signal.aborted||generation!==this.generation)return;this.failed.set(true);}

   }
   this.attemptAutomatic();
   if(sources.picture)await this.image(sources.picture,generation,signal,retry);
  }catch{if(!signal.aborted&&generation===this.generation){this.autoConsumed=true;this.failed.set(true);}}
  finally{if(!signal.aborted&&generation===this.generation)this.loading.set(false);}
 }
 private async blob(source:Source,signal:AbortSignal,retry:boolean):Promise<Blob>{return source.blob??this.remote.resource(source.remote!,signal,retry);}
 private async image(source:Source,generation:number,signal:AbortSignal,retry:boolean):Promise<void>{
  const blob=await this.blob(source,signal,retry);if(signal.aborted||generation!==this.generation)return;const url=URL.createObjectURL(blob);this.owned.add(url);this.urls.update(old=>({...old,picture:url}));
 }
 retry():void{this.explicitRetry=true;this.refresh.update(n=>n+1);}
 visibilityChanged():void{if(document.hidden)this.cancelAutomatic();}
 cancelAutomatic():void{this.autoConsumed=true;this.stop();}
 stop():void{
  ++this.playback;this.audioRequest?.abort();this.audioRequest=undefined;
  this.finishAudio?.(false);this.finishAudio=undefined;
  if(this.audio){this.audio.onended=null;this.audio.onerror=null;this.audio.pause();this.audio.removeAttribute('src');this.audio.load();}
  this.preparing.set(null);this.playing.set(null);
 }
 private attemptAutomatic():void{
  if(this.autoConsumed)return;this.autoConsumed=true;
  if(!this.media.autoAudio()||!this.automatic()||!this.active()||document.hidden)return;
  this.stop();const token=this.playback;
  void this.sequence(token);
 }
 private async sequence(token:number):Promise<void>{
  for(const kind of ['wordAudio','sentenceAudio'] as const){
   if(token!==this.playback||!this.active()||document.hidden)return;
   if(!this.sources()[kind])continue;
   const ended=await this.startClip(kind,token);
   if(!ended||!await ended.done)return;
  }
 }
 async play(kind:'wordAudio'|'sentenceAudio'):Promise<void>{
  this.autoConsumed=true;this.stop();await this.startClip(kind,this.playback);
 }
 private async startClip(kind:'wordAudio'|'sentenceAudio',token:number):Promise<{done:Promise<boolean>}|null>{
  const source=this.sources()[kind];if(!source||!this.active()||document.hidden)return null;
  const generation=this.generation,request=new AbortController();this.audioRequest=request;
  this.preparing.set(kind);this.audioError.set(null);
  try{
   let url=this.urls()[kind];
   if(!url){const blob=await this.blob(source,request.signal,this.reload);if(request.signal.aborted||generation!==this.generation||token!==this.playback)return null;url=URL.createObjectURL(blob);this.owned.add(url);this.urls.update(old=>({...old,[kind]:url}));}
   if(request.signal.aborted||generation!==this.generation||token!==this.playback)return null;
   const audio=this.audio??new Audio();this.audio=audio;audio.src=url;
   const done=new Promise<boolean>(resolve=>{this.finishAudio=resolve;});
   audio.onended=()=>{if(token===this.playback){this.playing.set(null);this.finishAudio?.(true);this.finishAudio=undefined;}};
   audio.onerror=()=>{if(token===this.playback){this.audioError.set('failed');this.stop();}};
   await audio.play();
   if(request.signal.aborted||token!==this.playback||generation!==this.generation)return null;
   this.preparing.set(null);this.playing.set(kind);return {done};
  }catch(error){
   if(!request.signal.aborted&&generation===this.generation&&token===this.playback){this.audioError.set(typeof error==='object'&&error!==null&&'name' in error&&error.name==='NotAllowedError'?'blocked':'failed');this.stop();}
   return null;
  }finally{if(this.audioRequest===request)this.audioRequest=undefined;}
 }
 imageFailed(url:string):void{if(this.urls().picture!==url)return;this.urls.update(({picture,...audio})=>audio);this.failed.set(true);}
}

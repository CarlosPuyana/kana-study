import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { FuriganaText } from '../../shared/components/furigana-text/furigana-text';
import { TranslationService } from '../../core/services/translation.service';
import { PhraseAuthoringPreferences } from '../../core/services/phrase-authoring-preferences.service';
import { AUTHORING_LANGUAGES, AUTHORING_TOPICS, DEFAULT_PHRASE_SYNTHESIS, MAX_DRAFT_BYTES, canonicalJson, normalizeJapanese, parseDraftJson, validateDraft } from '../../core/models/phrase-admin-contract';
import type { PhraseAdminDraft } from '../../core/models/phrase-admin-contract';
import type { PhraseContent } from '../../core/models/phrase-island.model';
import type { AppLanguage } from '../../core/models/settings.model';
import content from '../../data/phrase-islands/phrases.v1.json';
import editorial from '../../data/phrase-islands/editorial.v1.json';
import media from '../../data/phrase-islands/audio.v1.json';
import * as islandsCopy from '../../../assets/i18n/phrase-islands.generated';
import * as adminCopy from './phrase-admin-copy.generated';

async function digest(value:unknown):Promise<string> {return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonicalJson(value))))].map(n=>n.toString(16).padStart(2,'0')).join('');}
@Component({selector:'app-phrase-islands-admin',imports:[FuriganaText],templateUrl:'./phrase-admin.page.html',styleUrl:'./phrase-admin.page.scss',changeDetection:ChangeDetectionStrategy.OnPush,host:{'(window:beforeunload)':'beforeUnload($event)'}})
export class PhraseAdminPage {
 readonly i18n=inject(TranslationService);
 readonly preferences=inject(PhraseAuthoringPreferences);
 readonly draft=signal<PhraseAdminDraft|null>(null);
 readonly dirty=signal(false);
 readonly message=signal('');
 readonly error=signal('');
 readonly audioUrl=signal<string|null>(null);
 readonly editorLanguage=signal<AppLanguage>('es');
 readonly topics=AUTHORING_TOPICS;
 readonly languages=AUTHORING_LANGUAGES;
 readonly published=content.phrases as readonly PhraseContent[];
 readonly fields=['natural','structural','explanation'] as const;
 readonly issues=computed(()=>{const d=this.draft();if(!d)return [];const issues=validateDraft(d,true);if(this.published.some(p=>p.id!==d.phrase.id&&normalizeJapanese(p.japanese)===normalizeJapanese(d.phrase.japanese)&&!!d.phrase.japanese.trim()))issues.push({code:'duplicate',field:'phrase.japanese'});if(d.base.catalogFingerprint!==this.baselineFingerprint)issues.push({code:'conflict',field:'base.catalogFingerprint'});return issues;});
 readonly structuralIssues=computed(()=>this.draft()?validateDraft(this.draft()):[]);
 readonly catalogVersion=content.version;
 private baselineFingerprint='';
 private objectUrl:string|null=null;
 private readonly player=viewChild<ElementRef<HTMLAudioElement>>('previewAudio');
 private generation=0;
 constructor(){
  this.i18n.useStudyCopy({es:{...islandsCopy.es,...adminCopy.es},en:{...islandsCopy.en,...adminCopy.en},ca:{...islandsCopy.ca,...adminCopy.ca}});
  effect(()=>{document.documentElement.dataset['theme']=this.preferences.theme();document.documentElement.lang=this.preferences.language();document.title=this.t('title');});
  const generation=this.generation;void digest({content,editorial,audio:media}).then(value=>{if(generation!==this.generation)return;this.baselineFingerprint=value;return this.newDraft(false);});
  inject(DestroyRef).onDestroy(()=>{this.generation++;this.clearAudio();});
 }
 t(key:string):string{return this.i18n.t('phraseAdmin.'+key);}
 beforeUnload(event:BeforeUnloadEvent):void{if(this.dirty()){event.preventDefault();event.returnValue='';}}
 private discardAllowed():boolean{return !this.dirty()||window.confirm(this.t('discard'));}
 async newDraft(confirm=true):Promise<void>{
  if(confirm&&!this.discardAllowed())return;this.generation++;this.clearAudio();this.error.set('');this.message.set('');
  this.draft.set({schemaVersion:1,draftId:crypto.randomUUID(),operation:'create',base:{catalogVersion:content.version,catalogFingerprint:this.baselineFingerprint,phraseFingerprint:null,contentRevision:null,audioSha256:null},phrase:{id:'pi-'+crypto.randomUUID(),topicId:'everyday',japanese:'',reading:'',segments:[],level:'N5',register:'polite',localizations:{es:{natural:'',structural:'',explanation:''},en:{natural:'',structural:'',explanation:''},ca:{natural:'',structural:'',explanation:''}}},synthesis:{...DEFAULT_PHRASE_SYNTHESIS}});this.dirty.set(false);
 }
 async selectPublished(id:string):Promise<void>{
  const phrase=this.published.find(p=>p.id===id);if(!phrase||!this.discardAllowed())return;
  const generation=++this.generation;const phraseFingerprint=await digest(phrase);if(generation!==this.generation)return;
  this.clearAudio();this.error.set('');this.message.set('');
  const reviews=editorial.records as Record<string,{contentRevision:string}>;const audio=media as Record<string,{sha256:string;path:string}>;
  this.draft.set({schemaVersion:1,draftId:crypto.randomUUID(),operation:'edit',base:{catalogVersion:content.version,catalogFingerprint:this.baselineFingerprint,phraseFingerprint,contentRevision:reviews[id].contentRevision,audioSha256:audio[id].sha256},phrase:structuredClone(phrase),synthesis:{...DEFAULT_PHRASE_SYNTHESIS}});
  this.audioUrl.set(new URL(audio[id].path,document.baseURI).href);this.dirty.set(false);
 }
 patchPhrase(patch:Partial<PhraseContent>):void{this.draft.update(d=>d?{...d,phrase:{...d.phrase,...patch}}:d);this.changed();if('japanese' in patch||'reading' in patch||'segments' in patch)this.clearAudio();}
 setText(field:'japanese'|'reading',value:string):void{this.patchPhrase({[field]:value});}
 setChoice(field:'topicId'|'level'|'register',value:string):void{this.patchPhrase({[field]:value} as Partial<PhraseContent>);}
 setLocalization(field:'natural'|'structural'|'explanation',value:string):void{
  const d=this.draft();if(!d)return;const lang=this.editorLanguage();this.patchPhrase({localizations:{...d.phrase.localizations,[lang]:{...d.phrase.localizations[lang],[field]:value}}});
 }
 addSegment():void{const d=this.draft();if(d)this.patchPhrase({segments:[...d.phrase.segments,{text:''}]});}
 removeSegment(index:number):void{const d=this.draft();if(d)this.patchPhrase({segments:d.phrase.segments.filter((_,n)=>n!==index)});}
 setSegment(index:number,field:'text'|'reading',value:string):void{
  const d=this.draft();if(!d)return;const segments=d.phrase.segments.map((s,n)=>{if(n!==index)return s;const result={...s,[field]:value};if(field==='reading'&&!value)delete result.reading;return result;});this.patchPhrase({segments});
 }
 setSpeed(value:string):void{this.draft.update(d=>d?{...d,synthesis:{...d.synthesis,speedScale:Number(value)}}:d);this.changed();this.clearAudio();}
 private changed():void{this.dirty.set(true);this.message.set('');}
 async importFile(event:Event):Promise<void>{
  const input=event.target as HTMLInputElement,file=input.files?.[0];if(!file)return;
  try{if(!this.discardAllowed())return;const generation=++this.generation;if(file.size>MAX_DRAFT_BYTES)throw Error('size');const value=parseDraftJson(await file.text());if(generation!==this.generation)return;this.clearAudio();this.draft.set(value);this.dirty.set(false);this.error.set('');this.message.set(this.t('imported'));}
  catch(error){this.error.set(this.t('invalidFile')+' '+(error instanceof Error?error.message:''));}finally{input.value='';}
 }
 exportDraft():void{
  const d=this.draft();if(!d||this.structuralIssues().length)return;
  const file=new Blob([JSON.stringify(d,null,2)+'\n'],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(file),link=document.createElement('a');link.href=url;link.download=d.phrase.id+'-draft.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);this.message.set(this.t('downloaded'));this.dirty.set(false);
 }
 selectAudio(event:Event):void{
  const file=(event.target as HTMLInputElement).files?.[0];if(!file)return;this.clearAudio();if(!/\.mp3$/i.test(file.name)||file.size>20*1024*1024){this.error.set(this.t('invalidAudio'));return;}this.objectUrl=URL.createObjectURL(file);this.audioUrl.set(this.objectUrl);
 }
 private clearAudio():void{this.player()?.nativeElement.pause();this.audioUrl.set(null);if(this.objectUrl)URL.revokeObjectURL(this.objectUrl);this.objectUrl=null;}
}

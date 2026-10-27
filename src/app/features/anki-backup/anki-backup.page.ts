import {LocalDeckNotice} from '../../shared/components/local-deck-notice/local-deck-notice';
import {Component,Injectable,OnDestroy,effect,inject,signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {TranslationService} from '../../core/services/translation.service';
import {WorkspaceService} from '../../core/services/workspace.service';
import {DeckBackupService} from '../../core/services/deck-backup.service';
import {DeckBackup} from '../../core/services/deck-backup-contract';
import * as copy from '../../../assets/i18n/deck-backup.generated';

/** Feature-scoped TranslationService keeps all backup copy outside the initial bundle. */
@Injectable()
class BackupTranslations extends TranslationService {
 override t(key:string,replacements?:Record<string,string|number>):string {
  let value=copy[this.language()][key];if(value===undefined)return super.t(key,replacements);
  for(const [k,v]of Object.entries(replacements??{}))value=value.replaceAll('{{'+k+'}}',String(v));return value;
 }
}
@Component({selector:'app-anki-backup',imports:[RouterLink,LocalDeckNotice],providers:[{provide:TranslationService,useClass:BackupTranslations}],
 styleUrl:'./anki-backup.page.scss',template:`<main class="page-shell">
 <a routerLink="/anki">← {{i18n.t('anki.title')}}</a><h1>{{i18n.t('deckBackup.title')}}</h1>
 <app-local-deck-notice /><p>{{i18n.t('deckBackup.scope')}}</p><p>{{i18n.t('deckBackup.includes')}}</p><p>{{i18n.t('deckBackup.privacy')}}</p><p class="notice">{{i18n.t('deckBackup.loss')}}</p>
 @if(!guest()){<p role="alert">{{i18n.t('deckBackup.error.owner')}}</p>}
 @if(summary();as p){<p class="summary">{{i18n.t('deckBackup.counts',{decks:p.counts.decks,cards:p.counts.cards,events:p.counts.events})}} · {{i18n.t('deckBackup.date')}} <time>{{p.exportedAt}}</time></p>}
 <section><h2>{{i18n.t('deckBackup.export')}}</h2><button [disabled]="busy()||!guest()" (click)="export()">{{i18n.t('deckBackup.export')}}</button></section>
 <section><h2>{{i18n.t('deckBackup.restore')}}</h2><label>{{i18n.t('deckBackup.file')}}<input type="file" accept="application/json,.json" [disabled]="busy()||!guest()" (change)="choose($event)" /></label>
 @if(preview();as p){<div class="preview" role="region" [attr.aria-label]="i18n.t('deckBackup.preview')"><h3>{{i18n.t('deckBackup.preview')}}</h3><p>{{i18n.t('deckBackup.counts',{decks:p.counts.decks,cards:p.counts.cards,events:p.counts.events})}}</p><p>{{i18n.t('deckBackup.date')}} <time>{{p.exportedAt}}</time></p><p>{{i18n.t('deckBackup.confirmHelp')}}</p><label><input type="checkbox" [checked]="confirmed()" [disabled]="busy()" (change)="confirmed.set($any($event.target).checked)" />{{i18n.t('deckBackup.confirm')}}</label><button [disabled]="busy()||!confirmed()" (click)="restore()">{{i18n.t('deckBackup.restore')}}</button></div>}
 </section>
 @if(busy()){<p role="status">{{i18n.t('common.loading')}}</p>}
 @if(busy()||preview()){<button (click)="cancel()">{{i18n.t('common.cancel')}}</button>}
 @if(error()){<p class="error" role="alert">{{i18n.t('deckBackup.error.'+error())}}</p>}
 @if(message()){<p role="status">{{i18n.t('deckBackup.'+message())}}</p>}
 </main>`})
export class AnkiBackupPage implements OnDestroy {
 readonly i18n=inject(TranslationService);private readonly service=inject(DeckBackupService);private readonly workspace=inject(WorkspaceService);
 readonly busy=signal(false);readonly error=signal('');readonly message=signal('');readonly preview=signal<DeckBackup|null>(null);readonly confirmed=signal(false);
 readonly summary=signal<DeckBackup|null>(null);
 private raw='';private controller:AbortController|null=null;private generation=0;
 guest(){return this.workspace.active()==='guest';}
 constructor(){effect(()=>{this.workspace.activationRevision();this.cancel();});}
 cancel(){this.controller?.abort();this.controller=null;++this.generation;this.busy.set(false);this.preview.set(null);this.summary.set(null);this.confirmed.set(false);this.raw='';this.error.set('');this.message.set('');}
 private async run(action:(signal:AbortSignal)=>Promise<void>){
  if(this.busy())return;const c=new AbortController(),generation=++this.generation;this.controller=c;this.busy.set(true);this.error.set('');this.message.set('');
  try{await action(c.signal);}catch(e){if(!c.signal.aborted&&generation===this.generation){const code=(e as {code?:string;name?:string}).code;this.error.set((e as Error).name==='QuotaExceededError'?'quota':['invalid','version','owner','coordination','limit','hash','lineage','nonempty','blocked','verify','confirmation'].includes(code??'')?code!:'invalid');}}
  finally{if(generation===this.generation){this.busy.set(false);this.controller=null;}}
 }
 export(){return this.run(async signal=>{const raw=await this.service.export(signal);signal.throwIfAborted();const backup=JSON.parse(raw) as DeckBackup;this.summary.set(backup);this.raw='';this.confirmed.set(false);const url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='kana-study-decks-'+backup.exportedAt.replaceAll(':','-')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);this.message.set('exported');this.preview.set(null);});}
 choose(event:Event){const input=event.target as HTMLInputElement,file=input.files?.[0];input.value='';if(!file)return;this.cancel();return this.run(async signal=>{const result=await this.service.preview(file,signal);signal.throwIfAborted();this.raw=result.raw;this.preview.set(result.backup);});}
 restore(){const raw=this.raw,confirmed=this.confirmed();return this.run(async signal=>{await this.service.restore(raw,confirmed,signal);if(signal.aborted)return;this.raw='';this.preview.set(null);this.confirmed.set(false);this.message.set('restored');});}
 ngOnDestroy(){this.cancel();}
}

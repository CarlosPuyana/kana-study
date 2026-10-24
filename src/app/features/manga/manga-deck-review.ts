import { afterRenderEffect, Component, computed, DestroyRef, effect, ElementRef, inject, input, output, signal, untracked, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DictionaryLookup, OcrLookupPoint } from '../../core/models/dictionary.model';
import { MangaContextLocation } from '../../core/models/manga-context.model';
import { MangaConfirmedCardOperation } from '../../core/models/manga-deck-confirmation.model';
import { TranslationService } from '../../core/services/translation.service';
import { MangaCardDraft, MangaDeckAssistedService } from '../../core/services/manga-deck-assisted.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { text } from '../../core/services/custom-deck-validation';

@Component({selector:'app-manga-deck-review', imports:[FormsModule],
  templateUrl:'./manga-deck-review.html', styleUrl:'./manga-deck-review.scss'})
export class MangaDeckReview {
  readonly point=input.required<OcrLookupPoint>();readonly lookup=input.required<DictionaryLookup>();
  readonly location=input.required<MangaContextLocation>();readonly volumeTitle=input.required<string>();readonly savedItemId=input<string>();
  readonly saved=output<void>();readonly cancelled=output<void>();
  readonly i18n=inject(TranslationService);private readonly service=inject(MangaDeckAssistedService);
  private readonly host=inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly workspace=inject(WorkspaceService);
  private readonly owner=this.workspace.active();private readonly epoch=this.workspace.activationRevision();
  private alive=true;private generation=0;private request:MangaConfirmedCardOperation|null=null;
  private readonly scope=computed(()=>JSON.stringify([this.point(),this.lookup(),this.location(),this.volumeTitle()]));
  readonly draft=signal<MangaCardDraft|null>(null);readonly busy=signal(false);readonly failed=signal(false);
  readonly editing=signal(false);readonly attempted=signal(false);readonly completed=signal(false);
  readonly advanced=signal(false);readonly missing=signal<readonly string[]>([]);
  readonly manualEntry=signal(false);readonly failureStage=signal<'source'|'prepare'|'confirm'|null>(null);
  private readonly focusField=signal<string|null>(null);
  private readonly saveButton=viewChild<ElementRef<HTMLButtonElement>>('saveButton');
  private readonly wordInput=viewChild<ElementRef<HTMLInputElement>>('wordInput');private focusEdit=false;private focusSave=false;
  private editFocusOrigin:Element|null=null;
  word='';reading='';meaning='';language:'es'|'en'|'ca'='es';selectedProposal='';reuseEntityId='';newIdentity=false;
  constructor(){
    inject(DestroyRef).onDestroy(()=>{this.alive=false;++this.generation;});
    effect(()=>{this.scope();const owner=this.workspace.active(),epoch=this.workspace.activationRevision();untracked(()=>{
      if(owner!==this.owner||epoch!==this.epoch){++this.generation;this.draft.set(null);this.request=null;this.busy.set(false);this.failed.set(true);return;}
      void this.start();
    });});
    afterRenderEffect(()=>{
      const field=this.focusField();
      if(field){this.host.nativeElement.querySelector<HTMLElement>('[data-field="'+field+'"]')?.focus();this.focusField.set(null);}
      else if(this.advanced()&&this.wordInput()&&this.focusEdit){this.focusEdit=false;
        const active=document.activeElement;
        // Do not steal focus after the user has already moved to another editable field.
        if(!(active instanceof HTMLElement&&active!==this.editFocusOrigin&&this.host.nativeElement.contains(active)&&active.matches('input,select,textarea')))this.wordInput()!.nativeElement.focus();
      }
      else if(this.draft()&&!this.busy()&&this.saveButton()&&this.focusSave){this.focusSave=false;
        const field=this.editing()?this.host.nativeElement.querySelector<HTMLElement>('.essentials [data-field]'):null;
        (field??this.saveButton()!.nativeElement).focus();}
    });
  }
  private current(generation:number,owner:string,epoch:number):boolean{return this.alive&&this.generation===generation&&owner===this.owner&&epoch===this.epoch&&this.workspace.active()===owner&&this.workspace.activationRevision()===epoch;}
  async start():Promise<void>{
    if(this.workspace.active()!==this.owner||this.workspace.activationRevision()!==this.epoch)return;
    const generation=++this.generation,owner=this.workspace.active(),epoch=this.workspace.activationRevision(),scope=this.scope();
    this.draft.set(null);this.request=null;this.word='';this.reading='';this.meaning='';this.selectedProposal='';this.reuseEntityId='';this.newIdentity=false;
    this.editing.set(false);this.advanced.set(false);this.manualEntry.set(false);this.failureStage.set(null);this.focusField.set(null);this.missing.set([]);this.attempted.set(false);this.completed.set(false);this.failed.set(false);this.busy.set(true);
    try{
      const loc=this.location(),draft=await this.service.open(loc.volumeId,this.volumeTitle(),loc.pageIndex+1,this.point(),this.lookup(),this.savedItemId());
      if(!this.current(generation,owner,epoch)||scope!==this.scope())return;
      this.word=draft.source.surface.trim();this.language=this.i18n.language();this.draft.set(draft);
      // Local evidence is unconfirmed. Never choose between senses or truncated alternatives.
      if(draft.totalAlternatives===1&&draft.proposals.length===1&&draft.proposals[0].expression.normalize('NFC')===this.word.normalize('NFC')){
        this.selectedProposal='0';this.chooseProposal();const p=draft.proposals[0];
        if(p.totalGlosses===1&&p.glosses.length===1)this.useMeaning(p.glosses[0]);
      }
      // An entry without reading cannot satisfy the persisted proposal contract.
      // Retain its single literal ES gloss for review without inventing a reading or a valid proposal.
      const raw=this.lookup().terms;
      if(draft.totalAlternatives===1&&!draft.proposals.length&&raw.length===1&&raw[0].expression.normalize('NFC')===this.word.normalize('NFC')&&
        !raw[0].reading.trim()&&raw[0].glossaries.length===1&&raw[0].glossaries[0].trim()&&raw[0].glossaries[0].length<=2000){this.useMeaning(raw[0].glossaries[0]);}
      this.editing.set(!this.reading||!this.meaning||this.needsIdentityChoice()||draft.totalAlternatives>1);
      this.manualEntry.set(!draft.proposals.length);
      this.missing.set((['word','reading','meaning'] as const).filter(f=>this.invalid(f)));
      this.focusSave=true;
    }catch{if(this.current(generation,owner,epoch)){this.failed.set(true);this.failureStage.set('source');}}
    finally{if(this.current(generation,owner,epoch))this.busy.set(false);}
  }
  edit():void{this.request=null;this.failed.set(false);this.failureStage.set(null);}
  openEdit():void{this.editFocusOrigin=document.activeElement;this.editing.set(true);this.advanced.set(true);this.focusEdit=true;}
  closeEdit():void{this.advanced.set(false);}
  selectProposal(value:string):void{
    this.manualEntry.set(value==='manual');this.selectedProposal=value==='manual'?'':value;
    if(value==='manual')this.edit();else this.chooseProposal();
  }
  proposal(){return this.selectedProposal===''?undefined:this.draft()?.proposals[Number(this.selectedProposal)];}
  identityEdited():void{this.reuseEntityId='';this.newIdentity=false;this.manualEntry.set(true);this.selectedProposal='';this.edit();}
  createIdentity():void{if(this.matchingEntities().length){this.newIdentity=true;this.changeIdentity();}}
  contextBrief():string{const text=Array.from((this.draft()?.source.fragment??'').replace(/\s+/g,' '));return text.slice(0,48).join('')+(text.length>48?'…':'');}
  chooseProposal():void{
    this.edit();const p=this.selectedProposal===''?undefined:this.draft()?.proposals[Number(this.selectedProposal)];
    this.reuseEntityId='';this.newIdentity=false;
    if(p){this.word=p.expression;this.reading=p.reading;this.meaning='';this.language=p.glossLanguage;this.focusField.set('meaning');}
  }
  useMeaning(gloss:string):void{this.edit();this.meaning=gloss;this.language='es';this.focusField.set(this.reading?'save':'reading');}
  chooseEntity():void{this.edit();const e=this.draft()?.entities.find(e=>e.id===this.reuseEntityId);if(e){this.word=e.word;this.reading=e.reading;this.newIdentity=false;}}
  changeIdentity():void{this.edit();if(this.newIdentity)this.reuseEntityId='';}
  matchingEntities(){return this.draft()?.entities.filter(e=>e.word===this.word.trim().normalize('NFC')&&e.reading===this.reading.trim().normalize('NFC'))??[];}
  needsIdentityChoice():boolean{return this.matchingEntities().length>0&&!this.reuseEntityId&&!this.newIdentity;}
  invalid(field:'word'|'reading'|'meaning'|'identity'):boolean{
    if(field==='identity')return this.needsIdentityChoice()||!!this.reuseEntityId&&!this.draft()?.entities.some(e=>e.id===this.reuseEntityId&&e.word===this.word.trim().normalize('NFC')&&e.reading===this.reading.trim().normalize('NFC'));
    const value=this[field].trim();return !text(value,field==='meaning'?8000:1024)||value.length>(field==='meaning'?2000:256)||field==='word'&&!/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(value);
  }
  async confirm():Promise<void>{
    const draft=this.draft();if(!draft||this.busy()||this.completed())return;
    this.attempted.set(true);
    const invalid=(['word','reading','meaning','identity'] as const).find(f=>this.invalid(f));
    if(invalid){if(invalid==='word')this.advanced.set(true);this.focusField.set(invalid);return;}
    const generation=this.generation,owner=this.workspace.active(),epoch=this.workspace.activationRevision(),scope=this.scope();
    const guard=()=>{if(!this.current(generation,owner,epoch)||scope!==this.scope())throw Error('obsolete-review');};
    this.busy.set(true);this.failed.set(false);this.failureStage.set(null);let stage:'prepare'|'confirm'='prepare';
    try{
      // Freeze one operation on explicit confirmation; retry the same receipt after storage failure.
      this.request??=await this.service.preview(draft,{word:this.word,reading:this.reading,meaning:this.meaning,language:this.language,
        proposalIndex:this.selectedProposal===''?null:Number(this.selectedProposal),reuseEntityId:this.reuseEntityId||null,newIdentity:this.newIdentity,reviewed:true});
      guard();stage='confirm';await this.service.confirm(this.request,guard);guard();this.completed.set(true);this.saved.emit();
    }catch{if(this.current(generation,owner,epoch)){this.failed.set(true);this.failureStage.set(stage);}}
    finally{if(this.current(generation,owner,epoch))this.busy.set(false);}
  }
}

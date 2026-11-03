import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, effect, inject, output, signal, untracked, viewChild } from '@angular/core';
import { PuyiCard, PuyiDraft, PUYI_FIELDS, PUYI_LIMITS, emptyPuyiDraft, validatePuyiDraft } from '../../core/models/puyi.model';
import { PuyiService, validatePuyiImage } from '../../core/services/puyi.service';
import { TranslationService } from '../../core/services/translation.service';
import * as copy from '../../../assets/i18n/puyi.generated';

@Component({selector:'app-puyi-admin',templateUrl:'./puyi-admin.html',styleUrl:'./puyi-admin.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class PuyiAdmin {
  readonly service=inject(PuyiService);readonly i18n=inject(TranslationService);readonly changed=output<void>();
  readonly cards=signal<readonly PuyiCard[]>([]);readonly query=signal('');readonly loading=signal(false);
  readonly message=signal('');readonly error=signal('');readonly busy=signal(false);readonly photoBusy=signal(false);
  readonly editing=signal<PuyiCard|null>(null);readonly draft=signal<PuyiDraft>(emptyPuyiDraft());readonly allowDuplicate=signal(false);
  readonly file=signal<File|null>(null);readonly previewUrl=signal<string|null>(null);readonly removePhoto=signal(false);
  readonly fields=PUYI_FIELDS;readonly limits=PUYI_LIMITS;
  readonly rows=computed(()=>{const q=this.query().trim().toLocaleLowerCase();return this.cards().filter(c=>[c.word,c.kana,c.meaning].some(v=>v.toLocaleLowerCase().includes(q)));});
  readonly duplicate=computed(()=>this.cards().some(c=>c.id!==this.editing()?.id&&c.word.trim().toLowerCase()===this.draft().word.trim().toLowerCase()&&c.kana.trim()===this.draft().kana.trim()));
  readonly valid=computed(()=>validatePuyiDraft(this.draft()));
  readonly dialog=viewChild<ElementRef<HTMLDialogElement>>('editor');
  private start='';private id='';private generation=0;private destroyed=false;
  constructor(){
    this.i18n.useStudyCopy(copy);
    effect(()=>{this.service.identity();untracked(()=>void this.service.checkAdmin());});
    effect(()=>{if(!this.service.admin())untracked(()=>{this.dialog()?.nativeElement.close();this.releasePreview();this.cards.set([]);++this.generation;});else untracked(()=>{void this.reload();void this.service.cleanup();});});
    inject(DestroyRef).onDestroy(()=>{this.destroyed=true;++this.generation;this.releasePreview();});
  }
  async reload():Promise<void>{
    const generation=++this.generation;this.loading.set(true);
    try{const cards=await this.service.list();if(generation===this.generation&&!this.destroyed)this.cards.set(cards);}
    catch{if(generation===this.generation)this.error.set('puyi.loadError');}
    finally{if(generation===this.generation)this.loading.set(false);}
  }
  open(card:PuyiCard|null=null):void{
    if(!this.service.admin()||this.busy())return;
    this.editing.set(card);this.id=card?.id??crypto.randomUUID();
    this.draft.set(card?{word:card.word,kana:card.kana,meaning:card.meaning,exampleSentence:card.exampleSentence,exampleTranslation:card.exampleTranslation}:emptyPuyiDraft());
    this.start=JSON.stringify(this.draft());this.file.set(null);this.removePhoto.set(false);this.allowDuplicate.set(false);this.error.set('');this.message.set('');this.releasePreview();
    this.dialog()?.nativeElement.showModal();
  }
  close():void{
    if(this.busy()||this.photoBusy())return;
    if((JSON.stringify(this.draft())!==this.start||this.file()||this.removePhoto())&&!window.confirm(this.i18n.t('puyi.unsaved')))return;
    this.dialog()?.nativeElement.close();this.releasePreview();
  }
  update(field:keyof PuyiDraft,event:Event):void{this.draft.update(d=>({...d,[field]:(event.target as HTMLInputElement).value}));}
  private releasePreview():void{const url=this.previewUrl();if(url)URL.revokeObjectURL(url);this.previewUrl.set(null);}
  image():string|undefined{return this.previewUrl()??(!this.removePhoto()?this.service.imageUrl(this.editing()?.image_path??null):undefined);}
  async selectImage(event:Event):Promise<void>{
    const file=(event.target as HTMLInputElement).files?.[0];if(!file)return;
    this.photoBusy.set(true);this.error.set('');const id=this.id;
    try{await validatePuyiImage(file);if(this.destroyed||id!==this.id||!this.service.admin())return;
      // Decode before allowing publication, not merely trusting the supplied MIME type.
      const url=URL.createObjectURL(file);try{await new Promise<void>((resolve,reject)=>{const img=new Image();img.onload=()=>img.naturalWidth*img.naturalHeight<=16000000?resolve():reject();img.onerror=reject;img.src=url;});}catch{URL.revokeObjectURL(url);throw new Error('puyi.imageError');}
      if(this.destroyed||id!==this.id||!this.service.admin()){URL.revokeObjectURL(url);return;}
      this.releasePreview();this.previewUrl.set(url);this.file.set(file);this.removePhoto.set(false);
    }catch{this.error.set('puyi.imageError');(event.target as HTMLInputElement).value='';}
    finally{this.photoBusy.set(false);}
  }
  clearImage():void{this.releasePreview();this.file.set(null);this.removePhoto.set(true);}
  async save():Promise<void>{
    if(this.busy()||this.photoBusy()||!this.service.admin())return;
    if(!this.valid()){this.error.set('puyi.invalid');return;}
    if(this.duplicate()&&!this.allowDuplicate()){this.error.set('puyi.duplicate');return;}
    this.busy.set(true);this.error.set('');let uploaded:string|null=null;
    try{if(this.file())uploaded=await this.service.upload(this.file()!);
      await this.service.save(this.id,this.editing()?.version??0,this.draft(),uploaded??(this.removePhoto()?null:this.editing()?.image_path??null),this.allowDuplicate());
      if(this.destroyed)return;this.dialog()?.nativeElement.close();this.releasePreview();this.message.set('puyi.saved');await this.reload();this.changed.emit();await this.service.cleanup();
    }catch(error){if(uploaded)await this.service.discard(uploaded);if(!this.destroyed){const code=(error as {code?:string}).code;this.error.set(code==='23505'?'puyi.duplicate':code==='40001'?'puyi.conflict':'puyi.saveError');if(code==='40001')await this.reload();}}
    finally{this.busy.set(false);}
  }
  async remove(card:PuyiCard):Promise<void>{
    if(this.busy()||!window.confirm(this.i18n.t('puyi.confirmDelete',{word:card.word})))return;
    this.busy.set(true);this.error.set('');
    try{await this.service.remove(card);if(this.destroyed)return;await this.reload();this.changed.emit();this.message.set('puyi.deleted');await this.service.cleanup();}
    catch{this.error.set('puyi.saveError');}finally{this.busy.set(false);}
  }
}

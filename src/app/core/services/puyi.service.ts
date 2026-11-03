import { computed, inject, Injectable, Injector, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { SupabaseClientService } from './supabase-client.service';
import { PuyiCard, PuyiDraft, PUYI_FIELDS, validatePuyiDraft } from '../models/puyi.model';

export const PUYI_IMAGE_BYTES=2*1024*1024;
export async function validatePuyiImage(file:File):Promise<'jpg'|'png'|'webp'> {
  if(!file.size||file.size>PUYI_IMAGE_BYTES)throw new Error('puyi.imageError');
  const bytes=new Uint8Array(await file.slice(0,12).arrayBuffer());
  if(file.type==='image/jpeg'&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'jpg';
  if(file.type==='image/png'&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v))return 'png';
  if(file.type==='image/webp'&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')return 'webp';
  throw new Error('puyi.imageError');
}

/** Shared content only. Authentication and Storage authority are enforced by PostgreSQL. */
@Injectable({providedIn:'root'})
export class PuyiService {
  private readonly supabase=inject(SupabaseClientService);
  private readonly injector=inject(Injector);
  private get auth(){return this.injector.get(AuthService);}
  readonly identity=computed(()=>this.auth.user());
  private readonly grant=signal<{user:unknown;allowed:boolean}>({user:null,allowed:false});
  readonly admin=computed(()=>!!this.auth.user()&&this.grant().user===this.auth.user()&&this.grant().allowed);
  readonly configured=this.supabase.config.configured;
  readonly cleanupPending=signal(false);
  async checkAdmin():Promise<void>{
    const user=this.auth.user();
    try{const client=await this.supabase.getClient();if(!user||!client)return;
      const {data,error}=await client.rpc('is_puyi_admin');
      if(user===this.auth.user())this.grant.set({user,allowed:!error&&data===true});
    }catch{if(user===this.auth.user())this.grant.set({user,allowed:false});}
  }
  async list():Promise<readonly PuyiCard[]>{
    const client=await this.supabase.getClient();if(!client)return [];
    const cards:PuyiCard[]=[];
    for(let start=0;;start+=500){
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
      try{const {data,error}=await client.from('puyi_cards').select('id,position,version,word,kana,meaning,exampleSentence,exampleTranslation,image_path,created_at,updated_at,author_id').order('position').order('id').range(start,start+499).abortSignal(controller.signal);
        if(error)throw error;cards.push(...(data??[]) as PuyiCard[]);if(!data||data.length<500)break;
      }finally{clearTimeout(timer);}
    }
    return cards;
  }
  imageUrl(path:string|null):string|undefined {
    if(!path||! /^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(path)||!this.configured)return undefined;
    return `${this.supabase.config.url}/storage/v1/object/public/puyi-images/${path}`;
  }
  private async writer(){
    const user=this.auth.user(),client=await this.supabase.getClient();
    if(!user||!client||!this.admin())throw new Error('puyi.denied');
    return {client,assert:()=>{if(user!==this.auth.user()||!this.admin())throw new Error('puyi.denied');}};
  }
  async save(id:string,version:number,draft:PuyiDraft,imagePath:string|null,allowDuplicate=false):Promise<PuyiCard>{
    if(!validatePuyiDraft(draft))throw new Error('puyi.invalid');
    const {client,assert}=await this.writer();assert();
    const content=Object.fromEntries(PUYI_FIELDS.map(k=>[k,draft[k].trim()]));
    const {data,error}=await client.rpc('puyi_save_card',{p_id:id,p_expected_version:version,p_content:content,p_image_path:imagePath,p_allow_duplicate:allowDuplicate});
    if(error)throw error;assert();return data as PuyiCard;
  }
  async remove(card:PuyiCard):Promise<void>{
    const {client,assert}=await this.writer();assert();
    const {error}=await client.rpc('puyi_save_card',{p_id:card.id,p_expected_version:card.version,p_content:{},p_delete:true});
    if(error)throw error;assert();
  }
  async upload(file:File):Promise<string>{
    const ext=await validatePuyiImage(file),{client,assert}=await this.writer(),path=`${crypto.randomUUID()}.${ext}`;
    const reserved=await client.rpc('puyi_reserve_image',{p_path:path});if(reserved.error)throw reserved.error;
    try{assert();const {error}=await client.storage.from('puyi-images').upload(path,file,{upsert:false,contentType:file.type,cacheControl:'31536000'});if(error)throw error;assert();return path;}
    catch(error){await this.discard(path);throw error;}
  }
  async discard(path:string):Promise<void>{
    try{const {client}=await this.writer();const {error}=await client.rpc('puyi_discard_image',{p_path:path});if(error)throw error;await this.cleanup();}
    catch{this.cleanupPending.set(true);}
  }
  async cleanup():Promise<void>{
    try{const {client,assert}=await this.writer();const {data,error}=await client.rpc('puyi_image_cleanup');if(error)throw error;
      for(const path of (data??[]) as string[]){assert();const removed=await client.storage.from('puyi-images').remove([path]);if(removed.error)throw removed.error;
        const ack=await client.rpc('puyi_image_cleanup_ack',{p_path:path});if(ack.error)throw ack.error;}
      this.cleanupPending.set((data??[]).length===100);
    }catch{this.cleanupPending.set(true);}
  }
}

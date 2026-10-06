import {DOCUMENT} from '@angular/common';
import {inject, Injectable} from '@angular/core';
import {LocalManga, MangaDialogueBubble, MangaLanguage} from '../models/local-manga.model';
import {MangaPage, MangaReaderVolume, MokuroDocument} from '../models/manga.model';
import {MangaError, normalizeMangaPath, parseMokuro} from './mokuro-parser';

export const LOCAL_MANGA_PREFIX = 'catalog:';
const languages: MangaLanguage[] = ['ja','es'];
function record(value:unknown):value is Record<string,unknown>{return !!value&&typeof value==='object'&&!Array.isArray(value);}
function text(value:unknown):value is string{return typeof value==='string'&&!!value.trim();}
function path(value:unknown):value is string{
  if(!text(value)||/[?#:%]/u.test(value))return false;
  try{return normalizeMangaPath(value)===value;}catch{return false;}
}
export function parseLocalManga(value:unknown):LocalManga {
  if(!record(value)||value['schemaVersion']!==1||!text(value['id'])||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value['id'])
    ||!record(value['titles'])||!text(value['titles']['ja'])||value['originalLanguage']!=='ja'
    ||!['draft','published'].includes(String(value['status']))||!['rtl','ltr'].includes(String(value['readingDirection']))
    ||!Array.isArray(value['availableLanguages'])||!value['availableLanguages'].includes('ja')
    ||new Set(value['availableLanguages']).size!==value['availableLanguages'].length
    ||!value['availableLanguages'].every(l=>languages.includes(l))||!Array.isArray(value['pages'])
    ||!value['pages'].length)throw new MangaError('catalogInvalid');
  const manga=value as unknown as LocalManga;
  if((manga.availableLanguages.includes('es')||manga.titles.es!==undefined)&&!text(manga.titles.es))throw new MangaError('catalogInvalid');
  const ids=new Set<string>();
  for(const page of manga.pages){
    if(!record(page)||!text(page.id)||ids.has(page.id)||!Number.isFinite(page.width)||page.width<=0
      ||!Number.isFinite(page.height)||page.height<=0||!record(page.images)
      ||!manga.availableLanguages.every(l=>path(page.images[l]))
      ||!Object.entries(page.images).every(([l,p])=>manga.availableLanguages.includes(l as MangaLanguage)&&path(p)))throw new MangaError('catalogInvalid');
    ids.add(page.id);
  }
  if(manga.cover!==undefined&&!path(manga.cover)||manga.dialogue!==undefined&&!path(manga.dialogue)
    ||manga.reading!==undefined&&!text(manga.reading)||manga.description!==undefined&&(!record(manga.description)||!Object.entries(manga.description).every(([l,s])=>['es','en','ca'].includes(l)&&text(s)))
    ||manga.mokuro!==undefined&&(!record(manga.mokuro)||!Object.entries(manga.mokuro).every(([l,p])=>manga.availableLanguages.includes(l as MangaLanguage)&&path(p))))throw new MangaError('catalogInvalid');
  return manga;
}
export function parseMangaDialogue(value:unknown,manga:LocalManga):MangaDialogueBubble[] {
  if(!Array.isArray(value))throw new MangaError('catalogInvalid');
  const ids=new Set<string>();
  for(const bubble of value){
    if(!record(bubble)||!text(bubble['bubbleId'])||ids.has(bubble['bubbleId'])||!manga.pages.some(p=>p.id===bubble['pageId'])||!text(bubble['jp'])
      ||['speaker','reading','es'].some(k=>bubble[k]!==undefined&&!text(bubble[k]))
      ||bubble['studyTargets']!==undefined&&(!Array.isArray(bubble['studyTargets'])||!bubble['studyTargets'].every(text)))throw new MangaError('catalogInvalid');
    ids.add(bubble['bubbleId']);
  }
  return value as MangaDialogueBubble[];
}

@Injectable({providedIn:'root'})
export class LocalMangaCatalogService {
  private readonly document=inject(DOCUMENT);
  private readonly root=new URL('manga/',this.document.baseURI);
  private pending?:Promise<LocalManga[]>;
  private readonly locations=new Map<string,URL>();
  private readonly ocr=new Map<string,Promise<MokuroDocument>>();
  private async json(url:URL):Promise<unknown>{const response=await fetch(url);if(!response.ok)throw new MangaError('catalogUnavailable');return response.json();}
  list():Promise<LocalManga[]> {
    return this.pending??=this.load().catch(error=>{this.pending=undefined;throw error;});
  }
  private async load():Promise<LocalManga[]> {
    const index=await this.json(new URL('index.json',this.root));
    if(!record(index)||index['schemaVersion']!==1||!Array.isArray(index['mangas'])||!index['mangas'].every(path)
      ||new Set(index['mangas']).size!==index['mangas'].length)throw new MangaError('catalogInvalid');
    const locations=new Map<string,URL>();
    const entries=await Promise.all(index['mangas'].map(async file=>{
      const url=new URL(file,this.root),manga=parseLocalManga(await this.json(url));
      if(locations.has(manga.id))throw new MangaError('catalogInvalid');locations.set(manga.id,url);return manga;
    }));
    this.locations.clear();for(const [id,url]of locations)this.locations.set(id,url);
    return entries.filter(m=>m.status==='published');
  }
  async get(id:string):Promise<LocalManga>{const manga=(await this.list()).find(m=>m.id===id);if(!manga)throw new MangaError('catalogMissing');return manga;}
  asset(manga:LocalManga,relative:string):string {
    const base=this.locations.get(manga.id);if(!base||!path(relative))throw new MangaError('catalogInvalid');return new URL(relative,base).href;
  }
  async volume(id:string):Promise<MangaReaderVolume>{
    const m=await this.get(id);
    return {id:LOCAL_MANGA_PREFIX+m.id,title:m.titles.ja,seriesTitle:m.titles.ja,pageCount:m.pages.length,complete:true,
      catalogId:m.id,availableLanguages:m.availableLanguages,originalLanguage:m.originalLanguage,readingDirection:m.readingDirection};
  }
  async page(id:string,index:number,language:MangaLanguage='ja'):Promise<MangaPage> {
    const manga=await this.get(id);
    if(!manga.availableLanguages.includes(language))throw new MangaError('catalogLanguage');
    const page=manga.pages[index];if(!page)throw new MangaError('catalogMissing');
    const response=await fetch(this.asset(manga,page.images[language]!));if(!response.ok)throw new MangaError('catalogUnavailable');
    const image=await response.blob();if(!image.size||!image.type.startsWith('image/'))throw new MangaError('catalogInvalid');
    let ocr={img_path:page.images[language]!,img_width:page.width,img_height:page.height,blocks:[]} as MangaPage['ocr'];
    const source=manga.mokuro?.[language];
    if(source){
      const key=JSON.stringify([id,language]);let pending=this.ocr.get(key);
      if(!pending){pending=this.json(new URL(this.asset(manga,source))).then(raw=>{
        const doc=parseMokuro(JSON.stringify(raw));
        if(doc.pages.length!==manga.pages.length||doc.pages.some((p,i)=>p.img_width!==manga.pages[i].width||p.img_height!==manga.pages[i].height||p.img_path!==manga.pages[i].images[language]))throw new MangaError('catalogInvalid');return doc;
      }).catch(error=>{this.ocr.delete(key);throw error;});this.ocr.set(key,pending);}
      ocr=(await pending).pages[index];
    }
    return {volumeId:LOCAL_MANGA_PREFIX+id,pageIndex:index,image,ocr};
  }
  async dialogue(id:string):Promise<MangaDialogueBubble[]>{const manga=await this.get(id);return manga.dialogue?parseMangaDialogue(await this.json(new URL(this.asset(manga,manga.dialogue))),manga):[];}
}

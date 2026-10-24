import { inject, Injectable } from '@angular/core';
import { LocalWorkspaceId } from '../models/account.model';
import { MokuroPage } from '../models/manga.model';
import { MangaRepository } from './manga.repository';
import { LocalMangaCatalogService, LOCAL_MANGA_PREFIX } from './local-manga-catalog.service';

export interface OcrSource {
  readonly pageCount:number;readonly stamp:string;
  read(index:number):Promise<{ocr:MokuroPage|null;imageBytes:number}|null>;
}
@Injectable({providedIn:'root'})
export class MangaOcrSourceService {
  private readonly repository=inject(MangaRepository);
  private readonly catalog=inject(LocalMangaCatalogService);
  async open(id:string,owner:LocalWorkspaceId,signal:AbortSignal):Promise<OcrSource|null>{
    if(id.startsWith(LOCAL_MANGA_PREFIX)){
      const catalogId=id.slice(LOCAL_MANGA_PREFIX.length),volume=await this.catalog.volume(catalogId);
      const doc=await this.catalog.ocrDocument(catalogId,signal);
      return {pageCount:volume.pageCount,stamp:JSON.stringify([id,volume.pageCount]),
        read:async index=>({ocr:doc?.pages[index]??null,imageBytes:0})};
    }
    const volume=await this.repository.volume(id,owner);if(!volume?.complete)return null;
    return {pageCount:volume.pageCount,stamp:JSON.stringify([id,volume.pageCount,volume.updatedAt,volume.mokuro]),read:async index=>{
      // IndexedDB stores image and OCR in one record; structured clone cannot project fields.
      // Retain only OCR, never decode/create an object URL or retain the Blob across pages.
      const page=await this.repository.page(id,index,owner);
      return page?{ocr:page.ocr??null,imageBytes:page.image?.size??0}:null;
    }};
  }
}

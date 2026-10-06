import {inject, Injectable} from '@angular/core';
import {LocalWorkspaceId} from '../models/account.model';
import {MangaLanguage} from '../models/local-manga.model';
import {MangaRepository} from './manga.repository';
import {LocalMangaCatalogService, LOCAL_MANGA_PREFIX} from './local-manga-catalog.service';
/** Both sources feed the existing Reader; imported IndexedDB records stay unchanged. */
@Injectable({providedIn:'root'})
export class MangaSourceService {
  private readonly repository=inject(MangaRepository);
  private readonly catalog=inject(LocalMangaCatalogService);
  volume(id:string,workspace:LocalWorkspaceId){return id.startsWith(LOCAL_MANGA_PREFIX)?this.catalog.volume(id.slice(LOCAL_MANGA_PREFIX.length)):this.repository.volume(id,workspace);}
  page(id:string,index:number,workspace:LocalWorkspaceId,language:MangaLanguage='ja'){return id.startsWith(LOCAL_MANGA_PREFIX)?this.catalog.page(id.slice(LOCAL_MANGA_PREFIX.length),index,language):this.repository.page(id,index,workspace);}
}

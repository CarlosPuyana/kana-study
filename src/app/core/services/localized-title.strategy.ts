import {effect, inject, Injectable} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {RouterStateSnapshot, TitleStrategy} from '@angular/router';
import {TranslationService} from './translation.service';

/** Route metadata stays light, including lazy features. Language changes update the current title. */
@Injectable()
export class LocalizedTitleStrategy extends TitleStrategy {
  private readonly title=inject(Title);
  private readonly i18n=inject(TranslationService);
  private snapshot:RouterStateSnapshot|null=null;
  constructor(){super();effect(()=>{this.i18n.language();if(this.snapshot)this.updateTitle(this.snapshot);});}
  override updateTitle(snapshot:RouterStateSnapshot):void {
    this.snapshot=snapshot;
    let route=snapshot.root, key:string|undefined;
    while(route){if(route.data['titleKey'])key=route.data['titleKey'];const child=route.children.find(child=>child.outlet==='primary');if(!child)break;route=child;}
    const screen=key?this.i18n.t(key):this.buildTitle(snapshot);
    this.title.setTitle(screen?(screen.endsWith(' · Kana Study')?screen:`${screen} · Kana Study`):'Kana Study');
  }
}

import {CustomDeckAccess} from '../../../core/services/custom-deck-access';
import {Component,Injectable,inject,input} from '@angular/core';
import {RouterLink} from '@angular/router';
import {TranslationService} from '../../../core/services/translation.service';
import {WorkspaceService} from '../../../core/services/workspace.service';
import {CUSTOM_DECKS_ENABLED,CUSTOM_DECK_SYNC_ENABLED} from '../../../core/services/custom-deck-gates';
import * as copy from '../../../../assets/i18n/local-decks.generated';
/** Scoped to lazy pages; no custom repository or transport is constructed for copy. */
@Injectable()
export class LocalDeckTranslations extends TranslationService {
 override t(key:string,replacements?:Record<string,string|number>):string {return copy[this.language()][key]??super.t(key,replacements);}
}
@Component({selector:'app-local-deck-notice',imports:[RouterLink],providers:[{provide:TranslationService,useClass:LocalDeckTranslations}],
 template:`@if(enabled()&&!cloud()){@if(compact()){<small>{{i18n.t('localDeck.badge')}}</small>}@else{<aside aria-label="{{i18n.t('localDeck.title')}}"><strong>{{i18n.t(guest()?'localDeck.guest':'localDeck.account')}}</strong><p>{{i18n.t('localDeck.local')}}</p>@if(legacy()){<p>{{i18n.t('localDeck.sync')}}</p>}<p>{{i18n.t('localDeck.loss')}}</p>@if(guest()){<p>{{i18n.t('localDeck.backup')}}</p><a routerLink="/anki/backups">{{i18n.t('settings.data')}}</a>}@else{<p>{{i18n.t('localDeck.unsupported')}}</p>@if(access.guestOnly){<p>{{i18n.t('localDeck.guestOnly')}}</p>}}</aside>}}`,
 styles:[`:host{display:block}aside{margin:1rem 0;padding:1rem;border:1px solid var(--border);border-radius:.8rem;background:var(--surface);color:var(--text-primary);overflow-wrap:anywhere}p{margin:.5rem 0;line-height:1.5}small{color:var(--text-secondary)}a{color:var(--accent)}a:focus-visible{outline:2px solid var(--accent);outline-offset:3px}`]})
export class LocalDeckNotice {
 readonly access=inject(CustomDeckAccess);readonly i18n=inject(TranslationService);readonly enabled=inject(CUSTOM_DECKS_ENABLED);readonly cloud=inject(CUSTOM_DECK_SYNC_ENABLED);readonly workspace=inject(WorkspaceService);
 readonly compact=input(false);readonly legacy=input(false);guest(){return this.workspace.active()==='guest';}
}

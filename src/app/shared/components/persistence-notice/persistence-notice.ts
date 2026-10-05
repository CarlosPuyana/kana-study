import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {StorageService} from '../../../core/services/storage.service';
import {TranslationService} from '../../../core/services/translation.service';

@Component({selector:'app-persistence-notice',changeDetection:ChangeDetectionStrategy.OnPush,
  template:`@if(storage.persistenceFailed()){<aside role="status"><span>{{i18n.t('storage.saveFailed')}}</span><button type="button" [attr.aria-label]="i18n.t('common.close')" (click)="storage.dismissPersistenceError()">×</button></aside>}`,
  styles:`aside{position:fixed;z-index:1200;bottom:1rem;left:50%;transform:translateX(-50%);width:min(36rem,calc(100% - 2rem));display:flex;align-items:center;gap:1rem;padding:.7rem 1rem;border:1px solid var(--warning);border-radius:1rem;background:var(--surface);color:var(--text-primary);box-shadow:0 4px 20px var(--primary-soft)}button{flex:none;min-width:44px;min-height:44px;border:0;background:transparent;color:inherit;font-size:1.5rem}button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}`})
export class PersistenceNotice {readonly storage=inject(StorageService);readonly i18n=inject(TranslationService);}

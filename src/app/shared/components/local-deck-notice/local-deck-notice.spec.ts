import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {LocalDeckNotice} from './local-deck-notice';
import {WorkspaceService} from '../../../core/services/workspace.service';
import {SettingsService} from '../../../core/services/settings.service';
import {CUSTOM_DECKS_ENABLED,CUSTOM_DECK_SYNC_ENABLED} from '../../../core/services/custom-deck-gates';
import * as copy from '../../../../assets/i18n/local-decks.generated';

describe('Local deck protection copy',()=>{
 beforeEach(()=>{localStorage.clear();vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener(){},removeEventListener(){}}));TestBed.configureTestingModule({providers:[provideRouter([]),{provide:CUSTOM_DECKS_ENABLED,useValue:signal(true)}]});});
 afterEach(()=>{TestBed.resetTestingModule();localStorage.clear();vi.unstubAllGlobals();});
 for(const lang of ['es','en','ca'] as const){
  it('Guest backup and legacy sync have separate meanings in '+lang,()=>{
   TestBed.inject(SettingsService).setLanguage(lang);const f=TestBed.createComponent(LocalDeckNotice);f.componentRef.setInput('legacy',true);f.detectChanges();
   for(const key of ['local','sync','loss','backup','guest'])expect(f.nativeElement.textContent).toContain(copy[lang]['localDeck.'+key]);
   expect(f.nativeElement.querySelector('a').getAttribute('href')).toBe('/anki/backups');expect(f.nativeElement.textContent).not.toContain(copy[lang]['localDeck.unsupported']);
  });
  it('account backup remains explicitly unsupported with no Guest-export recommendation in '+lang,()=>{
   TestBed.inject(WorkspaceService).activateUser('local-a');TestBed.inject(SettingsService).setLanguage(lang);const f=TestBed.createComponent(LocalDeckNotice);f.detectChanges();
   for(const key of ['account','local','loss','unsupported'])expect(f.nativeElement.textContent).toContain(copy[lang]['localDeck.'+key]);
   expect(f.nativeElement.querySelector('a')).toBeNull();expect(f.nativeElement.textContent).not.toContain(copy[lang]['localDeck.backup']);
  });
 }
 it('custom card badge never advertises Synced or backup',()=>{
  const f=TestBed.createComponent(LocalDeckNotice);f.componentRef.setInput('compact',true);f.detectChanges();expect(f.nativeElement.textContent).toBe(copy.es['localDeck.badge']);expect(f.nativeElement.querySelector('a')).toBeNull();
 });
 it('production gate leaves local notices hidden without changing sync state',()=>{
  TestBed.overrideProvider(CUSTOM_DECKS_ENABLED,{useValue:signal(false)});const f=TestBed.createComponent(LocalDeckNotice);f.detectChanges();expect(f.nativeElement.textContent).toBe('');
 });
 it('experimental cloud mode retains its own protocol UI',()=>{
  TestBed.overrideProvider(CUSTOM_DECK_SYNC_ENABLED,{useValue:signal(true)});const f=TestBed.createComponent(LocalDeckNotice);f.detectChanges();expect(f.nativeElement.textContent).toBe('');
 });
});

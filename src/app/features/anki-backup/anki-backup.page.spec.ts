import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {provideRouter} from '@angular/router';
import {AnkiBackupPage} from './anki-backup.page';
import {DeckBackupService} from '../../core/services/deck-backup.service';
import {SettingsService} from '../../core/services/settings.service';
import {WorkspaceService} from '../../core/services/workspace.service';
describe('local backup page',()=>{
 beforeEach(()=>{localStorage.clear();const language=signal<'es'|'en'|'ca'>('es');vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));TestBed.configureTestingModule({providers:[provideRouter([]),{provide:SettingsService,useValue:{language,setLanguage:(value:'es'|'en'|'ca')=>language.set(value)}},{provide:DeckBackupService,useValue:{}}]});});
 afterEach(()=>{TestBed.resetTestingModule();localStorage.clear();vi.unstubAllGlobals();});
 it.each([['es','Copias de seguridad de Mazos'],['en','Deck backups'],['ca','Còpies de seguretat de Baralles']] as const)('renders its lazy dictionary through TranslationService in %s',async(language,title)=>{
  TestBed.inject(SettingsService).setLanguage(language);const f=TestBed.createComponent(AnkiBackupPage);f.detectChanges();await f.whenStable();f.detectChanges();expect(f.nativeElement.querySelector('h1').textContent).toBe(title);expect(f.nativeElement.textContent).not.toContain('deckBackup.');expect(f.nativeElement.querySelectorAll('input[type=file]')).toHaveLength(1);expect(f.nativeElement.querySelector('[role=alert]')).toBeNull();
 });
 it('clears a preview and its confirmation on workspace activation changes, including A-B-A',()=>{
  const f=TestBed.createComponent(AnkiBackupPage);f.detectChanges();f.componentInstance.preview.set({counts:{decks:1,cards:1,events:0},exportedAt:'2026-10-25T12:00:00.000Z'} as any);f.componentInstance.confirmed.set(true);const w=TestBed.inject(WorkspaceService);w.activateUser('other');w.activateGuest();f.detectChanges();expect(f.componentInstance.preview()).toBeNull();expect(f.componentInstance.confirmed()).toBe(false);
 });
});

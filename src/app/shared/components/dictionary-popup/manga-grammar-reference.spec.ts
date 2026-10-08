import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MangaGrammarReference } from './manga-grammar-reference';
import { DictionaryPopup } from './dictionary-popup';
import { TranslationService } from '../../../core/services/translation.service';
import { SettingsService } from '../../../core/services/settings.service';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { MangaStudySavedRepository } from '../../../core/services/manga-study-saved.repository';
import { SyncOutboxService } from '../../../core/services/sync-outbox.service';
import { MangaContextService } from '../../../core/services/manga-context.service';

describe('Manga grammar reference is read-only and integrated',()=>{
  const enqueue=vi.fn(async()=>{}),request=vi.fn();
  beforeEach(()=>{
    TestBed.resetTestingModule();localStorage.clear();enqueue.mockClear();request.mockClear();
    vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:()=>{},removeEventListener:()=>{}}));
    TestBed.configureTestingModule({providers:[provideRouter([]),{provide:SyncOutboxService,useValue:{enqueue}},
      {provide:MangaContextService,useValue:{available:false,request}},
      {provide:MangaStudySavedRepository,useValue:{items:signal([]),loading:signal(false),failed:signal(false)}}]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
  async function reference(text='見てください。'){
    await TestBed.inject(TranslationService).loadGrammar();const fixture=TestBed.createComponent(MangaGrammarReference);
    fixture.componentRef.setInput('point',{mode:'selection',selectedText:text,text,offset:0,startOffset:0,endOffset:text.length,x:0,y:0});
    fixture.componentRef.setInput('returnTo','/manga/read/original%20volume?page=7');
    fixture.detectChanges();await fixture.whenStable();fixture.detectChanges();return fixture;
  }
  it.each(['es','en','ca'] as const)('renders course references and valid links in %s without progress/events',async language=>{
    TestBed.inject(SettingsService).setLanguage(language);const fixture=await reference();
    const before=Object.fromEntries(Object.entries(localStorage));const writes=vi.spyOn(Storage.prototype,'setItem');
    fixture.componentInstance.choose('te-kudasai');fixture.detectChanges();
    const root=fixture.nativeElement as HTMLElement;
    expect(root.textContent).not.toMatch(/manga\.grammar\.|grammar\.v2\./);
    expect(root.querySelector('a')?.getAttribute('href')).toContain('/grammar/n5/07/te-kudasai');
    expect(root.querySelectorAll('a')[1].getAttribute('href')).toContain('lesson=te-kudasai');
    expect(root.querySelectorAll('a')[1].getAttribute('href')).toContain('return=');
    expect(writes).not.toHaveBeenCalled();expect(enqueue).not.toHaveBeenCalled();expect(request).not.toHaveBeenCalled();
    expect(Object.fromEntries(Object.entries(localStorage))).toEqual(before);
  });
  it('offers manual search for ambiguous text and renders OCR only as safe text',async()=>{
    const fixture=await reference('<img src=x onerror=alert(1)>は\n食べた');const root=fixture.nativeElement as HTMLElement;
    expect(root.querySelector('img')).toBeNull();expect(root.querySelector('.original')?.textContent).toBe('<img src=x onerror=alert(1)>は\n食べた');
    expect(root.textContent).toContain('No se ha encontrado una coincidencia gramatical segura.');
    fixture.componentInstance.query.set('ください');fixture.detectChanges();expect(root.querySelectorAll('.result').length).toBeGreaterThan(0);
    fixture.componentInstance.choose('invented');fixture.detectChanges();expect(root.querySelector('.reference')).toBeNull();
  });
  it('resets chosen lessons and search on changed selection/location/account; language stays dynamic',async()=>{
    const fixture=await reference();fixture.componentInstance.choose('te-kudasai');fixture.componentInstance.query.set('ください');
    fixture.componentRef.setInput('point',{mode:'selection',selectedText:'食べた',text:'食べた',offset:0,x:0,y:0});fixture.detectChanges();
    expect(fixture.componentInstance.chosen()).toBeNull();expect(fixture.componentInstance.query()).toBe('');
    fixture.componentInstance.choose('te-kudasai');fixture.componentRef.setInput('returnTo','/manga/read/new?page=2');fixture.detectChanges();expect(fixture.componentInstance.chosen()).toBeNull();
    fixture.componentInstance.choose('te-kudasai');TestBed.inject(WorkspaceService).activateUser('next');fixture.detectChanges();expect(fixture.componentInstance.chosen()).toBeNull();
  });
  it('adds a third tab without a dictionary, preserves the first two and traps search focus',async()=>{
    await TestBed.inject(TranslationService).loadGrammar();const fixture=TestBed.createComponent(DictionaryPopup);
    fixture.componentRef.setInput('result',{installed:false,query:'見てください',terms:[]});
    fixture.componentRef.setInput('context',{mode:'selection',selectedText:'見てください。',text:'見てください。',offset:0,x:0,y:0});
    fixture.detectChanges();expect(fixture.nativeElement.querySelectorAll('.tabs button')).toHaveLength(3);
    expect(fixture.nativeElement.textContent).toContain('Instala JMdict Español');
    fixture.componentInstance.tab.set('context');fixture.detectChanges();expect(fixture.nativeElement.querySelector('.context-actions')).not.toBeNull();
    fixture.componentInstance.tab.set('grammar');fixture.detectChanges();
    await fixture.whenStable();fixture.detectChanges();expect(fixture.nativeElement.querySelector('input[type=search]')).not.toBeNull();
    fixture.nativeElement.querySelector('input').focus();const tab=new KeyboardEvent('keydown',{key:'Tab',cancelable:true});fixture.componentInstance.key(tab);
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.close'));expect(tab.defaultPrevented).toBe(true);
    const closed=vi.fn();fixture.componentInstance.closed.subscribe(closed);fixture.componentInstance.key(new KeyboardEvent('keydown',{key:'Escape'}));expect(closed).toHaveBeenCalledOnce();
    expect(enqueue).not.toHaveBeenCalled();expect(request).not.toHaveBeenCalled();
  });
});

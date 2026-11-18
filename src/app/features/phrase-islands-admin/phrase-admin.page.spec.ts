import { TestBed } from '@angular/core/testing';
import { PhraseAdminPage } from './phrase-admin.page';
import { PhraseAuthoringPreferences } from '../../core/services/phrase-authoring-preferences.service';
import { SettingsService } from '../../core/services/settings.service';

describe('Local phrase editor files and isolation',()=>{
 let counter=0;
 beforeEach(()=>{
  vi.stubGlobal('crypto',{randomUUID:()=>`12345678-1234-4123-8123-${String(++counter).padStart(12,'0')}`,subtle:{digest:async()=>new Uint8Array(32).buffer}});
  TestBed.configureTestingModule({imports:[PhraseAdminPage],providers:[PhraseAuthoringPreferences,{provide:SettingsService,useExisting:PhraseAuthoringPreferences}]});
 });
 afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
 async function create(){const f=TestBed.createComponent(PhraseAdminPage);f.detectChanges();await f.whenStable();f.detectChanges();return f;}
 it('starts as a private incomplete draft and never instantiates study writes',async()=>{
  const write=vi.spyOn(Storage.prototype,'setItem');const f=await create();expect(f.componentInstance.draft()?.operation).toBe('create');expect(f.componentInstance.structuralIssues()).toEqual([]);expect(f.componentInstance.issues().length).toBeGreaterThan(0);expect(write).not.toHaveBeenCalled();
 });
 it('edits an existing phrase while preserving its ID and source translations',async()=>{
  const f=await create(),c=f.componentInstance;await c.selectPublished('pi-everyday-001');const id=c.draft()!.phrase.id;c.setLocalization('natural','Otra traducción revisable.');expect(c.draft()!.phrase.id).toBe(id);expect(c.dirty()).toBe(true);expect(c.draft()!.phrase.localizations.en.natural).not.toBe('Otra traducción revisable.');expect(c.draft()!.base.contentRevision).toBeTruthy();
 });
 it('keeps incomplete drafts editable and warns before discarding them',async()=>{
  const f=await create(),c=f.componentInstance,id=c.draft()!.phrase.id;c.setText('japanese','少し休みましょう。');vi.spyOn(window,'confirm').mockReturnValue(false);await c.newDraft();expect(c.draft()!.phrase.id).toBe(id);const e=new Event('beforeunload',{cancelable:true}) as BeforeUnloadEvent;c.beforeUnload(e);expect(e.defaultPrevented).toBe(true);
 });
 it('updates only the selected locale and reconstructs segment input without guessing readings',async()=>{
  const f=await create(),c=f.componentInstance;c.addSegment();c.setSegment(0,'text','休');c.setSegment(0,'reading','やす');c.editorLanguage.set('ca');c.setLocalization('natural','Descansem.');expect(c.draft()!.phrase.localizations.ca.natural).toBe('Descansem.');expect(c.draft()!.phrase.localizations.es.natural).toBe('');expect(c.draft()!.phrase.segments).toEqual([{text:'休',reading:'やす'}]);
 });
 it.each(['es','en','ca'] as const)('renders editor copy through TranslationService in %s',async lang=>{
  const f=await create();f.componentInstance.preferences.setLanguage(lang);f.detectChanges();expect(f.nativeElement.textContent).not.toContain('phraseAdmin.');expect(f.nativeElement.querySelector('h1').textContent.length).toBeGreaterThan(8);
 });
});

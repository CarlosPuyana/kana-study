import {Component,input} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {ConjugationsPage} from './conjugations.page';
import {PageHeader} from '../../shared/components/page-header/page-header';
import {TranslationService} from '../../core/services/translation.service';
import {SyncOutboxService} from '../../core/services/sync-outbox.service';
import {WorkspaceService} from '../../core/services/workspace.service';
import {StorageService} from '../../core/services/storage.service';
import * as copy from '../../../assets/i18n/conjugations.generated';
@Component({selector:'app-page-header',template:'<h1>{{titleKey()}}</h1>'})class HeaderStub{readonly titleKey=input('');readonly backRoute=input('');readonly backQueryParams=input<unknown>();}
describe('Conjugations selection page',()=>{
  let fixture:ReturnType<typeof TestBed.createComponent<ConjugationsPage>>;
  beforeEach(()=>{localStorage.clear();TestBed.configureTestingModule({imports:[ConjugationsPage],providers:[{provide:SyncOutboxService,useValue:{enqueue:vi.fn(async()=>{})}},{provide:TranslationService,useValue:{useStudyCopy:vi.fn(),t:(key:string,replacements:Record<string,string|number>={})=>Object.entries(replacements).reduce((s,[name,value])=>s.replaceAll('{{'+name+'}}',String(value)),copy.es[key]??key)}}]}).overrideComponent(ConjugationsPage,{remove:{imports:[PageHeader]},add:{imports:[HeaderStub]}});
    fixture=TestBed.createComponent(ConjugationsPage);fixture.detectChanges();});
  afterEach(()=>{fixture.destroy();TestBed.resetTestingModule();localStorage.clear();vi.restoreAllMocks();});
  const query=(selector:string)=>fixture.nativeElement.querySelector(selector) as HTMLElement;
  it('renders exactly twenty cards and pending indicators, with mixed practice disabled when empty',()=>{
    expect(fixture.nativeElement.querySelectorAll('.category-card')).toHaveLength(20);expect(fixture.nativeElement.querySelectorAll('.indicators dd')).toHaveLength(40);
    expect([...fixture.nativeElement.querySelectorAll('.indicators dd')].every((node:any)=>node.textContent==='Pendiente')).toBe(true);
    expect((query('.mix button.primary') as HTMLButtonElement).disabled).toBe(true);
  });
  it('preserves hidden selections and select-all includes the entire catalog',()=>{
    const page=fixture.componentInstance;page.selection.setCategory('verb-negative',true);page.filter.set('adjective');fixture.detectChanges();expect(page.visible()).toHaveLength(2);expect(page.hiddenSelected()).toBe(1);
    page.selectAll();fixture.detectChanges();expect(page.selection.count()).toBe(20);expect(page.hiddenSelected()).toBe(18);page.clear();expect(page.selection.count()).toBe(0);
  });
  it('individual practice is a clear announcement, without toggling selection or navigating',()=>{
    query('.individual').click();fixture.detectChanges();expect(fixture.componentInstance.selection.count()).toBe(0);expect(query('.practice-status').textContent).toContain('todavía no está disponible');
    expect(fixture.nativeElement.querySelector('a[href*="practice"]')).toBeNull();expect(Object.keys(localStorage).some(key=>/session|progress|review|attempt/.test(key))).toBe(false);
  });
  it('checkbox changes once and mixed requests keep their saved IDs',()=>{
    const input=query('.category-card input') as HTMLInputElement;input.click();fixture.detectChanges();expect(fixture.componentInstance.selection.ids()).toEqual(['verb-negative']);
    query('.mix button.primary').click();fixture.detectChanges();expect(query('.practice-status').textContent).toContain('seleccionadas: 1');expect(fixture.componentInstance.selection.ids()).toEqual(['verb-negative']);
  });
  it('rolls a checkbox back after a failed write and shows the failure',()=>{
    vi.spyOn(TestBed.inject(StorageService),'set').mockImplementation(()=>{throw Error('QA quota');});const input=query('.category-card input') as HTMLInputElement;input.click();fixture.detectChanges();expect(input.checked).toBe(false);expect(query('.save-error').getAttribute('role')).toBe('alert');
  });
  it('clears an earlier workspace request and synchronously restores its own selection',()=>{
    const page=fixture.componentInstance,workspace=TestBed.inject(WorkspaceService);workspace.activateUser('qa-a');page.selection.setCategory('adjective-i',true);page.requestPractice();expect(page.notice()).toContain('seleccionadas: 1');
    workspace.activateUser('qa-b');expect(page.notice()).toBe('');expect(page.selection.ids()).toEqual([]);page.selection.setCategory('copula-plain',true);workspace.activateUser('qa-a');expect(page.selection.ids()).toEqual(['adjective-i']);
  });
});

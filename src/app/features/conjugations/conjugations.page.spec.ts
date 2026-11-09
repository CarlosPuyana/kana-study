import {Component,input} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {ConjugationsPage} from './conjugations.page';
import {PageHeader} from '../../shared/components/page-header/page-header';
import {TranslationService} from '../../core/services/translation.service';
import {SyncOutboxService} from '../../core/services/sync-outbox.service';
import {WorkspaceService} from '../../core/services/workspace.service';
import {StorageService} from '../../core/services/storage.service';
import * as copy from '../../../assets/i18n/conjugations.generated';
import {Router} from '@angular/router';
@Component({selector:'app-page-header',template:'<h1>{{titleKey()}}</h1>'})class HeaderStub{readonly titleKey=input('');readonly backRoute=input('');readonly backQueryParams=input<unknown>();}
describe('Conjugations selection page',()=>{
  const navigate=vi.fn(async()=>true);
  let fixture:ReturnType<typeof TestBed.createComponent<ConjugationsPage>>;
  beforeEach(()=>{localStorage.clear();navigate.mockClear();TestBed.configureTestingModule({imports:[ConjugationsPage],providers:[{provide:Router,useValue:{navigate}},{provide:SyncOutboxService,useValue:{enqueue:vi.fn(async()=>{})}},{provide:TranslationService,useValue:{useStudyCopy:vi.fn(),t:(key:string,replacements:Record<string,string|number>={})=>Object.entries(replacements).reduce((s,[name,value])=>s.replaceAll('{{'+name+'}}',String(value)),copy.es[key]??key)}}]}).overrideComponent(ConjugationsPage,{remove:{imports:[PageHeader]},add:{imports:[HeaderStub]}});
    fixture=TestBed.createComponent(ConjugationsPage);fixture.detectChanges();});
  afterEach(()=>{fixture.destroy();TestBed.resetTestingModule();localStorage.clear();vi.restoreAllMocks();});
  const query=(selector:string)=>fixture.nativeElement.querySelector(selector) as HTMLElement;
  it('renders exactly twenty cards and pending indicators, with mixed practice disabled when empty',()=>{
    expect(fixture.nativeElement.querySelectorAll('.category-card')).toHaveLength(20);expect(fixture.nativeElement.querySelectorAll('.indicators dd')).toHaveLength(40);
    expect([...fixture.nativeElement.querySelectorAll('.category-card')].slice(0,2).map((n:any)=>n.dataset.categoryId)).toEqual(['adjective-i','adjective-na']);
    expect([...fixture.nativeElement.querySelectorAll('.indicators dd')].filter((node:any)=>node.textContent==='Pendiente')).toHaveLength(36);
    expect(query('[data-category-id="adjective-i"] .indicators dd').textContent).toBe('15');expect(query('[data-category-id="adjective-na"] .indicators dd').textContent).toBe('10');
    expect((query('.mix button.primary') as HTMLButtonElement).disabled).toBe(true);
  });
  it('preserves hidden selections and select-all includes the entire catalog',()=>{
    const page=fixture.componentInstance;page.selection.setCategory('verb-negative',true);page.filter.set('adjective');fixture.detectChanges();expect(page.visible()).toHaveLength(2);expect(page.hiddenSelected()).toBe(1);
    page.selectAll();fixture.detectChanges();expect(page.selection.count()).toBe(20);expect(page.hiddenSelected()).toBe(18);page.clear();expect(page.selection.count()).toBe(0);
  });
  it('locks unavailable cards without an individual action or navigation',()=>{
    query('[data-category-id="verb-negative"]').click();fixture.detectChanges();expect(fixture.componentInstance.selection.count()).toBe(0);expect(query('[data-category-id="verb-negative"] .availability').textContent).toContain('Próximamente');expect(query('[data-category-id="verb-negative"] .card-open')).toBeNull();expect(navigate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('a[href*="practice"]')).toBeNull();expect(Object.keys(localStorage).some(key=>/session|progress|review|attempt/.test(key))).toBe(false);
  });
  it('checkbox changes once and mixed requests keep their saved IDs',()=>{
    const input=query('[data-category-id="verb-negative"] input') as HTMLInputElement;input.click();fixture.detectChanges();expect(fixture.componentInstance.selection.ids()).toEqual(['verb-negative']);
    query('.mix button.primary').click();fixture.detectChanges();expect(query('.practice-status').textContent).toContain('seleccionadas: 1');expect(fixture.componentInstance.selection.ids()).toEqual(['verb-negative']);
  });
  it('rolls a checkbox back after a failed write and shows the failure',()=>{
    vi.spyOn(TestBed.inject(StorageService),'set').mockImplementation(()=>{throw Error('QA quota');});const input=query('.category-card input') as HTMLInputElement;input.click();fixture.detectChanges();expect(input.checked).toBe(false);expect(query('.save-error').getAttribute('role')).toBe('alert');
  });
  it('clears an earlier workspace request and synchronously restores its own selection',()=>{
    const page=fixture.componentInstance,workspace=TestBed.inject(WorkspaceService);workspace.activateUser('qa-a');page.selection.setCategory('verb-negative',true);page.requestPractice();expect(page.notice()).toContain('seleccionadas: 1');
    workspace.activateUser('qa-b');expect(page.notice()).toBe('');expect(page.selection.ids()).toEqual([]);page.selection.setCategory('copula-plain',true);workspace.activateUser('qa-a');expect(page.selection.ids()).toEqual(['verb-negative']);
  });
  it('starts only selected available categories and requires explicit consent to a supported subset',()=>{
    const p=fixture.componentInstance;query('[data-category-id="adjective-na"] .card-open').click();expect(navigate).toHaveBeenLastCalledWith(['/conjugations/practice'],{queryParams:{mode:'single',categories:'adjective-na'}});expect(p.selection.count()).toBe(0);
    navigate.mockClear();p.selection.setCategory('adjective-i',true);p.selection.setCategory('verb-past',true);p.requestPractice();fixture.detectChanges();expect(navigate).not.toHaveBeenCalled();expect(p.notice()).toContain('Pasado');expect(p.availableRequest()).toEqual(['adjective-i']);
    query('.available-only').click();expect(navigate).toHaveBeenCalledWith(['/conjugations/practice'],{queryParams:{mode:'mixed',categories:'adjective-i'}});expect(p.selection.ids()).toEqual(['verb-past','adjective-i']);
  });
});

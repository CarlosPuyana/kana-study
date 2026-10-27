import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { GrammarAccessService, GrammarAccessState } from '../../core/services/grammar-access.service';
import { AuthService } from '../../core/services/auth.service';
import { grammarChild, grammarDestination, grammarMatch } from '../../core/services/grammar-access.guard';
import { GrammarAccessShell } from './grammar-access-shell';
import { GrammarAccessPage } from './grammar-access.page';
import { MorePage } from '../more/more.page';
import { WorkspaceService } from '../../core/services/workspace.service';

const opened=vi.fn();
@Component({template:'<p>Authorized course fixture</p>'}) class CourseFixture { constructor(){opened();} }
@Component({template:'Home fixture'}) class HomeFixture {}
describe('Grammar route boundary and entry points',()=>{
  const allowed=signal(false),state=signal<GrammarAccessState>('denied'),check=vi.fn();
  const courseLoad=vi.fn(async()=>[{path:'**',component:CourseFixture}]),resolver=vi.fn(()=>true);
  beforeEach(()=>{
    localStorage.clear();allowed.set(false);state.set('denied');check.mockReset();check.mockImplementation(async()=>allowed());courseLoad.mockClear();resolver.mockClear();opened.mockClear();
    vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:()=>{},removeEventListener:()=>{}}));
    TestBed.configureTestingModule({providers:[
      {provide:GrammarAccessService,useValue:{allowed,state,check,scope:signal('A:0')}},
      {provide:AuthService,useValue:{ready:signal(true),authenticated:signal(false)}},
      provideRouter([{path:'',component:HomeFixture},{path:'grammar-access',component:GrammarAccessPage},
        {path:'grammar',canMatch:[grammarMatch],canActivateChild:[grammarChild],component:GrammarAccessShell,resolve:{course:resolver},loadChildren:courseLoad}]),
    ]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.unstubAllGlobals();});
  it.each(['/grammar','/grammar/review','/grammar/n5/07/te-kudasai','/grammar/n5/07/practice','/grammar/n5/11/07'])('rejects direct %s before course loading or resolvers',async path=>{
    const harness=await RouterTestingHarness.create();await harness.navigateByUrl(path);
    expect(TestBed.inject(Router).url).toContain('/grammar-access?');
    expect(harness.routeNativeElement?.textContent).toContain('Beta privada');
    expect(courseLoad).not.toHaveBeenCalled();expect(resolver).not.toHaveBeenCalled();
    expect(harness.routeNativeElement?.querySelector('app-grammar-access-shell')).toBeNull();
  });
  it('does not render course while the guard request is pending, then allows authorized children',async()=>{
    let resolve!:(value:boolean)=>void;check.mockReturnValueOnce(new Promise(r=>resolve=r));
    const harness=await RouterTestingHarness.create();const navigation=harness.navigateByUrl('/grammar/n5/01/a');
    await Promise.resolve();expect(courseLoad).not.toHaveBeenCalled();expect(resolver).not.toHaveBeenCalled();
    allowed.set(true);state.set('authorized');resolve(true);await navigation;
    expect(harness.routeNativeElement?.textContent).toContain('Authorized course fixture');
    expect(check).toHaveBeenCalledWith(true);expect(resolver).toHaveBeenCalledOnce();
    await harness.navigateByUrl('/grammar/review');expect(harness.routeNativeElement?.textContent).toContain('Authorized course fixture');
  });
  it('destroys an open course and leaves it on revocation without touching progress',async()=>{
    TestBed.inject(WorkspaceService);
    localStorage.setItem('kana-study.grammar-progress.v2','{"version":2,"concepts":{"historical":{"status":"completed"}}}');
    allowed.set(true);state.set('authorized');const harness=await RouterTestingHarness.create('/grammar/review');
    expect(harness.routeNativeElement?.textContent).toContain('Authorized course fixture');
    const stored=Object.fromEntries(Object.entries(localStorage));allowed.set(false);state.set('denied');TestBed.tick();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toContain('/grammar-access');expect(harness.fixture.nativeElement.textContent).not.toContain('Authorized course fixture');
    expect(Object.fromEntries(Object.entries(localStorage))).toEqual(stored);
  });
  it('hides and disables an open activity while revalidating, then resumes the same route',async()=>{
    allowed.set(true);state.set('authorized');const harness=await RouterTestingHarness.create('/grammar/review');
    const original=harness.routeNativeElement?.querySelector('router-outlet')?.nextElementSibling;
    allowed.set(false);state.set('checking');TestBed.tick();harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('section')?.hidden).toBe(true);
    expect(harness.routeNativeElement?.querySelector('section')?.hasAttribute('inert')).toBe(true);
    expect(TestBed.inject(Router).url).toBe('/grammar/review');
    allowed.set(true);state.set('authorized');TestBed.tick();harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('section')?.hidden).toBe(false);
    expect(harness.routeNativeElement?.querySelector('router-outlet')?.nextElementSibling).toBe(original);
  });
  it('does not instantiate an activity if the lease changes between the guard and activation',async()=>{
    check.mockResolvedValue(true);state.set('checking');
    const harness=await RouterTestingHarness.create('/grammar/review');
    expect(opened).not.toHaveBeenCalled();
    expect(harness.fixture.nativeElement.textContent).not.toContain('Authorized course fixture');
  });
  it('does not accept external, malformed or unrelated login return destinations',()=>{
    for(const value of ['https://evil.test','//evil.test','/\\evil','/%2f%2fevil','/profile','/grammar-access','/grammarish'])expect(grammarDestination(value)).toBe('/grammar');
    expect(grammarDestination('/grammar/n5/07/te-kudasai?return=%2Fmanga')).toBe('/grammar/n5/07/te-kudasai?return=%2Fmanga');
  });
  it('hides the module card until explicitly authorized and removes it immediately',async()=>{
    const fixture=TestBed.createComponent(MorePage);fixture.detectChanges();
    expect(fixture.componentInstance.modules().some(m=>m.id==='grammar')).toBe(false);
    expect(fixture.nativeElement.querySelector('a[href$="/grammar"]')).toBeNull();
    allowed.set(true);fixture.detectChanges();expect(fixture.nativeElement.querySelector('a[href$="/grammar"]')).not.toBeNull();
    allowed.set(false);fixture.detectChanges();expect(fixture.nativeElement.querySelector('a[href$="/grammar"]')).toBeNull();
  });
});

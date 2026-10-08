import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { MangaReviewPage } from './manga-review.page';
import { MangaStudySavedRepository } from '../../core/services/manga-study-saved.repository';
import { SyncOutboxService } from '../../core/services/sync-outbox.service';
import { SyncService } from '../../core/services/sync.service';
import { AuthService } from '../../core/services/auth.service';

describe('Manga review page',()=>{
  beforeEach(()=>{localStorage.clear();vi.spyOn(document,'hidden','get').mockReturnValue(false);
    vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:()=>{},removeEventListener:()=>{}}));});
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
  function page(context='<img src=x onerror="alert(1)">龍。') {
    const items=signal([{schemaVersion:1,id:'external',expression:'龍',reading:'りゅう',meaning:'dragon',surface:'龍',context,kanji:[],source:{volumeId:'fixture',pageNumber:1},createdAt:1}]);
    TestBed.configureTestingModule({providers:[provideRouter([]),{provide:SyncOutboxService,useValue:{enqueue:async()=>{}}},
      {provide:AuthService,useValue:{authenticated:signal(false)}},{provide:SyncService,useValue:{status:signal('guest')}},
      {provide:MangaStudySavedRepository,useValue:{items,loading:signal(false),failed:signal(false),reload:async()=>{}}}]});
    const fixture=TestBed.createComponent(MangaReviewPage);fixture.detectChanges();return {fixture,items};
  }
  it('renders imported context as text and a safe highlighted surface, never HTML',()=>{
    const {fixture}=page();fixture.componentInstance.mode.set('contextual');fixture.componentInstance.start();fixture.detectChanges();
    const root=fixture.nativeElement as HTMLElement;expect(root.querySelector('blockquote')?.textContent).toContain('<img src=x onerror="alert(1)">龍。');
    expect(root.querySelector('blockquote img')).toBeNull();expect(root.querySelector('blockquote mark')?.textContent).toBe('龍');
  });
  it('disables empty sessions and updates configuration after remote saved-word changes',()=>{
    const {fixture,items}=page();expect(fixture.componentInstance.selectedCount()).toBe(1);
    items.set([]);fixture.detectChanges();const start=[...fixture.nativeElement.querySelectorAll('button')].find((button:any)=>button.textContent.trim()==='Comenzar') as HTMLButtonElement;
    expect(start.disabled).toBe(true);fixture.componentInstance.start();expect(fixture.componentInstance.session.state()).toBe('intro');
  });
  it('keeps started questions stable when the saved collection is remotely removed',()=>{
    const {fixture,items}=page();fixture.componentInstance.start();const q=fixture.componentInstance.session.current();items.set([]);fixture.detectChanges();
    expect(fixture.componentInstance.session.current()).toEqual(q);
  });
});

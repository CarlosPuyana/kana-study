import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { GrammarPage } from './pages/grammar.page';
import { GRAMMAR_ROUTES } from './grammar.routes';
import { TranslationService } from '../../core/services/translation.service';
import { GrammarV2ProgressService } from '../../core/services/grammar-v2-progress.service';

describe('Manga entry into existing Grammar navigation',()=>{
  beforeEach(()=>{localStorage.clear();vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:()=>{}}));vi.spyOn(window,'scrollTo').mockImplementation(()=>{});TestBed.configureTestingModule({providers:[provideRouter(GRAMMAR_ROUTES)]});});
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
  it.each(['n5/07/te-kudasai','n5/07/practice?lesson=te-kudasai'])('preserves a safe manga return for %s',async path=>{
    await TestBed.inject(TranslationService).loadGrammar();const harness=await RouterTestingHarness.create();
    const page=await harness.navigateByUrl('/'+path+(path.includes('?')?'&':'?')+'return='+encodeURIComponent('/manga/read/book?page=7'),GrammarPage);
    expect(page.mangaReturn()).toBe('/manga/read/book?page=7');expect(harness.routeNativeElement?.querySelector('.manga-return a')?.getAttribute('href')).toContain('/manga/read/book?page=7');
    if(path.includes('practice'))expect(page.practice()?.exercises.every(exercise=>exercise.lessonId==='te-kudasai')).toBe(true);
    else expect(TestBed.inject(GrammarV2ProgressService).state().concepts['te-kudasai']?.openedAt).toBeTruthy();
  });
  it.each(['https://evil.test','//evil.test','/grammar','/%2f%2fevil.test','/manga/read/book\\evil'])('rejects unsafe/non-manga return %s',async value=>{
    const harness=await RouterTestingHarness.create();const page=await harness.navigateByUrl('/n5/07/te-kudasai?return='+encodeURIComponent(value),GrammarPage);
    expect(page.mangaReturn()).toBeNull();
  });
});

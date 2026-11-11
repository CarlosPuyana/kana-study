import {isolatedKanjiAvailability} from '../core/services/kanji-availability.test-support';
import {GrammarAccessService} from '../core/services/grammar-access.service';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, ParamMap, provideRouter, RouterLink } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { FlagProgressService } from '../core/services/flag-progress.service';
import { MedalService } from '../core/services/medal.service';
import { FlagMedalService } from '../core/services/flag-medal.service';
import { KanjiMedalService } from '../core/services/kanji-medal.service';
import { ProgressService } from '../core/services/progress.service';
import { SettingsService } from '../core/services/settings.service';
import { RushSettingsService } from '../core/services/rush-settings.service';
import { TranslationService } from '../core/services/translation.service';
import { FlagsPage } from '../features/flags/flags.page';
import { KanjiPage } from '../features/kanji/kanji.page';
import { KanjiProgressService } from '../core/services/kanji-progress.service';
import { HomePage } from '../features/home/home.page';
import { MorePage } from '../features/more/more.page';
import { ModuleCard } from '../shared/components/module-card/module-card';
import { SelectionCard } from '../shared/components/selection-card/selection-card';
import { APP_MODULES } from './app-modules';

const moreOrder = ['kana','vocabulary','anki','conjugations','kanji','manga','grammar','flags'];
const translate = { t: (key: string) => key, useStudyCopy:()=>{}, language:signal('es') };
const emptyStats = {
  total: 0,
  newCount: 0,
  pendingCount: 0,
  memorizedCount: 0,
  dueCount: 0,
  percentage: 0,
};

describe('Module navigation', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('A: defines the nine modules in deterministic navigation order', () => {
    expect(APP_MODULES).toHaveLength(9);
    expect(APP_MODULES.map(module => module.id)).toEqual([
      'kana', 'kanji', 'vocabulary', 'flags', 'anki', 'grammar', 'manga', 'conjugations', 'extras',
    ]);
    expect(APP_MODULES.map(module => module.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('B: exposes Kana as available at the root route', () => {
    expect(APP_MODULES.find(module => module.id === 'kana')).toEqual(
      expect.objectContaining({ available: true, route: '/' }),
    );
  });

  it('C: exposes Flags as available at /flags', () => {
    expect(APP_MODULES.find(module => module.id === 'flags')).toEqual(
      expect.objectContaining({ available: true, route: '/flags' }),
    );
  });

  it('C2: exposes Kanji as available at /kanji', () => {
    expect(APP_MODULES.find(module => module.id === 'kanji')).toEqual(
      expect.objectContaining({ available: true, route: '/kanji' }),
    );
  });

  it('C3: exposes Vocabulary as available at /vocabulary', () => {
    expect(APP_MODULES.find(module => module.id === 'vocabulary')).toEqual(
      expect.objectContaining({ available: true, route: '/vocabulary' }),
    );
  });

  it('C4: exposes Decks as available at /anki', () => {
    expect(APP_MODULES.find(module => module.id === 'anki')).toEqual(
      expect.objectContaining({ available: true, route: '/anki' }),
    );
  });

  it('D: includes Kana when the origin is kana', async () => {
    const fixture = await createMoreFixture('kana');
    expect(visibleModuleIds(fixture)).toContain('kana');
    expect(visibleModuleIds(fixture)).toEqual(moreOrder);
  });

  it('E: includes Flags when the origin is flags', async () => {
    const fixture = await createMoreFixture('flags');
    expect(visibleModuleIds(fixture)).toContain('flags');
    expect(visibleModuleIds(fixture)).toEqual(moreOrder);
  });

  it('F: shows available modules without an origin', async () => {
    const fixture = await createMoreFixture();
    expect(visibleModuleIds(fixture)).toEqual(moreOrder);
  });

  it('F2: includes Kanji and returns to it when the origin is kanji', async () => {
    const fixture = await createMoreFixture('kanji');
    expect(visibleModuleIds(fixture)).toContain('kanji');
    expect(fixture.componentInstance.returnRoute()).toBe('/kanji');
  });

  it('F3: includes Vocabulary and returns to it when the origin is vocabulary', async () => {
    const fixture = await createMoreFixture('vocabulary');
    expect(visibleModuleIds(fixture)).toContain('vocabulary');
    expect(fixture.componentInstance.returnRoute()).toBe('/vocabulary');
  });

  it('F4: includes Decks and returns to it when the origin is anki', async () => {
    const fixture = await createMoreFixture('anki');
    expect(visibleModuleIds(fixture)).toContain('anki');
    expect(fixture.componentInstance.returnRoute()).toBe('/anki');
  });

  it('G: shows available modules for an unknown origin', async () => {
    const fixture = await createMoreFixture('unknown');
    expect(visibleModuleIds(fixture)).toEqual(moreOrder);
  });

  it('keeps restricted Grammar hidden and restores it in the requested position when access changes',async()=>{
    const allowed=signal(false),fixture=await createMoreFixture('grammar',allowed);
    expect(visibleModuleIds(fixture)).toEqual(moreOrder.filter(id=>id!=='grammar'));
    expect(fixture.componentInstance.returnRoute()).toBe('/');allowed.set(true);fixture.detectChanges();
    expect(visibleModuleIds(fixture)).toEqual(moreOrder);expect(fixture.componentInstance.returnRoute()).toBe('/grammar');
  });

  it('H: resolves the return route from the module definition', async () => {
    let fixture = await createMoreFixture('kana');
    expect(fixture.componentInstance.returnRoute()).toBe('/');
    TestBed.resetTestingModule();
    fixture = await createMoreFixture('flags');
    expect(fixture.componentInstance.returnRoute()).toBe('/flags');
  });

  it('I: Home Kana links More with from=kana', async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers:[
        provideRouter([]),
        { provide: TranslationService, useValue: translate },
        { provide: ProgressService, useValue: { stats: signal(emptyStats) } },
        { provide: MedalService, useValue: { homeMedals: signal([]), presentation: vi.fn() } },
        { provide: SettingsService, useValue: { selection: () => ({ categories: { hiragana: { basic: true, dakuten: false, handakuten: false, combination: false }, katakana: { basic: false, dakuten: false, handakuten: false, combination: false } }, questionTypes: ['kana-to-romaji'] }) } },
        { provide: RushSettingsService, useValue: { getOrInitialize: vi.fn(), save: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    const cards = fixture.debugElement.queryAll(By.directive(SelectionCard))
      .map(element => element.componentInstance as SelectionCard);
    const moreCard = cards.find(card => card.title() === 'home.more.title');

    expect(moreCard?.route()).toBe('/more');
    expect(moreCard?.queryParams()).toEqual({ from: 'kana' });
  });

  it('J: Home Flags links More with from=flags', async () => {
    await TestBed.configureTestingModule({
      imports: [FlagsPage],
      providers: [
        provideRouter([]),
        { provide: TranslationService, useValue: translate },
        { provide: FlagProgressService, useValue: { stats: signal(emptyStats) } },
        { provide: FlagMedalService, useValue: { homeMedals: signal([]), presentation: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(FlagsPage);
    fixture.detectChanges();
    const links = fixture.debugElement.queryAll(By.directive(RouterLink))
      .map(element => element.injector.get(RouterLink));

    expect(links.some(link => link.urlTree?.toString() === '/more?from=flags')).toBe(true);
  });

  it('K: renders blocked modules as disabled buttons without links', async () => {
    await TestBed.configureTestingModule({
      imports: [ModuleCard],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(ModuleCard);
    fixture.componentRef.setInput('definition', APP_MODULES.find(module => !module.available));
    fixture.componentRef.setInput('title', 'Locked');
    fixture.componentRef.setInput('description', 'Coming soon');
    fixture.componentRef.setInput('availableLabel', 'Available');
    fixture.componentRef.setInput('comingSoonLabel', 'Coming soon');
    fixture.detectChanges();

    expect((fixture.nativeElement.querySelector('button') as HTMLButtonElement).disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('a')).toBeNull();
  });

  it('L: Home Kanji links More with from=kanji', async () => {
    await TestBed.configureTestingModule({
      imports: [KanjiPage], providers: [isolatedKanjiAvailability,provideRouter([]),
        { provide: TranslationService, useValue: translate },
        { provide: KanjiProgressService, useValue: { stats: signal(emptyStats), roundSummary:()=>({roundNew:1}) } },
        { provide: KanjiMedalService, useValue: { homeMedals: signal([]), presentation: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(KanjiPage); fixture.detectChanges();
    const links = fixture.debugElement.queryAll(By.directive(RouterLink)).map(element => element.injector.get(RouterLink));
    expect(links.some(link => link.urlTree?.toString() === '/more?from=kanji')).toBe(true);
  });
});

async function createMoreFixture(from?: string, allowed=signal(true)): Promise<ComponentFixture<MorePage>> {
  const params = new BehaviorSubject<ParamMap>(convertToParamMap(from ? { from } : {}));
  await TestBed.configureTestingModule({
    imports: [MorePage],
    providers: [
      {provide:GrammarAccessService,useValue:{allowed}},
      provideRouter([]),
      { provide: TranslationService, useValue: translate },
      {
        provide: ActivatedRoute,
        useValue: { queryParamMap: params.asObservable(), snapshot: { queryParamMap: params.value } },
      },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(MorePage);
  fixture.detectChanges();
  return fixture;
}

function visibleModuleIds(fixture: ComponentFixture<MorePage>): string[] {
  return fixture.debugElement.queryAll(By.directive(ModuleCard))
    .map(element => (element.componentInstance as ModuleCard).definition().id);
}


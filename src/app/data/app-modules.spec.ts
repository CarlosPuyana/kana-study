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

const translate = { t: (key: string) => key };
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

  it('A: defines exactly eight modules in the requested order', () => {
    expect(APP_MODULES).toHaveLength(8);
    expect(APP_MODULES.map(module => module.id)).toEqual([
      'kana', 'kanji', 'vocabulary', 'flags', 'anki', 'grammar', 'manga', 'extras',
    ]);
    expect(APP_MODULES.map(module => module.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
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

  it('D: hides Kana when the origin is kana', async () => {
    const fixture = await createMoreFixture('kana');
    expect(visibleModuleIds(fixture)).not.toContain('kana');
    expect(visibleModuleIds(fixture)).toHaveLength(7);
  });

  it('E: hides Flags when the origin is flags', async () => {
    const fixture = await createMoreFixture('flags');
    expect(visibleModuleIds(fixture)).not.toContain('flags');
    expect(visibleModuleIds(fixture)).toHaveLength(7);
  });

  it('F: shows all eight modules without an origin', async () => {
    const fixture = await createMoreFixture();
    expect(visibleModuleIds(fixture)).toEqual(APP_MODULES.map(module => module.id));
  });

  it('F2: hides Kanji and returns to it when the origin is kanji', async () => {
    const fixture = await createMoreFixture('kanji');
    expect(visibleModuleIds(fixture)).not.toContain('kanji');
    expect(fixture.componentInstance.returnRoute()).toBe('/kanji');
  });

  it('F3: hides Vocabulary and returns to it when the origin is vocabulary', async () => {
    const fixture = await createMoreFixture('vocabulary');
    expect(visibleModuleIds(fixture)).not.toContain('vocabulary');
    expect(fixture.componentInstance.returnRoute()).toBe('/vocabulary');
  });

  it('F4: hides Decks and returns to it when the origin is anki', async () => {
    const fixture = await createMoreFixture('anki');
    expect(visibleModuleIds(fixture)).not.toContain('anki');
    expect(fixture.componentInstance.returnRoute()).toBe('/anki');
  });

  it('G: shows all eight modules for an unknown origin', async () => {
    const fixture = await createMoreFixture('unknown');
    expect(visibleModuleIds(fixture)).toEqual(APP_MODULES.map(module => module.id));
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
      providers: [
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
      imports: [KanjiPage], providers: [provideRouter([]),
        { provide: TranslationService, useValue: translate },
        { provide: KanjiProgressService, useValue: { stats: signal(emptyStats) } },
        { provide: KanjiMedalService, useValue: { homeMedals: signal([]), presentation: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(KanjiPage); fixture.detectChanges();
    const links = fixture.debugElement.queryAll(By.directive(RouterLink)).map(element => element.injector.get(RouterLink));
    expect(links.some(link => link.urlTree?.toString() === '/more?from=kanji')).toBe(true);
  });
});

async function createMoreFixture(from?: string): Promise<ComponentFixture<MorePage>> {
  const params = new BehaviorSubject<ParamMap>(convertToParamMap(from ? { from } : {}));
  await TestBed.configureTestingModule({
    imports: [MorePage],
    providers: [
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


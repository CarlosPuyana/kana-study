import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { IDBFactory, IDBKeyRange, IDBObjectStore as FakeObjectStore } from 'fake-indexeddb';
import { State } from 'ts-fsrs';
import { STUDY_DECKS } from '../../data/study-decks';
import { DeckDefinition } from '../../core/models/deck-catalog.model';
import { DeckSettings, NewCardOrder } from '../../core/models/deck.model';
import { DeckCardProgress, DeckEntryIndexItem } from '../../core/models/deck-study.model';
import { PUYI_DECK } from '../../core/models/puyi.model';
import { CUSTOM_DECKS_ENABLED, CustomDeckRepository } from '../../core/services/custom-deck.repository';
import { customCard, customDeck } from '../../core/services/custom-deck.fixture';
import { DeckCatalogService } from '../../core/services/deck-catalog.service';
import { DeckDatabaseService } from '../../core/services/deck-database.service';
import { deckTimeGroups } from '../../core/services/deck-learning-presentation';
import { DECK_SCHEDULER_ENABLE_FUZZ } from '../../core/services/deck-scheduler.service';
import { DeckSettingsService } from '../../core/services/deck-settings.service';
import { DeckStudyService, emptyDailyState } from '../../core/services/deck-study.service';
import { getLocalStudyDayKey, nextLocalStudyDayStart } from '../../core/services/deck-study-time';
import { KaishiStaticMediaService } from '../../core/services/kaishi-static-media.service';
import { PuyiService } from '../../core/services/puyi.service';
import { StorageService } from '../../core/services/storage.service';
import { SyncOutboxService } from '../../core/services/sync-outbox.service';
import { TranslationService } from '../../core/services/translation.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { AnkiSettingsPage } from './anki-settings.page';

const NOW = new Date('2026-11-06T11:00:00Z'), DAY = 86_400_000;
const deck = STUDY_DECKS[0];
const SETTINGS_KEY = 'kana-study.deck-settings.v1';
const fresh: DeckEntryIndexItem[] = Array.from({ length: 100 }, (_, i) => ({ id: `n${i}`, order: i + 67 }));
const reviews: DeckCardProgress[] = Array.from({ length: 40 }, (_, i) => {
  const due = NOW.getTime() + (i - 20) * 60_000;
  return { deckId: deck.id, entryId: `r${i}`, due, state: State.Review, card: { due, state: State.Review,
    stability: 30, difficulty: 5, reps: 8, lapses: 0, elapsedDays: 30, scheduledDays: 30,
    learningSteps: 0, lastReview: NOW.getTime() - 30 * DAY } };
});
const index = [...fresh].reverse().concat(reviews.map((p, i) => ({ id: p.entryId, order: 1000 + i })));

// Audit only: real controls → real persistence → real dynamic queue and scheduler.
// Unrelated media/network/outbox are isolated; never touches a browser profile or Supabase.
describe('Deck settings functional audit', () => {
  let fixture: ComponentFixture<AnkiSettingsPage> | undefined;
  let route: { snapshot: { paramMap: ReturnType<typeof convertToParamMap> } };
  let settings: DeckSettingsService, study: DeckStudyService, db: DeckDatabaseService;
  function configure() {
    route = { snapshot: { paramMap: convertToParamMap({ deckId: deck.id }) } };
    TestBed.configureTestingModule({ imports: [AnkiSettingsPage], providers: [provideRouter([]),
      { provide: ActivatedRoute, useValue: route },
      { provide: CUSTOM_DECKS_ENABLED, useValue: () => true },
      { provide: DECK_SCHEDULER_ENABLE_FUZZ, useValue: false },
      { provide: SyncOutboxService, useValue: { enqueue: async () => undefined } },
      { provide: PuyiService, useValue: { list: async () => [], imageUrl: () => null } },
      { provide: KaishiStaticMediaService, useValue: { publication: () => 'blocked', catalog: async () => ({ publication: 'blocked' }) } },
      { provide: TranslationService, useValue: { t: (key: string) => key } },
    ] });
    settings = TestBed.inject(DeckSettingsService); study = TestBed.inject(DeckStudyService); db = TestBed.inject(DeckDatabaseService);
  }
  beforeEach(() => {
    TestBed.resetTestingModule(); localStorage.clear();
    vi.stubGlobal('indexedDB', new IDBFactory()); vi.stubGlobal('IDBKeyRange', IDBKeyRange);
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW); fixture = undefined; configure();
  });
  afterEach(() => { TestBed.resetTestingModule(); vi.restoreAllMocks(); vi.useRealTimers(); vi.unstubAllGlobals(); });
  async function mount(deckId = deck.id) {
    route.snapshot.paramMap = convertToParamMap({ deckId });
    fixture = TestBed.createComponent(AnkiSettingsPage);
    fixture.detectChanges(); await fixture.componentInstance.resource.ready();
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    return fixture.componentInstance;
  }
  async function saveUI(count: number, order: NewCardOrder, retention = .9) {
    if (!fixture) await mount();
    const root = fixture!.nativeElement as HTMLElement;
    const input = root.querySelector<HTMLInputElement>('input[type=number]')!;
    input.value = String(count); input.dispatchEvent(new Event('input'));
    for (const [name, value] of [['order', order], ['retention', String(retention)]]) {
      const radio = root.querySelector<HTMLInputElement>(`input[name=${name}][value="${value}"]`)!;
      radio.checked = true; radio.dispatchEvent(new Event('change'));
    }
    const save = vi.spyOn(fixture!.componentInstance, 'save');
    root.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await save.mock.results.at(-1)?.value; save.mockRestore();
    fixture!.detectChanges(); await fixture!.componentInstance.resource.ready();
    fixture!.detectChanges(); await fixture!.whenStable(); fixture!.detectChanges();
  }
  async function seed() { await db.mergeFromCloud({ progress: reviews, daily: [], events: [] }); }

  it.each([0, 1, 10, 120])('UI saves %i new/day; forty daily reviews are never capped', async count => {
    await seed(); await saveUI(count, 'after-reviews', .95);
    const snap = await study.snapshot(deck, index, NOW);
    expect(snap.newAvailable).toBe(Math.min(count, 100)); expect(snap.reviewDue).toBe(40);
    expect(snap.newEntries).toEqual(fresh.slice(0, Math.min(count, 100)));
    expect(settings.settingsFor(deck)).toEqual({ newCardsPerDay: count, newCardOrder: 'after-reviews', desiredRetention: .95 });
    expect(fixture!.componentInstance.saved()).toBe(true);
    expect(await db.getDeckReviewEvents(deck.id)).toEqual([]);
  });

  it.each(['before-reviews', 'after-reviews', 'mixed'] as const)('%s selects the same new IDs and preserves chronological relative review order', async order => {
    await seed(); await saveUI(2, order);
    let cursor = { debt: 0 }; const sequence: string[] = [], introductions: string[] = [];
    for (let i = 0; i < 50; i++) {
      const snap = await study.snapshot(deck, index, NOW);
      const decision = study.chooseNext(snap, deck, cursor);
      if (!decision.choice) break;
      cursor = decision.cursor; const choice = decision.choice; sequence.push(choice.entryId);
      if (choice.kind === 'new') introductions.push(choice.entryId);
      await study.rate(deck, choice, study.preview(deck, choice, NOW), 'good', 100, NOW);
    }
    expect(introductions).toEqual(['n0', 'n1']);
    expect(sequence.filter(id => id.startsWith('r'))).toEqual(reviews.map(p => p.entryId));
    expect(sequence).toHaveLength(44);
    expect((await db.getDeckReviewEvents(deck.id))).toHaveLength(44);
    expect(new Set(sequence).size).toBe(42);
    if (order === 'before-reviews') expect(sequence.slice(0, 2)).toEqual(['n0', 'n1']);
    if (order === 'after-reviews') expect(sequence.slice(0, 40)).toEqual(reviews.map(p => p.entryId));
    if (order === 'mixed') { expect(sequence.indexOf('n0')).toBeGreaterThan(0); expect(sequence.indexOf('n0')).toBeLessThan(40); }
  });

  it.each(['before-reviews', 'after-reviews', 'mixed'] as const)('%s with zero reviews retains editorial new order before Learn Ahead repeats', async order => {
    await saveUI(3, order);
    const snap = await study.snapshot(deck, fresh, NOW), choice = study.chooseNext(snap, deck, { debt: 0 }).choice!;
    expect(choice.entryId).toBe('n0');
    await study.rate(deck, choice, study.preview(deck, choice, NOW), 'again', 1, NOW);
    expect(study.chooseNext(await study.snapshot(deck, fresh, NOW), deck, { debt: 0 }).choice?.entryId).toBe('n1');
    expect((await study.snapshot(deck, fresh, NOW)).newEntries.map(e => e.id)).toEqual(['n1', 'n2']);
  });

  it('reload preserves settings, introduced IDs and due; the next Madrid day gets a fresh allowance', async () => {
    await saveUI(2, 'before-reviews');
    const choice = study.chooseNext(await study.snapshot(deck, fresh, NOW), deck, { debt: 0 }).choice!;
    await study.rate(deck, choice, study.preview(deck, choice, NOW), 'good', 100, NOW);
    const saved = await db.getDeckProgress(deck.id);
    TestBed.resetTestingModule(); fixture = undefined; configure(); await mount();
    expect(fixture!.componentInstance.draft().newCardsPerDay).toBe(2);
    expect((await study.snapshot(deck, fresh, NOW)).newEntries.map(e => e.id)).toEqual(['n1']);
    expect((await study.snapshot(deck, fresh, NOW)).introducedToday).toBe(1);
    expect(await db.getDeckProgress(deck.id)).toEqual(saved);
    const nextDay = await study.snapshot(deck, fresh, new Date(nextLocalStudyDayStart(NOW)));
    expect(nextDay.newAvailable).toBe(2); expect(nextDay.introducedToday).toBe(0);
    expect(await db.getDeckReviewEvents(deck.id)).toHaveLength(1);
  });

  it('changing the base quota affects remaining introductions until a today override takes precedence', async () => {
    await saveUI(10, 'mixed');
    await db.writeDailyState({ ...emptyDailyState(deck.id, getLocalStudyDayKey(NOW)), introducedEntryIds: ['n0', 'n1', 'n2'] });
    // Persist corresponding progress too; a real introduction always has a snapshot.
    await db.mergeFromCloud({ progress: fresh.slice(0, 3).map((e, i) => ({ ...reviews[i], entryId: e.id })), daily: [], events: [] });
    await saveUI(2, 'mixed'); expect((await study.snapshot(deck, fresh, NOW)).newAvailable).toBe(0);
    await saveUI(5, 'mixed'); expect((await study.snapshot(deck, fresh, NOW)).newAvailable).toBe(2);
    await study.adjustTodayNewLimit(deck, 5, NOW); // override=10
    await saveUI(0, 'mixed');
    expect(settings.settingsFor(deck).newCardsPerDay).toBe(0);
    expect((await study.snapshot(deck, fresh, NOW)).effectiveNewLimit).toBe(10);
    expect((await study.snapshot(deck, fresh, NOW)).newAvailable).toBe(7);
    expect(await db.getDeckReviewEvents(deck.id)).toEqual([]);
  });

  it('raising the base quota makes remaining introductions available without a daily batch lock', async () => {
    await saveUI(0, 'mixed'); await study.completeSession(deck, fresh, NOW);
    await saveUI(10, 'mixed'); expect((await study.snapshot(deck, fresh, NOW)).newAvailable).toBe(10);
    await study.adjustTodayNewLimit(deck, 5, NOW);
    expect((await study.snapshot(deck, fresh, NOW)).newAvailable).toBe(15);
  });

  it('restores the balanced mixed cursor after page recreation without randomization', async () => {
    await seed(); await saveUI(10, 'mixed');
    let cursor = { debt: 0 };
    for (let i = 0; i < 4; i++) {
      const choice = study.chooseNext(await study.snapshot(deck, index, NOW), deck, cursor);
      cursor = choice.cursor;
      await study.rate(deck, choice.choice!, study.preview(deck, choice.choice!, NOW), 'good', 0, NOW);
    }
    const snap = await study.snapshot(deck, index, NOW);
    expect(study.chooseNext(snap, deck, cursor).choice?.kind).toBe('new');
    expect(study.chooseNext(snap, deck, { debt: 0 }).choice?.kind).toBe('new');
    TestBed.resetTestingModule(); fixture = undefined; configure();
    expect(study.chooseNext(await study.snapshot(deck, index, NOW), deck, {debt:0}).choice?.kind).toBe('new');
    expect(snap.newEntries.map(e => e.id)).toEqual(fresh.slice(0, 10).map(e => e.id));
  });

  it('UI retention reaches real FSRS: 85/90/95 differ in consolidated intervals, not S/D', async () => {
    await seed(); const choice = { entryId: 'r0', kind: 'review' as const, progress: reviews[0] };
    const rows = [];
    for (const retention of [.85, .9, .95]) {
      await saveUI(10, 'mixed', retention);
      const preview = study.preview(deck, choice, NOW);
      expect(preview.desiredRetention).toBe(retention);
      rows.push(preview.good.card);
      expect(study.preview(deck, { entryId: 'new', kind: 'new', progress: null }, NOW).good.card.due).toBe(NOW.getTime() + 600_000);
    }
    expect(rows.map(c => c.scheduledDays)).toEqual([162, 85, 34]);
    expect(rows.map(c => c.stability)).toEqual([85.02789144, 85.02789144, 85.02789144]);
    expect(rows.map(c => c.difficulty)).toEqual([4.99022837, 4.99022837, 4.99022837]);
    expect(rows.map(c => c.due)).toEqual([162, 85, 34].map(days => NOW.getTime() + days * DAY));
    expect(Object.fromEntries((await db.getDeckProgress(deck.id)).map(p => [p.entryId, p])))
      .toEqual(Object.fromEntries(reviews.map(p => [p.entryId, p])));
    const event = await study.rate(deck, choice, study.preview(deck, choice, NOW), 'good', 0, NOW);
    expect(event.desiredRetention).toBe(.95); expect(event.dueAfter).toBe(rows[2].due);
  });

  it('saving retention does not rewrite dates or By time; an already revealed preview keeps its old retention', async () => {
    await seed(); const choice = { entryId: 'r0', kind: 'review' as const, progress: reviews[0] };
    const preview = study.preview(deck, choice, NOW), groups = deckTimeGroups(index, reviews, deck.id, NOW);
    await saveUI(10, 'mixed', .95);
    expect(deckTimeGroups(index, await db.getDeckProgress(deck.id), deck.id, NOW)).toEqual(groups);
    expect(await db.getDeckReviewEvents(deck.id)).toEqual([]);
    const old = await study.rate(deck, choice, preview, 'good', 0, NOW);
    expect(old.desiredRetention).toBe(.9); expect(old.dueAfter).toBe(NOW.getTime() + 85 * DAY);
    expect(study.preview(deck, choice, NOW).desiredRetention).toBe(.95);
  });

  it('isolates settings by deck and workspace, including public Puyi', () => {
    const workspace = TestBed.inject(WorkspaceService);
    const update = (d: DeckDefinition, r: number) => settings.save(d.id, { ...d.settings, desiredRetention: r });
    update(deck, .85); update(PUYI_DECK, .95);
    workspace.activateUser('audit-A'); expect(settings.settingsFor(deck).desiredRetention).toBe(.9); update(deck, .97);
    workspace.activateUser('audit-B'); expect(settings.settingsFor(deck).desiredRetention).toBe(.9);
    workspace.activateGuest(); expect(settings.settingsFor(deck).desiredRetention).toBe(.85);
    expect(settings.settingsFor(PUYI_DECK).desiredRetention).toBe(.95);
    expect(study.preview(PUYI_DECK, { entryId: 'puyi', kind: 'new', progress: null }, NOW).desiredRetention).toBe(.95);
    workspace.activateUser('audit-A'); expect(settings.settingsFor(deck).desiredRetention).toBe(.97);
  });

  it('custom settings persist in their real repository and drive the loaded catalog/FSRS', async () => {
    const repo = TestBed.inject(CustomDeckRepository), definition = customDeck('md-settings-audit');
    await repo.create('create-settings-audit', definition, [await customCard(definition.id)]);
    const desired: DeckSettings = { desiredRetention: .95, newCardsPerDay: 0, newCardOrder: 'after-reviews' };
    await mount(definition.id); await saveUI(0, 'after-reviews', .95);
    const loaded = await TestBed.inject(DeckCatalogService).load(definition.id);
    expect(loaded.status).toBe('ready'); if (loaded.status !== 'ready') throw Error('fixture');
    expect(settings.settingsFor(loaded.value.deck)).toEqual(desired);
    expect((await study.snapshot(loaded.value.deck, loaded.value.content.index, NOW)).newAvailable).toBe(0);
    expect(study.preview(loaded.value.deck, { entryId: 'card-猫', kind: 'new', progress: null }, NOW).desiredRetention).toBe(.95);
    expect(localStorage.getItem(SETTINGS_KEY)).toBeNull();
    expect((await repo.journal()).map(op => op.kind)).toContain('settings');
  });

  it('keeps the failed builtin draft and reports no saved acknowledgement; reload restores persisted defaults', async () => {
    await mount();
    const original = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key === SETTINGS_KEY) throw new DOMException('Synthetic quota failure', 'QuotaExceededError');
      original.call(this, key, value);
    });
    await saveUI(7, 'mixed', .95);
    expect(fixture!.componentInstance.saved()).toBe(false);
    expect(fixture!.componentInstance.error()).toBe(true);
    expect(fixture!.componentInstance.draft().newCardsPerDay).toBe(7);
    expect(settings.settingsFor(deck)).toEqual(deck.settings);
    expect(TestBed.inject(StorageService).persistenceFailed()).toBe(true);
    expect(localStorage.getItem(SETTINGS_KEY)).toBeNull();
    TestBed.resetTestingModule(); fixture = undefined; configure();
    expect(settings.settingsFor(deck)).toEqual(deck.settings);
  });

  it('validates the custom maximum before persistence and clears errors when corrected', async () => {
    const repo = TestBed.inject(CustomDeckRepository), definition = customDeck('md-settings-limits');
    await repo.create('create-settings-limits', definition, [await customCard(definition.id)]);
    await mount(definition.id); await saveUI(10001, 'mixed');
    const input = fixture!.nativeElement.querySelector('input[type=number]') as HTMLInputElement;
    expect(input.checkValidity()).toBe(false); expect(fixture!.componentInstance.newCardsValid()).toBe(false);
    expect(fixture!.componentInstance.error()).toBe(false);
    expect((await repo.list())[0].settings.newCardsPerDay).toBe(10);
    await saveUI(2, 'mixed');
    expect((await repo.list())[0].settings.newCardsPerDay).toBe(2);
    expect(fixture!.componentInstance.error()).toBe(false);
    expect(fixture!.componentInstance.saved()).toBe(true);
  });

  it('retries a real localStorage failure without losing the draft or changing active settings prematurely', async () => {
    await mount();const original=Storage.prototype.setItem;let fail=true;
    vi.spyOn(Storage.prototype,'setItem').mockImplementation(function(this:Storage,key,value){
      if(key===SETTINGS_KEY&&fail){fail=false;throw new DOMException('controlled quota failure','QuotaExceededError');}
      original.call(this,key,value);
    });
    await saveUI(7,'before-reviews',.95);
    expect(fixture!.componentInstance.draft()).toMatchObject({newCardsPerDay:7,desiredRetention:.95});
    expect(fixture!.componentInstance.error()).toBe(true);expect(settings.settingsFor(deck)).toEqual(deck.settings);
    await fixture!.componentInstance.save();fixture!.detectChanges();
    expect(fixture!.componentInstance.saved()).toBe(true);expect(fixture!.componentInstance.error()).toBe(false);
    TestBed.resetTestingModule();fixture=undefined;configure();
    expect(settings.settingsFor(deck)).toEqual({newCardsPerDay:7,newCardOrder:'before-reviews',desiredRetention:.95});
    expect(await db.getDeckReviewEvents(deck.id)).toEqual([]);
  });

  it('recovers from a real custom journal write failure and clears the error after correction', async () => {
    const repo=TestBed.inject(CustomDeckRepository),definition=customDeck('md-settings-write-failure');
    await repo.create('create-settings-write-failure',definition,[await customCard(definition.id)]);
    await mount(definition.id);const before=await repo.journal(),put=FakeObjectStore.prototype.put;let fail=true;
    vi.spyOn(FakeObjectStore.prototype,'put').mockImplementation(function(this:IDBObjectStore,...args:[value:unknown,key?:IDBValidKey]){
      if(this.name==='journal'&&fail){fail=false;throw new DOMException('controlled IDB failure','QuotaExceededError');}
      return put.apply(this,args);
    });
    await saveUI(4,'before-reviews',.95);
    expect(fixture!.componentInstance.error()).toBe(true);expect(fixture!.componentInstance.saved()).toBe(false);
    expect(fixture!.componentInstance.draft().newCardsPerDay).toBe(4);
    expect((await repo.list())[0].settings).toEqual(definition.settings);expect(await repo.journal()).toEqual(before);
    await saveUI(5,'before-reviews',.95);
    expect(fixture!.componentInstance.error()).toBe(false);expect(fixture!.componentInstance.saved()).toBe(true);
    expect((await repo.list())[0].settings.newCardsPerDay).toBe(5);expect(await repo.getDeckReviewEvents(definition.id)).toEqual([]);
  });

  it.each([['',false],['-1',false],['1.5',false],['10001',false],['1e100',false],['10000',true],['0',true],['2',true]] as const)(
    'custom raw input %s validates before a write (valid=%s)',async(raw,valid)=>{
      const repo=TestBed.inject(CustomDeckRepository),definition=customDeck('md-settings-raw');
      await repo.create('create-settings-raw',definition,[await customCard(definition.id)]);await mount(definition.id);
      const write=vi.spyOn(repo,'saveSettings'),input=fixture!.nativeElement.querySelector('input[type=number]') as HTMLInputElement;
      input.value=raw;input.dispatchEvent(new Event('input'));fixture!.detectChanges();
      expect(fixture!.componentInstance.newCardsValid()).toBe(valid);
      await fixture!.componentInstance.save();
      expect(write).toHaveBeenCalledTimes(Number(valid));
      expect((await repo.list())[0].settings.newCardsPerDay).toBe(valid?Number(raw):10);
    });
});

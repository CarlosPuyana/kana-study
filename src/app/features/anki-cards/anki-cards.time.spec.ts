import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { DeckScheduleReader } from '../../core/services/deck-schedule-reader';
import { DeckCardProgress } from '../../core/models/deck-study.model';
import { JAPANESE_1500_ENTRIES } from '../../data/japanese-1500.generated';
import { WorkspaceService } from '../../core/services/workspace.service';
import { AnkiCardsPage } from './anki-cards.page';
import { TranslationService } from '../../core/services/translation.service';

describe('Deck cards All / By time', () => {
  const read = vi.fn(async () => ({ progress: [] as DeckCardProgress[], events: [] }));
  beforeEach(() => {
    localStorage.clear(); read.mockReset(); read.mockResolvedValue({ progress: [], events: [] });
    TestBed.configureTestingModule({ imports: [AnkiCardsPage], providers: [provideRouter([]),
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ deckId: 'japanese-1500' }) } } },
      { provide: DeckScheduleReader, useValue: { revision: signal('0'), read } },
      { provide: TranslationService, useValue: { language: signal('es'), t: (key: string) => key } },
    ] });
  });
  afterEach(() => { TestBed.resetTestingModule(); vi.useRealTimers(); });
  async function create() { const f = TestBed.createComponent(AnkiCardsPage); f.detectChanges(); await f.whenStable(); f.detectChanges(); return f; }
  it('keeps the original default order, search, limit, controls and overlay, without reading progress', async () => {
    const f = await create(), p = f.componentInstance;
    expect(p.mode()).toBe('all'); expect(p.visibleCards().map(e => e.id)).toEqual(JAPANESE_1500_ENTRIES.slice(0, 120).map(e => e.id));
    expect(f.nativeElement.querySelectorAll('.entry-card')).toHaveLength(120); expect(read).not.toHaveBeenCalled();
    p.showMore(); expect(p.visibleCards()).toHaveLength(240);
    p.updateQuery({ target: { value: '#124' } } as unknown as Event); f.detectChanges();
    expect(p.cards().map(e => e.order)).toEqual([124]);
    f.nativeElement.querySelector('.entry-card').click(); f.detectChanges();
    expect(f.nativeElement.querySelector('[role=dialog]')).not.toBeNull();
    expect(f.nativeElement.querySelector('.schedule-detail')).toBeNull();
  });
  it('does not instantiate closed groups; opens 60 cards at a time and retains search when returning to All', async () => {
    const f = await create(), p = f.componentInstance; p.mode.set('time'); f.detectChanges(); await f.whenStable(); f.detectChanges();
    expect(read).toHaveBeenCalledWith('japanese-1500'); expect(p.groups()).toHaveLength(1);
    expect(f.nativeElement.querySelectorAll('.entry-card')).toHaveLength(0);
    f.nativeElement.querySelector('.time-heading').click(); f.detectChanges();
    expect(f.nativeElement.querySelector('.time-heading').getAttribute('aria-expanded')).toBe('true');
    expect(f.nativeElement.querySelectorAll('.entry-card')).toHaveLength(60);
    p.moreInGroup('new'); f.detectChanges(); expect(f.nativeElement.querySelectorAll('.entry-card')).toHaveLength(120);
    p.query.set('食べる'); p.mode.set('all'); f.detectChanges();
    expect(p.cards().some(e => e.word === '食べる')).toBe(true);
  });
  it('does not round a 25-hour remaining duration into two days at the autumn boundary', async () => {
    const f = await create(), p = f.componentInstance;
    vi.spyOn(p.i18n,'t').mockImplementation((key, values) => `${key}:${values?.['count']??''}`);
    p.now.set(new Date('2026-10-24T22:00:00Z'));
    expect(p.remaining(Date.parse('2026-10-25T23:00:00Z'))).toBe('anki.interval.day:1 · anki.interval.hour:1');
  });
  it('ignores a delayed response from the previous workspace and closes its details', async () => {
    const f = await create(), p = f.componentInstance;
    let resolve!: (value: { progress: DeckCardProgress[]; events: [] }) => void;
    read.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
    p.mode.set('time'); f.detectChanges(); await Promise.resolve();
    TestBed.inject(WorkspaceService).activateUser('other-local-test'); f.detectChanges();
    resolve({ progress: [{ deckId: 'japanese-1500', entryId: JAPANESE_1500_ENTRIES[0].id, card: { state: 2, due: 1 } } as DeckCardProgress], events: [] });
    await p.resource.ready(); f.detectChanges(); await f.whenStable(); f.detectChanges();
    expect(p.schedule()).toEqual([]); expect(p.selected()).toBeNull(); expect(p.groups()[0].key).toBe('new');
  });
});

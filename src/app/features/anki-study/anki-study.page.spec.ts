import {STUDY_MONOTONIC_NOW} from '../../core/services/study-clock';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Rating, State } from 'ts-fsrs';
import { DeckQueueSnapshot, DeckReviewEvent } from '../../core/models/deck-study.model';
import { DeckStudyService } from '../../core/services/deck-study.service';
import { TranslationService } from '../../core/services/translation.service';
import { JAPANESE_1500_ENTRIES } from '../../data/japanese-1500.generated';
import { AnkiStudyPage } from './anki-study.page';

describe('AnkiStudyPage', () => {
  const language = signal<'es' | 'en' | 'ca'>('es');
  let fixture: ComponentFixture<AnkiStudyPage>;
  let study: StudyStub;
  let monotonic=0;

  beforeEach(async () => {
    monotonic=0;study = new StudyStub();
    await TestBed.configureTestingModule({
      imports: [AnkiStudyPage],
      providers: [{provide:STUDY_MONOTONIC_NOW,useValue:()=>monotonic},
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ deckId: 'japanese-1500' }) } } },
        { provide: DeckStudyService, useValue: study },
        { provide: TranslationService, useValue: { language, t: (key: string, values?: Record<string, string | number>) => values ? `${key}:${Object.values(values).join(',')}` : key } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AnkiStudyPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => { fixture.destroy(); TestBed.resetTestingModule(); });

  it('front contains word and context but no answer content in the DOM', () => {
    const front = fixture.nativeElement.querySelector('.front') as HTMLElement;
    expect(front.textContent).toContain('私');
    expect(front.textContent).not.toContain('わたし');
    expect(front.textContent).not.toContain('yo (general, neutro)');
    expect(front.textContent).not.toContain('Top');
    expect(fixture.nativeElement.querySelector('rt')).toBeNull();
    expect(fixture.nativeElement.querySelector('.back-content')).toBeNull();
  });

  it('reveals furigana and exactly Again/Good with scheduler-derived intervals', () => {
    fixture.componentInstance.reveal(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('rt')?.textContent).toContain('わたし');
    expect(fixture.nativeElement.textContent).toContain('yo (general, neutro)');
    const buttons = fixture.nativeElement.querySelectorAll('.ratings button') as NodeListOf<HTMLButtonElement>;
    expect(buttons).toHaveLength(2);
    expect(buttons[0].textContent).toContain('anki.studyPage.again');
    expect(buttons[1].textContent).toContain('anki.studyPage.good');
    expect(buttons[0].textContent).toContain('anki.interval.minute');
    expect(buttons[1].textContent).toContain('anki.interval.minutes');
    expect(fixture.nativeElement.textContent).not.toContain('Yo soy Ann.');
  });

  it('keeps translation folded until requested', () => {
    fixture.componentInstance.reveal(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Yo soy Ann.');
    (fixture.nativeElement.querySelector('.translation-toggle') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Yo soy Ann.');
  });

  it('supports Space reveal and numeric ratings without rating before reveal', async () => {
    fixture.componentInstance.handleKey(new KeyboardEvent('keydown', { key: '1', code: 'Digit1' }));
    expect(study.ratings).toEqual([]);
    fixture.componentInstance.handleKey(new KeyboardEvent('keydown', { key: ' ', code: 'Space' }));
    fixture.detectChanges();
    fixture.componentInstance.handleKey(new KeyboardEvent('keydown', { key: '2', code: 'Digit2' }));
    await fixture.whenStable();
    expect(study.ratings).toEqual(['good']);
  });

  it('blocks duplicate ratings while persistence is pending', async () => {
    let resolve!: (event: DeckReviewEvent) => void;
    study.ratingPromise = new Promise(value => { resolve = value; });
    fixture.componentInstance.reveal();
    const first = fixture.componentInstance.rate('good');
    void fixture.componentInstance.rate('good');
    expect(study.ratings).toEqual(['good']);
    resolve(study.event);
    await first;
  });

  it('blocks the direct study route when today is completed', async () => {
    Object.assign(study.snapshotValue,{completedToday:true,newEntries:[],newAvailable:0});
    fixture.componentInstance.refreshAvailability();await fixture.whenStable();fixture.detectChanges();
    expect(fixture.componentInstance.choice()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('anki.daily.completed');
    expect(fixture.nativeElement.textContent).toContain('anki.daily.tomorrow');
    expect(fixture.nativeElement.querySelector('.study-card')).toBeNull();
  });

  it('completes the day only after the final rating exhausts the queue', async () => {
    study.exhaustAfterRating=true;
    fixture.componentInstance.reveal();await fixture.componentInstance.rate('good');fixture.detectChanges();
    expect(study.completed).toBe(1);
    expect(fixture.componentInstance.snapshot()?.completedToday).toBe(true);
    expect(fixture.componentInstance.choice()).toBeNull();
  });

  it('does not complete a day when an active session is abandoned', () => {
    fixture.componentInstance.ngOnDestroy();
    expect(study.completed).toBe(0);
  });

  it('refreshes availability when focus or visibility returns', async () => {
    Object.assign(study.snapshotValue,{completedToday:true});
    window.dispatchEvent(new Event('focus'));await fixture.whenStable();
    expect(fixture.componentInstance.choice()).toBeNull();
    Object.assign(study.snapshotValue,{completedToday:false});
    document.dispatchEvent(new Event('visibilitychange'));await fixture.whenStable();
    expect(fixture.componentInstance.choice()).not.toBeNull();
  });
  it('shows the capped credited total, keeps focus on the same allowance and subtracts undo once',async()=>{
    const page=fixture.componentInstance;page.clock.attach();monotonic=4000;
    page.refreshAvailability();await fixture.whenStable();monotonic=15000;
    page.reveal();await page.rate('good');fixture.detectChanges();
    expect(study.times).toEqual([10000]);expect(page.clock.committedSeconds).toBe(10);
    expect(fixture.nativeElement.querySelector('[role="timer"]').textContent).toContain('00:10');
    monotonic+=4000;await page.undo();fixture.detectChanges();expect(page.clock.committedSeconds).toBe(0);
    await page.undo();expect(page.clock.committedSeconds).toBe(0);
    monotonic+=7000;page.reveal();await page.rate('good');expect(study.times).toEqual([10000,7000]);
    expect(page.clock.committedSeconds).toBe(7);expect(study.completed).toBe(0);
  });
  it('freezes during saves, rejects double clicks and freezes results without another duration record',async()=>{
    const page=fixture.componentInstance;page.clock.attach();study.exhaustAfterRating=true;
    let resolve!:(event:DeckReviewEvent)=>void;study.ratingPromise=new Promise(r=>resolve=r);
    monotonic=4000;page.reveal();const save=page.rate('good');void page.rate('good');monotonic+=60000;
    resolve({...study.event,elapsedAnswerMs:4000});await save;fixture.detectChanges();
    expect(study.times).toEqual([4000]);expect(study.completed).toBe(1);expect(page.clock.committedSeconds).toBe(4);
    monotonic+=60000;page.clock.pause();fixture.detectChanges();expect(page.elapsedLabel()).toBe('00:04');
    expect(fixture.nativeElement.querySelector('.end-state app-study-timer').textContent).toContain('00:04');
  });
  it('a failed save excludes its wait and allows retrying the same appearance once',async()=>{
    const page=fixture.componentInstance;page.clock.attach();monotonic=4000;page.reveal();
    let reject!:(reason:Error)=>void;
    vi.spyOn(study,'rate').mockImplementationOnce(()=>new Promise((_resolve,rejectPromise)=>reject=rejectPromise));
    const first=page.rate('good');monotonic+=60000;reject(new Error('save'));await first;
    expect(page.error()).toBe(true);expect(page.clock.committedSeconds).toBe(0);
    expect(page.clock.appearanceMilliseconds()).toBe(4000);
    monotonic+=3000;await page.rate('good');expect(study.times).toEqual([7000]);
    expect(page.clock.committedSeconds).toBe(7);
  });
  it('a next-card loading error after a successful review cannot rate the saved card again',async()=>{
    const page=fixture.componentInstance;page.clock.attach();monotonic=4000;page.reveal();
    vi.spyOn(study,'snapshot').mockRejectedValueOnce(new Error('load'));
    await page.rate('good');expect(page.error()).toBe(true);expect(page.choice()).toBeNull();
    page.reveal();await page.rate('good');expect(study.times).toEqual([4000]);
    expect(page.clock.committedSeconds).toBe(4);
  });

});

class StudyStub {
  completed=0;
  exhaustAfterRating=false;
  ratings: string[] = [];
  times: number[] = [];
  ratingPromise: Promise<DeckReviewEvent> | null = null;
  readonly event = { id: 'event-1', deckId: 'japanese-1500', entryId: JAPANESE_1500_ENTRIES[0].id, reviewedAt: Date.now(), rating: 'good' } as DeckReviewEvent;
  readonly snapshotValue: DeckQueueSnapshot = { progress: [], newEntries: [{ id: JAPANESE_1500_ENTRIES[0].id, order: 1 }], learningEntries: [], reviewEntries: [], newAvailable: 10, learningDue: 0, reviewDue: 0, introducedToday: 0, effectiveNewLimit: 10, nextLearningDue: null, nextDue: null, remainingUnseen: 1500 };
  async snapshot() { return this.snapshotValue; }
  chooseNext() { return { choice: this.exhaustAfterRating && this.ratings.length ? null : { entryId: JAPANESE_1500_ENTRIES[0].id, kind: 'new' as const, progress: null }, cursor: { debt: 0 } }; }
  preview() { const base = { due: Date.now(), stability: 0, difficulty: 0, elapsedDays: 0, scheduledDays: 0, learningSteps: 0, reps: 0, lapses: 0, state: State.New, lastReview: null }; const log = { rating: Rating.Again, state: State.New, due: Date.now(), stability: 0, difficulty: 0, elapsedDays: 0, lastElapsedDays: 0, scheduledDays: 0, learningSteps: 0, review: Date.now() }; return { generatedAt: Date.now(), desiredRetention: 0.9, cardBefore: base, retrievabilityBefore: null, again: { card: { ...base, due: Date.now() + 60_000 }, log }, good: { card: { ...base, due: Date.now() + 10 * 60_000 }, log: { ...log, rating: Rating.Good } } }; }
  async rate(_deck: unknown, _choice: unknown, _preview: unknown, rating: string, elapsedAnswerMs: number) { this.ratings.push(rating); this.times.push(elapsedAnswerMs); return this.ratingPromise ?? {...this.event,elapsedAnswerMs}; }
  async undo() {}
  async completeSession() { this.completed++;Object.assign(this.snapshotValue,{completedToday:true,newEntries:[],newAvailable:0}); }
}

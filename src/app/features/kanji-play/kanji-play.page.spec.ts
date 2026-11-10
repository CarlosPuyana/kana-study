import {isolatedKanjiAvailability} from '../../core/services/kanji-availability.test-support';
import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DailyLearningService } from '../../core/services/daily-learning.service';
import { JapaneseGlyphService } from '../../core/services/japanese-glyph.service';
import { KanjiProgressService } from '../../core/services/kanji-progress.service';
import { KanjiSessionService } from '../../core/services/kanji-session.service';
import { TranslationService } from '../../core/services/translation.service';
import { KANJI_N5 } from '../../data/kanji-n5.generated';
import { KanjiPlayPage } from './kanji-play.page';

describe('Kanji Daily keyboard shortcuts', () => {
  const mode = signal('self-assessment');
  const revealed = signal(false);
  const language = signal<'es'|'en'|'ca'>('es');
  const learning = {
    clear: vi.fn(), saving:signal(false), error:signal(false),
    session: computed(() => ({ mode: mode(), sessionSize: 1, attempts: 0 })),
    currentKanji: signal(KANJI_N5[0]),
    currentUnit: signal({ key: 'test', questionType: 'kanji-to-meaning' }),
    completed: signal(false), resolvedCount: signal(0), progressPercent: signal(0),
    newlyUnlockedMedals: signal([]), feedback: signal<{correct:boolean;selectedId:string}|null>(null), revealed,
    currentItem: () => ({appearances:1}),
    options: () => [], meaning: () => 'meaning',
    reveal: vi.fn(() => revealed.set(true)),
    rate: vi.fn(() => revealed.set(false)),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    revealed.set(false);
    language.set('es');
    learning.currentKanji.set(KANJI_N5[0]);
    learning.currentUnit.set({key:'test',questionType:'kanji-to-meaning'});
    learning.feedback.set(null);
    mode.set('self-assessment');
    learning.completed.set(false);
    TestBed.configureTestingModule({
      imports: [KanjiPlayPage],
      providers:[isolatedKanjiAvailability,
        { provide: KanjiSessionService, useValue: learning },
        { provide: KanjiProgressService, useValue: { get: () => null } },
        { provide: DailyLearningService, useValue: { isCompletedToday: () => false } },
        { provide: TranslationService, useValue: { useStudyCopy:()=>{}, t: (key: string) => key, language } },
        { provide: JapaneseGlyphService, useValue: {load:vi.fn(async()=>[])} },
        { provide: Router, useValue: { navigateByUrl: vi.fn() } },
      ],
    });
  });
  afterEach(() => TestBed.resetTestingModule());
  function render() {
    const fixture = TestBed.createComponent(KanjiPlayPage);
    fixture.detectChanges();
    return fixture;
  }
  function press(key: string, repeat = false, target: EventTarget = document) {
    const event = new KeyboardEvent('keydown', {
      key, code: key === ' ' ? 'Space' : `Digit${key}`, repeat, bubbles: true, cancelable: true,
    });
    target.dispatchEvent(event);
    return event;
  }

  it('Space reveals once and is left native when no reveal remains', () => {
    render();
    expect(press(' ').defaultPrevented).toBe(true);
    expect(learning.reveal).toHaveBeenCalledOnce();
    expect(press(' ').defaultPrevented).toBe(false);
    expect(learning.reveal).toHaveBeenCalledOnce();
  });
  it.each([['1', 'again'], ['2', 'hard'], ['3', 'good']])('only rates %s after reveal', (key, rating) => {
    render();
    press(key);
    expect(learning.rate).not.toHaveBeenCalled();
    revealed.set(true);
    press(key);
    press(key);
    expect(learning.rate).toHaveBeenCalledExactlyOnceWith(rating);
  });
  it.each(['input', 'textarea', 'select', 'editable'])('ignores shortcuts in %s', tag => {
    render();
    const element = document.createElement(tag === 'editable' ? 'div' : tag);
    if (tag === 'editable') element.setAttribute('contenteditable', 'true');
    document.body.append(element);
    try {
      press(' ', false, element);
      expect(learning.reveal).not.toHaveBeenCalled();
      revealed.set(true);
      press('3', false, element);
      expect(learning.rate).not.toHaveBeenCalled();
    } finally { element.remove(); }
  });
  it('ignores key repeat for both reveal and rating', () => {
    render();
    press(' ', true);
    expect(learning.reveal).not.toHaveBeenCalled();
    press(' ');
    press('3', true);
    expect(learning.rate).not.toHaveBeenCalled();
    press('3');
    press('3', true);
    expect(learning.rate).toHaveBeenCalledOnce();
  });
  it('ignores shortcuts during exit confirmation', () => {
    const fixture = render();
    fixture.componentInstance.showExit.set(true);
    press(' ');
    revealed.set(true);
    press('1');
    expect(learning.reveal).not.toHaveBeenCalled();
    expect(learning.rate).not.toHaveBeenCalled();
  });
  it('ignores shortcuts while another modal is open', () => {
    render();
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    document.body.append(dialog);
    try {
      press(' ');
      revealed.set(true);
      press('2');
      expect(learning.reveal).not.toHaveBeenCalled();
      expect(learning.rate).not.toHaveBeenCalled();
    } finally { dialog.remove(); }
  });
  it('leaves quick practice unchanged', () => {
    mode.set('quick-practice');
    render();
    press(' ');
    revealed.set(true);
    press('3');
    expect(learning.reveal).not.toHaveBeenCalled();
    expect(learning.rate).not.toHaveBeenCalled();
  });
  it('keeps current labels and adds discrete accessible hints', () => {
    const fixture = render();
    expect(fixture.nativeElement.querySelector('.reveal').getAttribute('aria-keyshortcuts')).toBe('Space');
    expect(fixture.nativeElement.querySelector('.reveal').textContent).toContain('kanji.reveal');
    revealed.set(true);
    fixture.detectChanges();
    const buttons = [...fixture.nativeElement.querySelectorAll('.ratings button')] as HTMLButtonElement[];
    expect(buttons.map(button => button.getAttribute('aria-keyshortcuts'))).toEqual(['1', '2', '3']);
    expect(buttons.map(button => button.textContent?.trim())).toEqual(['1 · learn.no', '2 · learn.almost', '3 · learn.yes']);
  });

  describe('K2 contextual answer',()=>{
    for(const direction of ['kanji-to-meaning','meaning-to-kanji']){
      for(const studyMode of ['self-assessment','quick-practice']){
        it.each(['es','en','ca'] as const)(`${direction}, ${studyMode}: shows the localized word only after revealing in %s`,lang=>{
          const kanji=KANJI_N5.find(k=>k.id==='食')!,example=kanji.examples[0];
          learning.currentKanji.set(kanji);
          learning.currentUnit.set({key:'kanji:食:'+direction,questionType:direction});
          mode.set(studyMode);language.set(lang);
          const fixture=render(),before=JSON.stringify(kanji);
          expect(fixture.nativeElement.querySelector('app-kanji-answer')).toBeNull();
          const writes=vi.spyOn(Storage.prototype,'setItem');
          try{
            if(studyMode==='self-assessment')learning.reveal();
            else learning.feedback.set({correct:false,selectedId:'山'});
            fixture.detectChanges();
            const answer=fixture.nativeElement.querySelector('app-kanji-answer');
            expect(answer.querySelector('.word').textContent).toBe('食べる');
            expect(answer.querySelector('.reading').textContent).toBe('たべる');
            expect(answer.querySelector('.example p').textContent).toBe(example.translations[lang]);
            expect(answer.querySelector('.word').lang).toBe('ja');
            expect(answer.querySelector('details').open).toBe(false);
            expect(answer.querySelector('dd').textContent).toContain(kanji.onyomi[0]);
            expect(answer.querySelectorAll('button,input')).toHaveLength(0);
            expect(learning.rate).not.toHaveBeenCalled();
            expect(writes).not.toHaveBeenCalled();
            expect(JSON.stringify(kanji)).toBe(before);
          }finally{writes.mockRestore();}
        });
      }
    }
  });
});

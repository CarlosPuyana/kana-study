import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DeckStudyCounts } from '../../../../core/models/deck-study.model';
import { TranslationService } from '../../../../core/services/translation.service';
import { STUDY_DECKS } from '../../../../data/study-decks';
import { DeckCard } from './deck-card';

describe('DeckCard availability', () => {
  const stats: DeckStudyCounts = { newAvailable: 0, learningDue: 0, reviewDue: 0, introducedToday: 10, effectiveNewLimit: 10, nextLearningDue: null, nextDue: Date.now() + 86_400_000 };
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: TranslationService, useValue: { t: (key: string) => key } }] }));
  afterEach(() => TestBed.resetTestingModule());
  function render(values: Partial<DeckStudyCounts>) {
    const fixture = TestBed.createComponent(DeckCard);
    fixture.componentRef.setInput('deck', STUDY_DECKS[0]);
    fixture.componentRef.setInput('stats', { ...stats, ...values });
    fixture.detectChanges();
    return fixture;
  }
  it.each(['newAvailable', 'learningDue', 'reviewDue'] as const)('enables study when %s is available', key => {
    const fixture = render({ [key]: 1 });
    expect(fixture.nativeElement.querySelector('a.study')?.getAttribute('href')).toContain('/anki/japanese-1500/study');
    expect(fixture.nativeElement.querySelector('.study-status')).toBeNull();
  });
  it('keeps a disabled CTA and one short completion notice in its action area', () => {
    const fixture = render({ completedToday: true });
    expect(fixture.nativeElement.querySelector('button.study')?.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('a.study')).toBeNull();
    expect(fixture.nativeElement.querySelector('.study-action .study-status')?.textContent).toBe('anki.daily.completedNotice');
    expect(fixture.nativeElement.querySelectorAll('.stats dd')).toHaveLength(3);
    expect(fixture.nativeElement.textContent).not.toContain('anki.daily.nextReview');
  });
  it('disables study when no cards are due and updates reactively when cards become available', () => {
    const fixture = render({});
    expect(fixture.nativeElement.querySelector('button.study')?.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('.study-status')?.textContent).toBe('anki.daily.unavailable');
    expect(fixture.nativeElement.textContent).not.toContain('anki.daily.nextReview');
    fixture.componentRef.setInput('stats', { ...stats, reviewDue: 1 });fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a.study')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('button.study')).toBeNull();
  });
});

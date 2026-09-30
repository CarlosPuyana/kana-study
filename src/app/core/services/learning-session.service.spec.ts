import { TestBed } from '@angular/core/testing';
import { ALL_KANA } from '../../data/kana';
import { StudyRating, StudyUnit } from '../models/progress.model';
import { LearningSessionService, MAX_APPEARANCES_PER_UNIT } from './learning-session.service';
import { ProgressService } from './progress.service';
import { MedalService } from './medal.service';
import { SessionHistoryService } from './session-history.service';

function makeUnits(count: number): StudyUnit[] {
  return ALL_KANA.slice(0, count).map(kana => ({
    key: `${kana.id}:kana-to-romaji`, kanaId: kana.id, questionType: 'kana-to-romaji',
  }));
}

describe('LearningSessionService', () => {
  let service: LearningSessionService;
  let round: StudyUnit[];
  let progress: {
    buildRound: ReturnType<typeof vi.fn>;
    recordReview: ReturnType<typeof vi.fn>;
    recordPracticeAttempt: ReturnType<typeof vi.fn>;
  };
  let history: { record: ReturnType<typeof vi.fn> };
  let medals: { evaluateUnlocks: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    round = makeUnits(10);
    progress = {
      buildRound: vi.fn(() => round),
      recordReview: vi.fn(),
      recordPracticeAttempt: vi.fn(),
    };
    history = { record: vi.fn() };
    medals = { evaluateUnlocks: vi.fn(() => []) };
    TestBed.configureTestingModule({
      providers: [
        LearningSessionService,
        { provide: ProgressService, useValue: progress },
        { provide: SessionHistoryService, useValue: history },
        { provide: MedalService, useValue: medals },
      ],
    });
    service = TestBed.inject(LearningSessionService);
  });

  afterEach(() => TestBed.resetTestingModule());

  function answer(rating: StudyRating): void {
    service.reveal();
    service.rate(rating);
  }

  it('repeats Again after two intervening exercises', () => {
    service.start('self-assessment');
    const repeatedKey = service.currentUnit()!.key;
    answer('again');
    answer('good');
    answer('good');
    expect(service.currentUnit()!.key).toBe(repeatedKey);
  });

  it('repeats Hard later than Again, after four intervening exercises', () => {
    service.start('self-assessment');
    const repeatedKey = service.currentUnit()!.key;
    answer('hard');
    for (let index = 0; index < 4; index++) answer('good');
    expect(service.currentUnit()!.key).toBe(repeatedKey);
  });

  it('allows immediate repetition when the queue has no other units', () => {
    round = makeUnits(1);
    service.start('self-assessment');
    const key = service.currentUnit()!.key;
    answer('again');
    expect(service.currentUnit()!.key).toBe(key);
  });

  it('stops after four appearances and leaves the unit marked for practice', () => {
    round = makeUnits(1);
    service.start('self-assessment');
    for (let index = 0; index < MAX_APPEARANCES_PER_UNIT; index++) answer('again');
    const item = service.session()!.items[0];
    expect(item.appearances).toBe(4);
    expect(item.needsPractice).toBe(true);
    expect(item.resolved).toBe(true);
    expect(service.completed()).toBe(true);
  });

  it('records exactly one FSRS review for Again, Hard, Good in one round', () => {
    round = makeUnits(1);
    service.start('self-assessment');
    answer('again');
    answer('hard');
    answer('good');
    expect(progress.recordReview).toHaveBeenCalledTimes(1);
    expect(progress.recordReview.mock.calls[0][1]).toBe('again');
    expect(progress.recordPracticeAttempt).toHaveBeenCalledTimes(2);
  });

  it('calculates visual progress from resolved unique units', () => {
    service.start('self-assessment');
    for (let index = 0; index < 7; index++) answer('good');
    expect(service.session()!.attempts).toBe(7);
    expect(service.resolvedCount()).toBe(7);
    expect(service.progressPercent()).toBe(70);
  });

  it('keeps first-try results at 70 percent after all retries resolve', () => {
    service.start('self-assessment');
    const firstTryGood = new Set(round.slice(0, 7).map(unit => unit.key));
    let guard = 0;
    while (!service.completed() && guard++ < 30) {
      const item = service.currentItem()!;
      answer(item.initialRating === null && !firstTryGood.has(item.studyKey) ? 'again' : 'good');
    }
    expect(service.completed()).toBe(true);
    expect(service.firstTrySuccessCount()).toBe(7);
    expect(service.firstTrySuccessPercentage()).toBe(70);
  });

  it('grades Romaji to Kana quick practice against the kana character', () => {
    const kana = ALL_KANA.find(item => item.id === 'hira-h-ho')!;
    round = [{
      key: `${kana.id}:romaji-to-kana`,
      kanaId: kana.id,
      questionType: 'romaji-to-kana',
    }];
    service.start('quick-practice');

    expect(service.questionValue()).toBe('ho');
    expect(service.answer()).toBe('ほ');
    expect(service.options()).toContain('ほ');
    service.answerQuick('ほ');

    expect(service.feedback()).toEqual({ correct: true, selected: 'ほ', answer: 'ほ' });
    expect(progress.recordReview).toHaveBeenCalledWith(round[0], 'good', true, expect.any(String));
  });

  it('records Again for the first incorrect Romaji to Kana answer', () => {
    const kana = ALL_KANA.find(item => item.id === 'kata-h-ho')!;
    round = [{
      key: `${kana.id}:romaji-to-kana`,
      kanaId: kana.id,
      questionType: 'romaji-to-kana',
    }];
    service.start('quick-practice');
    const incorrect = service.options().find(option => option !== kana.character)!;
    service.answerQuick(incorrect);

    expect(service.feedback()!.correct).toBe(false);
    expect(progress.recordReview).toHaveBeenCalledWith(round[0], 'again', false, expect.any(String));
  });

  it('uses the same Kana example for both question directions', () => {
    const kana = ALL_KANA.find(item => item.id === 'hira-h-ho')!;
    round = [{
      key: `${kana.id}:kana-to-romaji`, kanaId: kana.id, questionType: 'kana-to-romaji',
    }];
    service.start('self-assessment');
    const forwardExample = service.currentExample();

    service.clear();
    round = [{
      key: `${kana.id}:romaji-to-kana`, kanaId: kana.id, questionType: 'romaji-to-kana',
    }];
    service.start('self-assessment');

    expect(forwardExample).toBe(kana.examples[0]);
    expect(service.currentExample()).toBe(forwardExample);
  });

  it('records one reusable summary only when a round completes', () => {
    round = makeUnits(1);
    service.start('self-assessment');
    answer('good');

    expect(history.record).toHaveBeenCalledTimes(1);
    expect(history.record).toHaveBeenCalledWith(expect.objectContaining({
      exercisesCompleted: 1,
      firstTrySuccesses: 1,
      attempts: 1,
      needsPracticeCount: 0,
    }));
    expect(medals.evaluateUnlocks).toHaveBeenCalledTimes(1);
  });

  it('does not record an abandoned round', () => {
    service.start('self-assessment');
    service.clear();
    expect(history.record).not.toHaveBeenCalled();
    expect(medals.evaluateUnlocks).not.toHaveBeenCalled();
  });
});

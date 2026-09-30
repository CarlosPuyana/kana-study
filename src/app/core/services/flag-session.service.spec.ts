import { TestBed } from '@angular/core/testing';
import { FlagStudyUnit } from '../models/country.model';
import { FLAG_MAX_APPEARANCES, FlagSessionService } from './flag-session.service';
import { FlagProgressService } from './flag-progress.service';
import { FlagMedalService } from './flag-medal.service';
import { SessionHistoryService } from './session-history.service';

describe('FlagSessionService', () => {
  let service: FlagSessionService;
  let round: FlagStudyUnit[];
  let progress: { buildRound: ReturnType<typeof vi.fn>; recordReview: ReturnType<typeof vi.fn>; recordPracticeAttempt: ReturnType<typeof vi.fn> };
  let history: { record: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    round=[{key:'flags:jp:flag-to-country',countryId:'jp',questionType:'flag-to-country'}];
    progress={buildRound:vi.fn(()=>round),recordReview:vi.fn(),recordPracticeAttempt:vi.fn()};
    history={record:vi.fn()};
    TestBed.configureTestingModule({providers:[FlagSessionService,{provide:FlagProgressService,useValue:progress},{provide:SessionHistoryService,useValue:history},{provide:FlagMedalService,useValue:{evaluateUnlocks:vi.fn(()=>[])}}]});
    service=TestBed.inject(FlagSessionService);
  });
  afterEach(()=>TestBed.resetTestingModule());

  it('records Good for a correct first answer',()=>{service.start();service.answer('jp');expect(progress.recordReview).toHaveBeenCalledWith(round[0],'good',true,expect.any(String));});
  it('records Again once when a later repetition is answered correctly',()=>{service.start();service.answer('fr');service.continue();service.answer('jp');expect(progress.recordReview).toHaveBeenCalledTimes(1);expect(progress.recordReview.mock.calls[0][1]).toBe('again');expect(progress.recordPracticeAttempt).toHaveBeenCalledWith(round[0],true);});
  it('repeats Again immediately only when no intervening country exists',()=>{service.start();service.answer('fr');service.continue();expect(service.currentUnit()?.countryId).toBe('jp');});
  it('stops at four appearances and marks the unit for practice',()=>{service.start();for(let i=0;i<FLAG_MAX_APPEARANCES;i++){service.answer('fr');service.continue();}const item=service.session()!.items[0];expect(item.appearances).toBe(4);expect(item.needsPractice).toBe(true);expect(item.resolved).toBe(true);expect(service.completed()).toBe(true);});
  it('records module metadata only after completion',()=>{service.start();service.answer('jp');expect(history.record).not.toHaveBeenCalled();service.continue();expect(history.record).toHaveBeenCalledWith(expect.objectContaining({module:'flags',countryIds:['jp'],questionTypes:['flag-to-country'],studyRegions:['asia']}));});
});


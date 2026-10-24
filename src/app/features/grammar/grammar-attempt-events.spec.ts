import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {RouterTestingHarness} from '@angular/router/testing';
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb';
import {GRAMMAR_ROUTES} from './grammar.routes';
import {GrammarPage} from './pages/grammar.page';
import {AttemptEvent} from '../../core/models/attempt-event.model';
import {AttemptEventRepository} from '../../core/services/attempt-event.repository';
import {AttemptRecordingService} from '../../core/services/attempt-recording.service';
describe('Grammar lesson AttemptEvent boundary',()=>{
  beforeEach(()=>{localStorage.clear();vi.stubGlobal('indexedDB',new IDBFactory());vi.stubGlobal('IDBKeyRange',IDBKeyRange);vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));vi.spyOn(window,'scrollTo').mockImplementation(()=>{});TestBed.configureTestingModule({providers:[provideRouter([{path:'grammar',children:GRAMMAR_ROUTES}])]});});
  afterEach(async()=>{await TestBed.inject(AttemptRecordingService).settle();TestBed.resetTestingModule();vi.unstubAllGlobals();vi.restoreAllMocks();});
  async function events(){await TestBed.inject(AttemptRecordingService).settle();const values:AttemptEvent[]=[];await TestBed.inject(AttemptEventRepository).scan({from:'0000',to:'9999'},e=>{values.push(e);});return values;}
  it('opening and navigation do not emit; grading keeps the actual exercise identity once',async()=>{
    const h=await RouterTestingHarness.create(),page=await h.navigateByUrl('/grammar/n5/01/sentence-structure-context',GrammarPage);await h.fixture.whenStable();
    expect(await events()).toEqual([]);const exercise=page.currentExercise()!;page.answer(false);page.answer(true);
    expect(await events()).toHaveLength(1);expect((await events())[0]).toMatchObject({module:'grammar',itemId:exercise.id,questionType:exercise.kind,result:{source:'objective',correct:false}});
    page.continueExercise();await h.fixture.whenStable();expect(await events()).toHaveLength(1);
    await h.navigateByUrl('/grammar',GrammarPage);expect(await events()).toHaveLength(1);
  });
});

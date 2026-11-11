import {TestBed} from '@angular/core/testing';
import {ADJECTIVE_CATEGORIES,ADJECTIVE_TRANSFORMATIONS} from '../models/conjugation-practice.model';
import {ConjugationPracticeService} from './conjugation-practice.service';
import {ConjugationSelectionService,CONJUGATION_SELECTION_KEY} from './conjugation-selection.service';
import {ConjugationStatsService,CONJUGATION_STATS_KEY} from './conjugation-stats.service';
import {WorkspaceService} from './workspace.service';
import {StorageService} from './storage.service';
import {CONJUGATION_ADJECTIVES} from '../../data/conjugation-adjectives';
import {practiceQuestions} from './conjugation-questions';
import * as copy from '../../../assets/i18n/conjugations.generated';
describe('C3.1 adjective transformations and durable preferences',()=>{
 beforeEach(()=>{localStorage.clear();TestBed.configureTestingModule({providers:[ConjugationPracticeService]});});
 afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();localStorage.clear();});
 for(const [i,id]of ADJECTIVE_CATEGORIES.entries())for(const type of ['i','na','both'] as const)it(id+' / '+type+': isolated literal answers, correction and independent statistics',()=>{
  const s=TestBed.inject(ConjugationSelectionService),p=TestBed.inject(ConjugationPracticeService);expect(s.isUnlocked(id)).toBe(true);s.setAdjectiveType(id,type);expect(p.start(s.intent(id)!)).toBe(true);const q=p.session()!.questions;expect(q).toHaveLength(type==='i'?15:type==='na'?10:25);
  for(const question of q){expect(question.transformation).toBe(ADJECTIVE_TRANSFORMATIONS[i]);expect(question.answers).toBe(CONJUGATION_ADJECTIVES.find(w=>w.id===question.word.id)!.conjugations[ADJECTIVE_TRANSFORMATIONS[i]]);expect(type==='both'||question.word.type===type).toBe(true);}
  const old=TestBed.inject(ConjugationStatsService).get('adjective-i');expect(p.answer(p.question()!.answers.kana[0])).toBe(true);p.next();expect(p.answer('wrong')).toBe(true);expect(p.stats.get(id).attempts).toBe(2);expect(p.stats.get(id).correct).toBe(1);expect(p.stats.get('adjective-i')).toEqual(old);expect(p.stats.get('adjective-na').attempts).toBe(0);
 });
 it.each([1,2,3,4])('v%s: removes legacy selection without silently selecting new forms or redistributing historical data',version=>{
  const legacy={attempts:20,correct:14,wrong:6,bestStreak:5,durationSeconds:30,timedAttempts:2};const raw=JSON.stringify({version:1,buckets:{'adjective-i':legacy,'adjective-na':legacy,mixed:legacy}});localStorage.setItem(CONJUGATION_STATS_KEY,raw);
  localStorage.setItem(CONJUGATION_SELECTION_KEY,JSON.stringify({version,categoryIds:['adjective-i','adjective-na','verb-te',...ADJECTIVE_CATEGORIES],unlockedIds:['adjective-i','adjective-na','verb-te','verb-polite','verb-conditional-ba','verb-potential',...ADJECTIVE_CATEGORIES]}));
  const s=TestBed.inject(ConjugationSelectionService),stats=TestBed.inject(ConjugationStatsService);expect(s.ids()).toEqual(['verb-te']);expect(s.legacySelection()).toBe(true);expect(s.isUnlocked('verb-potential')).toBe(version>=4);expect(s.isUnlocked('verb-conditional-ba')).toBe(version>=3);expect(s.isUnlocked('verb-polite')).toBe(version>=2);
  for(const id of ADJECTIVE_CATEGORIES){expect(s.isUnlocked(id)).toBe(true);expect(stats.get(id).attempts).toBe(0);}expect(stats.get('adjective-i')).toEqual(legacy);expect(stats.get('adjective-na')).toEqual(legacy);expect(localStorage.getItem(CONJUGATION_STATS_KEY)).toBe(raw);expect(TestBed.inject(ConjugationPracticeService).start({mode:'single',categoryIds:['adjective-i']})).toBe(false);
 });
 it('persists each family selector and input preference through reload and A→B→A',()=>{
  let s=TestBed.inject(ConjugationSelectionService);const w=TestBed.inject(WorkspaceService);w.activateUser('a');s.setAdjectiveType('adjective-past','na');s.setCategory('adjective-past',true);s.setAutoKana(false);s.setUnlocked('verb-passive',true);w.activateUser('b');expect(s.autoKana()).toBe(true);expect(s.adjectiveTypes()['adjective-past']).toBe('both');expect(s.isUnlocked('verb-passive')).toBe(false);w.activateUser('a');expect(s.autoKana()).toBe(false);expect(s.adjectiveTypes()['adjective-past']).toBe('na');expect(s.isUnlocked('verb-passive')).toBe(true);
  TestBed.resetTestingModule();s=TestBed.inject(ConjugationSelectionService);expect(s.autoKana()).toBe(false);expect(s.ids()).toEqual(['adjective-past']);expect(s.intent('adjective-past')?.adjectiveTypes?.['adjective-past']).toBe('na');
 });
 it('keeps previous preferences and reports failed writes without pretending success',()=>{
  const s=TestBed.inject(ConjugationSelectionService);s.setAdjectiveType('adjective-negative','i');const raw=localStorage.getItem(CONJUGATION_SELECTION_KEY);vi.spyOn(TestBed.inject(StorageService),'set').mockImplementation(()=>{throw Error('quota');});s.setAdjectiveType('adjective-negative','na');s.setAutoKana(false);expect(s.adjectiveTypes()['adjective-negative']).toBe('i');expect(s.autoKana()).toBe(true);expect(s.saveError()).toBe(true);expect(localStorage.getItem(CONJUGATION_SELECTION_KEY)).toBe(raw);
 });
 it('mixes requested transformations/types with permitted verbs, rejecting malformed families and legacy routes',()=>{
  const s=TestBed.inject(ConjugationSelectionService),p=TestBed.inject(ConjugationPracticeService);s.setAdjectiveType('adjective-negative','i');s.setAdjectiveType('adjective-past','na');for(const id of ['adjective-negative','adjective-past','verb-te'] as const)s.setCategory(id,true);expect(p.start(s.intent()!)).toBe(true);expect(p.session()!.questions).toHaveLength(75);
  const before=p.session()!.intent.adjectiveTypes!;s.setAdjectiveType('adjective-negative','na');expect(before['adjective-negative']).toBe('i');expect(p.session()!.questions.filter(q=>!q.id.startsWith('verb:')&&q.transformation==='negative').every(q=>q.word.type==='i')).toBe(true);
  expect(practiceQuestions({mode:'mixed',categoryIds:['adjective-negative','verb-te'],adjectiveTypes:{'adjective-negative':'x' as 'i'}})).toEqual([]);for(const id of ['adjective-i','adjective-na'] as const)expect(p.start({mode:'single',categoryIds:[id]})).toBe(false);
 });
 for(const language of ['es','en','ca'] as const)for(const word of CONJUGATION_ADJECTIVES)it(language+' / '+word.id+': all five result meanings, readings and rules exist',()=>{
  for(const form of ADJECTIVE_TRANSFORMATIONS){const key=['suki','kirai'].includes(word.id)?word.id:'adjective';const result=copy[language]['conjugations.result.'+key+'.'+form];expect(result).toBeTruthy();expect(result).not.toBe(copy[language][word.meaningKey]);expect(copy[language]['conjugations.rule.'+word.type+'.'+form]).toBeTruthy();expect(word.conjugations[form].kana[0]).toBeTruthy();expect(word.conjugations[form].romaji[0]).toBeTruthy();}
 });
});

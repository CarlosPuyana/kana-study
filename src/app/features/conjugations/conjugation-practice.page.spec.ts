import {STUDY_MONOTONIC_NOW,STUDY_WALL_NOW} from '../../core/services/study-clock';
import {TestBed} from '@angular/core/testing';
import {Component} from '@angular/core';
import {provideRouter} from '@angular/router';
import {RouterTestingHarness} from '@angular/router/testing';
import {ConjugationPracticePage} from './conjugation-practice.page';
import {TranslationService} from '../../core/services/translation.service';
import {WorkspaceService} from '../../core/services/workspace.service';
import {SyncOutboxService} from '../../core/services/sync-outbox.service';
import * as copy from '../../../assets/i18n/conjugations.generated';
@Component({template:'Choose'})class ChoosePage{}
describe('Adjective practice form',()=>{
  let harness:RouterTestingHarness,page:ConjugationPracticePage;
  beforeEach(async()=>{
    localStorage.clear();TestBed.configureTestingModule({providers:[{provide:STUDY_MONOTONIC_NOW,useValue:()=>0},{provide:STUDY_WALL_NOW,useValue:()=>0},provideRouter([{path:'conjugations/practice',component:ConjugationPracticePage},{path:'conjugations',component:ChoosePage}]),{provide:SyncOutboxService,useValue:{enqueue:vi.fn()}},{provide:TranslationService,useValue:{useStudyCopy:vi.fn(),t:(k:string)=>copy.es[k]??k}}]});
    harness=await RouterTestingHarness.create();page=await harness.navigateByUrl('/conjugations/practice?mode=single&categories=adjective-i',ConjugationPracticePage);
  });
  afterEach(()=>{TestBed.resetTestingModule();localStorage.clear();});
  const root=()=>harness.routeNativeElement!;
  const input=()=>root().querySelector('input')!;
  const submit=(answer:string)=>{input().value=answer;input().dispatchEvent(new Event('input'));root().querySelector('form')!.dispatchEvent(new Event('submit',{cancelable:true}));harness.detectChanges();};
  it('starts a valid isolated question with a collapsed rule and semantic input',()=>{expect(page.practice.question()?.word.type).toBe('i');expect(root().querySelector('details')?.open).toBe(false);expect(input().getAttribute('aria-describedby')).toBe('answer-hint');expect(root().textContent).toContain('romaji');expect(root().querySelector('.feedback')).toBeNull();});
  it('handles submit/Enter contract exactly once, shows the expected answer and moves to a fresh empty input',()=>{const first=page.practice.question()!;submit(first.answers.romaji[0].toUpperCase());expect(page.practice.session()?.correct).toBe(1);expect(root().querySelector('.feedback')?.textContent).toContain('¡Correcto!');submit(first.answers.romaji[0]);expect(page.practice.stats.get('adjective-i').attempts).toBe(1);page.ruleOpen.set(true);page.next();harness.detectChanges();expect(page.practice.question()?.id).not.toBe(first.id);expect(input().value).toBe('');expect(root().querySelector('details')?.open).toBe(false);});
  it('reveals wrong/unknown answers and cannot count copying after reveal',()=>{submit('wrong');expect(page.practice.session()?.feedback).toBe('wrong');expect(root().querySelector('.expected')?.textContent).toBe(page.expected());page.next();page.unknown();harness.detectChanges();expect(page.practice.session()?.feedback).toBe('unknown');submit(page.practice.question()!.answers.kana[0]);expect(page.practice.stats.get('adjective-i')).toEqual({attempts:2,correct:0,wrong:2,bestStreak:0,durationSeconds:0,timedAttempts:2});});
  it('does not submit while an IME composition is active',()=>{page.composition(true);page.answer.set(page.practice.question()!.answers.kana[0]);page.submit(new Event('submit',{cancelable:true}));expect(page.practice.session()?.feedback).toBeNull();const event=new KeyboardEvent('keydown',{key:'Enter',cancelable:true,isComposing:true});page.enter(event);expect(event.defaultPrevented).toBe(true);page.composition(false);page.submit(new Event('submit',{cancelable:true}));expect(page.practice.session()?.feedback).toBe('correct');});
  it('closes the active round on A→B→A and never counts an old input for another workspace',()=>{TestBed.inject(WorkspaceService).activateUser('b');harness.detectChanges();expect(root().querySelector('.question')).toBeNull();expect(root().querySelector('.empty')).toBeTruthy();expect(page.practice.answer('anything',true)).toBe(false);TestBed.inject(WorkspaceService).activateGuest();expect(page.practice.session()).toBeNull();});
  it('rejects manipulated, missing, duplicated and unsupported query selections',async()=>{for(const query of ['','?mode=single&categories=verb-potential','?mode=single&categories=adjective-i,adjective-na','?mode=mixed&categories=adjective-na,verb-potential','?mode=mixed&categories=adjective-na&categories=adjective-i']){await harness.navigateByUrl('/conjugations',ChoosePage);page=await harness.navigateByUrl('/conjugations/practice'+query,ConjugationPracticePage);expect(page.practice.session()).toBeNull();expect(root().querySelector('input')).toBeNull();}});
  it('handles a changed selection on the reused route, including browser history/query navigation',async()=>{const reused=await harness.navigateByUrl('/conjugations/practice?mode=single&categories=adjective-na',ConjugationPracticePage);expect(reused).toBe(page);expect(page.practice.question()?.word.type).toBe('na');await harness.navigateByUrl('/conjugations/practice?mode=mixed&categories=adjective-i,verb-potential',ConjugationPracticePage);expect(page.practice.session()).toBeNull();});
  it('advances with Space only after feedback and preserves typing, modifiers and other focused controls',()=>{
    const press=(target:EventTarget,options:KeyboardEventInit={})=>{const event=new KeyboardEvent('keydown',{key:' ',bubbles:true,cancelable:true,...options});target.dispatchEvent(event);harness.detectChanges();return event;};
    const first=page.practice.question()!.id;expect(press(input()).defaultPrevented).toBe(false);expect(page.practice.question()!.id).toBe(first);
    submit(page.practice.question()!.answers.kana[0]);expect(press(input(),{repeat:true}).defaultPrevented).toBe(false);expect(press(input(),{ctrlKey:true}).defaultPrevented).toBe(false);expect(press(root().querySelector('.exit-link')!).defaultPrevented).toBe(false);
    expect(press(input()).defaultPrevented).toBe(true);expect(page.practice.question()!.id).not.toBe(first);expect(page.practice.stats.get('adjective-i').attempts).toBe(1);expect(page.practice.session()?.feedback).toBeNull();expect(input().value).toBe('');
    expect(press(document).defaultPrevented).toBe(false);page.unknown();harness.detectChanges();expect(press(root().querySelector('.next')!).defaultPrevented).toBe(true);expect(page.practice.stats.get('adjective-i').attempts).toBe(2);
  });
  it('displays correct / wrong independently, rather than correct / attempts',()=>{
    const counts=()=>[root().querySelector('.correct-count')!.textContent,root().querySelector('.wrong-count')!.textContent];
    submit(page.practice.question()!.answers.kana[0]);page.next();harness.detectChanges();submit(page.practice.question()!.answers.kana[0]);expect(counts()).toEqual(['2','0']);
    page.next();harness.detectChanges();submit('incorrect');expect(counts()).toEqual(['2','1']);page.next();page.unknown();harness.detectChanges();expect(counts()).toEqual(['2','2']);
  });
});

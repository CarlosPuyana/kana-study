import {ConjugationSelectionService} from '../../core/services/conjugation-selection.service';
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
    TestBed.inject(ConjugationSelectionService).setAdjectiveType('adjective-negative','i');TestBed.inject(ConjugationSelectionService).setAdjectiveType('adjective-past','na');harness=await RouterTestingHarness.create();page=await harness.navigateByUrl('/conjugations/practice?mode=single&categories=adjective-negative',ConjugationPracticePage);
  });
  afterEach(()=>{TestBed.resetTestingModule();localStorage.clear();});
  const root=()=>harness.routeNativeElement!;
  const input=()=>root().querySelector('input')!;
  const submit=(answer:string)=>{input().value=answer;input().dispatchEvent(new Event('input'));root().querySelector('form')!.dispatchEvent(new Event('submit',{cancelable:true}));harness.detectChanges();};
  it('starts a valid isolated question with a collapsed rule and semantic input',()=>{expect(page.practice.question()?.word.type).toBe('i');expect(root().querySelector('details')?.open).toBe(false);expect(input().getAttribute('aria-describedby')).toBe('answer-hint');expect(root().textContent).toContain('romaji');expect(root().querySelector('.feedback')).toBeNull();});
  it('handles submit/Enter contract exactly once, shows the expected answer and moves to a fresh empty input',()=>{const first=page.practice.question()!;submit(first.answers.romaji[0].toUpperCase());expect(page.practice.session()?.correct).toBe(1);expect(root().querySelector('.feedback')?.textContent).toContain('¡Correcto!');submit(first.answers.romaji[0]);expect(page.practice.stats.get('adjective-negative').attempts).toBe(1);page.ruleOpen.set(true);page.next();harness.detectChanges();expect(page.practice.question()?.id).not.toBe(first.id);expect(input().value).toBe('');expect(root().querySelector('details')?.open).toBe(false);});
  it('reveals wrong/unknown answers and cannot count copying after reveal',()=>{submit('wrong');expect(page.practice.session()?.feedback).toBe('wrong');expect(root().querySelector('.expected')?.textContent).toBe(page.expected());page.next();page.unknown();harness.detectChanges();expect(page.practice.session()?.feedback).toBe('unknown');submit(page.practice.question()!.answers.kana[0]);expect(page.practice.stats.get('adjective-negative')).toEqual({attempts:2,correct:0,wrong:2,bestStreak:0,durationSeconds:0,timedAttempts:2});});
  it('does not submit while an IME composition is active',()=>{page.composition(true);page.answer.set(page.practice.question()!.answers.kana[0]);page.submit(new Event('submit',{cancelable:true}));expect(page.practice.session()?.feedback).toBeNull();const event=new KeyboardEvent('keydown',{key:'Enter',cancelable:true,isComposing:true});page.enter(event);expect(event.defaultPrevented).toBe(true);page.composition(false);page.submit(new Event('submit',{cancelable:true}));expect(page.practice.session()?.feedback).toBe('correct');});
  it('closes the active round on A→B→A and never counts an old input for another workspace',()=>{TestBed.inject(WorkspaceService).activateUser('b');harness.detectChanges();expect(root().querySelector('.question')).toBeNull();expect(root().querySelector('.empty')).toBeTruthy();expect(page.practice.answer('anything',true)).toBe(false);TestBed.inject(WorkspaceService).activateGuest();expect(page.practice.session()).toBeNull();});
  it('rejects manipulated, missing, duplicated and unsupported query selections',async()=>{for(const query of ['','?mode=single&categories=verb-potential','?mode=single&categories=adjective-negative,adjective-past','?mode=mixed&categories=adjective-past,verb-potential','?mode=mixed&categories=adjective-past&categories=adjective-negative']){await harness.navigateByUrl('/conjugations',ChoosePage);page=await harness.navigateByUrl('/conjugations/practice'+query,ConjugationPracticePage);expect(page.practice.session()).toBeNull();expect(root().querySelector('input')).toBeNull();}});
  it('handles a changed selection on the reused route, including browser history/query navigation',async()=>{const reused=await harness.navigateByUrl('/conjugations/practice?mode=single&categories=adjective-past',ConjugationPracticePage);expect(reused).toBe(page);expect(page.practice.question()?.word.type).toBe('na');await harness.navigateByUrl('/conjugations/practice?mode=mixed&categories=adjective-negative,verb-potential',ConjugationPracticePage);expect(page.practice.session()).toBeNull();});
  it('advances with Space only after feedback and preserves typing, modifiers and other focused controls',()=>{
    const press=(target:EventTarget,options:KeyboardEventInit={})=>{const event=new KeyboardEvent('keydown',{key:' ',bubbles:true,cancelable:true,...options});target.dispatchEvent(event);harness.detectChanges();return event;};
    const first=page.practice.question()!.id;expect(press(input()).defaultPrevented).toBe(false);expect(page.practice.question()!.id).toBe(first);
    submit(page.practice.question()!.answers.kana[0]);expect(press(input(),{repeat:true}).defaultPrevented).toBe(false);expect(press(input(),{ctrlKey:true}).defaultPrevented).toBe(false);expect(press(root().querySelector('.exit-link')!).defaultPrevented).toBe(false);
    expect(press(input()).defaultPrevented).toBe(true);expect(page.practice.question()!.id).not.toBe(first);expect(page.practice.stats.get('adjective-negative').attempts).toBe(1);expect(page.practice.session()?.feedback).toBeNull();expect(input().value).toBe('');
    expect(press(document).defaultPrevented).toBe(false);page.unknown();harness.detectChanges();expect(press(root().querySelector('.next')!).defaultPrevented).toBe(true);expect(page.practice.stats.get('adjective-negative').attempts).toBe(2);
  });
  it('displays correct / wrong independently, rather than correct / attempts',()=>{
    const counts=()=>[root().querySelector('.correct-count')!.textContent,root().querySelector('.wrong-count')!.textContent];
    submit(page.practice.question()!.answers.kana[0]);page.next();harness.detectChanges();submit(page.practice.question()!.answers.kana[0]);expect(counts()).toEqual(['2','0']);
    page.next();harness.detectChanges();submit('incorrect');expect(counts()).toEqual(['2','1']);page.next();page.unknown();harness.detectChanges();expect(counts()).toEqual(['2','2']);
  });
  it('converts progressive input and pasted text while preserving selection and intermediate edits',()=>{
    const edit=(text:string,start:number,end=start,type='insertText')=>{input().value=text;input().setSelectionRange(start,end);input().dispatchEvent(new InputEvent('input',{inputType:type,bubbles:true}));harness.detectChanges();};
    edit('sh',2);expect(input().value).toBe('sh');edit('shi',3);expect(input().value).toBe('し');expect(input().selectionStart).toBe(1);
    edit('漢字shizukadatta後',5,5,'insertFromPaste');expect(input().value).toBe('漢字しずかだった後');expect(input().selectionStart).toBe(3);
    edit('安いyasui後',2,7,'insertFromPaste');expect(input().value).toBe('安いやすい後');expect(input().selectionStart).toBe(2);expect(input().selectionEnd).toBe(5);
    edit('漢字sh後',4,4,'deleteContentBackward');expect(input().value).toBe('漢字sh後');expect(input().selectionStart).toBe(4);
  });
  it('keeps native IME composition text intact and suppresses Enter until composition ends',()=>{
    input().dispatchEvent(new CompositionEvent('compositionstart'));input().value='shi';input().dispatchEvent(new InputEvent('input',{isComposing:true,inputType:'insertCompositionText'}));expect(input().value).toBe('shi');expect(page.answer()).toBe('shi');page.submit(new Event('submit',{cancelable:true}));expect(page.practice.session()?.feedback).toBeNull();
    input().value='安かった';input().dispatchEvent(new InputEvent('input',{isComposing:true,inputType:'insertCompositionText'}));input().dispatchEvent(new CompositionEvent('compositionend'));expect(input().value).toBe('安かった');expect(page.answer()).toBe('安かった');
  });
  it('lets the user disable conversion durably and still submit an explicit romaji answer',()=>{
    const toggle=root().querySelector('.auto-kana input') as HTMLInputElement;toggle.click();harness.detectChanges();expect(page.selection.autoKana()).toBe(false);const q=page.practice.question()!;submit(q.answers.romaji[0]);expect(input().value).toBe(q.answers.romaji[0]);expect(page.practice.session()?.feedback).toBe('correct');expect(JSON.parse(localStorage.getItem('kana-study.conjugation-selection.v1')!).autoKana).toBe(false);
  });
  it('shows meaning, reading, form and rule after both correct and incorrect answers',()=>{
    for(const correct of [true,false]){const q=page.practice.question()!;submit(correct?q.answers.kana[0]:'incorrect');const feedback=root().querySelector('.feedback')!;expect(feedback.textContent).toContain(q.answers.kana[0]);expect(feedback.textContent).toContain(q.answers.romaji[0]);expect(feedback.textContent).toContain(copy.es[q.word.meaningKey]);expect(feedback.textContent).toContain(copy.es['conjugations.transform.'+q.transformation]);expect(feedback.textContent).toContain(copy.es['conjugations.rule.'+q.word.type+'.'+q.transformation]);expect(feedback.querySelector('.result-meaning')!.textContent).toContain('No es/está');page.next();harness.detectChanges();}
  });
  it('does not turn legacy family URLs into new practice',async()=>{page=await harness.navigateByUrl('/conjugations/practice?mode=single&categories=adjective-i',ConjugationPracticePage);expect(page.practice.session()).toBeNull();expect(root().querySelector('.question')).toBeNull();});
  for(const category of ['copula-plain','copula-polite'] as const)it(category+': enforces the lock and renders an independent copula family with complete feedback',async()=>{
    page=await harness.navigateByUrl('/conjugations/practice?mode=single&categories='+category,ConjugationPracticePage);expect(page.practice.session()).toBeNull();page.selection.setUnlocked(category,true);page.start();harness.detectChanges();expect(page.isCopula()).toBe(true);expect(page.isVerb()).toBe(false);expect(page.ruleFamily()).toBe(category);const q=page.practice.question()!;expect(root().querySelector('.question')!.getAttribute('data-adjective-id')).toBeNull();expect(root().querySelector('.question')!.getAttribute('data-copula-id')).toBe(q.word.id);expect(root().textContent).not.toContain('conjugations.category.adjective-noun');submit(q.answers.romaji[0]);expect(page.practice.session()?.feedback).toBe('correct');expect(root().querySelector('.feedback')!.textContent).toContain(copy.es['conjugations.rule.'+category+'.'+q.transformation]);expect(root().querySelector('.feedback')!.textContent).toContain(copy.es['conjugations.rule.'+category+'.note']);page.selection.setUnlocked(category,false);harness.detectChanges();expect(root().querySelector('.question')).toBeNull();
  });
});

import {Component,signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {provideRouter} from '@angular/router';
import {DictionaryRepository} from '../../../core/services/dictionary.repository';
import {WorkspaceService} from '../../../core/services/workspace.service';
import {TranslationService} from '../../../core/services/translation.service';
import {DictionaryTerm} from '../../../core/models/dictionary.model';
import {JapaneseDictionaryPopover} from './japanese-dictionary-popover';

@Component({imports:[JapaneseDictionaryPopover],template:`<app-japanese-dictionary-popover [context]="context()">
  <p lang="ja" tabindex="0" class="word">学生</p><p class="western">Estudiante</p>
  <button lang="ja">学生</button><div data-dictionary-ignore><span lang="ja">学生</span></div>
  <p lang="ja" class="unknown">未知語</p></app-japanese-dictionary-popover>`})
class ReferenceHost {readonly context=signal('01/01');}
describe('Read-only Japanese reference popover',()=>{
  const active=signal('guest'),language=signal('es');let rows:DictionaryTerm[]=[];
  const repository={cleanup:vi.fn(),ready:vi.fn(),find:vi.fn()};
  beforeEach(()=>{
    vi.clearAllMocks();rows=[];active.set('guest');language.set('es');
    repository.ready.mockResolvedValue(null);repository.find.mockImplementation(async(_id:string,query:string,index:string)=>rows.filter(term=>(index==='reading'?term.reading:term.expression)===query));
    TestBed.configureTestingModule({providers:[provideRouter([]),{provide:DictionaryRepository,useValue:repository},
      {provide:WorkspaceService,useValue:{active}},{provide:TranslationService,useValue:{language,t:(key:string)=>key}}]});
  });
  afterEach(()=>{vi.unstubAllGlobals();getSelection()?.removeAllRanges();Reflect.deleteProperty(document,'caretRangeFromPoint');TestBed.resetTestingModule();});
  async function fixture(){const f=TestBed.createComponent(ReferenceHost);await f.whenStable();f.detectChanges();return f;}
  function popover(f:Awaited<ReturnType<typeof fixture>>){return f.debugElement.query(By.directive(JapaneseDictionaryPopover)).componentInstance as JapaneseDictionaryPopover;}
  function clickWord(f:Awaited<ReturnType<typeof fixture>>,selector='.word'){
    const element=f.nativeElement.querySelector(selector) as HTMLElement;
    const range=document.createRange();range.setStart(element.firstChild!,0);range.collapse(true);
    getSelection()?.removeAllRanges();
    Object.defineProperty(document,'caretRangeFromPoint',{configurable:true,value:()=>range});
    element.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:100,clientY:100}));
  }
  it('opens only Japanese text, uses exact offline N5 fallback and performs no import maintenance',async()=>{
    const f=await fixture();clickWord(f);await f.whenStable();f.detectChanges();
    expect(f.nativeElement.querySelector('[role="dialog"]').textContent).toContain('alumno');
    expect(repository.cleanup).not.toHaveBeenCalled();expect(repository.find).not.toHaveBeenCalled();
    f.nativeElement.querySelector('.western').click();f.detectChanges();expect(popover(f).open()).toBe(false);
    const calls=repository.ready.mock.calls.length;
    f.nativeElement.querySelector('button[lang="ja"]').click();f.nativeElement.querySelector('[data-dictionary-ignore] span').click();
    expect(repository.ready).toHaveBeenCalledTimes(calls);expect(popover(f).open()).toBe(false);
  });
  it('shows an honest missing dictionary state and links to the existing installer',async()=>{
    const f=await fixture();clickWord(f,'.unknown');await f.whenStable();f.detectChanges();
    expect(f.nativeElement.querySelector('[role="dialog"]').textContent).toContain('grammar.dictionary.notInstalled');
    expect(f.nativeElement.querySelector('[role="dialog"] a').getAttribute('href')).toContain('manga');
  });
  it('supports keyboard selection, restores focus with Escape and closes on outside click',async()=>{
    const f=await fixture(),element=f.nativeElement.querySelector('.word') as HTMLElement;element.focus();
    element.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));await f.whenStable();f.detectChanges();
    expect(document.activeElement).toBe(f.nativeElement.querySelector('[role="dialog"] button'));
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));f.detectChanges();expect(popover(f).open()).toBe(false);expect(document.activeElement).toBe(element);
    clickWord(f);await f.whenStable();document.body.click();expect(popover(f).open()).toBe(false);
  });
  it('uses selection lookup and preserves reading, base form and at most three glosses',async()=>{
    repository.ready.mockResolvedValue({dictionaryId:'local'});
    rows=[{id:'term',dictionaryId:'local',expression:'食べる',reading:'たべる',glossaries:['eat','consume','have a meal','fourth'],definitionTags:'',rules:'v1',score:0,sequence:1,termTags:''}];
    const f=await fixture(),element=f.nativeElement.querySelector('.word') as HTMLElement;element.textContent='食べなかった';
    const range=document.createRange();range.selectNodeContents(element);getSelection()!.addRange(range);popover(f).selected();await f.whenStable();f.detectChanges();
    const panel=f.nativeElement.querySelector('[role="dialog"]');expect(panel.textContent).toContain('食べる');expect(panel.textContent).toContain('たべる');expect(panel.textContent).toContain('grammar.dictionary.base');expect(panel.querySelectorAll('li')).toHaveLength(3);
    expect(repository.cleanup).not.toHaveBeenCalled();
  });
  it('does not reopen a dismissed selection on a delayed selectionchange, and accepts a new range',async()=>{
    const f=await fixture(),range=document.createRange();range.selectNodeContents(f.nativeElement.querySelector('.word'));
    getSelection()!.addRange(range);popover(f).selected();await f.whenStable();popover(f).close();popover(f).selected();
    expect(popover(f).open()).toBe(false);
    const next=document.createRange();next.selectNodeContents(f.nativeElement.querySelector('.unknown'));
    getSelection()!.removeAllRanges();getSelection()!.addRange(next);popover(f).selected();await f.whenStable();
    expect(popover(f).open()).toBe(true);expect(popover(f).result()?.query).toBe('未知語');
  });
  it.each(['lesson','account','selection','close'] as const)('discards a pending result after %s changes',async change=>{
    let resolve!:(value:null)=>void;repository.ready.mockImplementationOnce(()=>new Promise<null>(r=>resolve=r));
    const f=await fixture();clickWord(f);f.detectChanges();expect(popover(f).loading()).toBe(true);
    if(change==='lesson')f.componentInstance.context.set('02/01');
    if(change==='account')active.set('user:other');
    if(change==='selection'){clickWord(f,'.unknown');await f.whenStable();}
    if(change==='close')popover(f).close();
    f.detectChanges();resolve(null);await f.whenStable();f.detectChanges();
    if(change==='selection')expect(f.nativeElement.querySelector('[role="dialog"]').textContent).toContain('grammar.dictionary.notInstalled');
    else expect(popover(f).open()).toBe(false);
    expect(popover(f).result()?.query).not.toBe('学生');
  });
});


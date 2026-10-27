import {computed, signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {Router} from '@angular/router';
import {LearningSessionService} from '../../core/services/learning-session.service';
import {DailyLearningService} from '../../core/services/daily-learning.service';
import {TranslationService} from '../../core/services/translation.service';
import {KanaStrokesService} from '../../core/services/kana-strokes.service';
import {ALL_KANA} from '../../data/kana';
import {KanaWritingCanvas} from '../../shared/components/kana-writing-canvas/kana-writing-canvas';
import {LearnPage} from './learn.page';
import {HomePage} from '../home/home.page';

describe('Kana page keyboard and modal boundary', () => {
  const mode=signal('self-assessment'), type=signal('kana-to-romaji'), revealed=signal(false), feedback=signal<unknown>(null);
  const learning={session:computed(()=>({id:'keyboard',mode:mode(),sessionSize:1,attempts:1,items:[],completedAt:null})),
    currentKana:signal(ALL_KANA[0]),currentUnit:computed(()=>({key:'test',questionType:type()})),currentItem:()=>({appearances:0}),
    completed:signal(false),newlyUnlockedMedals:signal<unknown[]>([]),resolvedCount:()=>0,progressPercent:()=>0,
    questionValue:()=> 'あ',answer:()=> 'a',currentExample:()=>null,options:()=>['a','i','u','e'],feedback,revealed,
    reveal:vi.fn(()=>revealed.set(true)),rate:vi.fn(()=>revealed.set(false)),answerQuick:vi.fn(()=>feedback.set({correct:true,answer:'a',selected:'a'})),
    clear:vi.fn(),dismissNextMedal:vi.fn(),isPractice:()=>false};
  let fixture:ReturnType<typeof TestBed.createComponent<LearnPage>>;
  beforeEach(()=>{vi.clearAllMocks();mode.set('self-assessment');type.set('kana-to-romaji');revealed.set(false);feedback.set(null);learning.completed.set(false);
    TestBed.configureTestingModule({imports:[LearnPage],providers:[
      {provide:LearningSessionService,useValue:learning},{provide:DailyLearningService,useValue:{isCompletedToday:()=>false}},
      {provide:TranslationService,useValue:{t:(key:string)=>key,language:signal('es')}},
      {provide:Router,useValue:{navigateByUrl:vi.fn()}},{provide:KanaStrokesService,useValue:{load:async()=>[]}}]});
  });
  afterEach(()=>{fixture?.destroy();fixture?.nativeElement.remove();TestBed.resetTestingModule();});
  async function render(){fixture=TestBed.createComponent(LearnPage);document.body.append(fixture.nativeElement);await fixture.whenStable();fixture.detectChanges();return fixture;}
  function press(key:string,repeat=false){const e=new KeyboardEvent('keydown',{key,repeat,bubbles:true,cancelable:true});document.dispatchEvent(e);return e;}
  it('reveals, preserves all three existing ratings, and does not consume Space after reveal',async()=>{
    await render();expect(press('1').defaultPrevented).toBe(false);expect(learning.rate).not.toHaveBeenCalled();
    expect(press(' ').defaultPrevented).toBe(true);expect(press(' ').defaultPrevented).toBe(false);
    for(const [key,rating]of [['1','again'],['2','hard'],['3','good']]){revealed.set(true);press(key);expect(learning.rate).toHaveBeenLastCalledWith(rating);press(key,true);}
    expect(learning.rate).toHaveBeenCalledTimes(3);
  });
  it('numbers select only visible quick options, and cannot answer twice during feedback',async()=>{
    mode.set('quick-practice');await render();expect(press(' ').defaultPrevented).toBe(false);press('4');press('1');
    expect(learning.answerQuick).toHaveBeenCalledExactlyOnceWith('e');
  });
  it('ignores shortcuts while drawing or loading and before drawing choices are opened',async()=>{
    mode.set('quick-practice');type.set('romaji-to-kana');await render();press('1');expect(learning.answerQuick).not.toHaveBeenCalled();
    mode.set('self-assessment');await fixture.whenStable();fixture.detectChanges();
    const canvas=fixture.debugElement.query(By.directive(KanaWritingCanvas)).componentInstance as KanaWritingCanvas;
    canvas.loading.set(true);press(' ');expect(learning.reveal).not.toHaveBeenCalled();canvas.loading.set(false);
    const svg=fixture.nativeElement.querySelector('svg');
    canvas.pointerDown({pointerId:1,button:0,currentTarget:svg,clientX:0,clientY:0,timeStamp:1,pressure:1,preventDefault:()=>{}} as unknown as PointerEvent);
    press(' ');expect(learning.reveal).not.toHaveBeenCalled();canvas.clear();press(' ');expect(learning.reveal).toHaveBeenCalledOnce();
  });
  it('Escape closes exit confirmation with focus restored and no grade behind it',async()=>{
    await render();const close=fixture.nativeElement.querySelector('.session-header button:last-child') as HTMLButtonElement;
    close.focus();close.click();await fixture.whenStable();fixture.detectChanges();expect(fixture.nativeElement.querySelector('main').hasAttribute('inert')).toBe(true);
    press(' ');press('1');expect(learning.reveal).not.toHaveBeenCalled();expect(learning.rate).not.toHaveBeenCalled();
    press('Escape');await fixture.whenStable();fixture.detectChanges();expect(fixture.nativeElement.querySelector('[role=dialog]')).toBeNull();expect(document.activeElement).toBe(close);
  });
});

describe('deferred learning panel intent',()=>{
  it('can cancel a pending opening with Escape, without closing an existing modal',()=>{
    const showLearningPanel=signal(true),host={showLearningPanel} as unknown as HomePage;
    const event=new KeyboardEvent('keydown',{key:'Escape',cancelable:true});
    HomePage.prototype.cancelLearningLoad.call(host,event);
    expect(showLearningPanel()).toBe(false);expect(event.defaultPrevented).toBe(true);
    showLearningPanel.set(true);const modal=document.createElement('section');modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');document.body.append(modal);
    try {HomePage.prototype.cancelLearningLoad.call(host,new KeyboardEvent('keydown',{key:'Escape'}));expect(showLearningPanel()).toBe(true);}
    finally{modal.remove();}
  });
});

import { afterRenderEffect, ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, signal, viewChild, ViewEncapsulation } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslationService } from '../../../core/services/translation.service';
import { GRAMMAR_LESSONS, GRAMMAR_PRACTICES, GRAMMAR_ROADMAP, GRAMMAR_TOPICS, GRAMMAR_SESSIONS } from '../data/grammar-n5.generated';
import { FuriganaText } from '../../../shared/components/furigana-text/furigana-text';
import { GrammarSidebar } from '../components/grammar-sidebar';
import { GrammarExerciseComponent } from '../components/grammar-exercise';
import { GrammarPracticeComponent } from '../components/grammar-practice';
import { grammarLessonExercises } from '../models/grammar.model';

@Component({selector:'app-grammar-page',imports:[RouterLink,FuriganaText,GrammarSidebar,GrammarExerciseComponent,GrammarPracticeComponent],templateUrl:'./grammar.page.html',styleUrls:['./grammar-roadmap.scss','./grammar-topic.scss','./grammar-lesson.scss','./grammar-practice.scss','./grammar.page.scss'],encapsulation:ViewEncapsulation.None,changeDetection:ChangeDetectionStrategy.OnPush,host:{'(document:keydown)':'menuKeydown($event)','(document:focusin)':'menuFocus($event)'}})
export class GrammarPage {
  readonly i18n=inject(TranslationService);private readonly route=inject(ActivatedRoute);private readonly router=inject(Router);
  private readonly params=toSignal(this.route.paramMap,{initialValue:this.route.snapshot.paramMap});
  readonly topics=GRAMMAR_TOPICS;readonly roadmap=GRAMMAR_ROADMAP;
  readonly topic=computed(()=>this.topics.find(topic=>topic.id===this.params().get('topicId'))??null);
  readonly lesson=computed(()=>GRAMMAR_LESSONS.find(lesson=>lesson.topicId===this.topic()?.id&&lesson.id===this.params().get('lessonId'))??null);
  readonly exerciseIndex=signal(0);
  readonly exercises=computed(()=>this.lesson()?grammarLessonExercises(this.lesson()!):[]);
  readonly currentExercise=computed(()=>this.exercises()[this.exerciseIndex()]??null);
  readonly sessions=computed(()=>GRAMMAR_SESSIONS.filter(session=>session.topicId===this.topic()?.id));
  readonly studySession=computed(()=>this.sessions().find(session=>session.lessonIds.includes(this.lesson()?.id??''))??null);
  readonly sessionLessons=computed(()=>this.studySession()?.lessonIds.map(id=>GRAMMAR_LESSONS.find(l=>l.topicId===this.topic()?.id&&l.id===id)!)??[]);
  readonly sessionPosition=computed(()=>(this.studySession()?.lessonIds.indexOf(this.lesson()?.id??'')??-1)+1);
  readonly sessionCards=computed(()=>this.sessions().map(session=>({session,first:this.topic()!.lessons.find(l=>l.path?.endsWith('/'+session.lessonIds[0]))!,lessons:session.lessonIds.map(id=>GRAMMAR_LESSONS.find(l=>l.topicId===session.topicId&&l.id===id)!)})));
  readonly practice=computed(()=>this.route.snapshot.routeConfig?.path?.endsWith('/practice')?GRAMMAR_PRACTICES.find(practice=>practice.topicId===this.topic()?.id)??null:null);
  readonly invalid=computed(()=>!!this.params().get('topicId')&&(!this.topic()||!!this.params().get('lessonId')&&!this.lesson()||this.route.snapshot.routeConfig?.path?.endsWith('/practice')&&!this.practice()));
  readonly mobileOpen=signal(false);readonly collapsed=signal(false);
  private readonly sidebar=viewChild<ElementRef<HTMLElement>>('sidebar');
  private readonly menuTrigger=viewChild<ElementRef<HTMLButtonElement>>('menuTrigger');
  private readonly restoreFocus=signal(false);
  private readonly exerciseComponent=viewChild(GrammarExerciseComponent);
  private readonly focusNextExercise=signal(false);
  readonly rows=[this.topics.slice(0,3),this.topics.slice(3,6),this.topics.slice(6,9),this.topics.slice(9)];
  constructor(){effect(()=>{this.params();this.exerciseIndex.set(0);window.scrollTo({top:0});});
    afterRenderEffect(()=>{
      if(this.mobileOpen())this.menuItems()[0]?.focus();
      else if(this.restoreFocus()){this.menuTrigger()?.nativeElement.focus();this.restoreFocus.set(false);}
    });
    afterRenderEffect(()=>{if(this.focusNextExercise()){this.exerciseComponent()?.focusAnswer();this.focusNextExercise.set(false);}});
  }
  toggleMenu():void{
    if(window.innerWidth>900){this.collapsed.update(value=>!value);return;}
    if(this.mobileOpen())this.closeMenu();else{this.collapsed.set(false);this.mobileOpen.set(true);}
  }
  closeMenu():void{if(this.mobileOpen()){this.restoreFocus.set(true);this.mobileOpen.set(false);}}
  collapseMenu():void{if(this.mobileOpen())this.closeMenu();else this.collapsed.update(value=>!value);}
  private menuItems():HTMLElement[]{return Array.from(this.sidebar()?.nativeElement.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),[tabindex="0"]')??[]).filter(e=>!e.closest('[hidden]'));}
  menuKeydown(event:KeyboardEvent):void{
    if(!this.mobileOpen())return;
    if(event.key==='Escape'){event.preventDefault();this.closeMenu();return;}
    if(event.key!=='Tab')return;
    const items=this.menuItems(),first=items[0],last=items.at(-1),active=document.activeElement;
    if(!first)return;
    if(!this.sidebar()?.nativeElement.contains(active)||event.shiftKey&&active===first||!event.shiftKey&&active===last){event.preventDefault();(event.shiftKey?last:first)?.focus();}
  }
  menuFocus(event:FocusEvent):void{if(this.mobileOpen()&&event.target instanceof Node&&!this.sidebar()?.nativeElement.contains(event.target))this.menuItems()[0]?.focus();}
  navigate(path:string):void{void this.router.navigateByUrl(path);window.scrollTo({top:0});}
  continueExercise():void{
    if(this.exerciseIndex()+1<this.exercises().length){this.exerciseIndex.update(i=>i+1);this.focusNextExercise.set(true);}
    else if(this.lesson())this.navigate(this.lesson()!.nextPath);
  }
  showProgress():void{document.getElementById('grammar-progress')?.scrollIntoView({behavior:'smooth',block:'start'});}
}

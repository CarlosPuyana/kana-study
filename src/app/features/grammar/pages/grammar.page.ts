import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, ViewEncapsulation } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslationService } from '../../../core/services/translation.service';
import { GRAMMAR_LESSONS, GRAMMAR_PRACTICES, GRAMMAR_ROADMAP, GRAMMAR_TOPICS } from '../data/grammar-n5.generated';
import { GrammarSidebar } from '../components/grammar-sidebar';
import { GrammarExerciseComponent } from '../components/grammar-exercise';
import { GrammarPracticeComponent } from '../components/grammar-practice';

@Component({selector:'app-grammar-page',imports:[RouterLink,GrammarSidebar,GrammarExerciseComponent,GrammarPracticeComponent],templateUrl:'./grammar.page.html',styleUrls:['./grammar-roadmap.scss','./grammar-topic.scss','./grammar-lesson.scss','./grammar-practice.scss','./grammar.page.scss'],encapsulation:ViewEncapsulation.None,changeDetection:ChangeDetectionStrategy.OnPush,host:{'(document:keydown.escape)':'closeMenu()'}})
export class GrammarPage {
  readonly i18n=inject(TranslationService);private readonly route=inject(ActivatedRoute);private readonly router=inject(Router);
  private readonly params=toSignal(this.route.paramMap,{initialValue:this.route.snapshot.paramMap});
  readonly topics=GRAMMAR_TOPICS;readonly roadmap=GRAMMAR_ROADMAP;
  readonly topic=computed(()=>this.topics.find(topic=>topic.id===this.params().get('topicId'))??null);
  readonly lesson=computed(()=>GRAMMAR_LESSONS.find(lesson=>lesson.topicId===this.topic()?.id&&lesson.id===this.params().get('lessonId'))??null);
  readonly practice=computed(()=>this.route.snapshot.routeConfig?.path?.endsWith('/practice')?GRAMMAR_PRACTICES.find(practice=>practice.topicId===this.topic()?.id)??null:null);
  readonly invalid=computed(()=>!!this.params().get('topicId')&&(!this.topic()||!!this.params().get('lessonId')&&!this.lesson()||this.route.snapshot.routeConfig?.path?.endsWith('/practice')&&!this.practice()));
  readonly mobileOpen=signal(false);readonly collapsed=signal(false);
  readonly rows=[this.topics.slice(0,3),this.topics.slice(3,6),this.topics.slice(6,9),this.topics.slice(9)];
  constructor(){effect(()=>{this.params();window.scrollTo({top:0});});}
  toggleMenu():void{this.mobileOpen.update(open=>!open);this.collapsed.set(false);}
  closeMenu():void{this.mobileOpen.set(false);}
  collapseMenu():void{this.collapsed.update(value=>!value);this.mobileOpen.set(false);}
  navigate(path:string):void{void this.router.navigateByUrl(path);window.scrollTo({top:0});}
  showProgress():void{document.getElementById('grammar-progress')?.scrollIntoView({behavior:'smooth',block:'start'});}
}

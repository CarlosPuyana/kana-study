import {ChangeDetectionStrategy, Component, computed, effect, inject, OnDestroy, signal} from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {VOCABULARY_CATEGORIES, VocabularyStudyCategory} from '../../core/models/vocabulary.model';
import {JapaneseAudioService} from '../../core/services/japanese-audio.service';
import {ListeningMode, ListeningQuestion, VocabularyListeningSession} from '../../core/services/vocabulary-listening-session';
import {TranslationService} from '../../core/services/translation.service';
import {WeaknessService} from '../../core/services/weakness.service';
import {VOCABULARY_N5} from '../../data/vocabulary-n5.generated';

@Component({selector:'app-vocabulary-listening-page',imports:[RouterLink],templateUrl:'./vocabulary-listening.page.html',
  styleUrl:'./vocabulary-listening.page.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class VocabularyListeningPage implements OnDestroy {
  readonly i18n=inject(TranslationService);readonly audio=inject(JapaneseAudioService);
  private readonly weaknesses=inject(WeaknessService);private readonly route=inject(ActivatedRoute);
  readonly validEntries=VOCABULARY_N5.filter(e=>e.enabled&&this.audio.hasAudio(e.id));
  readonly categories=VOCABULARY_CATEGORIES.filter(c=>this.validEntries.some(e=>e.studyCategory===c));
  readonly selected=signal<readonly VocabularyStudyCategory[]>([...this.categories]);
  readonly mode=signal<ListeningMode>('meaning');readonly modes:readonly ListeningMode[]=['meaning','japanese','mixed'];
  readonly pool=computed(()=>this.validEntries.filter(e=>this.selected().includes(e.studyCategory)));
  readonly weakMode=this.route.snapshot.queryParamMap.get('weak')==='1';
  readonly session=signal<VocabularyListeningSession|null>(null);readonly question=signal<ListeningQuestion|null>(null);
  readonly chosen=signal<string|null>(null);readonly canAnswer=signal(false);readonly answered=signal(0);readonly total=signal(0);
  readonly skipped=signal(0);private token=0;
  constructor(){
    effect(()=>{if(this.audio.state()==='error'&&this.question()&&!this.chosen())this.skip();});
    if(this.weakMode)this.start();
  }
  toggle(category:VocabularyStudyCategory):void{this.selected.update(items=>items.includes(category)?items.filter(c=>c!==category):[...items,category]);}
  start():void {
    const pool=this.weakMode?this.weaknesses.items('vocabulary',this.validEntries,15,'listening'):this.pool();
    this.session.set(new VocabularyListeningSession(pool,this.validEntries,this.mode(),this.i18n.language(),Math.random,this.weakMode));
    this.skipped.set(0);this.refresh();
  }
  async replay():Promise<void> {
    const question=this.question();if(!question)return;
    const token=this.token;const result=await this.audio.play(question.entry.id);
    if(token!==this.token)return;
    if(result==='played')this.canAnswer.set(true);
    if(result==='error'&&!this.chosen())this.skip();
  }
  answer(optionId:string):void {
    if(!this.canAnswer()||this.audio.state()==='error'||this.chosen())return;
    const session=this.session(),question=this.question();if(!session||!question)return;
    const correct=session.answer(optionId);if(correct===null)return;
    this.chosen.set(optionId);this.answered.set(session.answered);this.total.set(session.total);
    // Commit only on Continue, after successful playback; late media errors never penalize.
  }
  next():void {
    const session=this.session(),question=this.question(),chosen=this.chosen();if(!session||!question||!chosen)return;
    if(this.audio.state()!=='error')this.weaknesses.record('vocabulary',question.entry.id,
      question.options.find(o=>o.id===chosen)!.correct,'listening');
    session.next();this.refresh();
  }
  configure():void{this.token++;this.audio.stop();this.session.set(null);this.question.set(null);this.chosen.set(null);this.canAnswer.set(false);}
  private skip():void {
    const session=this.session();if(!session||!this.question()||this.chosen())return;
    this.skipped.update(n=>n+1);session.skip();this.refresh();
  }
  private refresh():void {
    this.token++;this.audio.stop();const session=this.session()!;
    this.question.set(session.question);this.chosen.set(null);this.canAnswer.set(false);this.answered.set(session.answered);this.total.set(session.total);
    if(session.question)void this.replay();
  }
  ngOnDestroy():void{this.token++;this.audio.stop();}
}

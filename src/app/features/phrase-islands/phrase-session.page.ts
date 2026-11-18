import { afterNextRender, ElementRef, Injector, ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PhraseAudioService } from '../../core/services/phrase-audio.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { TranslationService } from '../../core/services/translation.service';
import { PHRASE_ISLANDS_CATALOG } from '../../data/phrase-islands/phrase-islands-catalog';
import { CatalogPhrase } from '../../core/models/phrase-island.model';
import { FuriganaText } from '../../shared/components/furigana-text/furigana-text';
import { PhraseRecallSession } from '../../core/services/phrase-recall-session';
import { RecallSwipe } from './recall-swipe';
import { PhraseRecallSummary } from '../../shared/components/phrase-recall-summary/phrase-recall-summary';
import * as copy from '../../../assets/i18n/phrase-islands.generated';

@Component({selector:'app-phrase-session', imports:[RouterLink,FuriganaText,RecallSwipe,PhraseRecallSummary], providers:[PhraseAudioService,PhraseRecallSession],
 host: {'(document:keydown)': 'recallKey($event)'},
 templateUrl:'./phrase-session.page.html',styleUrl:'./phrase-session.page.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class PhraseSessionPage {
 readonly recall=inject(PhraseRecallSession);
 private readonly element=inject<ElementRef<HTMLElement>>(ElementRef);
 private readonly injector=inject(Injector);
 readonly recallStatus=computed(()=>this.recall.round().answers[this.current()?.id]?.known);
 readonly canEvaluate=computed(()=>this.mode==='recall'&&this.revealed()&&!this.finished()&&!this.recall.complete()&&!!this.current()&&this.recallStatus()===undefined);
 readonly i18n=inject(TranslationService);
 readonly audio=inject(PhraseAudioService);
 private readonly route=inject(ActivatedRoute);
 private readonly workspace=inject(WorkspaceService);
 readonly mode=this.route.snapshot.data['mode'] as 'listen'|'shadowing'|'recall';
 readonly phrases=signal<readonly CatalogPhrase[]>([]);
 readonly index=signal(0);
 readonly current=computed(()=>this.phrases()[this.index()]);
 readonly query=signal<{topics:string}>({topics:''});
 readonly revealed=signal(false);
 readonly meaning=signal(false);
 readonly finished=signal(false);
 readonly running=signal(false);
 readonly paused=signal(false);
 readonly waiting=signal(false);
 readonly speed=signal(1);
 readonly repeats=signal(1);
 readonly gap=signal(1);
 readonly shadowGap=signal(3);
 private repetition=0;
 private timer?: ReturnType<typeof setTimeout>;
 private deadline=0;
 private remaining=0;
 private afterWait?:()=>void;
 private epoch=0;
 constructor(){
  this.i18n.useStudyCopy(copy);
  this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params=>{
   this.stop(); this.index.set(0); this.revealed.set(false); this.finished.set(false);
   const topics=new Set((params.get('topics')??'').split(','));
   const phrases=PHRASE_ISLANDS_CATALOG.filter(p=>topics.has(p.topicId));
   this.phrases.set(phrases);this.recall.initialize(this.mode==='recall'?phrases.map(p=>p.id):[]);this.query.set({topics:[...new Set(phrases.map(p=>p.topicId))].join(',')});
  });
  const workspace=this.workspace.activationRevision();
  effect(()=>{if(this.workspace.activationRevision()!==workspace){this.stop();this.phrases.set([]);this.recall.initialize([]);this.finished.set(false);this.revealed.set(false);}});
  effect(()=>{if(['error','blocked'].includes(this.audio.state())){this.cancelWait();this.running.set(false);this.paused.set(false);}});
  inject(DestroyRef).onDestroy(()=>{this.stop();this.recall.initialize([]);});
 }
 text(field:'natural'|'structural'|'explanation'):string {const p=this.current();return p?this.i18n.t('phraseIslands.content.'+p.id+'.'+field):'';}
 t(key:string):string{return this.i18n.t('phraseIslands.session.'+key);}
 setSpeed(value:string):void{this.speed.set(Number(value));this.audio.setRate(this.speed());}
 private cancelWait():void{clearTimeout(this.timer);this.timer=undefined;this.waiting.set(false);this.afterWait=undefined;}
 stop():void{this.epoch++;this.cancelWait();this.audio.stop();this.running.set(false);this.paused.set(false);this.repetition=0;}
 start():void{
  if(!this.current()||this.finished()||(this.mode==='recall'&&!this.revealed()))return;
  this.stop();this.running.set(true);this.play();
 }
 private play():void{
  const phrase=this.current();if(!phrase)return;
  const epoch=this.epoch;
  void this.audio.play(phrase,{rate:this.speed(),ended:()=>{
   if(epoch!==this.epoch||!this.running())return;
   if(this.mode==='listen'){
    this.repetition++;
    if(this.repetition>=this.repeats()&&this.index()===this.phrases().length-1){this.finish();return;}
    this.wait(this.gap()*1000,()=>{
     if(this.repetition>=this.repeats()){this.repetition=0;this.index.update(n=>n+1);}
     this.play();
    });
   }else if(this.mode==='shadowing')this.wait(this.shadowGap()*1000,()=>{this.running.set(false);});
   else this.running.set(false);
  }}).then(()=>{if(epoch===this.epoch&&['blocked','error'].includes(this.audio.state()))this.running.set(false);});
 }
 private wait(ms:number,callback:()=>void):void{
  this.remaining=ms;this.afterWait=callback;this.waiting.set(true);this.schedule();
 }
 private schedule():void{
  this.deadline=Date.now()+this.remaining;const epoch=this.epoch;
  this.timer=setTimeout(()=>{if(epoch!==this.epoch)return;const callback=this.afterWait;this.cancelWait();callback?.();},this.remaining);
 }
 pause():void{
  if(!this.running()||this.paused())return;
  this.paused.set(true);
  if(this.waiting()){clearTimeout(this.timer);this.remaining=Math.max(0,this.deadline-Date.now());}
  else this.audio.pause();
 }
 resume():void{
  if(!this.paused())return;this.paused.set(false);
  if(this.waiting())this.schedule();else void this.audio.resume().then(()=>{if(['error','blocked'].includes(this.audio.state()))this.running.set(false);});
 }
 move(delta:number):void{
  const next=this.index()+delta;if(next<0||next>=this.phrases().length)return;
  this.stop();this.index.set(next);this.revealed.set(false);
 }
 finish():void{this.stop();this.finished.set(true);this.revealed.set(false);if(this.mode==='recall')this.recall.initialize([]);}
 private focusControl(selector:string):void {
  afterNextRender(()=>this.element.nativeElement.querySelector<HTMLElement>(selector)?.focus({preventScroll:true}),{injector:this.injector});
 }
 evaluate(known:boolean):void {
  if(!this.canEvaluate())return;
  const id=this.current().id;
  if(!this.recall.answer(id,known))return;
  this.stop();this.revealed.set(false);
  if(this.recall.complete()){this.focusControl('.round-summary h2');return;}
  const ids=this.phrases().map(p=>p.id), start=this.index();
  const next=ids.map((_,n)=>(start+n+1)%ids.length).find(n=>!this.recall.round().answers[ids[n]]);
  this.index.set(next!);this.focusControl('.reveal');
 }
 recallKey(event:KeyboardEvent):void {
  if(event.repeat||event.defaultPrevented||event.isComposing||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||!this.canEvaluate())return;
  if(event.target instanceof Element&&event.target.closest('input,select,textarea,summary,audio,video,[contenteditable]:not([contenteditable="false"]),[role="slider"],[role="combobox"],[role="listbox"],[role="menu"],[role="tablist"]'))return;
  if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
  event.preventDefault();this.evaluate(event.key==='ArrowRight');
 }
 undoEvaluation():void {
  const last=this.recall.undo();if(!last)return;
  this.stop();this.restoreRound();this.index.set(this.phrases().findIndex(p=>p.id===last.phraseId));this.revealed.set(true);this.focusControl('.grade-unknown');
 }
 repeatFailed():void {
  if(!this.recall.repeatFailures())return;
  this.stop();this.restoreRound();this.index.set(0);this.revealed.set(false);this.focusControl('.reveal');
 }
 private restoreRound():void {
  const catalog=new Map(PHRASE_ISLANDS_CATALOG.map(p=>[p.id,p]));
  this.phrases.set(this.recall.round().ids.map(id=>catalog.get(id)!));
 }
}

import { computed, DestroyRef, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { State } from 'ts-fsrs';
import { DailyStudyDuration, DailyStudySnapshot, DailyUnitSnapshot, DailyWeaknessSnapshot } from '../models/daily-study.model';
import { ProgressService } from './progress.service';
import { KanjiProgressService } from './kanji-progress.service';
import { VocabularyProgressService } from './vocabulary-progress.service';
import { DailyLearningService, getSpainDayKey } from './daily-learning.service';
import { SessionHistoryService } from './session-history.service';
import { GrammarProgressService } from './grammar-progress.service';
import { GrammarV2ProgressService } from './grammar-v2-progress.service';
import { WeaknessService } from './weakness.service';
import { JapaneseAudioService } from './japanese-audio.service';
import { DeckStudyService } from './deck-study.service';
import { DeckDatabaseService } from './deck-database.service';
import { DeckSettingsService } from './deck-settings.service';
import { MangaFsrsService } from './manga-fsrs.service';
import { MangaReviewHistoryService } from './manga-review-history.service';
import { MangaStudySavedRepository } from './manga-study-saved.repository';
import { isMangaFsrsEvent } from '../models/manga-fsrs.model';
import { WorkspaceService } from './workspace.service';
import { StorageService } from './storage.service';
import { SyncService } from './sync.service';
import { STUDY_DECKS } from '../../data/study-decks';
import { JAPANESE_1500_INDEX } from '../../data/japanese-1500.index.generated';
import { GRAMMAR_V2_CONCEPTS } from '../../data/grammar/grammar-n5-v2.generated';
import { GRAMMAR_LESSONS } from '../../features/grammar/data/grammar-catalog';
import { grammarFocusedExercises } from '../../features/grammar/services/grammar-weakness';
import { isStudyToday, nextSpainDayBoundary, planDailyStudy } from './daily-study-planner';

/** Page-scoped reader: no writes, no session initialization, no sync requests. */
@Injectable()
export class DailyStudyPlannerService {
  private readonly workspace=inject(WorkspaceService);
  private readonly storage=inject(StorageService);
  private readonly sync=inject(SyncService);
  private readonly kana=inject(ProgressService);
  private readonly kanji=inject(KanjiProgressService);
  private readonly vocabulary=inject(VocabularyProgressService);
  private readonly daily=inject(DailyLearningService);
  private readonly history=inject(SessionHistoryService);
  private readonly grammar=inject(GrammarProgressService);
  private readonly grammarV2=inject(GrammarV2ProgressService);
  private readonly weaknesses=inject(WeaknessService);
  private readonly audio=inject(JapaneseAudioService);
  private readonly deckStudy=inject(DeckStudyService);
  private readonly deckDb=inject(DeckDatabaseService);
  private readonly deckSettings=inject(DeckSettingsService);
  private readonly manga=inject(MangaFsrsService);
  private readonly mangaHistory=inject(MangaReviewHistoryService);
  private readonly saved=inject(MangaStudySavedRepository);
  readonly now=signal(Date.now());
  readonly duration=signal<DailyStudyDuration>(15);
  readonly offline=signal(!navigator.onLine);
  private readonly deckState=signal<{owner:string;rows:DailyStudySnapshot['decks'];loading:boolean;error:boolean}|null>(null);
  private generation=0;
  readonly loading=computed(()=>this.deckState()?.owner!==this.workspace.active()||!!this.deckState()?.loading||this.saved.loading());
  readonly error=computed(()=>this.deckState()?.owner===this.workspace.active()&&!!this.deckState()?.error||this.saved.failed());
  readonly snapshot=computed<DailyStudySnapshot>(()=>{
    const now=this.now(),day=getSpainDayKey(new Date(now)),workspace=this.workspace.active();
    if(this.deckState()?.owner!==workspace)return {workspace,now,day,normal:[],grammar:[],grammarContinuePath:null,weaknesses:[],decks:[],sessions:[],manga:{enabled:false,due:0,fresh:0,nextDue:null,eventsToday:0,completedSessionIds:[]}};
    const units=<T extends {key:string;questionType:string}>(items:readonly T[],progress:Readonly<Record<string,{fsrs:{due:string}}>>,itemId:(item:T)=>string):DailyUnitSnapshot[]=>items.map(item=>({key:item.key,itemId:itemId(item),questionType:item.questionType,due:progress[item.key]?Date.parse(progress[item.key].fsrs.due):null}));
    const kana=units(this.kana.activeUnits(),this.kana.allProgress(),u=>u.kanaId);
    const kanji=units(this.kanji.activeUnits(),this.kanji.allProgress(),u=>u.kanjiId);
    const vocabulary=units(this.vocabulary.activeUnits(),this.vocabulary.allProgress(),u=>u.entryId);
    const active={kana,kanji,vocabulary},weak:DailyWeaknessSnapshot[]=[];
    for(const record of this.weaknesses.records()){
      if(record.module==='grammar'){
        if(record.activity==='learn'&&grammarFocusedExercises([{...record,score:Math.max(3,record.score)}]).some(e=>e.exerciseType===record.questionType||e.kind===record.questionType))weak.push({record,titleKey:'grammar.title',path:'/grammar/review?weak=1'});
        continue;
      }
      const eligible=active[record.module].some(u=>u.itemId===record.itemId&&(record.activity!=='learn'||u.questionType===record.questionType));
      if(!eligible||record.activity==='listening'&&(record.module!=='vocabulary'||!this.audio.hasAudio(record.itemId)))continue;
      if(record.activity==='learn')weak.push({record,titleKey:`daily.module.${record.module}`,path:'/weaknesses'});
      else weak.push({record,titleKey:`daily.module.${record.module}`,path:(record.module==='kana'?'/writing':`/${record.module}/${record.activity}`)+'?weak=1'});
    }
    const state=this.grammarV2.state();
    const grammar=GRAMMAR_V2_CONCEPTS.filter(c=>Number(c.topicId)>=1&&Number(c.topicId)<=10&&GRAMMAR_LESSONS.some(l=>l.topicId===c.topicId&&l.id===c.id)).map(c=>{
      const row=state.concepts[c.id];
      return {id:c.id,titleKey:c.titleKey,path:row?.status==='completed'&&state.review[c.id]?.active?'/grammar/review':`/grammar/n5/${c.topicId}/${c.id}`,completed:row?.status==='completed',completedAt:row?.completedAt,
        answersToday:Object.values(row?.answers??{}).filter(a=>isStudyToday(a.answeredAt,now,day)).length,difficult:state.review[c.id]?.active===true,optional:c.track==='bridge'};
    });
    const cards=this.manga.cards(),events=this.mangaHistory.events().filter(isMangaFsrsEvent);
    const future=cards.filter(c=>c.card.state!==State.New&&c.card.due>now).map(c=>c.card.due);
    return {workspace,now,day,normal:[{module:'kana',units:kana,completedToday:this.daily.isCompletedToday('kana')},{module:'kanji',units:kanji,completedToday:this.daily.isCompletedToday('kanji')},{module:'vocabulary',units:vocabulary,completedToday:this.daily.isCompletedToday('vocabulary')}],
      grammar,grammarContinuePath:this.grammar.continuePath(),weaknesses:weak,
      decks:this.deckState()?.owner===workspace?this.deckState()!.rows:[],sessions:this.history.sessions(),
      manga:{enabled:this.manga.enabled(),due:cards.filter(c=>c.card.state!==State.New&&c.card.due<=now).length,fresh:cards.filter(c=>c.card.state===State.New).length,nextDue:future.length?Math.min(...future):null,
        eventsToday:events.filter(e=>isStudyToday(e.reviewedAt,now,day)).length,completedSessionIds:[...new Set(events.map(e=>e.sessionId))]}};
  });
  readonly plan=computed(()=>planDailyStudy(this.snapshot(),this.duration()));
  constructor(){
    const destroy=inject(DestroyRef);
    const refresh=()=>{this.daily.refresh();this.now.set(Date.now());this.offline.set(!navigator.onLine);};
    const focus=()=>{refresh();};
    const visibility=()=>{if(!document.hidden)focus();};
    window.addEventListener('focus',focus);document.addEventListener('visibilitychange',visibility);
    window.addEventListener('online',refresh);window.addEventListener('offline',refresh);
    destroy.onDestroy(()=>{this.generation++;window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('online',refresh);window.removeEventListener('offline',refresh);});
    effect(()=>{this.workspace.active();this.workspace.dataRevision();this.storage.cloudRevision();this.sync.lastSyncedAt();this.deckSettings.all();this.now();untracked(()=>{void this.refreshDecks();});});
    effect(onCleanup=>{
      const snapshot=this.snapshot();
      const dates=[...snapshot.normal.flatMap(n=>n.units.flatMap(u=>u.due!==null&&u.due>snapshot.now?[u.due]:[])),...snapshot.decks.flatMap(d=>d.nextDue!==null&&d.nextDue>snapshot.now?[d.nextDue]:[]),...(snapshot.manga.nextDue!==null?[snapshot.manga.nextDue]:[])];
      const next=Math.min(nextSpainDayBoundary(snapshot.now),...dates);
      const timer=window.setTimeout(refresh,Math.max(1,next-Date.now()));onCleanup(()=>window.clearTimeout(timer));
    });
  }
  async refreshDecks():Promise<void>{
    const owner=this.workspace.active(),generation=++this.generation,now=new Date(this.now());
    this.deckState.set({owner,rows:[],loading:true,error:false});
    try{
      const rows=await Promise.all(STUDY_DECKS.map(async deck=>{
        const [queue,events]=await Promise.all([this.deckStudy.snapshot(deck,deck.id==='japanese-1500'?JAPANESE_1500_INDEX:[],now),this.deckDb.getDeckReviewEvents(deck.id)]);
        return {id:deck.id,titleKey:deck.nameKey,due:queue.learningDue+queue.reviewDue,fresh:queue.newAvailable,completedToday:queue.completedToday===true,nextDue:queue.nextDue,reviewsToday:events.filter(e=>Number.isFinite(e.reviewedAt)&&e.reviewedAt<=now.getTime()&&getSpainDayKey(new Date(e.reviewedAt))===getSpainDayKey(now)).length};
      }));
      if(this.workspace.active()===owner&&generation===this.generation)this.deckState.set({owner,rows,loading:false,error:false});
    }catch{if(this.workspace.active()===owner&&generation===this.generation)this.deckState.set({owner,rows:[],loading:false,error:true});}
  }
  async retry():Promise<void>{await Promise.allSettled([this.refreshDecks(),this.saved.reload()]);}
}

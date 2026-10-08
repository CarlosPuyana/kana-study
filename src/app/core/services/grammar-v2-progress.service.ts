import {computed, effect, inject, Injectable, signal, untracked} from '@angular/core';
import {GRAMMAR_PROGRESS_V2_KEY, GrammarV2ConceptProgress, GrammarIntegrationProgress} from '../models/grammar-v2.model';
import {GrammarDifficulty, GrammarPracticeProgress, GrammarResume} from '../models/grammar-progress.model';
import {GRAMMAR_V2_CONCEPTS, GRAMMAR_V2_REVIEW, GRAMMAR_V2_INTEGRATION} from '../../data/grammar/grammar-n5-v2.generated';
import {StorageService} from './storage.service';
import {WorkspaceService} from './workspace.service';

export interface ProgressV2 {
  version: 2; concepts: Record<string, GrammarV2ConceptProgress>;
  practices: Record<string, GrammarPracticeProgress>; review: Record<string, GrammarDifficulty>; resume?: GrammarResume;
  integration?: GrammarIntegrationProgress;
}
const empty=():ProgressV2=>({version:2,concepts:{},practices:{},review:{}});
const catalog=new Map(GRAMMAR_V2_CONCEPTS.map(c=>[c.id,c]));
const allExercises=[...GRAMMAR_V2_CONCEPTS.flatMap(c=>c.exercises),...GRAMMAR_V2_REVIEW,...GRAMMAR_V2_INTEGRATION.flatMap(s=>s.exercises)];
const object=(v:unknown):Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
const count=(v:unknown)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0?v:0;
const date=(v:unknown):string|undefined=>typeof v==='string'&&Number.isFinite(Date.parse(v))?v:undefined;

/** Semantic progress and separate integration activities. Never imports V1 records. */
@Injectable({providedIn:'root'})
export class GrammarV2ProgressService {
  private readonly storage=inject(StorageService);
  private readonly workspace=inject(WorkspaceService);
  private readonly saved=signal(this.read(this.storage.get<unknown>(GRAMMAR_PROGRESS_V2_KEY,null)));
  readonly state=this.saved.asReadonly();
  readonly started=computed(()=>Object.keys(this.state().concepts).length>0);
  readonly integrationCompleted=computed(()=>!!this.state().integration?.openedAt&&GRAMMAR_V2_INTEGRATION.filter(s=>s.track==='core').every(s=>this.integrationStatus(s.id)==='completed'));
  readonly coreCompleted=computed(()=>GRAMMAR_V2_CONCEPTS.filter(c=>c.track==='core').every(c=>this.state().concepts[c.id]?.status==='completed')&&this.integrationCompleted());
  constructor(){effect(()=>{this.workspace.active();this.workspace.dataRevision();this.storage.cloudRevision();untracked(()=>this.saved.set(this.read(this.storage.get<unknown>(GRAMMAR_PROGRESS_V2_KEY,null))));});}
  has(id:string):boolean{return catalog.has(id);}
  integrationStatus(id:string):'not-started'|'in-progress'|'completed' {
    if(id==='00')return this.state().integration?.openedAt?'completed':'not-started';
    const section=GRAMMAR_V2_INTEGRATION.find(s=>s.id===id),row=this.state().integration?.activities[id];
    if(!section||!row)return 'not-started';
    return section.exercises.every(e=>row.answers[e.id]?.solved)?'completed':'in-progress';
  }
  integrationContinuePath():string {
    const id=!this.state().integration?.openedAt?'00':GRAMMAR_V2_INTEGRATION.find(s=>s.track==='core'&&this.integrationStatus(s.id)!=='completed')?.id;
    return id?`/grammar/n5/11/${id}`:'/grammar/review';
  }
  openIntegration(id:string):void {
    if(id!=='00'&&!GRAMMAR_V2_INTEGRATION.some(s=>s.id===id))return;
    const now=new Date().toISOString(),integration=this.state().integration??{activities:{}};
    this.write({...this.state(),integration:{...integration,resumeActivityId:id,...(id==='00'?{openedAt:integration.openedAt??now}:{activities:{...integration.activities,[id]:integration.activities[id]??{openedAt:now,updatedAt:now,answers:{}}}})}});
  }
  recordIntegration(activityId:string,exerciseId:string,correct:boolean):void {
    const section=GRAMMAR_V2_INTEGRATION.find(s=>s.id===activityId),e=section?.exercises.find(e=>e.id===exerciseId);if(!e)return;
    const now=new Date().toISOString(),integration=this.state().integration??{activities:{}},row=integration.activities[activityId]??{openedAt:now,updatedAt:now,answers:{}},old=row.answers[exerciseId];
    this.write({...this.state(),integration:{...integration,resumeActivityId:activityId,activities:{...integration.activities,[activityId]:{...row,updatedAt:now,answers:{...row.answers,[exerciseId]:{correct,solved:correct||!!old?.solved,attempts:(old?.attempts??0)+1,correctCount:(old?.correctCount??0)+Number(correct),answeredAt:now}}}}}});
    if(!correct)this.flag(e.conceptId!,e.id);
  }
  open(id:string):void {
    const concept=catalog.get(id);if(!concept)return;
    const now=new Date().toISOString(),old=this.state().concepts[id];
    const row:GrammarV2ConceptProgress=old?{...old,openedAt:old.openedAt??now,updatedAt:now}:{conceptId:id,topicId:concept.topicId,status:'in-progress',attempts:0,correct:0,answers:{},startedAt:now,openedAt:now,updatedAt:now,lastExerciseIndex:0};
    this.setConcept(row);this.resume(id);
  }
  firstPending(id:string):number{const answers=this.state().concepts[id]?.answers;const i=catalog.get(id)?.exercises.findIndex(e=>!answers?.[e.id]?.solved)??0;return Math.max(0,i);}
  resume(id:string):void {if(!catalog.has(id))return;this.write({...this.state(),resume:{conceptId:id,path:`/grammar/n5/${catalog.get(id)!.topicId}/${id}`,exerciseIndex:this.firstPending(id),updatedAt:new Date().toISOString()}});}
  record(id:string,exerciseId:string,index:number,correct:boolean):void {
    const concept=catalog.get(id);if(!concept||concept.exercises[index]?.id!==exerciseId)return;
    const now=new Date().toISOString(),old=this.state().concepts[id];
    const previous=old?.answers[exerciseId];
    const row:GrammarV2ConceptProgress={conceptId:id,topicId:concept.topicId,status:'in-progress',startedAt:old?.startedAt??now,openedAt:old?.openedAt,updatedAt:now,
      attempts:(old?.attempts??0)+1,correct:(old?.correct??0)+Number(correct),lastExerciseIndex:index,
      answers:{...old?.answers,[exerciseId]:{correct,solved:correct||!!previous?.solved,attempts:(previous?.attempts??0)+1,correctCount:(previous?.correctCount??0)+Number(correct),answeredAt:now}},
      ...(old?.completedAt?{completedAt:old.completedAt}:{})};
    this.setConcept(row);this.resume(id);if(!correct)this.flag(id,exerciseId);
  }
  flag(id:string,exerciseId:string):void {
    if(!allExercises.some(e=>e.conceptId===id&&e.id===exerciseId))return;
    const now=new Date().toISOString();this.write({...this.state(),review:{...this.state().review,[id]:{conceptId:id,topicId:catalog.get(id)!.topicId,active:true,updatedAt:now,flaggedAt:now,lastFailedExerciseId:exerciseId}}});
  }
  finishReview(answers:readonly {conceptId:string;exerciseId:string;correct:boolean}[]):void {
    const review={...this.state().review},now=new Date().toISOString();
    for(const id of new Set(answers.map(a=>a.conceptId))){
      const valid=answers.filter(a=>a.conceptId===id&&allExercises.some(e=>e.id===a.exerciseId&&e.conceptId===id));if(!valid.length)continue;
      const failed=valid.find(a=>!a.correct);
      if(failed)review[id]={conceptId:id,topicId:catalog.get(id)!.topicId,active:true,updatedAt:now,flaggedAt:now,lastFailedExerciseId:failed.exerciseId};
      else if(review[id])review[id]={...review[id],active:false,updatedAt:now,clearedAt:now};
    }
    this.write({...this.state(),review});
  }
  practice(score:number,total:number,ids:readonly string[],attemptedAt:string,topicId='01'):void {
    const exercises=GRAMMAR_V2_REVIEW.filter(e=>e.topicId===topicId);
    if(!Number.isInteger(score)||!Number.isInteger(total)||total<1||total>exercises.length||score<0||score>total||!date(attemptedAt))return;
    this.write({...this.state(),practices:{...this.state().practices,[topicId]:{topicId,score,total,errorConceptIds:[...new Set(ids.filter(id=>catalog.get(id)?.topicId===topicId))],attemptedAt,updatedAt:new Date().toISOString()}}});
  }
  private setConcept(row:GrammarV2ConceptProgress):void {
    const completed=!!row.openedAt&&catalog.get(row.conceptId)!.exercises.every(e=>row.answers[e.id]?.solved);
    const {completedAt,...rest}=row;
    this.write({...this.state(),concepts:{...this.state().concepts,[row.conceptId]:{...rest,status:completed?'completed':'in-progress',...(completed?{completedAt:completedAt??row.updatedAt}:{})}}});
  }
  private write(state:ProgressV2):void{this.saved.set(state);this.storage.set(GRAMMAR_PROGRESS_V2_KEY,state);}
  private read(raw:unknown):ProgressV2 {
    const input=object(raw),state=empty();if(input['version']!==2)return state;
    for(const [id,value] of Object.entries(object(input['concepts']))){
      const concept=catalog.get(id),row=object(value),startedAt=date(row['startedAt']),updatedAt=date(row['updatedAt']);
      if(!concept||row['conceptId']!==id||row['topicId']!==concept.topicId||!startedAt||!updatedAt)continue;
      const answers:GrammarV2ConceptProgress['answers']={};
      for(const e of concept.exercises){const a=object(object(row['answers'])[e.id]),answeredAt=date(a['answeredAt']);
        if(typeof a['correct']==='boolean'&&answeredAt&&count(a['attempts'])>0){
          const attempts=count(a['attempts']),correctCount=Math.min(attempts,count(a['correctCount']));
          answers[e.id]={correct:a['correct'],solved:correctCount>0,attempts,correctCount,answeredAt};
        }
      }
      const openedAt=date(row['openedAt']),completed=!!openedAt&&concept.exercises.every(e=>answers[e.id]?.solved);
      state.concepts[id]={conceptId:id,topicId:concept.topicId,status:completed?'completed':'in-progress',startedAt,updatedAt,...(openedAt?{openedAt}:{}),
        answers,attempts:Object.values(answers).reduce((n,a)=>n+a.attempts,0),correct:Object.values(answers).reduce((n,a)=>n+a.correctCount,0),lastExerciseIndex:Math.min(count(row['lastExerciseIndex']),concept.exercises.length-1),...(completed?{completedAt:date(row['completedAt'])??updatedAt}:{})};
    }
    for(const [id,value] of Object.entries(object(input['review']))){const row=object(value),updatedAt=date(row['updatedAt']);
      if(catalog.has(id)&&row['conceptId']===id&&row['topicId']===catalog.get(id)!.topicId&&typeof row['active']==='boolean'&&updatedAt)state.review[id]={conceptId:id,topicId:catalog.get(id)!.topicId,active:row['active'],updatedAt,
        ...(date(row['flaggedAt'])?{flaggedAt:date(row['flaggedAt'])}:{}),...(date(row['clearedAt'])?{clearedAt:date(row['clearedAt'])}:{}),
        ...(allExercises.some(e=>e.conceptId===id&&e.id===row['lastFailedExerciseId'])?{lastFailedExerciseId:row['lastFailedExerciseId'] as string}:{})};
    }
    for(const topicId of new Set(GRAMMAR_V2_CONCEPTS.map(c=>c.topicId))){
      const practice=object(object(input['practices'])[topicId]);
      if(practice['topicId']===topicId&&date(practice['attemptedAt'])&&date(practice['updatedAt'])&&count(practice['total'])>0&&count(practice['total'])<=GRAMMAR_V2_REVIEW.filter(e=>e.topicId===topicId).length&&typeof practice['score']==='number'&&practice['score']===count(practice['score'])&&count(practice['score'])<=count(practice['total']))
        state.practices[topicId]={topicId,score:count(practice['score']),total:count(practice['total']),attemptedAt:practice['attemptedAt'] as string,updatedAt:practice['updatedAt'] as string,errorConceptIds:Array.isArray(practice['errorConceptIds'])?practice['errorConceptIds'].filter((id):id is string=>typeof id==='string'&&catalog.get(id)?.topicId===topicId):[]};
    }
    const resume=object(input['resume']);if(typeof resume['conceptId']==='string'&&catalog.has(resume['conceptId'])&&date(resume['updatedAt']))state.resume={conceptId:resume['conceptId'],path:`/grammar/n5/${catalog.get(resume['conceptId'])!.topicId}/${resume['conceptId']}`,exerciseIndex:count(resume['exerciseIndex']),updatedAt:resume['updatedAt'] as string};
    const integration=object(input['integration']);
    if(Object.keys(integration).length){
      const openedAt=date(integration['openedAt']);state.integration={activities:{},...(openedAt?{openedAt}:{})};
      for(const section of GRAMMAR_V2_INTEGRATION){
        const row=object(object(integration['activities'])[section.id]),openedAt=date(row['openedAt']),updatedAt=date(row['updatedAt']);if(!openedAt||!updatedAt)continue;
        const answers:GrammarV2ConceptProgress['answers']={};
        for(const e of section.exercises){const a=object(object(row['answers'])[e.id]),answeredAt=date(a['answeredAt']),attempts=count(a['attempts']);if(typeof a['correct']!=='boolean'||!answeredAt||!attempts)continue;
          const correctCount=Math.min(attempts,count(a['correctCount']));answers[e.id]={correct:a['correct'],solved:correctCount>0,attempts,correctCount,answeredAt};}
        state.integration.activities[section.id]={openedAt,updatedAt,answers};
      }
      const id=integration['resumeActivityId'];if(typeof id==='string'&&(id==='00'||GRAMMAR_V2_INTEGRATION.some(s=>s.id===id)))state.integration.resumeActivityId=id;
    }
    return state;
  }
}

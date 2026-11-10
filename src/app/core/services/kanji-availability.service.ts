import {computed,DestroyRef,effect,EffectRef,inject,Injectable,Injector,signal,untracked} from '@angular/core';
import {KanjiProgressService} from './kanji-progress.service';
import {DailyLearningService,getSpainDayKey} from './daily-learning.service';
import {madridMidnight,shiftDay} from './attempt-analytics';
import {WorkspaceService} from './workspace.service';

export type KanjiAvailabilityStatus='empty'|'completedDue'|'completed'|'due'|'fresh'|'waiting';
/** Feature-lazy clock. Consumers share one deadline; no polling or background work without a view. */
@Injectable({providedIn:'root'})
export class KanjiAvailabilityService {
  private readonly progress=inject(KanjiProgressService);
  private readonly daily=inject(DailyLearningService);
  private readonly workspace=inject(WorkspaceService);
  private readonly injector=inject(Injector);
  private readonly time=signal(Date.now());
  private consumers=0;
  private timer:ReturnType<typeof setTimeout>|undefined;
  private watching:EffectRef|undefined;
  readonly state=computed(()=>{
    const now=this.time(),units=this.progress.activeUnits(),progress=this.progress.allProgress();
    let due=0,fresh=0,nextDue:number|null=null;
    for(const unit of units){const p=progress[unit.key];if(!p){fresh++;continue;}
      const at=Date.parse(p.fsrs.due);if(at<=now)due++;else if(Number.isFinite(at))nextDue=nextDue===null?at:Math.min(nextDue,at);
    }
    const blocked=this.daily.isCompletedToday('kanji');
    const status:KanjiAvailabilityStatus=blocked?(due?'completedDue':'completed'):!units.length?'empty':due?'due':fresh?'fresh':'waiting';
    return {status,total:units.length,due,fresh,nextDue,blocked,canStart:!blocked&&due+fresh>0};
  });
  constructor(){inject(DestroyRef).onDestroy(()=>this.stop());}
  watch(destroy:DestroyRef):void {
    if(this.consumers++===0){
      window.addEventListener('focus',this.refresh);window.addEventListener('pageshow',this.refresh);
      window.addEventListener('pagehide',this.pause);document.addEventListener('visibilitychange',this.refresh);
      this.watching=effect(()=>{this.progress.activeUnits();this.progress.allProgress();this.workspace.activationRevision();untracked(this.refresh);},{injector:this.injector,manualCleanup:true});
    }
    this.refresh();let active=true;
    destroy.onDestroy(()=>{if(!active)return;active=false;this.consumers=Math.max(0,this.consumers-1);if(!this.consumers)this.stop();});
  }
  private readonly pause=()=>{if(this.timer!==undefined)clearTimeout(this.timer);this.timer=undefined;};
  private readonly refresh=()=>{
    if(!this.consumers)return;this.pause();const now=Date.now();
    this.time.set(now);this.progress.availabilityTime.set(now);this.daily.refresh(new Date(now));
    if(document.hidden)return;
    let next=madridMidnight(shiftDay(getSpainDayKey(new Date(now)),1));
    let deadline=Date.parse(next);
    const progress=this.progress.allProgress();
    for(const unit of this.progress.activeUnits()){const due=Date.parse(progress[unit.key]?.fsrs.due??'');if(due>now)deadline=Math.min(deadline,due);}
    this.timer=setTimeout(this.refresh,Math.max(1,deadline-now));
  };
  private stop():void {
    this.pause();this.watching?.destroy();this.watching=undefined;
    window.removeEventListener('focus',this.refresh);window.removeEventListener('pageshow',this.refresh);
    window.removeEventListener('pagehide',this.pause);document.removeEventListener('visibilitychange',this.refresh);
    this.progress.availabilityTime.set(null);
  }
}

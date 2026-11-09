import {computed,DestroyRef,inject,InjectionToken,signal} from '@angular/core';
import {CardStudyTimer,formatStudyTime} from './card-study-time';
import {WorkspaceService} from './workspace.service';

export const STUDY_MONOTONIC_NOW=new InjectionToken<()=>number>('STUDY_MONOTONIC_NOW',{providedIn:'root',factory:()=>()=>performance.now()});
export const STUDY_WALL_NOW=new InjectionToken<()=>number>('STUDY_WALL_NOW',{providedIn:'root',factory:()=>()=>Date.now()});

/** One heartbeat while a mounted card is running; never registers blur/focus handlers. */
export class StudyClock {
  private readonly engine:CardStudyTimer;
  private mounted=false;
  private paused=true;
  private watching=false;
  private destroyed=false;
  private fenced=false;
  private epoch:number;
  private heartbeat:ReturnType<typeof setInterval>|undefined;
  private readonly value=signal(0);
  readonly seconds=computed(()=>this.epoch===this.workspaceEpoch()?this.value():0);
  readonly label=computed(()=>formatStudyTime(this.seconds()));
  private readonly visibility=()=>{this.engine.setVisible(!document.hidden);this.refresh();if(document.hidden)this.stopHeartbeat();else this.startHeartbeat();};
  private readonly hide=()=>{this.engine.setVisible(false);this.refresh();this.stopHeartbeat();};
  constructor(now:()=>number,destroy:DestroyRef,wall:()=>number=()=>Date.now(),private readonly workspaceEpoch:()=>number=()=>0){
    this.epoch=workspaceEpoch();this.engine=new CardStudyTimer(now,wall);this.engine.setVisible(!document.hidden);
    destroy.onDestroy(()=>{this.engine.pause();this.unwatch();this.mounted=false;this.destroyed=true;});
  }
  attach():void{if(!this.valid()||this.mounted)return;this.mounted=true;this.resume();}
  detach():void{this.pause();this.mounted=false;this.unwatch();}
  reset():void{this.epoch=this.workspaceEpoch();this.fenced=false;this.engine.reset();this.paused=true;this.unwatch();this.value.set(0);}
  restoreCommitted(seconds:number):void{this.reset();this.engine.restoreCommitted(seconds);this.refresh();}
  startAppearance():void{if(!this.valid())return;this.engine.startAppearance();if(this.mounted)this.resume();this.refresh();}
  pause():void{if(this.valid())this.engine.pause();this.paused=true;this.stopHeartbeat();this.refresh();}
  resume():void{if(!this.valid()||!this.mounted)return;this.watch();this.paused=false;this.engine.resume();this.startHeartbeat();this.refresh();}
  commitAppearance():number{if(!this.valid())return 0;const ms=this.engine.commitAppearance();this.unwatch();this.refresh();return ms;}
  discardAppearance():void{this.engine.discardAppearance();this.unwatch();this.refresh();}
  undo(ms:number):void{if(this.valid())this.engine.undo(ms);this.refresh();}
  appearanceMilliseconds():number{return this.valid()?this.engine.appearanceMilliseconds:0;}
  get committedSeconds():number{return this.valid()?this.engine.committedSeconds:0;}
  private valid():boolean{
    // Activation epochs also detect A -> B -> A without any intermediate read.
    // Only an explicit reset/new round may release this fence; resume cannot.
    if(this.epoch!==this.workspaceEpoch()){this.epoch=this.workspaceEpoch();this.engine.reset();this.paused=true;this.fenced=true;this.unwatch();this.value.set(0);}
    return !this.destroyed&&!this.fenced;
  }
  private refresh():void{if(this.valid())this.value.set(this.engine.tick());}
  private watch():void{
    if(this.watching||!this.engine.hasAppearance)return;
    this.engine.setVisible(!document.hidden);this.watching=true;
    document.addEventListener('visibilitychange',this.visibility);window.addEventListener('pagehide',this.hide);window.addEventListener('pageshow',this.visibility);
  }
  private startHeartbeat():void{if(this.heartbeat===undefined&&this.mounted&&!this.paused&&!document.hidden&&this.engine.hasAppearance)this.heartbeat=setInterval(()=>this.refresh(),250);}
  private stopHeartbeat():void{if(this.heartbeat!==undefined){clearInterval(this.heartbeat);this.heartbeat=undefined;}}
  private unwatch():void{this.stopHeartbeat();if(!this.watching)return;this.watching=false;document.removeEventListener('visibilitychange',this.visibility);window.removeEventListener('pagehide',this.hide);window.removeEventListener('pageshow',this.visibility);}
}

export function createStudyClock():StudyClock {const workspace=inject(WorkspaceService);return new StudyClock(inject(STUDY_MONOTONIC_NOW),inject(DestroyRef),inject(STUDY_WALL_NOW),()=>workspace.activationRevision());}

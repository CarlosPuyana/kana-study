import {signal} from '@angular/core';
import {rushStudyActions} from './rush-study-actions';
import {RushSessionService} from '../../core/services/rush-session.service';

describe('RUSH sequential UI gates',()=>{
 function fixture(){
  const state={loading:signal(false),saving:signal(false),summary:signal<unknown>(null),session:signal<unknown>({endedAt:null}),currentUnit:signal<unknown>({key:'x'}),revealed:signal(false),error:signal(false),medals:{newlyUnlocked:signal<unknown[]>([])},reveal:vi.fn(),next:vi.fn(async()=>{})};
  const writing=signal(false),actions=rushStudyActions(state as unknown as RushSessionService,writing);
  return {state,writing,actions};
 }
 beforeEach(()=>(document.activeElement as HTMLElement)?.blur?.());
 it.each(['loading','saving','summary','session','currentUnit','error','medal','writing','ended'])('blocks the global shortcut while %s',flag=>{
  const {state,writing,actions}=fixture();
  if(flag==='loading'||flag==='saving'||flag==='error')state[flag].set(true);
  if(flag==='summary')state.summary.set({});if(flag==='session'||flag==='currentUnit')state[flag].set(null);
  if(flag==='medal')state.medals.newlyUnlocked.set([{}]);if(flag==='writing')writing.set(true);if(flag==='ended')state.session.set({endedAt:1});
  const e=new KeyboardEvent('keydown',{key:' ',code:'Space',cancelable:true});actions.key(e);expect(e.defaultPrevented).toBe(false);expect(state.reveal).not.toHaveBeenCalled();expect(state.next).not.toHaveBeenCalled();
 });
 it('does not act when the current unit cannot be resolved to a visible card',()=>{
  const {state}=fixture(),actions=rushStudyActions(state as unknown as RushSessionService,()=>false,()=>false);
  actions.key(new KeyboardEvent('keydown',{key:' ',code:'Space',cancelable:true}));actions.run();expect(actions.blocked()).toBe(true);expect(state.reveal).not.toHaveBeenCalled();
 });
 it('retains manual recovery and does not replace the session mechanics',()=>{
  const {state,actions}=fixture();state.error.set(true);actions.run();expect(state.reveal).toHaveBeenCalledOnce();
  state.revealed.set(true);actions.run();expect(state.next).toHaveBeenCalledOnce();state.saving.set(true);actions.run();expect(state.next).toHaveBeenCalledOnce();
 });
});

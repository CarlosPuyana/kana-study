import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RecallSwipe } from './recall-swipe';
@Component({imports:[RecallSwipe],template:'<article appRecallSwipe [enabled]="enabled()" [phraseKey]="key()" (recallSwipe)="answers.push($event)"><span>phrase</span><button>control</button></article>'})
class Host { enabled=signal(true);key=signal('r1:a');answers:boolean[]=[]; }
describe('Recall horizontal pointer intent',()=>{
 function setup(){const f=TestBed.createComponent(Host);f.detectChanges();const node=f.debugElement.query(By.directive(RecallSwipe)),d=node.injector.get(RecallSwipe);const event=(x:number,y:number,extra={})=>({clientX:x,clientY:y,pointerId:1,pointerType:'touch',isPrimary:true,button:0,target:node.nativeElement.querySelector('span'),...extra} as PointerEvent);return {f,d,event};}
 afterEach(()=>TestBed.resetTestingModule());
 it.each([[-90,false],[90,true]])('accepts directional intent %s exactly once',(dx,known)=>{const {f,d,event}=setup();d.down(event(100,100));d.move(event(100+dx,105));expect(Math.abs(d.drag())).toBeGreaterThan(0);expect(Math.abs(d.drag())).toBeLessThanOrEqual(28);d.up(event(100+dx,105));d.up(event(100+dx,105));expect(f.componentInstance.answers).toEqual([known]);expect(d.drag()).toBe(0);});
 it('rejects ambiguous, short and vertical scroll gestures',()=>{const {f,d,event}=setup();for(const [dx,dy] of [[30,0],[80,70],[8,110]]){d.down(event(100,100));d.move(event(100+dx,100+dy));d.up(event(100+dx,100+dy));}expect(f.componentInstance.answers).toEqual([]);});
 it('ignores disabled cards, mouse and controls',()=>{const {f,d,event}=setup();f.componentInstance.enabled.set(false);f.detectChanges();d.down(event(0,0));d.up(event(100,0));f.componentInstance.enabled.set(true);f.detectChanges();d.down(event(0,0,{pointerType:'mouse'}));d.up(event(100,0));d.down(event(0,0,{target:f.nativeElement.querySelector('button')}));d.up(event(100,0));expect(f.componentInstance.answers).toEqual([]);});
 it('cancels stale identity, pointercancel and multiple touches',()=>{const {f,d,event}=setup();d.down(event(0,0));f.componentInstance.key.set('r1:b');f.detectChanges();d.up(event(100,0));d.down(event(0,0));d.cancel();d.up(event(100,0));d.down(event(0,0));d.down(event(0,0,{pointerId:2,isPrimary:false}));d.up(event(100,0));expect(f.componentInstance.answers).toEqual([]);});
});

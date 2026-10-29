import {Component, signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {runRevealNextShortcut} from './study-shortcuts';
import {StudyPrimaryAction} from './study-primary-action';

@Component({imports:[StudyPrimaryAction],template:`<button studyPrimaryAction [studyPrimaryBlocked]="blocked">Action</button>`})
class PrimaryFixture {busy=signal(false);blocked=()=>this.busy();}

describe('sequential reveal/Next shortcut ownership',()=>{
 const action=vi.fn();
 beforeEach(()=>{action.mockClear();(document.activeElement as HTMLElement)?.blur?.();});
 afterEach(()=>TestBed.resetTestingModule());
 function key(init:KeyboardEventInit={},target:EventTarget=document,enter=true){
  const e=new KeyboardEvent('keydown',{key:' ',code:'Space',bubbles:true,cancelable:true,...init});target.dispatchEvent(e);runRevealNextShortcut(e,action,enter);return e;
 }
 it('runs exactly one Space/Enter action, respects prior processing and unavailable actions',()=>{
  const e=key();runRevealNextShortcut(e,action,true);expect(action).toHaveBeenCalledTimes(1);
  key({key:'Enter',code:'Enter'});expect(action).toHaveBeenCalledTimes(2);
  key({key:'Enter',code:'Enter'},document,false);expect(action).toHaveBeenCalledTimes(2);
  const none=new KeyboardEvent('keydown',{key:' ',cancelable:true});runRevealNextShortcut(none,null,true);expect(none.defaultPrevented).toBe(false);
  const processed=new KeyboardEvent('keydown',{key:' ',cancelable:true});processed.preventDefault();runRevealNextShortcut(processed,action,true);expect(action).toHaveBeenCalledTimes(2);
 });
 it.each(['button','a','input','textarea','select','summary','editable','checkbox','tab','option','menuitem','textbox','writing'])('leaves %s and nested event paths untouched',kind=>{
  const el=document.createElement(['editable','checkbox','tab','option','menuitem','textbox','writing'].includes(kind)?'div':kind);
  if(kind==='editable')el.setAttribute('contenteditable','true');
  if(['checkbox','tab','option','menuitem','textbox'].includes(kind))el.setAttribute('role',kind);
  if(kind==='writing')el.className='writing-surface';
  const span=document.createElement('span');el.append(span);document.body.append(el);
  try{expect(key({},span).defaultPrevented).toBe(false);expect(action).not.toHaveBeenCalled();}finally{el.remove();}
 });
 it.each([{repeat:true},{isComposing:true},{ctrlKey:true},{altKey:true},{metaKey:true},{shiftKey:true}])('does not act for %j',flags=>{
  expect(key(flags).defaultPrevented).toBe(false);expect(action).not.toHaveBeenCalled();
 });
 it.each(['dialog','aria-dialog','alertdialog'])('does not act behind an open %s',kind=>{
  const el=document.createElement(kind==='dialog'?'dialog':'section');if(kind==='dialog')el.setAttribute('open','');else el.setAttribute('role',kind==='aria-dialog'?'dialog':'alertdialog');document.body.append(el);
  try{key();key({key:'Enter',code:'Enter'});expect(action).not.toHaveBeenCalled();}finally{el.remove();}
 });
 it('blocks native Enter/Space repeats and reads busy state at keydown, not the previous render',()=>{
  const f=TestBed.createComponent(PrimaryFixture);f.detectChanges();const button=f.nativeElement.querySelector('button') as HTMLButtonElement;
  const press=(repeat=false)=>{const e=new KeyboardEvent('keydown',{key:'Enter',code:'Enter',repeat,bubbles:true,cancelable:true});button.dispatchEvent(e);return e;};
  expect(press().defaultPrevented).toBe(false);expect(press(true).defaultPrevented).toBe(true);
  f.componentInstance.busy.set(true);expect(press().defaultPrevented).toBe(true);
  f.componentInstance.busy.set(false);expect(press().defaultPrevented).toBe(false);
 });
});

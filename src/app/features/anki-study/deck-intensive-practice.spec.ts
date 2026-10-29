import {By} from '@angular/platform-browser';
import {KaishiCardMedia} from '../../shared/components/kaishi-card-media/kaishi-card-media';
import {KaishiMediaService} from '../../core/services/kaishi-media.service';
import {KaishiStaticMediaService} from '../../core/services/kaishi-static-media.service';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DeckIntensivePractice } from './deck-intensive-practice';
import { TranslationService } from '../../core/services/translation.service';
import { JAPANESE_1500_ENTRIES } from '../../data/japanese-1500.generated';

describe('free intensive practice presentation',()=>{
 beforeEach(()=>TestBed.configureTestingModule({imports:[DeckIntensivePractice],providers:[
  {provide:KaishiMediaService,useValue:{pitch:signal(false),autoAudio:signal(false),revision:signal(0),store:{resource:async()=>null}}},
  {provide:KaishiStaticMediaService,useValue:{card:async()=>({catalog:{publication:'blocked'},card:null})}},
  {provide:TranslationService,useValue:{language:signal('es'),t:(key:string)=>key}},
 ]}));
 afterEach(()=>TestBed.resetTestingModule());
 function render(count=2){const f=TestBed.createComponent(DeckIntensivePractice);f.componentRef.setInput('entries',JAPANESE_1500_ENTRIES.slice(0,count));f.detectChanges();return f;}
 it('front exposes only the word; last-to-first returns to its front without terminal controls',()=>{
  const f=render(),p=f.componentInstance;
  expect(f.nativeElement.querySelector('.practice-word').textContent).toBe('私');
  expect(f.nativeElement.querySelector('rt,img,audio,app-kaishi-card-media,.practice-meaning,.practice-reading,.practice-example')).toBeNull();
  p.advance();f.detectChanges();expect(f.nativeElement.querySelector('.practice-meaning').textContent).toContain('yo');
  expect(f.nativeElement.querySelector('.practice-translation:not([open])')).not.toBeNull();
  p.advance();f.detectChanges();expect(p.session().position).toBe(2);expect(p.revealed()).toBe(false);
  expect(f.nativeElement.querySelector('.practice-word').textContent).toBe('あなた');
  p.advance();p.advance();f.detectChanges();expect(p.current()?.word).toBe('私');expect(p.session().position).toBe(1);expect(p.revealed()).toBe(false);
  expect(f.nativeElement.querySelector('.practice-end,.practice-restart,.practice-close')).toBeNull();
  expect(f.nativeElement.querySelector('[role=timer],.practice-again,.practice-good,.practice-finish,.practice-continue')).toBeNull();
 });
 it('keeps a single word on its front after each advance and rejects empty selections',()=>{
  const f=render(1),p=f.componentInstance;for(let i=0;i<3;i++){p.advance();p.advance();f.detectChanges();expect(p.current()?.id).toBe(JAPANESE_1500_ENTRIES[0].id);expect(p.revealed()).toBe(false);expect(p.session().position).toBe(1);}
  f.componentRef.setInput('entries',[]);f.detectChanges();p.advance();expect(p.session().total).toBe(0);expect(f.nativeElement.querySelector('.practice-primary,.practice-restart')).toBeNull();
 });
 it('replaces the media appearance even if the same entry is revealed again before a render',()=>{
  const f=render(1),p=f.componentInstance;f.componentRef.setInput('builtinMedia',true);p.advance();f.detectChanges();
  const original=f.debugElement.query(By.directive(KaishiCardMedia)).componentInstance as KaishiCardMedia;
  const stop=vi.spyOn(original,'cancelAutomatic'),button=f.nativeElement.querySelector('.practice-primary');
  p.advance();expect(stop).toHaveBeenCalled();p.advance();f.detectChanges();
  const next=f.debugElement.query(By.directive(KaishiCardMedia)).componentInstance;
  expect(next).not.toBe(original);expect(next.entry().id).toBe(original.entry().id);expect(f.nativeElement.querySelector('.practice-primary')).toBe(button);
 });
 it('does not duplicate a reading identical to the displayed word',()=>{
  const f=render();f.componentRef.setInput('entries',[{...JAPANESE_1500_ENTRIES[0],word:'あなた',reading:'あなた'}]);f.detectChanges();f.componentInstance.advance();f.detectChanges();
  expect(f.nativeElement.querySelector('.practice-reading')).toBeNull();
 });
 it('Space acts once, and respects native controls, modifiers, IME and held keys',()=>{
  const f=render(),p=f.componentInstance;(document.activeElement as HTMLElement)?.blur?.();
  p.handleKey(new KeyboardEvent('keydown',{code:'Space',repeat:true}));expect(p.revealed()).toBe(false);
  for(const init of [{isComposing:true},{ctrlKey:true},{altKey:true},{metaKey:true},{shiftKey:true}]){p.handleKey(new KeyboardEvent('keydown',{code:'Space',...init}));expect(p.revealed()).toBe(false);}
  for(const tag of ['button','a','input','textarea','select','summary','div']){
   const node=document.createElement(tag);if(tag==='div')node.setAttribute('contenteditable','true');f.nativeElement.append(node);
   const event=new KeyboardEvent('keydown',{code:'Space',bubbles:true,cancelable:true});node.dispatchEvent(event);expect(event.defaultPrevented).toBe(false);expect(p.revealed()).toBe(false);node.remove();
  }
  p.handleKey(new KeyboardEvent('keydown',{code:'Space'}));expect(p.revealed()).toBe(true);
  p.handleKey(new KeyboardEvent('keydown',{code:'Space',repeat:true}));expect(p.session().position).toBe(1);
  p.handleKey(new KeyboardEvent('keydown',{code:'Space'}));expect(p.session().position).toBe(2);expect(p.revealed()).toBe(false);
 });
 it('exit emits only the close action at any point',()=>{
  const f=render(),close=vi.fn();f.componentInstance.closed.subscribe(close);
  f.nativeElement.querySelector('.practice-exit').click();expect(close).toHaveBeenCalledTimes(1);
 });
});

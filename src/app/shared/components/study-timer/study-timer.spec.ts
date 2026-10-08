import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createStudyClock, STUDY_MONOTONIC_NOW } from '../../../core/services/study-clock';
import { TranslationService } from '../../../core/services/translation.service';
import { StudyTimer } from './study-timer';

@Component({imports:[StudyTimer],template:`@if(show()){<app-study-timer [clock]="clock" [result]="result()"/>}`})
class TimerHost {
  readonly clock=createStudyClock();
  readonly show=signal(false);
  readonly result=signal(false);
}

describe('study counter visibility and lifecycle',()=>{
  let now=0,hidden=false;
  beforeEach(()=>{
    now=0;hidden=false;vi.spyOn(document,'hidden','get').mockImplementation(()=>hidden);
    TestBed.configureTestingModule({imports:[TimerHost],providers:[
      {provide:STUDY_MONOTONIC_NOW,useValue:()=>now},
      {provide:TranslationService,useValue:{t:()=> 'Tiempo de estudio'}}]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();});
  it('starts on rendering, excludes hidden/locked time, freezes results and removes listeners on navigation',()=>{
    const fixture=TestBed.createComponent(TimerHost),host=fixture.componentInstance;
    host.clock.startAppearance();now=60000;fixture.detectChanges();expect(host.clock.appearanceMilliseconds()).toBe(0);
    host.show.set(true);fixture.detectChanges();now+=4000;
    hidden=true;document.dispatchEvent(new Event('visibilitychange'));fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="timer"]').textContent).toContain('Tiempo de estudio: 00:04');
    now+=60000;hidden=false;document.dispatchEvent(new Event('visibilitychange'));now+=3000;
    window.dispatchEvent(new Event('pagehide'));expect(host.clock.seconds()).toBe(7);
    now+=60000;window.dispatchEvent(new Event('pageshow'));now+=3000;
    host.clock.commitAppearance();host.result.set(true);fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('00:10');
    now+=60000;host.clock.pause();expect(host.clock.seconds()).toBe(10);
    fixture.destroy();const unchanged=host.clock.seconds();
    document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('pageshow'));
    expect(host.clock.seconds()).toBe(unchanged);
  });
  it('unmounting excludes time and remounting a new session starts at zero',()=>{
    const fixture=TestBed.createComponent(TimerHost),host=fixture.componentInstance;
    host.show.set(true);host.clock.startAppearance();fixture.detectChanges();now=4000;
    host.show.set(false);fixture.detectChanges();now+=60000;expect(host.clock.appearanceMilliseconds()).toBe(4000);
    host.clock.reset();host.clock.startAppearance();host.show.set(true);fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('00:00');now+=7000;host.clock.commitAppearance();fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('00:07');
  });
});

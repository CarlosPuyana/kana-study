import {Component, signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {ModalFocusDirective} from './modal-focus.directive';

@Component({imports:[ModalFocusDirective],template:`<button id="opener" (click)="open.set(true)">Open</button>@if(open()){<section appModalFocus (modalClosed)="open.set(false)" role="dialog" aria-modal="true" aria-labelledby="title"><h2 id="title">Title</h2><button id="first">Close</button><a id="last" href="#">Action</a></section>}`})
class ModalHost {readonly open=signal(false);}
describe('audited modal focus boundary',()=>{
  afterEach(()=>{TestBed.resetTestingModule();});
  it('focuses the dialog, cycles Tab/Shift+Tab, closes on Escape and restores the opener',async()=>{
    const fixture=TestBed.createComponent(ModalHost);fixture.detectChanges();document.body.appendChild(fixture.nativeElement);
    const opener=fixture.nativeElement.querySelector('#opener') as HTMLButtonElement;opener.focus();opener.click();fixture.detectChanges();await fixture.whenStable();
    const first=fixture.nativeElement.querySelector('#first') as HTMLElement,last=fixture.nativeElement.querySelector('#last') as HTMLElement;
    expect(document.activeElement).toBe(first);last.focus();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));expect(document.activeElement).toBe(first);
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true}));expect(document.activeElement).toBe(last);
    opener.focus();expect(document.activeElement).toBe(first);
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));fixture.detectChanges();expect(fixture.nativeElement.querySelector('[role=dialog]')).toBeNull();expect(document.activeElement).toBe(opener);
    fixture.nativeElement.remove();
  });
});

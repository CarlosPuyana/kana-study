import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {PersistenceNotice} from './persistence-notice';
import {StorageService} from '../../../core/services/storage.service';
import {TranslationService} from '../../../core/services/translation.service';

describe('deduplicated persistence feedback',()=>{
  afterEach(()=>TestBed.resetTestingModule());
  it('shows one translated status after repeated failures and allows dismissing it',()=>{
    const persistenceFailed=signal(false),storage={persistenceFailed,dismissPersistenceError:()=>persistenceFailed.set(false)};
    TestBed.configureTestingModule({providers:[{provide:StorageService,useValue:storage},{provide:TranslationService,useValue:{t:(key:string)=>key==='common.close'?'Close':'Could not save changes.'}}]});
    const fixture=TestBed.createComponent(PersistenceNotice);fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=status]')).toBeNull();
    persistenceFailed.set(true);fixture.detectChanges();persistenceFailed.set(true);fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[role=status]')).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Could not save changes.');
    fixture.nativeElement.querySelector('button[aria-label=Close]').click();fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=status]')).toBeNull();
  });
});

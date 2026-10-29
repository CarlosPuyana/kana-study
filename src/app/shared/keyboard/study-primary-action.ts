import {Directive, input} from '@angular/core';
import {guardStudyPrimaryKey} from './study-shortcuts';

/** Opt-in for sequential study buttons; other native buttons are untouched. */
@Directive({selector:'button[studyPrimaryAction]',host:{'(keydown)':'key($event)'}})
export class StudyPrimaryAction {
 readonly studyPrimaryBlocked=input<boolean|(()=>boolean)>(false);
 key(event:KeyboardEvent):void{const blocked=this.studyPrimaryBlocked();guardStudyPrimaryKey(event,typeof blocked==='function'?blocked():blocked);}
}

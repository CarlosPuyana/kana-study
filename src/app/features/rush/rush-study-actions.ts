import type {RushSessionService} from '../../core/services/rush-session.service';
import {runRevealNextShortcut, studyModalOpen} from '../../shared/keyboard/study-shortcuts';

/** UI adapter only; session order, timing and persistence remain in RUSH. */
export function rushStudyActions(rush:RushSessionService, writingBusy:()=>boolean=()=>false, hasExercise:()=>boolean=()=>true){
 const available=()=>!rush.loading()&&!rush.saving()&&!!rush.currentUnit()&&rush.session()?.endedAt===null&&!rush.summary()&&hasExercise()&&!writingBusy()&&!studyModalOpen();
 const run=()=>{if(available())rush.revealed()?void rush.next():rush.reveal();};
 const key=(event:KeyboardEvent)=>runRevealNextShortcut(event,available()&&!rush.error()&&!rush.medals.newlyUnlocked().length?run:null,true);
 const blocked=()=>!available()||!!rush.medals.newlyUnlocked().length;
 return {available,blocked,run,key};
}

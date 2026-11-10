import {KanjiAvailabilityService} from './kanji-availability.service';
/** Presentation tests with a synthetic progress repository do not run the real deadline clock. */
export const isolatedKanjiAvailability={provide:KanjiAvailabilityService,useValue:{watch:()=>{},state:()=>({status:'fresh',total:1,due:0,fresh:1,nextDue:null,blocked:false,canStart:true})}};

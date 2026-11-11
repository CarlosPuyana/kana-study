import {computed,inject,Injectable,linkedSignal} from '@angular/core';
import {ConjugationCategoryId,ConjugationPracticeIntent,ConjugationSelection} from '../models/conjugations.model';
import {ADJECTIVE_CATEGORIES,AdjectiveCategory} from '../models/conjugation-practice.model';
import {CONJUGATION_CATEGORIES} from '../../data/conjugations';
import {StorageService} from './storage.service';
import {WorkspaceService} from './workspace.service';
export const CONJUGATION_SELECTION_KEY='kana-study.conjugation-selection.v1';
const initialIds:readonly ConjugationCategoryId[]=['verb-negative','verb-past','verb-negative-past','verb-te',...ADJECTIVE_CATEGORIES];
const implemented=CONJUGATION_CATEGORIES.filter(c=>c.availability==='available').map(c=>c.id);
const catalogIds=CONJUGATION_CATEGORIES.map(category=>category.id);
export function normalizeConjugationSelection(value:unknown):readonly ConjugationCategoryId[]{
 const ids=value&&typeof value==='object'?(value as {categoryIds?:unknown}).categoryIds:null;
 const selected=new Set(Array.isArray(ids)?ids.filter(id=>typeof id==='string'):[]);
 return catalogIds.filter(id=>selected.has(id));
}
type Types=NonNullable<ConjugationSelection['adjectiveTypes']>;
export function normalizeAdjectiveTypes(value:unknown):Types{
 const record=value&&typeof value==='object'?value as Record<string,unknown>:{};
 return Object.fromEntries(ADJECTIVE_CATEGORIES.map(id=>[id,record[id]==='i'||record[id]==='na'?record[id]:'both'])) as Types;
}
@Injectable({providedIn:'root'})
export class ConjugationSelectionService{
 private readonly workspace=inject(WorkspaceService);
 private readonly storage=inject(StorageService);
 private readonly state=linkedSignal(()=>{
  this.workspace.activationRevision();this.workspace.dataRevision();
  try{
   const raw=localStorage.getItem(this.workspace.storageKey(CONJUGATION_SELECTION_KEY));
   const value=raw===null?null:JSON.parse(raw) as ConjugationSelection;
   if(value&&![1,2,3,4,5,6].includes(value.version))throw Error('Unknown conjugation preferences');
   if(value&&value.version>=2&&!Array.isArray(value.unlockedIds))throw Error('Invalid unlock preferences');
   const unlocked=value&&value.version>=2?implemented.filter(id=>value.unlockedIds!.includes(id)&&
    (value.version>=3||!['verb-conditional-tara','verb-conditional-ba','verb-volitional'].includes(id))&&
    (value.version>=4||!['verb-potential','verb-passive','verb-causative','verb-causative-passive'].includes(id))&&
    (value.version===6||!['verb-imperative','verb-prohibitive','copula-plain','copula-polite'].includes(id))):initialIds;
   const unlockedIds=[...new Set([...unlocked,...ADJECTIVE_CATEGORIES])];
   // Old families never silently select five transformation categories.
   const categoryIds=normalizeConjugationSelection(value).filter(id=>unlockedIds.includes(id)&&(!this.isAdjective(id)||(value?.version??0)>=5));
   return {categoryIds,unlockedIds,adjectiveTypes:normalizeAdjectiveTypes((value?.version??0)>=5?value?.adjectiveTypes:null),autoKana:(value?.version??0)>=5?value?.autoKana!==false:true,
    legacySelection:Array.isArray(value?.categoryIds)&&value.categoryIds.some(id=>id==='adjective-i'||id==='adjective-na'),readFailed:false};
  }catch{return {categoryIds:[] as readonly ConjugationCategoryId[],unlockedIds:[] as readonly ConjugationCategoryId[],adjectiveTypes:normalizeAdjectiveTypes(null),autoKana:true,legacySelection:false,readFailed:true};}
 });
 readonly ids=computed(()=>this.state().categoryIds);
 readonly adjectiveTypes=computed(()=>this.state().adjectiveTypes);
 readonly autoKana=computed(()=>this.state().autoKana);
 readonly legacySelection=computed(()=>this.state().legacySelection);
 isAdjective(id:ConjugationCategoryId):id is AdjectiveCategory{return ADJECTIVE_CATEGORIES.includes(id as AdjectiveCategory);}
 isUnlocked(id:ConjugationCategoryId):boolean{return implemented.includes(id)&&this.state().unlockedIds.includes(id);}
 isImplemented(id:ConjugationCategoryId):boolean{return implemented.includes(id);}
 setUnlocked(id:ConjugationCategoryId,unlocked:boolean):void{
  if(!implemented.includes(id)||this.isAdjective(id))return;
  const ids=unlocked?[...this.state().unlockedIds,id]:this.state().unlockedIds.filter(v=>v!==id);
  this.persist(this.ids().filter(v=>ids.includes(v)),ids);
 }
 setAdjectiveType(id:ConjugationCategoryId,type:string):void{
  if(this.isAdjective(id)&&['i','na','both'].includes(type))this.persist(this.ids(),this.state().unlockedIds,{...this.adjectiveTypes(),[id]:type} as Types);
 }
 setAutoKana(value:boolean):void{this.persist(this.ids(),this.state().unlockedIds,this.adjectiveTypes(),value);}
 readonly availableCount=computed(()=>implemented.filter(id=>this.isUnlocked(id)).length);
 readonly count=computed(()=>this.ids().length);
 readonly saveError=linkedSignal(()=>{this.workspace.activationRevision();return this.state().readFailed;});
 setCategory(id:ConjugationCategoryId,selected:boolean):void{if(this.isUnlocked(id))this.save(selected?[...this.ids(),id]:this.ids().filter(v=>v!==id));}
 selectAll():void{this.save(implemented.filter(id=>this.isUnlocked(id)));}
 clear():void{this.save([]);}
 intent(id?:ConjugationCategoryId):ConjugationPracticeIntent|null{
  const categoryIds=id?(this.isUnlocked(id)?[id]:[]):[...this.ids()];
  return categoryIds.length?{mode:id?'single':'mixed',categoryIds,...(categoryIds.some(id=>this.isAdjective(id))?{adjectiveTypes:{...this.adjectiveTypes()}}:{})}:null;
 }
 private save(ids:readonly ConjugationCategoryId[]):void{this.persist(normalizeConjugationSelection({categoryIds:ids}).filter(id=>this.isUnlocked(id)),this.state().unlockedIds);}
 private persist(categoryIds:readonly ConjugationCategoryId[],unlockedIds:readonly ConjugationCategoryId[],adjectiveTypes=this.adjectiveTypes(),autoKana=this.autoKana()):void{
  if(this.state().readFailed){this.saveError.set(true);return;}
  const owner=this.workspace.active(),epoch=this.workspace.activationRevision();
  try{
   const value={version:6 as const,categoryIds,unlockedIds:[...new Set(unlockedIds)],adjectiveTypes,autoKana};
   this.storage.set(CONJUGATION_SELECTION_KEY,value,{localOnly:true,strict:true,owner});
   if(owner!==this.workspace.active()||epoch!==this.workspace.activationRevision())return;
   this.state.set({...value,legacySelection:false,readFailed:false});this.saveError.set(false);
  }catch{if(owner===this.workspace.active()&&epoch===this.workspace.activationRevision())this.saveError.set(true);}
 }
}

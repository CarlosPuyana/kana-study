import {computed,inject,Injectable,linkedSignal} from '@angular/core';
import {ConjugationCategoryId,ConjugationPracticeIntent,ConjugationSelection} from '../models/conjugations.model';
import {CONJUGATION_CATEGORIES} from '../../data/conjugations';
import {StorageService} from './storage.service';
import {WorkspaceService} from './workspace.service';

export const CONJUGATION_SELECTION_KEY='kana-study.conjugation-selection.v1';
const catalogIds=CONJUGATION_CATEGORIES.map(category=>category.id);
export function normalizeConjugationSelection(value:unknown):readonly ConjugationCategoryId[]{
  const ids=value && typeof value==='object' ? (value as {categoryIds?:unknown}).categoryIds : null;
  const selected=new Set(Array.isArray(ids)?ids.filter(id=>typeof id==='string'):[]);
  return catalogIds.filter(id=>selected.has(id));
}

@Injectable({providedIn:'root'})
export class ConjugationSelectionService{
  private readonly workspace=inject(WorkspaceService);
  private readonly storage=inject(StorageService);
  private readonly state=linkedSignal(()=>{
    this.workspace.activationRevision();this.workspace.dataRevision();
    return normalizeConjugationSelection(this.storage.get<unknown>(CONJUGATION_SELECTION_KEY,null));
  });
  readonly ids=this.state.asReadonly();
  readonly count=computed(()=>this.ids().length);
  readonly saveError=linkedSignal(()=>{this.workspace.activationRevision();return false;});
  setCategory(id:ConjugationCategoryId,selected:boolean):void{
    if(!catalogIds.includes(id))return;
    this.save(selected?[...this.ids(),id]:this.ids().filter(value=>value!==id));
  }
  selectAll():void{this.save(catalogIds);}
  clear():void{this.save([]);}
  /** This is a selection request, never an exercise/session constructor. */
  intent(id?:ConjugationCategoryId):ConjugationPracticeIntent|null{
    const categoryIds=id?(catalogIds.includes(id)?[id]:[]):[...this.ids()];
    return categoryIds.length?{mode:id?'single':'mixed',categoryIds}:null;
  }
  private save(ids:readonly ConjugationCategoryId[]):void{
    const categoryIds=normalizeConjugationSelection({categoryIds:ids});
    try{
      const value:ConjugationSelection={version:1,categoryIds};
      this.storage.set(CONJUGATION_SELECTION_KEY,value,{localOnly:true,strict:true});
      this.state.set(categoryIds);this.saveError.set(false);
    }catch{this.saveError.set(true);}
  }
}

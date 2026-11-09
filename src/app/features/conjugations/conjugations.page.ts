import {ChangeDetectionStrategy,Component,computed,inject,linkedSignal,signal} from '@angular/core';
import * as copy from '../../../assets/i18n/conjugations.generated';
import {ConjugationCategoryId,ConjugationGroup} from '../../core/models/conjugations.model';
import {ConjugationSelectionService} from '../../core/services/conjugation-selection.service';
import {TranslationService} from '../../core/services/translation.service';
import {WorkspaceService} from '../../core/services/workspace.service';
import {CONJUGATION_CATEGORIES} from '../../data/conjugations';
import {PageHeader} from '../../shared/components/page-header/page-header';

@Component({selector:'app-conjugations-page',imports:[PageHeader],templateUrl:'./conjugations.page.html',styleUrl:'./conjugations.page.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class ConjugationsPage{
  readonly i18n=inject(TranslationService);
  readonly selection=inject(ConjugationSelectionService);
  private readonly workspace=inject(WorkspaceService);
  readonly categories=CONJUGATION_CATEGORIES;
  readonly groups=['all','verb','adjective','copula'] as const;
  readonly filter=signal<ConjugationGroup|'all'>('all');
  readonly visible=computed(()=>this.categories.filter(category=>this.filter()==='all'||category.group===this.filter()));
  readonly hiddenSelected=computed(()=>this.selection.ids().filter(id=>!this.visible().some(category=>category.id===id)).length);
  private readonly request=linkedSignal<{id?:ConjugationCategoryId;count:number}|null>(()=>{this.workspace.activationRevision();return null;});
  readonly requestedId=computed(()=>this.request()?.id??null);
  readonly notice=computed(()=>{const request=this.request();return !request?'':request.id?this.i18n.t('conjugations.requestSingle',{name:this.i18n.t(this.categories.find(category=>category.id===request.id)!.titleKey)}):this.i18n.t('conjugations.requestMix',{count:request.count});});
  constructor(){this.i18n.useStudyCopy(copy);}
  selected(id:ConjugationCategoryId):boolean{return this.selection.ids().includes(id);}
  toggle(id:ConjugationCategoryId,event:Event):void{this.request.set(null);const input=event.target as HTMLInputElement;this.selection.setCategory(id,input.checked);input.checked=this.selected(id);}
  selectAll():void{this.request.set(null);this.selection.selectAll();}
  clear():void{this.request.set(null);this.selection.clear();}
  requestPractice(id?:ConjugationCategoryId):void{
    const intent=this.selection.intent(id);if(!intent)return;
    this.request.set({id,count:intent.categoryIds.length});
  }
}

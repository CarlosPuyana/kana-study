import {ChangeDetectionStrategy,Component,computed,inject,linkedSignal,signal} from '@angular/core';
import * as copy from '../../../assets/i18n/conjugations.generated';
import {ConjugationCategoryId,ConjugationGroup} from '../../core/models/conjugations.model';
import {ConjugationSelectionService} from '../../core/services/conjugation-selection.service';
import {TranslationService} from '../../core/services/translation.service';
import {WorkspaceService} from '../../core/services/workspace.service';
import {CONJUGATION_CATEGORIES} from '../../data/conjugations';
import {PageHeader} from '../../shared/components/page-header/page-header';
import {Router} from '@angular/router';
import {ConjugationStatsService} from '../../core/services/conjugation-stats.service';
import {isPracticeCategory} from '../../core/services/conjugation-questions';

@Component({selector:'app-conjugations-page',imports:[PageHeader],templateUrl:'./conjugations.page.html',styleUrl:'./conjugations.page.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class ConjugationsPage{
  readonly i18n=inject(TranslationService);
  readonly selection=inject(ConjugationSelectionService);
  readonly stats=inject(ConjugationStatsService);
  readonly legacyIds=['adjective-i','adjective-na'] as const;
  private readonly router=inject(Router);
  private readonly workspace=inject(WorkspaceService);
  readonly categories=[...CONJUGATION_CATEGORIES].sort((a,b)=>Number(b.group==='adjective')-Number(a.group==='adjective'));
  readonly groups=['all','verb','adjective','copula'] as const;
  readonly filter=signal<ConjugationGroup|'all'>('all');
  readonly visible=computed(()=>this.categories.filter(category=>this.filter()==='all'||category.group===this.filter()));
  readonly hiddenSelected=computed(()=>this.selection.ids().filter(id=>!this.visible().some(category=>category.id===id)).length);
  private readonly request=linkedSignal<{id?:ConjugationCategoryId;count:number;ids:readonly ConjugationCategoryId[]}|null>(()=>{this.workspace.activationRevision();return null;});
  readonly pendingCategories=computed(()=>this.request()?.ids.filter(id=>!isPracticeCategory(id))??[]);
  readonly availableRequest=computed(()=>this.request()?.ids.filter(isPracticeCategory)??[]);
  readonly requestedId=computed(()=>this.request()?.id??null);
  readonly notice=computed(()=>{const request=this.request();return !request?'':request.id?this.i18n.t('conjugations.requestSingle',{name:this.i18n.t(this.categories.find(category=>category.id===request.id)!.titleKey)}):this.i18n.t('conjugations.requestMix',{count:request.count})+' '+this.i18n.t('conjugations.pendingCategories',{names:this.pendingCategories().map(id=>this.i18n.t(this.categories.find(c=>c.id===id)!.titleKey)).join(', ')});});
  constructor(){this.i18n.useStudyCopy(copy);}
  selected(id:ConjugationCategoryId):boolean{return this.selection.ids().includes(id);}
  toggle(id:ConjugationCategoryId,event:Event):void{this.request.set(null);const input=event.target as HTMLInputElement;this.selection.setCategory(id,input.checked);input.checked=this.selected(id);}
  selectAll():void{this.request.set(null);this.selection.selectAll();}
  clear():void{this.request.set(null);this.selection.clear();}
  requestPractice(id?:ConjugationCategoryId):void{
    const intent=this.selection.intent(id);if(!intent)return;
    if(intent.categoryIds.every(isPracticeCategory)){void this.router.navigate(['/conjugations/practice'],{queryParams:{mode:intent.mode,categories:intent.categoryIds.join(',')}});return;}
    this.request.set({id,count:intent.categoryIds.length,ids:intent.categoryIds});
  }
  practiceAvailable():void{const ids=this.availableRequest();if(ids.length)void this.router.navigate(['/conjugations/practice'],{queryParams:{mode:'mixed',categories:ids.join(',')}});}
  best(id:ConjugationCategoryId):number|null{return isPracticeCategory(id)?this.stats.get(id).bestStreak:null;}
}

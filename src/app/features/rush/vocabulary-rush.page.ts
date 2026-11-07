import * as studyCopy from '../../../assets/i18n/deck-study.generated';
import {StudyPrimaryAction} from '../../shared/keyboard/study-primary-action';
import {rushStudyActions} from './rush-study-actions';
import {StudyTimer} from '../../shared/components/study-timer/study-timer';
import {formatStudyTime} from '../../core/services/card-study-time';
import {ChangeDetectionStrategy,Component,OnDestroy,OnInit,inject,effect,untracked} from '@angular/core';
import {ActivatedRoute,Router,RouterLink} from '@angular/router';
import {VocabularyQuestionType,VOCABULARY_QUESTION_TYPES} from '../../core/models/vocabulary.model';
import {RushUnit} from '../../core/models/rush.model';
import {buildVocabularyRushUnits,vocabularyRushConfiguration} from '../../core/services/rush-builders';
import {RushSessionService} from '../../core/services/rush-session.service';
import {RushSettingsService} from '../../core/services/rush-settings.service';
import {TranslationService} from '../../core/services/translation.service';
import {VocabularySettingsService} from '../../core/services/vocabulary-settings.service';
import {VocabularySessionRush} from '../../core/services/vocabulary-session-rush';
import {WorkspaceService} from '../../core/services/workspace.service';
import {VOCABULARY_N5} from '../../data/vocabulary-n5.generated';
import {FuriganaText} from '../../shared/components/furigana-text/furigana-text';
import {MedalBadge} from '../../shared/components/medal-badge/medal-badge';
@Component({selector:'app-vocabulary-rush-page',imports:[StudyPrimaryAction,StudyTimer,RouterLink,FuriganaText,MedalBadge],templateUrl:'./vocabulary-rush.page.html',styleUrl:'./rush-session.scss',changeDetection:ChangeDetectionStrategy.OnPush,host:{'(document:keydown)':'key($event)'}})
export class VocabularyRushPage implements OnInit,OnDestroy{
  readonly rush=inject(RushSessionService);readonly actions=rushStudyActions(this.rush,()=>!this.validScope(),()=>!!this.entry());readonly i18n=inject(TranslationService);
  private readonly settings=inject(VocabularySettingsService);private readonly rushSettings=inject(RushSettingsService);private readonly router=inject(Router);
  private readonly route=inject(ActivatedRoute);private readonly pool=inject(VocabularySessionRush);private readonly workspace=inject(WorkspaceService);
  private readonly owner=this.workspace.active();private readonly epoch=this.workspace.activationRevision();
  private sessionUnits:readonly RushUnit[]|null=null;
  readonly fromSession=this.route.snapshot.queryParamMap.has('sessionRush');
  constructor(){this.i18n.useStudyCopy?.(studyCopy);effect(()=>{const owner=this.workspace.active(),epoch=this.workspace.activationRevision();if(this.fromSession&&(owner!==this.owner||epoch!==this.epoch))untracked(()=>{this.rush.clear();void this.router.navigateByUrl('/vocabulary');});});}
  async ngOnInit(){
    if(this.fromSession){
      if(this.rush.saving()||this.rush.loading()){void this.router.navigateByUrl('/vocabulary/play');return;}
      const selected=this.pool.take(this.route.snapshot.queryParamMap.get('sessionRush')??'');
      if(!selected){void this.router.navigateByUrl('/vocabulary');return;}
      this.sessionUnits=selected.flatMap(unit=>{const entry=VOCABULARY_N5.find(e=>e.id===unit.entryId&&e.enabled);return entry&&VOCABULARY_QUESTION_TYPES.includes(unit.questionType)?[{key:`rush:vocabulary:${unit.entryId}:${unit.questionType}`,module:'vocabulary' as const,contentId:unit.entryId,questionType:unit.questionType}]:[];});
      if(!this.sessionUnits.length){void this.router.navigateByUrl('/vocabulary');return;}
      await this.rush.start('vocabulary',this.sessionUnits,new Date(),()=>this.validScope());return;
    }
    const config=this.rushSettings.getOrInitialize('vocabulary',vocabularyRushConfiguration(this.settings.selection()));await this.rush.start('vocabulary',buildVocabularyRushUnits(VOCABULARY_N5,config));
  }
  ngOnDestroy(){if(this.validScope())void this.rush.checkpoint();else this.rush.clear();}
  entry(){return VOCABULARY_N5.find(item=>item.id===this.rush.currentUnit()?.contentId)??null;}
  meaning(){return this.entry()?.quizMeaning[this.i18n.language()]??'';}
  promptKey(type:string){return`vocabulary.questionType.${type as VocabularyQuestionType}`;}
  private validScope(){return !this.fromSession||this.owner===this.workspace.active()&&this.epoch===this.workspace.activationRevision();}
  key(event:KeyboardEvent):void{if(this.validScope())this.actions.key(event);}
  async exit(){if(!this.validScope()||this.rush.saving()||this.rush.loading())return;const summary=await this.rush.finish();if(!summary&&!this.rush.error())this.home();}
  home(){this.rush.clear();void this.router.navigateByUrl(this.fromSession?'/vocabulary/play':'/vocabulary');}
  another(){if(!this.validScope())return;this.rush.clear();if(this.sessionUnits){void this.rush.start('vocabulary',this.sessionUnits,new Date(),()=>this.validScope());}else void this.router.navigateByUrl('/vocabulary?rush=1');}
  format(n:number){return formatStudyTime(n);}
}

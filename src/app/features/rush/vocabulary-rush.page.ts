import { ChangeDetectionStrategy,Component,OnDestroy,OnInit,inject } from '@angular/core';
import { Router } from '@angular/router';
import { VocabularyQuestionType } from '../../core/models/vocabulary.model';
import { buildVocabularyRushUnits,vocabularyRushConfiguration } from '../../core/services/rush-builders';
import { RushSessionService } from '../../core/services/rush-session.service';
import { RushSettingsService } from '../../core/services/rush-settings.service';
import { TranslationService } from '../../core/services/translation.service';
import { VocabularySettingsService } from '../../core/services/vocabulary-settings.service';
import { VOCABULARY_N5 } from '../../data/vocabulary-n5.generated';
import { FuriganaText } from '../../shared/components/furigana-text/furigana-text';
import { MedalBadge } from '../../shared/components/medal-badge/medal-badge';
@Component({selector:'app-vocabulary-rush-page',imports:[FuriganaText,MedalBadge],templateUrl:'./vocabulary-rush.page.html',styleUrl:'./rush-session.scss',changeDetection:ChangeDetectionStrategy.OnPush,host:{'(document:keydown)':'key($event)'}})
export class VocabularyRushPage implements OnInit,OnDestroy{readonly rush=inject(RushSessionService);readonly i18n=inject(TranslationService);private readonly settings=inject(VocabularySettingsService);private readonly rushSettings=inject(RushSettingsService);private readonly router=inject(Router);async ngOnInit(){const c=this.rushSettings.getOrInitialize('vocabulary',vocabularyRushConfiguration(this.settings.selection()));await this.rush.start('vocabulary',buildVocabularyRushUnits(VOCABULARY_N5,c))}ngOnDestroy(){void this.rush.checkpoint()}entry(){return VOCABULARY_N5.find(item=>item.id===this.rush.currentUnit()?.contentId)??null}meaning(){return this.entry()?.quizMeaning[this.i18n.language()]??''}promptKey(type:string){return`vocabulary.questionType.${type as VocabularyQuestionType}`}key(event:KeyboardEvent){if(event.repeat||(event.code!=='Space'&&event.key!=='Enter'))return;event.preventDefault();this.rush.revealed()?void this.rush.next():this.rush.reveal()}async exit(){const summary=await this.rush.finish();if(!summary&&!this.rush.error())void this.router.navigateByUrl('/vocabulary')}home(){this.rush.clear();void this.router.navigateByUrl('/vocabulary')}another(){this.rush.clear();void this.router.navigateByUrl('/vocabulary?rush=1')}format(n:number){return`${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`}}


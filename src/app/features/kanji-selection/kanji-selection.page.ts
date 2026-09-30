import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { KANJI_N5 } from '../../data/kanji-n5.generated';
import { KANJI_QUESTION_TYPES, KanjiQuestionType } from '../../core/models/kanji.model';
import { KanjiSelection } from '../../core/models/kanji-study.model';
import { isValidKanjiSelection, kanjiStudyUnits } from '../../core/services/kanji-selection';
import { KanjiSettingsService } from '../../core/services/kanji-settings.service';
import { TranslationService } from '../../core/services/translation.service';
@Component({selector:'app-kanji-selection-page',templateUrl:'./kanji-selection.page.html',styleUrl:'./kanji-selection.page.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class KanjiSelectionPage {readonly i18n=inject(TranslationService);readonly questionTypes=KANJI_QUESTION_TYPES;private readonly settings=inject(KanjiSettingsService);private readonly router=inject(Router);readonly draft=signal<KanjiSelection>(structuredClone(this.settings.selection()));readonly valid=computed(()=>isValidKanjiSelection(this.draft()));readonly available=computed(()=>kanjiStudyUnits(KANJI_N5,this.draft()).length);toggleLevel(){this.draft.update(v=>({...v,levels:{N5:!v.levels.N5}}))}toggleType(type:KanjiQuestionType){this.draft.update(v=>({...v,questionTypes:v.questionTypes.includes(type)?v.questionTypes.filter(x=>x!==type):[...v.questionTypes,type]}))}back(){void this.router.navigateByUrl('/kanji')}save(){if(this.valid()){this.settings.save(this.draft());void this.router.navigateByUrl('/kanji')}}}

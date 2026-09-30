import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MedalProgress, MedalState } from '../../core/models/medal.model';
import { medalCompletionRatio } from '../../core/services/medal-rules';
import { VocabularyMedalService } from '../../core/services/vocabulary-medal.service';
import { TranslationService } from '../../core/services/translation.service';
import { MedalBadge } from '../../shared/components/medal-badge/medal-badge';
@Component({selector:'app-vocabulary-medals-page',imports:[RouterLink,MedalBadge],templateUrl:'./vocabulary-medals.page.html',styleUrl:'./vocabulary-medals.page.scss',changeDetection:ChangeDetectionStrategy.OnPush,host:{'(document:keydown.escape)':'selected.set(null)'}})
export class VocabularyMedalsPage {readonly medals=inject(VocabularyMedalService);readonly i18n=inject(TranslationService);readonly selected=signal<MedalState|null>(null);percent(p:MedalProgress){return Math.round(medalCompletionRatio(p)*100)}formattedDate(iso:string){const locale={es:'es-ES',en:'en-US',ca:'ca-ES'}[this.i18n.language()];return new Intl.DateTimeFormat(locale,{dateStyle:'medium'}).format(new Date(iso))}}



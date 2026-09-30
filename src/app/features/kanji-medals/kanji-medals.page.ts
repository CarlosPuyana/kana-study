import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MedalProgress, MedalState } from '../../core/models/medal.model';
import { medalCompletionRatio } from '../../core/services/medal-rules';
import { KanjiMedalService } from '../../core/services/kanji-medal.service';
import { TranslationService } from '../../core/services/translation.service';
import { MedalBadge } from '../../shared/components/medal-badge/medal-badge';
@Component({selector:'app-kanji-medals-page',imports:[RouterLink,MedalBadge],templateUrl:'./kanji-medals.page.html',styleUrl:'./kanji-medals.page.scss',changeDetection:ChangeDetectionStrategy.OnPush,host:{'(document:keydown.escape)':'selected.set(null)'}})
export class KanjiMedalsPage {readonly medals=inject(KanjiMedalService);readonly i18n=inject(TranslationService);readonly selected=signal<MedalState|null>(null);percent(p:MedalProgress){return Math.round(medalCompletionRatio(p)*100)}formattedDate(iso:string){const locale={es:'es-ES',en:'en-US',ca:'ca-ES'}[this.i18n.language()];return new Intl.DateTimeFormat(locale,{dateStyle:'medium'}).format(new Date(iso))}}


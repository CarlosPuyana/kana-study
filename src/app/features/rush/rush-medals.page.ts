import { DecimalPipe,Location } from '@angular/common';
import { ChangeDetectionStrategy,Component,OnInit,inject,signal } from '@angular/core';
import { Router } from '@angular/router';
import { MedalProgress,MedalState } from '../../core/models/medal.model';
import { medalCompletionRatio } from '../../core/services/medal-rules';
import { RushMedalService } from '../../core/services/rush-medal.service';
import { TranslationService } from '../../core/services/translation.service';
import { MedalBadge } from '../../shared/components/medal-badge/medal-badge';
@Component({selector:'app-rush-medals-page',imports:[MedalBadge,DecimalPipe],templateUrl:'./rush-medals.page.html',styleUrl:'../medals/medals.page.scss',changeDetection:ChangeDetectionStrategy.OnPush,host:{'(document:keydown.escape)':'selected.set(null)'}})
export class RushMedalsPage implements OnInit{readonly medals=inject(RushMedalService);readonly i18n=inject(TranslationService);readonly selected=signal<MedalState|null>(null);private readonly location=inject(Location);private readonly router=inject(Router);async ngOnInit(){await this.medals.refresh()}back(){if(((this.location.getState() as {navigationId?:number})?.navigationId??0)>1)this.location.back();else void this.router.navigateByUrl('/')}percent(p:MedalProgress){return Math.round(medalCompletionRatio(p)*100)}formattedDate(iso:string){const locale={es:'es-ES',en:'en-US',ca:'ca-ES'}[this.i18n.language()];return new Intl.DateTimeFormat(locale,{dateStyle:'medium'}).format(new Date(iso))}}

import { ChangeDetectionStrategy,Component,OnDestroy,OnInit,inject } from '@angular/core';
import { Router } from '@angular/router';
import { buildKanaRushUnits,kanaRushConfiguration } from '../../core/services/rush-builders';
import { RushSessionService } from '../../core/services/rush-session.service';
import { RushSettingsService } from '../../core/services/rush-settings.service';
import { SettingsService } from '../../core/services/settings.service';
import { TranslationService } from '../../core/services/translation.service';
import { ALL_KANA } from '../../data/kana';
import { MedalBadge } from '../../shared/components/medal-badge/medal-badge';
@Component({selector:'app-kana-rush-page',imports:[MedalBadge],templateUrl:'./kana-rush.page.html',styleUrl:'./rush-session.scss',changeDetection:ChangeDetectionStrategy.OnPush,host:{'(document:keydown)':'key($event)'}})
export class KanaRushPage implements OnInit,OnDestroy{readonly rush=inject(RushSessionService);readonly i18n=inject(TranslationService);private readonly settings=inject(SettingsService);private readonly rushSettings=inject(RushSettingsService);private readonly router=inject(Router);async ngOnInit(){const c=this.rushSettings.getOrInitialize('kana',kanaRushConfiguration(this.settings.selection()));await this.rush.start('kana',buildKanaRushUnits(ALL_KANA,c))}ngOnDestroy(){void this.rush.checkpoint()}kana(){return ALL_KANA.find(item=>item.id===this.rush.currentUnit()?.contentId)??null}key(event:KeyboardEvent){if(event.repeat||(event.code!=='Space'&&event.key!=='Enter'))return;event.preventDefault();this.rush.revealed()?void this.rush.next():this.rush.reveal()}async exit(){const summary=await this.rush.finish();if(!summary&&!this.rush.error())void this.router.navigateByUrl('/')}home(){this.rush.clear();void this.router.navigateByUrl('/')}another(){this.rush.clear();void this.router.navigateByUrl('/?rush=1')}format(n:number){return`${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`}}


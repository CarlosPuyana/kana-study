import { ChangeDetectionStrategy,Component,inject,output } from '@angular/core';
import { Router } from '@angular/router';
import { RushConfiguration } from '../../core/models/rush.model';
import { buildKanaRushUnits,kanaRushConfiguration } from '../../core/services/rush-builders';
import { RushSettingsService } from '../../core/services/rush-settings.service';
import { SettingsService } from '../../core/services/settings.service';
import { ALL_KANA } from '../../data/kana';
import { RushConfigDialog,RushConfigOption } from '../../shared/components/rush-config-dialog/rush-config-dialog';
@Component({selector:'app-kana-rush-launcher',imports:[RushConfigDialog],template:'<app-rush-config-dialog module="kana" [initial]="config" [contentOptions]="content" [questionOptions]="types" [countUnits]="countUnits" (closed)="closed.emit()" (started)="start($event)"/>',changeDetection:ChangeDetectionStrategy.OnPush})
export class KanaRushLauncher{readonly closed=output<void>();readonly content:readonly RushConfigOption[]=['hiragana','katakana'].flatMap(type=>['basic','dakuten','handakuten','combination'].map(variant=>({id:`${type}:${variant}`,labelKey:`rush.kana.${type}-${variant}`})));readonly types:readonly RushConfigOption[]=[{id:'kana-to-romaji',labelKey:'questionTypes.kana-to-romaji'},{id:'romaji-to-kana',labelKey:'questionTypes.romaji-to-kana'}];readonly countUnits=(config:RushConfiguration)=>buildKanaRushUnits(ALL_KANA,config).length;private readonly rushSettings=inject(RushSettingsService);private readonly settings=inject(SettingsService);private readonly router=inject(Router);readonly config=this.rushSettings.getOrInitialize('kana',kanaRushConfiguration(this.settings.selection()));start(config:RushConfiguration){this.rushSettings.save('kana',config);this.closed.emit();void this.router.navigateByUrl('/rush')}}

import * as studyCopy from '../../../../assets/i18n/deck-study.generated';
import {KaishiStaticMediaService} from '../../../core/services/kaishi-static-media.service';
import {ChangeDetectionStrategy,Component,inject,OnDestroy} from '@angular/core';
import {KaishiMediaService} from '../../../core/services/kaishi-media.service';
import {KAISHI_PACKAGE} from '../../../core/models/kaishi-media.model';
import {TranslationService} from '../../../core/services/translation.service';
@Component({selector:'app-kaishi-media-settings',templateUrl:'./kaishi-media-settings.html',styleUrl:'./kaishi-media-settings.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class KaishiMediaSettings implements OnDestroy{
 readonly remote=inject(KaishiStaticMediaService);
 constructor(){this.i18n.useStudyCopy?.(studyCopy);void this.remote.catalog().catch(()=>{});}
 readonly media=inject(KaishiMediaService);readonly i18n=inject(TranslationService);readonly source=KAISHI_PACKAGE.url;readonly total=KAISHI_PACKAGE.resources;
 select(event:Event):void{const input=event.target as HTMLInputElement,file=input.files?.[0];input.value='';if(file)void this.media.start(file);}
 ngOnDestroy():void{if(this.media.busy())void this.media.cancel();}
}

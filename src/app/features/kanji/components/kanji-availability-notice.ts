import {ChangeDetectionStrategy,Component,DestroyRef,inject} from '@angular/core';
import {KanjiAvailabilityService} from '../../../core/services/kanji-availability.service';
import {TranslationService} from '../../../core/services/translation.service';
import * as copy from '../../../../assets/i18n/deck-study.generated';

@Component({selector:'app-kanji-availability-notice',template:`
  @let s=availability.state();
  <div class="availability" role="status" aria-live="polite">
    <p>{{i18n.t('kanji.availability.'+s.status,{count:s.due})}}</p>
    @if(s.total){<p>{{i18n.t('kanji.availability.counts',{due:s.due,fresh:s.fresh})}}</p>}
    @if(s.nextDue!==null){<p>{{i18n.t('kanji.availability.next',{date:date(s.nextDue)})}}</p>}
    @if(s.blocked){<p>{{i18n.t('kanji.availability.voluntary')}}</p>}
  </div>`,styles:`:host{display:block;min-width:0}.availability{color:var(--text-secondary);font-size:.9rem;line-height:1.5;overflow-wrap:anywhere}.availability p{margin:.5rem 0}`,
  changeDetection:ChangeDetectionStrategy.OnPush})
export class KanjiAvailabilityNotice {
  readonly availability=inject(KanjiAvailabilityService);
  readonly i18n=inject(TranslationService);
  constructor(){this.i18n.useStudyCopy(copy);this.availability.watch(inject(DestroyRef));}
  date(at:number):string{return new Intl.DateTimeFormat(this.i18n.language(),{dateStyle:'medium',timeStyle:'medium',timeZone:'Europe/Madrid'}).format(at);}
}

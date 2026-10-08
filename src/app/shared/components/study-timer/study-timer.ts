import { afterRenderEffect, ChangeDetectionStrategy, Component, DestroyRef, inject, input } from '@angular/core';
import { StudyClock } from '../../../core/services/study-clock';
import { TranslationService } from '../../../core/services/translation.service';

@Component({selector:'app-study-timer', changeDetection:ChangeDetectionStrategy.OnPush,
  template:`<span [attr.role]="result()?'status':'timer'" [attr.aria-label]="i18n.t('studyTime.label')">{{i18n.t('studyTime.label')}}: <strong>{{clock()?.label()??'00:00'}}</strong></span>`,
  styles:[`:host{display:block;min-width:0;font-size:.85rem;color:var(--text-secondary)}span{display:flex;align-items:center;flex-wrap:wrap;gap:.35rem}strong{font-variant-numeric:tabular-nums;color:var(--text-primary)}`],
})
export class StudyTimer {
  readonly clock=input<StudyClock>(); readonly result=input(false); readonly i18n=inject(TranslationService);
  private attached:StudyClock|undefined;
  constructor(){
    afterRenderEffect(()=>{
      const clock=this.clock(),result=this.result();
      if(this.attached!==clock||result){this.attached?.detach();this.attached=undefined;}
      if(clock&&!result){clock.attach();this.attached=clock;}
    });
    inject(DestroyRef).onDestroy(()=>this.attached?.detach());
  }
}

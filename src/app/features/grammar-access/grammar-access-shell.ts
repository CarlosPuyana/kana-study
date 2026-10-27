import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { GrammarAccessService } from '../../core/services/grammar-access.service';
import { grammarDestination } from '../../core/services/grammar-access.guard';
import { TranslationService } from '../../core/services/translation.service';

/** Block pending checks; destroy on account changes and leave on denial, preserving progress. */
@Component({selector:'app-grammar-access-shell',imports:[RouterOutlet],changeDetection:ChangeDetectionStrategy.OnPush,
  template:`@if(access.scope()===entryScope){<section [hidden]="!access.allowed()" [attr.inert]="access.allowed()?null:''"><router-outlet/></section>}
    @if(access.state()==='checking'){<p role="status" aria-live="polite">{{i18n.t('grammarAccess.checking')}}</p>}`})
export class GrammarAccessShell {
  readonly access=inject(GrammarAccessService);
  readonly i18n=inject(TranslationService);
  readonly entryScope=this.access.allowed()?this.access.scope():undefined;
  private readonly router=inject(Router);
  constructor(){effect(()=>{if((this.access.scope()!==this.entryScope||this.access.state()==='denied'||this.access.state()==='error')&&!this.router.getCurrentNavigation())void this.router.navigate(['/grammar-access'],{
    queryParams:{return:grammarDestination(this.router.url)},replaceUrl:true,
  });});}
}

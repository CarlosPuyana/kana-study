import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { GrammarAccessService } from '../../core/services/grammar-access.service';
import { grammarDestination } from '../../core/services/grammar-access.guard';
import { TranslationService } from '../../core/services/translation.service';

@Component({selector:'app-grammar-access',imports:[RouterLink],changeDetection:ChangeDetectionStrategy.OnPush,
  template:`<main class="page-shell"><h1 #heading tabindex="-1">{{i18n.t('grammarAccess.title')}}</h1>
    <p role="status" aria-live="polite">{{i18n.t('grammarAccess.'+access.state())}}</p>
    <nav [attr.aria-label]="i18n.t('grammarAccess.title')"><a routerLink="/">{{i18n.t('common.returnHome')}}</a>
      @if(auth.ready()&&!auth.authenticated()){<a routerLink="/auth" [queryParams]="{return:destination}">{{i18n.t('grammarAccess.login')}}</a>}
      @if(access.state()!=='checking'){<button type="button" (click)="retry()">{{i18n.t('grammarAccess.retry')}}</button>}
    </nav></main>`,
  styles:`:host{display:block}.page-shell{max-width:38rem;margin:3rem auto;padding:1rem}h1{color:var(--text-primary)}p{color:var(--text-secondary);line-height:1.6}nav{display:flex;flex-wrap:wrap;gap:1rem}a,button{padding:.8rem 1rem;border:1px solid var(--border);border-radius:.8rem;background:var(--surface);color:var(--text-primary);font:inherit;cursor:pointer}a:focus-visible,button:focus-visible{outline:3px solid var(--accent);outline-offset:3px}`})
export class GrammarAccessPage implements AfterViewInit {
  readonly access=inject(GrammarAccessService); readonly auth=inject(AuthService); readonly i18n=inject(TranslationService);
  private readonly router=inject(Router);
  readonly destination=grammarDestination(inject(ActivatedRoute).snapshot.queryParamMap.get('return'));
  private readonly heading=viewChild<ElementRef<HTMLElement>>('heading');
  ngAfterViewInit():void { this.heading()?.nativeElement.focus(); }
  async retry():Promise<void>{if(await this.access.check(true))await this.router.navigateByUrl(this.destination);}
}

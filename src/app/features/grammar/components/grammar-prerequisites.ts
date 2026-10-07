import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {RouterLink} from '@angular/router';
import {PageHeader} from '../../../shared/components/page-header/page-header';
import {TranslationService} from '../../../core/services/translation.service';
@Component({selector:'app-grammar-prerequisites',imports:[RouterLink,PageHeader],changeDetection:ChangeDetectionStrategy.OnPush,template:`
  <app-page-header titleKey="grammar.v2.before" backRoute="/grammar"/>
  <section class="prerequisites"><p>{{i18n.t('grammar.v2.prerequisite')}}</p>
    <nav [attr.aria-label]="i18n.t('grammar.kanaHelp')"><a routerLink="/selection" [queryParams]="{from:'grammar',kana:'hiragana'}">{{i18n.t('grammar.practiceHiragana')}}</a><a routerLink="/selection" [queryParams]="{from:'grammar',kana:'katakana'}">{{i18n.t('grammar.practiceKatakana')}}</a></nav>
    <h2>{{i18n.t('grammar.v2.reminder')}}</h2><ul>@for(key of ['waReading','heReading','woReading'];track key){<li>{{i18n.t('grammar.v2.'+key)}}</li>}</ul>
    <p>{{i18n.t('grammar.v2.optional')}}</p><a class="start" routerLink="/grammar/n5/01/sentence-structure-context">{{i18n.t('grammar.v2.start')}}</a>
  </section>
`,styles:[`:host{display:block;color:var(--text-primary)}.prerequisites{max-width:48rem;margin:auto;padding:1rem;line-height:1.8}nav{display:flex;flex-wrap:wrap;gap:1rem;margin-block:1.5rem}a{display:inline-block;min-height:44px;padding:.7rem 1rem;border:1px solid var(--border);border-radius:.7rem;background:var(--surface);color:var(--text-primary);overflow-wrap:anywhere}.start{background:var(--primary-soft);color:var(--text-primary);border-color:var(--primary)}a:focus-visible{outline:2px solid var(--primary);outline-offset:3px}li{margin-block:.7rem}`]})
export class GrammarPrerequisitesComponent {readonly i18n=inject(TranslationService);}

import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslationService } from '../../../core/services/translation.service';
import { GrammarProgressService } from '../../../core/services/grammar-progress.service';
import { GrammarTopic, GrammarStudySession } from '../models/grammar.model';

@Component({selector:'app-grammar-sidebar',imports:[RouterLink,RouterLinkActive],changeDetection:ChangeDetectionStrategy.OnPush,template:`
  <div class="sidebar-head"><div class="brand"><div class="brand-icon">🌸</div><div><h1>{{i18n.t('grammar.title')}}</h1><p>{{i18n.t('grammar.subtitle')}}</p></div></div><button class="icon-btn" [attr.aria-label]="i18n.t('grammar.collapse')" (click)="collapsed.emit()">←</button></div>
  <nav class="side-nav" [attr.aria-label]="i18n.t('grammar.title')">
    <a class="nav-item" routerLink="/more" [queryParams]="{from:'grammar'}"><span class="nav-icon">⌂</span><span>{{i18n.t('grammar.home')}}</span></a>
    <div class="nav-group open"><button class="nav-item group-title" [attr.aria-expanded]="n5Open()" aria-controls="grammar-n5" (click)="n5Open.set(!n5Open())"><span class="nav-icon">🗻</span><span>N5</span><span class="chevron">{{n5Open()?'⌄':'›'}}</span></button>
      @if(n5Open()){
        <div class="subnav" id="grammar-n5"><a class="subnav-item subnav-link" routerLink="/grammar" routerLinkActive="selected" [routerLinkActiveOptions]="{exact:true}" ariaCurrentWhenActive="page" (click)="navigated.emit()"><span class="sub-icon">🗺️</span><span>{{i18n.t('grammar.roadmap')}}</span></a>
        @for(topic of topics();track topic.id){
          <a class="subnav-item subnav-link" [routerLink]="['/grammar/n5',topic.id]" [class.selected]="topic.id===topicId()" (click)="navigated.emit()"><span class="dot"></span><span>{{i18n.t('grammar.topic',{number:topic.id})}}</span><span class="mini-chevron">{{topic.id===topicId()?'⌄':'›'}}</span></a>
          @if(topic.id===topicId()){@for(session of sessions();track session.id){<a class="topic-subnav-item subtopic-link" [routerLink]="['/grammar/n5',topic.id,session.lessonIds[0]]" [class.active]="session.id===sessionId()" [attr.aria-current]="session.id===sessionId()?'step':null" (click)="navigated.emit()"><span [attr.aria-label]="i18n.t('grammar.progressState.'+progress.sessionStatus(session))">{{progress.statusSymbol(progress.sessionStatus(session))}}</span> {{session.position}} · {{i18n.t(session.titleKey)}}</a>}}
        }
        </div>
      }
    </div>
    @for(level of ['N4','N3','N2','N1'];track level){<button class="nav-item dim" disabled><span class="nav-icon">🗻</span><span>{{level}}</span><span aria-hidden="true">🔒</span></button>}
  </nav>
  <div class="sidebar-foot"><button class="nav-item" disabled><span class="nav-icon">📖</span><span>{{i18n.t('grammar.resources')}}</span></button><a class="nav-item" routerLink="/settings"><span class="nav-icon">⚙️</span><span>{{i18n.t('grammar.settings')}}</span></a></div>
`})
export class GrammarSidebar {
  readonly progress=inject(GrammarProgressService);
  readonly i18n=inject(TranslationService);readonly topics=input.required<readonly GrammarTopic[]>();readonly topicId=input<string|null>(null);
  readonly sessions=input<readonly GrammarStudySession[]>([]);readonly sessionId=input<string|null>(null);
  readonly n5Open=signal(true);readonly collapsed=output<void>();readonly navigated=output<void>();
}

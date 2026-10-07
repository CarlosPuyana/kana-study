import {ChangeDetectionStrategy, Component, inject, input, signal, effect} from '@angular/core';
import {GrammarConcept} from '../../../core/models/grammar-v2.model';
import {TranslationService} from '../../../core/services/translation.service';

@Component({selector:'app-grammar-v2-lesson',changeDetection:ChangeDetectionStrategy.OnPush,template:`
  <section class="v2-card"><h3>{{i18n.t('grammar.v2.goal')}}</h3><p>{{i18n.t(concept().goalKey)}}</p></section>
  <section class="v2-card"><h3>{{i18n.t('grammar.v2.idea')}}</h3><p>{{i18n.t(concept().lesson.ideaKey)}}</p></section>
  @if(concept().lesson.formation.length){<section class="v2-card"><h3>{{i18n.t('grammar.v2.formation')}}</h3>@for(block of concept().lesson.formation;track $index){<p class="pattern" lang="ja">{{block.pattern}}</p>@if(block.noteKey){<p>{{i18n.t(block.noteKey!)}}</p>}}</section>}
  @for(table of concept().lesson.tables;track table.captionKey){<div class="table-scroll" tabindex="0" role="region" [attr.aria-label]="i18n.t(table.captionKey)"><table><caption>{{i18n.t(table.captionKey)}}</caption><thead><tr><th scope="col">{{i18n.t('grammar.v2.family')}}</th>@for(header of table.headerKeys;track header){<th scope="col">{{i18n.t(header)}}</th>}</tr></thead><tbody>@for(row of table.rows;track row.labelKey){<tr><th scope="row">{{i18n.t(row.labelKey)}}</th>@for(cell of row.cells;track cell){<td lang="ja">{{cell}}</td>}</tr>}</tbody></table></div>}
  <section class="v2-card"><h3>{{i18n.t('grammar.v2.examples')}}</h3>@for(example of concept().lesson.examples;track example.japanese){<article class="example"><p class="japanese" lang="ja">{{example.japanese}}</p>@if(example.reading){<small lang="ja">{{example.reading}}</small>}<p>{{i18n.t(example.meaningKey)}}</p>@if(example.noteKey){<p>{{i18n.t(example.noteKey!)}}</p>}</article>}</section>
  @if(concept().lesson.mistakes?.length){<section class="v2-card"><h3>{{i18n.t('grammar.v2.mistakes')}}</h3>@for(mistake of concept().lesson.mistakes;track mistake.wrong){<p class="invalid" lang="ja"><span>{{i18n.t('grammar.v2.invalid')}}</span> {{mistake.wrong}}</p><p lang="ja">✔ {{mistake.correction}}</p><p>{{i18n.t(mistake.explanationKey)}}</p>}</section>}
  @if(concept().lesson.contrasts?.length){<section class="v2-card"><h3>{{i18n.t('grammar.v2.contrasts')}}</h3>@for(contrast of concept().lesson.contrasts;track contrast.left){<div class="comparison"><p lang="ja">{{contrast.left}}</p><p lang="ja">{{contrast.right}}</p></div><p>{{i18n.t(contrast.explanationKey)}}</p>}</section>}
  <section class="v2-card"><button type="button" class="details-toggle" [attr.aria-expanded]="expanded()" [attr.aria-controls]="'detail-'+concept().id" (click)="expanded.update(toggle)">{{i18n.t('grammar.v2.details')}}</button><div [id]="'detail-'+concept().id" [hidden]="!expanded()">@for(section of concept().lesson.detailedExplanation;track section.id){<h4>{{i18n.t(section.titleKey)}}</h4><p>{{i18n.t(section.bodyKey)}}</p>@for(example of section.examples;track example.japanese){<p lang="ja">{{example.japanese}}</p><p>{{i18n.t(example.meaningKey)}}</p>}}</div></section>
  <h3>{{i18n.t('grammar.v2.practice')}}</h3>
`,styles:[`
  :host{display:block;min-width:0;color:var(--text-primary)}
  .v2-card,.table-scroll{background:var(--surface);border:1px solid var(--border);border-radius:1rem;padding:1rem;margin-block:1rem;line-height:1.75;overflow-wrap:anywhere}
  h3,h4{margin-block:0 .6rem}h4{margin-top:1rem}p{margin-block:.5rem}.example+.example{border-top:1px solid var(--border);margin-top:1rem;padding-top:.7rem}
  .pattern,.japanese{font-size:1.25rem}.pattern{white-space:pre-wrap}small{color:var(--text-secondary)}.invalid{color:var(--error)}.invalid span{font-size:.85rem}
  .comparison{display:flex;gap:1rem;flex-wrap:wrap}.table-scroll{overflow-x:auto}table{border-collapse:collapse;min-width:100%}caption{text-align:start;font-weight:700;margin-bottom:.7rem}td,th{padding:.6rem;border:1px solid var(--border);text-align:start;white-space:nowrap}
  .details-toggle{font:inherit;font-weight:700;min-height:44px;width:100%;text-align:start;color:var(--text-primary);background:var(--surface-raised);border:1px solid var(--border);border-radius:.7rem;padding:.7rem;cursor:pointer}
  button:focus-visible,.table-scroll:focus-visible{outline:2px solid var(--primary);outline-offset:3px}
`]})
export class GrammarV2LessonComponent {
  readonly concept=input.required<GrammarConcept>();readonly i18n=inject(TranslationService);readonly expanded=signal(false);
  readonly toggle=(value:boolean)=>!value;
  constructor(){effect(()=>{this.concept();this.expanded.set(false);});}
}

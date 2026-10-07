import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';
const page = () => import('./pages/grammar.page').then(module => module.GrammarPage);
const title = () => `${inject(TranslationService).t('grammar.title')} · Kana Study`;
export const GRAMMAR_ROUTES: Routes = [
  {path:'n5/00/:lessonId',redirectTo:'n5/00',pathMatch:'full'},
  {path:'', data: {titleKey: 'grammar.title'},loadComponent:page,title},
  {path:'review', data: {titleKey: 'grammar.title'},loadComponent:()=>import('./pages/grammar-review.page').then(module=>module.GrammarReviewPage),title},
  {path:'n5/:topicId/practice', data: {titleKey: 'grammar.title'},loadComponent:page,title},
  {path:'n5/:topicId/:lessonId', data: {titleKey: 'grammar.title'},loadComponent:page,title},
  {path:'n5/:topicId', data: {titleKey: 'grammar.title'},loadComponent:page,title},
  {path:'**',redirectTo:''},
];

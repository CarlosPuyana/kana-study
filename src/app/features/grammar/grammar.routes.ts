import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';
const page = () => import('./pages/grammar.page').then(module => module.GrammarPage);
const title = () => `${inject(TranslationService).t('grammar.title')} · Kana Study`;
export const GRAMMAR_ROUTES: Routes = [
  {path:'',loadComponent:page,title},
  {path:'review',loadComponent:()=>import('./pages/grammar-review.page').then(module=>module.GrammarReviewPage),title},
  {path:'n5/:topicId/practice',loadComponent:page,title},
  {path:'n5/:topicId/:lessonId',loadComponent:page,title},
  {path:'n5/:topicId',loadComponent:page,title},
  {path:'**',redirectTo:''},
];

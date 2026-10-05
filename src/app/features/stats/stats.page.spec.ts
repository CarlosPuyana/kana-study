import {Component, signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {StatsPage} from './stats.page';
import {LearningAnalyticsService, calculateLearningAnalytics} from '../../core/services/learning-analytics.service';
import {SettingsService} from '../../core/services/settings.service';
import {AppLanguage} from '../../core/models/settings.model';
import {WeaknessRecord} from '../../core/models/weakness.model';
import {routes} from '../../app.routes';
import {APP_MODULES} from '../../data/app-modules';
import {MorePage} from '../more/more.page';
import {AccountControl} from '../../shared/components/account-control/account-control';

@Component({selector:'app-account-control',template:''})class AccountPlaceholder{}
const learningRecords:WeaknessRecord[]=[
  {module:'vocabulary',activity:'learn',itemId:'word',questionType:'meaning-to-japanese',attempts:10,failures:8,consecutiveCorrect:0,score:10,lastAttemptAt:new Date().toISOString()},
  {module:'vocabulary',activity:'learn',itemId:'word',questionType:'japanese-to-meaning',attempts:10,failures:1,consecutiveCorrect:0,score:0,lastAttemptAt:new Date().toISOString()},
];
describe('local learning statistics page',()=>{
  const language=signal<AppLanguage>('es'),stats=signal(calculateLearningAnalytics([],[]));
  beforeEach(()=>{
    language.set('es');stats.set(calculateLearningAnalytics([],[]));
    TestBed.configureTestingModule({providers:[provideRouter([]),
      {provide:SettingsService,useValue:{language}},
      {provide:LearningAnalyticsService,useValue:{stats,refresh:vi.fn()}},
    ]});
  });
  it('exposes a lazy /stats route without authentication and does not create an APP_MODULE',async()=>{
    const route=routes.find(r=>r.path==='stats')!;expect(route.canActivate).toBeUndefined();expect(route.canMatch).toBeUndefined();
    expect(await (route.loadComponent as ()=>Promise<unknown>)()).toBe(StatsPage);
    expect(APP_MODULES.some(m=>String(m.id)==='stats')).toBe(false);
  });
  it('shows honest empty metrics without failed-looking 0% bars',()=>{
    const f=TestBed.createComponent(StatsPage);f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Aún no hay suficientes datos');
    expect(f.nativeElement.querySelectorAll('.bar')).toHaveLength(0);
    expect(f.nativeElement.querySelectorAll('.accuracy')).toHaveLength(0);
    expect(f.nativeElement.querySelector('a[href="/weaknesses"]')).not.toBeNull();
  });
  for(const [lang,label,direction] of [['es','Estadísticas','Significado → Japonés'],['en','Statistics','Meaning → Japanese'],['ca','Estadístiques','Significat → Japonès']] as const){
    it(`translates directions and recommendations in ${lang}`,()=>{
      language.set(lang);stats.set(calculateLearningAnalytics(learningRecords,[]));
      const f=TestBed.createComponent(StatsPage);f.detectChanges();
      const text=f.nativeElement.textContent;
      expect(text).toContain(label);expect(text).toContain(direction);
      expect(text).not.toContain('meaning-to-japanese');expect(text).not.toContain('stats.');expect(text).not.toContain('{{');
      expect(f.nativeElement.querySelectorAll('.recommendation p')).toHaveLength(1);
    });
  }
  it('updates performance after source-derived statistics change',()=>{
    const f=TestBed.createComponent(StatsPage);f.detectChanges();expect(f.nativeElement.querySelectorAll('.accuracy')).toHaveLength(0);
    stats.set(calculateLearningAnalytics(learningRecords,[]));f.detectChanges();expect(f.nativeElement.querySelectorAll('.accuracy')).toHaveLength(2);
  });
  it('shows statistics as a prominent tool while hiding unavailable module cards',()=>{
    TestBed.overrideComponent(MorePage,{remove:{imports:[AccountControl]},add:{imports:[AccountPlaceholder]}});
    const f=TestBed.createComponent(MorePage);f.detectChanges();
    expect(f.nativeElement.querySelector('.learning-tools a[href="/stats"]')?.textContent).toContain('Estadísticas');
    expect(f.nativeElement.querySelectorAll('app-module-card')).toHaveLength(APP_MODULES.filter(module=>module.available).length);
  });
});

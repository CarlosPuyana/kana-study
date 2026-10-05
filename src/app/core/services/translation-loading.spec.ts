import {TestBed} from '@angular/core/testing';
import {TranslationService} from './translation.service';
import {SettingsService} from './settings.service';
import es from '../../../assets/i18n/es.json';
import en from '../../../assets/i18n/en.json';
import ca from '../../../assets/i18n/ca.json';

describe('feature translation loading',()=>{
  beforeEach(()=>{localStorage.clear();vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}));});
  afterEach(()=>{TestBed.resetTestingModule();vi.unstubAllGlobals();});
  it('keeps initial UI, interpolation and titles available synchronously in every language',()=>{
    const i18n=TestBed.inject(TranslationService),settings=TestBed.inject(SettingsService);
    for(const language of ['es','en','ca'] as const){settings.setLanguage(language);expect(i18n.t('more.title')).toBe(({es,en,ca}[language])['more.title']);}
    expect(i18n.t('grammar.topic',{number:'00'})).toContain('00');
  });
  it('loads Grammar once and immediately supports subsequent ES/EN/CA switches',async()=>{
    const i18n=TestBed.inject(TranslationService),settings=TestBed.inject(SettingsService);
    await Promise.all([i18n.loadGrammar(),i18n.loadGrammar()]);
    for(const language of ['en','ca','es'] as const){settings.setLanguage(language);expect(i18n.t('grammar.content.1')).toBe(({es,en,ca}[language])['grammar.content.1']);}
    await i18n.loadGrammar();expect(i18n.t('grammar.content.1')).toBe(es['grammar.content.1']);
  });
});

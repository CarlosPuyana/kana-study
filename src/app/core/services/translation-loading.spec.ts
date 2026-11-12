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
  it('loads reader copy once, keeps other feature copy and supports all languages without another load',async()=>{
    const i18n=TestBed.inject(TranslationService),settings=TestBed.inject(SettingsService);
    i18n.useStudyCopy({es:{'feature.test':'ES'},en:{'feature.test':'EN'},ca:{'feature.test':'CA'}});
    const register=vi.spyOn(i18n,'useStudyCopy'),first=i18n.loadManga();expect(i18n.loadManga()).toBe(first);await first;
    for(const language of ['es','en','ca'] as const){settings.setLanguage(language);for(const key of ['manga.remote.title','manga.read'] as const)expect(i18n.t(key)).toBe(({es,en,ca}[language])[key]);expect(i18n.t('feature.test')).toBe(language.toUpperCase());}
    await i18n.loadManga();expect(register).toHaveBeenCalledTimes(1);
  });
  it('keeps cross-module Manga labels synchronous before visiting the reader',()=>{
    const i18n=TestBed.inject(TranslationService),settings=TestBed.inject(SettingsService);
    for(const language of ['es','en','ca'] as const){settings.setLanguage(language);for(const key of ['manga.page','manga.fsrs.title','manga.assist.word','manga.grammar.return','manga.saved.title'] as const)expect(i18n.t(key)).toBe(({es,en,ca}[language])[key]);}
  });
  it('clears a failed reader load so navigation can retry safely',async()=>{
    const i18n=TestBed.inject(TranslationService),register=vi.spyOn(i18n,'useStudyCopy').mockImplementationOnce(()=>{throw Error('synthetic load failure');});
    await expect(i18n.loadManga()).rejects.toThrow('synthetic load failure');await expect(i18n.loadManga()).resolves.toBeUndefined();expect(register).toHaveBeenCalledTimes(2);expect(i18n.t('manga.remote.title')).toBe(es['manga.remote.title']);
  });
});

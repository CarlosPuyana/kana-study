import {TestBed} from '@angular/core/testing';
import {ActivatedRoute,convertToParamMap} from '@angular/router';
import {SettingsPage} from './settings.page';
import {SettingsService} from '../../core/services/settings.service';
import {ProgressService} from '../../core/services/progress.service';
import {TranslationService} from '../../core/services/translation.service';

describe('Settings contextual return',()=>{
  afterEach(()=>TestBed.resetTestingModule());
  for(const [value,expected] of [[null,'/'],['/more','/more'],['/more?from=kanji','/more?from=kanji'],['https://example.test','/'],['//example.test','/'],['/%2Fexample.test','/']]){
    it(`returns safely from ${value}`,()=>{
      TestBed.configureTestingModule({providers:[{provide:ActivatedRoute,useValue:{snapshot:{queryParamMap:convertToParamMap(value?{return:value}:{})}}},{provide:SettingsService,useValue:{}},{provide:ProgressService,useValue:{}},{provide:TranslationService,useValue:{}}]});
      expect(TestBed.runInInjectionContext(()=>new SettingsPage()).returnUrl).toBe(expected);
    });
  }
});

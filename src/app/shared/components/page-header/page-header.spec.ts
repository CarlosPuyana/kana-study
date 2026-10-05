import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {PageHeader} from './page-header';
import {MorePage} from '../../../features/more/more.page';
import {SettingsService} from '../../../core/services/settings.service';
describe('shared page header and global tools',()=>{
  beforeEach(()=>{localStorage.clear();vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:vi.fn()}));TestBed.configureTestingModule({providers:[provideRouter([])]});});
  afterEach(()=>{TestBed.resetTestingModule();vi.unstubAllGlobals();});
  it('has a localized heading, named back control and retains module query context',()=>{
    const fixture=TestBed.createComponent(PageHeader);fixture.componentRef.setInput('titleKey','kanji.title');fixture.componentRef.setInput('backRoute','/more');fixture.componentRef.setInput('backQueryParams',{from:'kanji'});fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Kanji');expect(fixture.nativeElement.querySelector('.back-button').getAttribute('href')).toBe('/more?from=kanji');expect(fixture.nativeElement.querySelector('.back-button').getAttribute('aria-label')).toBe('Volver');
    TestBed.inject(SettingsService).setLanguage('en');fixture.detectChanges();expect(fixture.nativeElement.querySelector('.back-button').getAttribute('aria-label')).toBe('Back');
  });
  it('exposes Settings alongside weaknesses and statistics in More for all languages',()=>{
    const fixture=TestBed.createComponent(MorePage);for(const language of ['es','en','ca'] as const){TestBed.inject(SettingsService).setLanguage(language);fixture.detectChanges();const links=fixture.nativeElement.querySelectorAll('.learning-tools a');expect([...links].map((link:any)=>link.getAttribute('href'))).toEqual(['/weaknesses','/stats','/settings']);expect(links[2].textContent).not.toContain('more.settings');}
  });
});

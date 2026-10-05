import {Location} from '@angular/common';
import {TestBed} from '@angular/core/testing';
import {provideRouter, Router} from '@angular/router';
import {FlagsSelectionPage} from '../../features/flags-selection/flags-selection.page';
import {FlagCountriesPage} from '../../features/flag-countries/flag-countries.page';
import {FlagMedalsPage} from '../../features/flag-medals/flag-medals.page';

describe('Flags internal return and deep-link fallback',()=>{
  beforeEach(()=>{vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}));localStorage.clear();TestBed.configureTestingModule({providers:[provideRouter([])]});});
  afterEach(()=>{TestBed.resetTestingModule();vi.unstubAllGlobals();});
  for(const page of [FlagsSelectionPage,FlagCountriesPage,FlagMedalsPage]){
    it(page.name+' uses /flags on direct entry',()=>{
      const location=TestBed.inject(Location);vi.spyOn(location,'getState').mockReturnValue({navigationId:1});const back=vi.spyOn(location,'back');
      const navigate=vi.spyOn(TestBed.inject(Router),'navigateByUrl').mockResolvedValue(true);
      TestBed.createComponent<FlagsSelectionPage|FlagCountriesPage|FlagMedalsPage>(page).componentInstance.back();
      expect(navigate).toHaveBeenCalledWith('/flags');expect(back).not.toHaveBeenCalled();
    });
    it(page.name+' preserves useful Angular history',()=>{
      const location=TestBed.inject(Location);vi.spyOn(location,'getState').mockReturnValue({navigationId:2});const back=vi.spyOn(location,'back');
      const navigate=vi.spyOn(TestBed.inject(Router),'navigateByUrl').mockResolvedValue(true);
      TestBed.createComponent<FlagsSelectionPage|FlagCountriesPage|FlagMedalsPage>(page).componentInstance.back();
      expect(back).toHaveBeenCalledOnce();expect(navigate).not.toHaveBeenCalled();
    });
  }
});

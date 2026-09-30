import { TestBed } from '@angular/core/testing';
import { FlagStudyUnit } from '../models/country.model';
import { FlagProgressService } from './flag-progress.service';
import { FlagSettingsService } from './flag-settings.service';
import { SpacedRepetitionService } from './spaced-repetition.service';
import { StorageService } from './storage.service';

const PROGRESS_KEY='kana-study.flags-progress.v1';
const EVENTS_KEY='kana-study.flags-review-events.v1';
const SELECTION_KEY='kana-study.flags-selection.v1';
function configure(){TestBed.configureTestingModule({providers:[FlagProgressService,FlagSettingsService,SpacedRepetitionService,StorageService]});return TestBed.inject(FlagProgressService);}

describe('Flag persistence',()=>{
  beforeEach(()=>localStorage.clear());afterEach(()=>TestBed.resetTestingModule());
  it('persists the module selection independently',()=>{configure();const settings=TestBed.inject(FlagSettingsService);settings.setRegion('asia',false);expect(JSON.parse(localStorage.getItem(SELECTION_KEY)! ).regions.asia).toBe(false);});
  it('persists Flag progress and ReviewEvents without writing Kana keys',()=>{const service=configure();const unit:FlagStudyUnit={key:'flags:jp:flag-to-country',countryId:'jp',questionType:'flag-to-country'};service.recordReview(unit,'again',false,'flags-session',new Date('2026-01-01T00:00:00.000Z'));expect(Object.keys(JSON.parse(localStorage.getItem(PROGRESS_KEY)!))).toEqual([unit.key]);expect(JSON.parse(localStorage.getItem(EVENTS_KEY)!)).toHaveLength(1);expect(localStorage.getItem('kana-study.study-progress.v2')).toBeNull();TestBed.resetTestingModule();const restored=configure();expect(restored.get(unit.key)?.lastRating).toBe('again');});
  it('keeps progress when a region is disabled and restores eligibility when re-enabled',()=>{const service=configure();const settings=TestBed.inject(FlagSettingsService);const unit:FlagStudyUnit={key:'flags:jp:flag-to-country',countryId:'jp',questionType:'flag-to-country'};service.recordReview(unit,'again',false,'flags-session',new Date('2026-01-01T00:00:00.000Z'));settings.setRegion('asia',false);expect(service.activeUnits().some(item=>item.key===unit.key)).toBe(false);expect(service.get(unit.key)).not.toBeNull();settings.setRegion('asia',true);expect(service.activeUnits().some(item=>item.key===unit.key)).toBe(true);});
});

import {TestBed} from '@angular/core/testing';
import {WorkspaceMigrationService} from './workspace-migration.service';
import {CustomDeckRepository} from './custom-deck.repository';
import {CUSTOM_DECKS_ENABLED,CUSTOM_DECK_SYNC_ENABLED,CUSTOM_REMOTE_UPLOAD_APPROVED} from './custom-deck-gates';
import {MANGA_DECK_ASSISTED_ENABLED} from './manga-deck-gate';
describe('Disabled custom migration stays outside the startup dependency graph',()=>{
 afterEach(()=>TestBed.resetTestingModule());
 it('does not instantiate the repository while the public gates are disabled',async()=>{
  const factory=vi.fn(()=>{throw new Error('Custom repository must not start');});TestBed.configureTestingModule({providers:[{provide:CustomDeckRepository,useFactory:factory}]});
  const migration=TestBed.inject(WorkspaceMigrationService);expect(await migration.hasCustomGuestData()).toBe(false);expect(await migration.customImportComplete('synthetic')).toBe(false);expect(factory).not.toHaveBeenCalled();
  expect(TestBed.inject(CUSTOM_DECKS_ENABLED)()).toBe(false);expect(TestBed.inject(CUSTOM_DECK_SYNC_ENABLED)()).toBe(false);expect(TestBed.inject(MANGA_DECK_ASSISTED_ENABLED)()).toBe(false);expect(TestBed.inject(CUSTOM_REMOTE_UPLOAD_APPROVED)).toBe(false);
 });
});

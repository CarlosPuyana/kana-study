import { TestBed } from '@angular/core/testing';
import { DeckDatabaseService } from './deck-database.service';
import { ProfileStatsService } from './profile-stats.service';
import { LocalRushRepository } from './rush-repository.service';
import { StorageService } from './storage.service';
import { WorkspaceService } from './workspace.service';

describe('ProfileStatsService',()=>{
  const decks={getDeckProgress:vi.fn(async()=>[]),getDeckReviewEvents:vi.fn(async()=>[])};
  const rush={getStats:vi.fn(async()=>({sessions:[],coverage:[]}))};
  beforeEach(()=>{localStorage.clear();TestBed.configureTestingModule({providers:[{provide:DeckDatabaseService,useValue:decks},{provide:LocalRushRepository,useValue:rush}]})});afterEach(()=>TestBed.resetTestingModule());
  it('derives a Madrid streak only from valid study activity',async()=>{const storage=TestBed.inject(StorageService);storage.set('kana-study.completed-sessions.v1',[{sessionId:'a',completedAt:'2026-06-30T12:00:00Z',exercisesCompleted:10,durationSeconds:60},{sessionId:'b',completedAt:'2026-07-01T12:00:00Z',exercisesCompleted:10,durationSeconds:60}]);const stats=await TestBed.inject(ProfileStatsService).load(new Date('2026-07-01T18:00:00Z'));expect(stats.streak).toBe(2);expect(stats.completedSessions).toBe(2);expect(stats.studySeconds).toBe(120)});
  it('reads stats exclusively from the active workspace',async()=>{const workspace=TestBed.inject(WorkspaceService),storage=TestBed.inject(StorageService);storage.set('kana-study.review-events.v1',[{id:'guest'}]);workspace.activateUser('carlos');storage.set('kana-study.review-events.v1',[{id:'c1'},{id:'c2'}]);expect((await TestBed.inject(ProfileStatsService).load()).reviews).toBe(2);workspace.activateGuest();expect((await TestBed.inject(ProfileStatsService).load()).reviews).toBe(1)});
});

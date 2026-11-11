import { TestBed } from '@angular/core/testing';
import { IDBObjectStore } from 'fake-indexeddb';
import { MangaRushSessionService } from './manga-rush-session.service';
import { WorkspaceService } from './workspace.service';
import { MANGA_RUSH_DEFAULTS, mangaRushPool, selectMangaRushCards } from './manga-rush';
import { rushIndex, rushWord } from './manga-rush.fixture';

describe('Manga RUSH memory-only scope and zero learning writes',()=>{
  let service:MangaRushSessionService,workspace:WorkspaceService;
  const cards=()=>{const words=[rushWord(),rushWord('に','に',2,1,'functional')],config={...MANGA_RUSH_DEFAULTS,category:'all' as const};
    return selectMangaRushCards('v1',mangaRushPool(rushIndex(words),words,config),config);};
  beforeEach(()=>{TestBed.resetTestingModule();localStorage.clear();TestBed.configureTestingModule({providers:[MangaRushSessionService]});
    service=TestBed.inject(MangaRushSessionService);workspace=TestBed.inject(WorkspaceService);});
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();localStorage.clear();});
  it('reveals before rating, prevents duplicate ratings and records only temporary self-reports',()=>{
    service.start('v1',cards());service.rate('v1',true);expect(service.session()?.answers).toHaveLength(0);
    service.reveal('v1');service.rate('v1',true);service.rate('v1',true);expect(service.session()?.answers).toHaveLength(1);
    expect(service.session()?.revealed).toBe(false);service.reveal('v1');service.rate('v1',false);
    expect(service.summary()).toEqual({total:2,distinct:2,knew:1,didNotKnow:1});service.reveal('v1');service.rate('v1',true);
    expect(service.summary()?.total).toBe(2);
  });
  it('performs zero storage, learning, history, statistics or network writes throughout the session',()=>{
    const storage=vi.spyOn(Storage.prototype,'setItem'),put=vi.spyOn(IDBObjectStore.prototype,'put'),add=vi.spyOn(IDBObjectStore.prototype,'add');
    const network=vi.spyOn(globalThis,'fetch');const before=JSON.stringify(localStorage);
    service.start('v1',cards());service.reveal('v1');service.rate('v1',true);service.reveal('v1');service.rate('v1',false);
    expect(service.summary()?.total).toBe(2);service.clear();
    expect(storage).not.toHaveBeenCalled();expect(put).not.toHaveBeenCalled();expect(add).not.toHaveBeenCalled();expect(network).not.toHaveBeenCalled();
    expect(JSON.stringify(localStorage)).toBe(before);
  });
  it('fences workspace A -> B -> A synchronously and never resurrects a session',()=>{
    service.start('v1',cards());service.reveal('v1');workspace.activateUser('other');expect(service.session()).toBeNull();
    service.rate('v1',true);workspace.activateGuest();expect(service.session()).toBeNull();expect(service.summary()).toBeNull();
  });
  it('fences volume changes, rejects mixed cards and clears on disposal/recreation',()=>{
    const selected=cards();expect(service.start('other',selected)).toBe(false);
    service.start('v1',selected);service.reveal('other');service.rate('other',true);expect(service.session()?.answers).toHaveLength(0);
    selected[0].answer={kind:'dictionary',contextualized:false,meanings:['changed outside']};
    expect(service.current()?.answer.meanings).not.toEqual(['changed outside']);
    TestBed.resetTestingModule();expect(service.session()).toBeNull();
    TestBed.configureTestingModule({providers:[MangaRushSessionService]});expect(TestBed.inject(MangaRushSessionService).session()).toBeNull();
  });
});

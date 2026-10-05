import {TestBed} from '@angular/core/testing';
import {StorageService} from './storage.service';
import {SyncOutboxService} from './sync-outbox.service';

describe('local persistence failure feedback',()=>{
  beforeEach(()=>{localStorage.clear();TestBed.configureTestingModule({providers:[{provide:SyncOutboxService,useValue:{enqueue:vi.fn()}}]});});
  afterEach(()=>{vi.restoreAllMocks();TestBed.resetTestingModule();});
  it('does not throw and reports relevant failed writes once through shared state',()=>{
    const storage=TestBed.inject(StorageService);vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('full');});
    expect(()=>storage.set('study',{value:1})).not.toThrow();storage.set('study',{value:2});expect(storage.persistenceFailed()).toBe(true);
    storage.dismissPersistenceError();expect(storage.persistenceFailed()).toBe(false);
  });
  it('does not report safe internal/read fallbacks and never enqueues a failed write',()=>{
    const storage=TestBed.inject(StorageService),outbox=TestBed.inject(SyncOutboxService);
    vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('blocked');});
    storage.set('internal',{}, {silent:true});expect(storage.persistenceFailed()).toBe(false);expect(outbox.enqueue).not.toHaveBeenCalled();
    vi.spyOn(Storage.prototype,'getItem').mockReturnValue('{broken');expect(storage.get('bad',{})).toEqual({});expect(storage.persistenceFailed()).toBe(false);
  });
  it('reports failed user removals without deleting unrelated values',()=>{
    const storage=TestBed.inject(StorageService);localStorage.setItem('unrelated','keep');
    vi.spyOn(Storage.prototype,'removeItem').mockImplementation(()=>{throw new Error('blocked');});
    storage.remove('study');expect(storage.persistenceFailed()).toBe(true);expect(localStorage.getItem('unrelated')).toBe('keep');
  });
});

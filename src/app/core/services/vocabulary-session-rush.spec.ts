import { TestBed } from '@angular/core/testing';
import { VOCABULARY_N5 } from '../../data/vocabulary-n5.generated';
import { VocabularyStudyUnit } from '../models/vocabulary.model';
import { WorkspaceService } from './workspace.service';
import { VocabularySessionRush } from './vocabulary-session-rush';

describe('Vocabulary session RUSH handoff',()=>{
  const unit=(id:string,type:VocabularyStudyUnit['questionType']='japanese-to-meaning'):VocabularyStudyUnit=>({key:`vocab:${id}:${type}`,entryId:id,questionType:type});
  beforeEach(()=>{TestBed.resetTestingModule();localStorage.clear();});afterEach(()=>TestBed.resetTestingModule());
  it('deduplicates words and preserves the first authentic studied direction, with no catalog fallback',()=>{
    const pool=TestBed.inject(VocabularySessionRush),id=VOCABULARY_N5[0].id,second=VOCABULARY_N5[1].id;
    const token=pool.prepare([id,id,second],[unit(id),unit(id,'meaning-to-japanese'),unit(second)])!;
    expect(pool.take(token)).toEqual([unit(id),unit(second)]);expect(pool.take(token)).toBeNull();
  });
  it('rejects an empty difficult pool without creating a handoff',()=>{const pool=TestBed.inject(VocabularySessionRush);expect(pool.prepare([],[])).toBeNull();expect(pool.take('forged')).toBeNull();});
  it('rejects manipulated, expired and reloaded tokens instead of selecting general vocabulary',()=>{
    const pool=TestBed.inject(VocabularySessionRush),unitA=unit(VOCABULARY_N5[0].id);const token=pool.prepare([unitA.entryId],[unitA])!;
    expect(pool.take(token+'x')).toBeNull();expect(pool.take(token)).toBeNull();
    const fresh=pool.prepare([unitA.entryId],[unitA])!;TestBed.resetTestingModule();expect(TestBed.inject(VocabularySessionRush).take(fresh)).toBeNull();
  });
  it('rejects both workspace changes and A→B→A',()=>{
    const pool=TestBed.inject(VocabularySessionRush),workspace=TestBed.inject(WorkspaceService),u=unit(VOCABULARY_N5[0].id);
    const token=pool.prepare([u.entryId],[u])!;workspace.activateUser('B');workspace.activateGuest();expect(pool.take(token)).toBeNull();
  });
});

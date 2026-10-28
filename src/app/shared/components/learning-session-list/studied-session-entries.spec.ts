import { studiedSessionEntries } from './studied-session-entries';
import type { SessionItem } from '../../../core/models/learning-session.model';

const item=(studyKey:string,appearances=1):SessionItem=>({studyKey,appearances,attempts:appearances,initialRating:'good',resolved:true,needsPractice:false});
describe('finished Kanji/Vocabulary session projection',()=>{
  const catalog=[{id:'a',written:'同じ',reading:'おなじ'},{id:'b',written:'同じ',reading:'おなじ'},{id:'distractor',written:'別',reading:'べつ'}];
  it('deduplicates IDs and directions in first presented order, never writing/reading',()=>{
    const session={completedAt:'2026-10-28T10:00:00Z',units:[{key:'b:reading',id:'b'},{key:'a:meaning',id:'a'},{key:'b:meaning',id:'b'}],
      items:[item('b:reading',4),item('a:meaning'),item('b:meaning',2)]};
    const before=structuredClone(session);
    expect(studiedSessionEntries(session,catalog,u=>u.id)).toEqual([catalog[1],catalog[0]]);
    expect(session).toEqual(before);
  });
  it('excludes planned/unpresented, unknown IDs, distractors and unrelated items',()=>{
    const session={completedAt:'2026-10-28T10:00:00Z',units:[{key:'a',id:'a'},{key:'missing',id:'missing'},{key:'b',id:'b'}],
      items:[item('a',0),item('missing'),item('b'),item('distractor',10)]};
    expect(studiedSessionEntries(session,catalog,u=>u.id)).toEqual([catalog[1]]);
  });
  it('uses appearances rather than an answer or global mastery, and reads no browser storage',()=>{
    const session={completedAt:'2026-10-28T10:00:00Z',units:[{key:'b',id:'b'}],items:[{...item('b'),attempts:0,initialRating:null,resolved:false}]};
    const get=vi.spyOn(Storage.prototype,'getItem'),set=vi.spyOn(Storage.prototype,'setItem');
    expect(studiedSessionEntries(session,catalog,u=>u.id)).toEqual([catalog[1]]);
    expect(get).not.toHaveBeenCalled();expect(set).not.toHaveBeenCalled();vi.restoreAllMocks();
  });
  it('returns no list before completion, after clearing, or from a previous session',()=>{
    expect(studiedSessionEntries(null,catalog,(u:{key:string;id:string})=>u.id)).toEqual([]);
    const active={completedAt:null,units:[{key:'a',id:'a'}],items:[item('a')]};
    expect(studiedSessionEntries(active,catalog,u=>u.id)).toEqual([]);
    expect(studiedSessionEntries({...active,completedAt:'done'},catalog,u=>u.id)).toEqual([catalog[0]]);
    expect(studiedSessionEntries({completedAt:'next',units:[{key:'b',id:'b'}],items:[item('b')]},catalog,u=>u.id)).toEqual([catalog[1]]);
  });
});

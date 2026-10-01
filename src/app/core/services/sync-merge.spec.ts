import { lastWriteWins, mergeCoverage, mergeIntroducedIds, mergeMedalUnlocks, mergeProgressSnapshots, unionById } from './sync-merge';

describe('cloud conflict rules', () => {
  it('unions append-only events by stable ID', () => {
    expect(unionById([{ id:'A' },{ id:'B' }],[{ id:'B' },{ id:'C' }],item=>item.id).map(item=>item.id).sort()).toEqual(['A','B','C']);
  });
  it('keeps the earliest medal unlock', () => {
    expect(mergeMedalUnlocks([{medalId:'m',unlockedAt:'2026-01-01T10:00:00Z'}],[{medalId:'m',unlockedAt:'2026-01-01T09:00:00Z'}])[0].unlockedAt).toContain('09:00');
  });
  it('unions RUSH coverage and keeps first seen', () => {
    const result=mergeCoverage([{contentId:'A',firstSeenAt:2},{contentId:'B',firstSeenAt:4}],[{contentId:'B',firstSeenAt:3},{contentId:'C',firstSeenAt:5}]);
    expect(result.map(item=>item.contentId).sort()).toEqual(['A','B','C']);expect(result.find(item=>item.contentId==='B')?.firstSeenAt).toBe(3);
  });
  it('unions introduced deck cards without removing an introduction',()=>expect(mergeIntroducedIds(['A','B'],['B','C']).sort()).toEqual(['A','B','C']));
  it('uses last-write-wins for settings',()=>{expect(lastWriteWins('local','2026-01-02','cloud','2026-01-01')).toBe('local');expect(lastWriteWins('local','2026-01-01','cloud','2026-01-02')).toBe('cloud')});
  it('keeps the FSRS snapshot with the latest pedagogical review time',()=>{const local={u:{lastSeenAt:'2026-01-02',fsrs:'local'}},remote={u:{lastSeenAt:'2026-01-01',fsrs:'remote'},v:{lastSeenAt:'2026-01-03',fsrs:'remote-v'}};expect(mergeProgressSnapshots(local,remote)).toEqual({u:local.u,v:remote.v})});
});

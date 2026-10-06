import 'fake-indexeddb/auto';
import {IDBFactory} from 'fake-indexeddb';
import {TestBed} from '@angular/core/testing';
import {MangaStudySavedRepository} from './manga-study-saved.repository';
import {MangaStudyIntegrationService} from './manga-study-integration.service';
import {WorkspaceService} from './workspace.service';
import {MangaRepository} from './manga.repository';
import {MangaStudySavedItem} from '../models/manga-study-saved.model';
import {DictionaryLookup} from '../models/dictionary.model';

export function savedLookup(expression='食べる',reading='たべる'):DictionaryLookup {
  return {installed:true,query:expression,terms:[{id:'fixture',dictionaryId:'fixture',expression,reading,glossaries:['comer'],definitionTags:'',rules:'',score:0,sequence:1,termTags:''}]};
}
describe('Manga saved repository and snapshots',()=>{
  let repository:MangaStudySavedRepository;
  const item=(expression='食べる',reading='たべる',pageNumber=2)=>TestBed.inject(MangaStudyIntegrationService).snapshot(savedLookup(expression,reading),{volumeId:'manga',pageNumber,volumeTitle:'Volume 1'},'食べなかった。')!;
  beforeEach(()=>{localStorage.clear();vi.stubGlobal('indexedDB',new IDBFactory());TestBed.configureTestingModule({});repository=TestBed.inject(MangaStudySavedRepository);});
  afterEach(()=>{TestBed.resetTestingModule();vi.unstubAllGlobals();});
  it('saves, lists, gets and reports existence',async()=>{const value=item();await repository.save(value);expect(await repository.get(value.id)).toEqual(value);expect(await repository.exists(value.id)).toBe(true);expect(await repository.list()).toEqual([value]);expect(repository.count()).toBe(1);});
  it('deduplicates concurrent saves and keeps the first source/context from two pages',async()=>{const first=item();await Promise.all([repository.save(first),repository.save({...first,context:'different',source:{...first.source,pageNumber:8}})]);expect(await repository.list()).toEqual([first]);});
  it('removes idempotently and clear empties all items',async()=>{const value=item();await repository.save(value);await repository.remove(value.id);await repository.remove(value.id);expect(await repository.exists(value.id)).toBe(false);await repository.save(value);await repository.clear();expect(await repository.list()).toEqual([]);expect(repository.count()).toBe(0);});
  it('persists across repository recreation',async()=>{const value=item();await repository.save(value);TestBed.resetTestingModule();TestBed.configureTestingModule({});expect(await TestBed.inject(MangaStudySavedRepository).list()).toEqual([value]);});
  it('isolates guest and user databases and refreshes the active collection',async()=>{const value=item(),workspace=TestBed.inject(WorkspaceService);await repository.save(value);workspace.activateUser('user-a');TestBed.tick();await vi.waitFor(()=>expect(repository.loading()).toBe(false));expect(repository.count()).toBe(0);await repository.save({...value,meaning:'user'});workspace.activateGuest();TestBed.tick();await vi.waitFor(()=>expect(repository.items()[0]?.meaning).toBe('comer'));expect((await repository.list('user:user-a'))[0].meaning).toBe('user');});
  it('does not expose a late save from an old workspace',async()=>{const value=item(),workspace=TestBed.inject(WorkspaceService);const saving=repository.save(value,'guest');workspace.activateUser('next');TestBed.tick();await saving;await vi.waitFor(()=>expect(repository.loading()).toBe(false));expect(repository.count()).toBe(0);expect(await repository.exists(value.id,'guest')).toBe(true);});
  it('keeps words and context when their Manga volume is deleted',async()=>{const value=item();await repository.save(value);await TestBed.inject(MangaRepository).delete('manga');expect(await repository.get(value.id)).toEqual(value);});
  it('orders newest first',async()=>{const a=item(),b=item('ありがとう','ありがとう');await repository.save({...a,createdAt:1});await repository.save({...b,createdAt:2});expect((await repository.list()).map(i=>i.id)).toEqual([b.id,a.id]);});
  it('keeps written homophones distinct',async()=>{const a=item('橋','はし'),b=item('箸','はし');expect(a.id).not.toBe(b.id);await repository.save(a);await repository.save(b);expect(await repository.list()).toHaveLength(2);});
  it('normalizes whitespace for an external identity',()=>{expect(item(' 龍 ',' りゅう ').id).toBe(item('龍','りゅう').id);});
  it('stores canonical vocabulary, surface, context and source without dictionary payload',()=>{const lookup={...savedLookup(),query:'食べなかった',surface:'食べなかった',baseForm:'食べる',reading:'たべる'};const value=TestBed.inject(MangaStudyIntegrationService).snapshot(lookup,{volumeId:'manga',pageNumber:18,volumeTitle:'Vol 1'},'昨日何も食べなかった。')!;expect(value).toMatchObject({schemaVersion:1,id:'vocabulary:n5-euiuyn',expression:'食べる',vocabularyId:'n5-euiuyn',surface:'食べなかった',baseForm:'食べる',context:'昨日何も食べなかった。',source:{pageNumber:18,volumeTitle:'Vol 1'}});expect(TestBed.inject(MangaStudyIntegrationService).matchSaved(value).kanji.map(k=>k.character)).toEqual(['食']);expect(value).not.toHaveProperty('terms');});
  it('saves kana-only words without Kanji',()=>{expect(item('ここ','ここ').kanji).toEqual([]);expect(item('ここ','ここ').vocabularyId).toBeDefined();});
  it('saves unknown dictionary words without invented vocabulary resources',()=>{const value=item('龍','りゅう'),match=TestBed.inject(MangaStudyIntegrationService).matchSaved(value);expect(value.vocabularyId).toBeUndefined();expect(value.meaning).toBe('comer');expect(match.vocabulary).toBeUndefined();expect(match.audioAvailable).toBe(false);expect(match.writingAvailable).toBe(false);});
  it('bounds the meaning and context snapshots',()=>{const lookup=savedLookup();lookup.terms[0].glossaries=['x'.repeat(1000)];const value=TestBed.inject(MangaStudyIntegrationService).snapshot(lookup,{volumeId:'manga',pageNumber:1},'y'.repeat(3000))!;expect(value.meaning).toHaveLength(300);expect(value.context).toHaveLength(1200);});
  it('rejects invalid page metadata rather than storing it',async()=>{await expect(repository.save({...item(),source:{volumeId:'manga',pageNumber:0}})).rejects.toThrow();expect(await repository.list()).toEqual([]);});
  it('surfaces IndexedDB opening errors and allows retry',async()=>{const open=vi.spyOn(indexedDB,'open').mockImplementationOnce(()=>{throw new Error('Unavailable');});await expect(repository.save(item())).rejects.toThrow('Unavailable');open.mockRestore();await repository.save(item());expect(await repository.list()).toHaveLength(1);});
  it('reports loading failure without unhandled rejection',async()=>{vi.spyOn(repository,'list').mockRejectedValueOnce(new Error('Storage failed'));await repository.reload();expect(repository.failed()).toBe(true);expect(repository.loading()).toBe(false);await repository.reload();expect(repository.failed()).toBe(false);});
});

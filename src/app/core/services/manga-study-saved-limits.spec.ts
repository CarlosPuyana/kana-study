import {TestBed} from '@angular/core/testing';
import {IDBFactory} from 'fake-indexeddb';
import {MANGA_SAVED_ID_MAX_BYTES, MANGA_SAVED_PAYLOAD_MAX_BYTES, mangaSavedPayloadBytes, validateMangaSavedItem} from '../models/manga-study-saved.model';
import {dictionaryLimitItem, payloadLimitItem} from '../models/manga-study-saved-limits.fixtures';
import {MangaStudySavedRepository} from './manga-study-saved.repository';
import {MangaStudyIntegrationService} from './manga-study-integration.service';
import {DictionaryLookup} from '../models/dictionary.model';
const savedLookup=(expression:string,reading:string):DictionaryLookup=>({installed:true,query:expression,terms:[{id:'fixture',dictionaryId:'fixture',expression,reading,glossaries:['meaning'],definitionTags:'',rules:'',score:0,sequence:1,termTags:''}]});

describe('Manga saved local/SQL limits',()=>{
  beforeEach(()=>{localStorage.clear();vi.stubGlobal('indexedDB',new IDBFactory());TestBed.configureTestingModule({});});
  afterEach(()=>{TestBed.resetTestingModule();vi.unstubAllGlobals();});
  it.each(['x','漢','"','\\','\u0001','😀'])('accepts the generator identity for two maximum-length strings containing %s',async(character)=>{
    const text=character.repeat(1600/character.length),expected=dictionaryLimitItem(text,text);
    const generated=TestBed.inject(MangaStudyIntegrationService).snapshot(savedLookup(text,text),expected.source)!;
    expect(generated.id).toBe(expected.id);expect(new TextEncoder().encode(generated.id).length).toBeLessThanOrEqual(MANGA_SAVED_ID_MAX_BYTES);
    await TestBed.inject(MangaStudySavedRepository).save(generated);
    expect(await TestBed.inject(MangaStudySavedRepository).get(generated.id)).toEqual(generated);
  });
  it('admits the maximum escaped dictionary ID without truncation',()=>{
    const item=dictionaryLimitItem('\u0001'.repeat(1600),'\u0001'.repeat(1600));
    expect(item.id.length).toBe(19218);expect(validateMangaSavedItem(item).id).toBe(item.id);
    expect(()=>validateMangaSavedItem({...item,id:item.id+'x'})).toThrow();
  });
  it('rejects an over-limit generator snapshot rather than truncating its identity',async()=>{
    const text='x'.repeat(1601),generated=TestBed.inject(MangaStudyIntegrationService).snapshot(savedLookup(text,'reading'),{volumeId:'v',pageNumber:1})!;
    expect(generated.id).toBe('dictionary:'+JSON.stringify([text,'reading']));
    const repo=TestBed.inject(MangaStudySavedRepository);await expect(repo.save(generated)).rejects.toThrow();expect(await repo.list()).toEqual([]);
  });
  it('bounds arbitrary IDs in UTF-8 bytes, including supplementary characters',()=>{
    const item=dictionaryLimitItem('x','y');
    expect(validateMangaSavedItem({...item,id:'😀'.repeat(4804)+'xx'}).id).toHaveLength(9610);
    expect(()=>validateMangaSavedItem({...item,id:'😀'.repeat(4804)+'xxx'})).toThrow();
  });
  it.each(['expression','reading','baseForm','vocabularyId','meaning','surface','context'] as const)('checks %s at its existing field limit',field=>{
    const limit={expression:1600,reading:1600,baseForm:1600,vocabularyId:256,meaning:300,surface:160,context:1200}[field];
    const item={...dictionaryLimitItem('x','y'),[field]:'x'.repeat(limit)};
    expect(validateMangaSavedItem(item)[field]).toHaveLength(limit);
    expect(()=>validateMangaSavedItem({...item,[field]:'x'.repeat(limit+1)})).toThrow();
  });
  it('accepts exactly 64 KiB of jsonb text and rejects one extra byte before writing',async()=>{
    const item=payloadLimitItem(mangaSavedPayloadBytes,MANGA_SAVED_PAYLOAD_MAX_BYTES),repo=TestBed.inject(MangaStudySavedRepository);
    expect(mangaSavedPayloadBytes(item)).toBe(65536);await repo.save(item);
    const oversized={...item,context:item.context+'x'};
    expect(mangaSavedPayloadBytes(oversized)).toBe(65537);expect(()=>validateMangaSavedItem(oversized)).toThrow();
    await expect(repo.save(oversized)).rejects.toThrow();expect(await repo.list()).toHaveLength(1);
  });
  it('checks source and kanji boundaries',()=>{
    const item={...dictionaryLimitItem('x','y'),source:{volumeId:'v'.repeat(1024),pageNumber:1,volumeTitle:'t'.repeat(160)},kanji:Array.from({length:64},()=> '漢'.repeat(64))};
    expect(validateMangaSavedItem(item)).toEqual(item);
    for(const invalid of [{...item,source:{...item.source,volumeId:'v'.repeat(1025)}},
      {...item,source:{...item.source,volumeTitle:'t'.repeat(161)}},{...item,kanji:[...item.kanji,'漢']},
      {...item,kanji:['漢'.repeat(65)]}])expect(()=>validateMangaSavedItem(invalid)).toThrow();
  });
  it.each(['\u0000','\ud800','\udfff'])('rejects PostgreSQL-incompatible string %s in every string field',invalid=>{
    const item=dictionaryLimitItem('x','y');
    for(const key of ['id','expression','reading','baseForm','vocabularyId','meaning','surface','context'] as const)
      expect(()=>validateMangaSavedItem({...item,[key]:invalid})).toThrow();
    expect(()=>validateMangaSavedItem({...item,kanji:[invalid]})).toThrow();
    expect(()=>validateMangaSavedItem({...item,source:{...item.source,volumeId:invalid}})).toThrow();
    expect(()=>validateMangaSavedItem({...item,source:{...item.source,volumeTitle:invalid}})).toThrow();
  });
  it('allows maximum safe integer metadata and rejects values jsonb would expand differently',()=>{
    const item={...dictionaryLimitItem('x','y'),createdAt:Number.MAX_SAFE_INTEGER,source:{volumeId:'v',pageNumber:Number.MAX_SAFE_INTEGER}};
    expect(validateMangaSavedItem(item)).toEqual(item);
    for(const createdAt of [1.5,1e308,Number.MAX_SAFE_INTEGER+1])expect(()=>validateMangaSavedItem({...item,createdAt})).toThrow();
    expect(()=>validateMangaSavedItem({...item,source:{...item.source,pageNumber:Number.MAX_SAFE_INTEGER+1}})).toThrow();
  });
});

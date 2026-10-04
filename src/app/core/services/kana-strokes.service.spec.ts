import { TestBed } from '@angular/core/testing';
import { ALL_KANA } from '../../data/kana';
import { KanaStrokesService } from './kana-strokes.service';

describe('Local kana stroke assets',()=>{
  afterEach(()=>vi.unstubAllGlobals());
  it('fetches same-origin once and composes characters in order',async()=>{
    const fetchMock=vi.fn(async(_url:URL)=>({ok:true,json:async()=>[{character:'き',strokes:[],clipPaths:[]},{character:'ゃ',strokes:[],clipPaths:[]}]}));vi.stubGlobal('fetch',fetchMock);
    const service=TestBed.inject(KanaStrokesService);
    expect((await service.load('きゃ')).map(g=>g.character)).toEqual(['き','ゃ']);await service.load('き');
    expect(fetchMock).toHaveBeenCalledTimes(1);expect(fetchMock.mock.calls[0][0].toString()).toBe(new URL('kana-writing/strokes.json',document.baseURI).toString());
  });
  it('retries after an HTTP failure',async()=>{
    const fetchMock=vi.fn().mockResolvedValueOnce({ok:false}).mockResolvedValueOnce({ok:true,json:async()=>[{character:'あ',strokes:[],clipPaths:[]}]});vi.stubGlobal('fetch',fetchMock);
    const service=TestBed.inject(KanaStrokesService);await expect(service.load('あ')).rejects.toThrow();await expect(service.load('あ')).resolves.toHaveLength(1);
  });
  it('has local nonempty vector and median data for every character in the existing catalogue',()=>{
    const fs=(globalThis as unknown as {process:{getBuiltinModule:(id:string)=>{readFileSync:(path:string,encoding:string)=>string}}}).process.getBuiltinModule('fs');
    const data=JSON.parse(fs.readFileSync('public/kana-writing/strokes.json','utf8')) as {character:string;strokes:{value:string}[];clipPaths:{value:string}[]}[];
    for(const character of new Set(ALL_KANA.flatMap(k=>[...k.character]))){const g=data.find(g=>g.character===character);expect(g,character).toBeDefined();expect(g!.strokes.every(p=>p.value.startsWith('M'))).toBe(true);expect(g!.clipPaths.length).toBeGreaterThan(0);}
  });
});

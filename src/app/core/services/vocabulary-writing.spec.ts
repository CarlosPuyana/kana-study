import {TestBed} from '@angular/core/testing';
import {VOCABULARY_N5} from '../../data/vocabulary-n5.generated';
import {KANJI_N5} from '../../data/kanji-n5.generated';
import {WritingGlyph} from '../models/kana-writing.model';
import {JapaneseGlyphService,splitWritingWord} from './japanese-glyph.service';
import {KanaStrokesService} from './kana-strokes.service';
import {VocabularyWritingSession} from './vocabulary-writing-session';

describe('Vocabulary writing data and sessions',()=>{
  afterEach(()=>vi.unstubAllGlobals());
  it('decomposes mixed words and normalizes combining dakuten',()=>{
    expect(splitWritingWord('食べる')).toEqual(['食','べ','る']);expect(splitWritingWord('コーヒー')).toEqual(['コ','ー','ヒ','ー']);expect(splitWritingWord('か\u3099')).toEqual(['が']);
  });
  it('resolves Kanji, existing Kana, extra Kana and missing characters without external runtime requests',async()=>{
    const fetchMock=vi.fn(async(url:URL)=>({ok:true,json:async()=>url.pathname.endsWith('kanji.json')?[{character:'食',strokes:[{id:'1',value:'M0 0L1 1'}],clipPaths:[],viewBox:109,pathMode:'centerline'}]:[{character:'ー',strokes:[{id:'1',value:'M0 0L1 1'}],clipPaths:[]}]}));
    vi.stubGlobal('fetch',fetchMock);TestBed.configureTestingModule({providers:[{provide:KanaStrokesService,useValue:{load:async(character:string)=>[{character,strokes:[{id:'1',value:'M0 0Z'}],clipPaths:[]}]}}]});
    const data=await TestBed.inject(JapaneseGlyphService).load('食べー?');
    expect(data.map(g=>g.character)).toEqual(['食','べ','ー','?']);expect(data[0].pathMode).toBe('centerline');expect(data[3].strokes).toEqual([]);
    expect(fetchMock.mock.calls.every(([url])=>url.origin===new URL(document.baseURI).origin)).toBe(true);
  });
  it('only vendors the Kanji used by the primary written forms and checks known stroke counts',()=>{
    const fs=(globalThis as unknown as {process:{getBuiltinModule:(id:string)=>{readFileSync:(p:string,e:string)=>string}}}).process.getBuiltinModule('fs');
    const data=JSON.parse(fs.readFileSync('public/vocabulary-writing/kanji.json','utf8')) as WritingGlyph[];
    const expected=new Set(VOCABULARY_N5.flatMap(e=>splitWritingWord(e.primaryWrittenForm)).filter(c=>/\p{Script=Han}/u.test(c)));
    expect(new Set(data.map(g=>g.character))).toEqual(expected);expect(data.every(g=>g.strokes.length>0&&g.viewBox===109)).toBe(true);
    for(const kanji of KANJI_N5){const glyph=data.find(g=>g.character===kanji.character);if(glyph)expect(glyph.strokes.length,kanji.character).toBe(kanji.strokeCount);}
    const extras=JSON.parse(fs.readFileSync('public/vocabulary-writing/kana-extra.json','utf8')) as WritingGlyph[];
    const kana=JSON.parse(fs.readFileSync('public/kana-writing/strokes.json','utf8')) as WritingGlyph[];
    for(const char of new Set(VOCABULARY_N5.flatMap(e=>splitWritingWord(e.primaryWrittenForm)).filter(c=>/[\u3040-\u30ff]/u.test(c))))expect([...extras,...kana].some(g=>g.character===char),char).toBe(true);
  });
  it('shuffles selected categories without unnecessary repetition and counts correct words',()=>{
    const entries=VOCABULARY_N5.slice(0,5),session=new VocabularyWritingSession(entries,['nouns','verbs','adjectives','adverbs','pronouns-demonstratives','numbers-counters','function-words','expressions-other'],()=>0);
    const first=session.current!.id;session.answer(false);expect(session.current!.id).not.toBe(first);expect(session.resolved).toBe(0);
    const seen:string[]=[];while(session.current){seen.push(session.current.id);session.answer(true);}
    expect(new Set(seen).size).toBe(session.total);expect(seen.at(-1)).toBe(first);expect(session.resolved).toBe(session.total);
    expect(new VocabularyWritingSession(entries,[]).current).toBeNull();
  });
});

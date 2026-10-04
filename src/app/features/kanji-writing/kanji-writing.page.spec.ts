import {TestBed} from '@angular/core/testing';
import {ActivatedRoute, convertToParamMap, provideRouter} from '@angular/router';
import {signal} from '@angular/core';
import {KanjiWritingPage} from './kanji-writing.page';
import {JapaneseGlyphService} from '../../core/services/japanese-glyph.service';
import {KanjiSettingsService} from '../../core/services/kanji-settings.service';
import {KanjiSelection} from '../../core/models/kanji-study.model';
import {KANJI_N5} from '../../data/kanji-n5.generated';
import {KANJI_N5_CATEGORIES} from '../../data/kanji-n5-categories';
import {KanjiWritingSession} from '../../core/services/kanji-writing-session';
import {of} from 'rxjs';

describe('Kanji handwriting', () => {
  const selection = signal<KanjiSelection>({levels:{N5:true},questionTypes:['kanji-to-meaning']});
  const load = vi.fn(async (character:string) => [{character,viewBox:109,pathMode:'centerline' as const,
    strokes:[{id:'1',value:'M10 10L20 20'}],clipPaths:[]}]);
  beforeEach(() => {
    selection.set({levels:{N5:true},questionTypes:['kanji-to-meaning']}); load.mockClear();
    vi.stubGlobal('matchMedia',vi.fn(() => ({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
    TestBed.configureTestingModule({providers:[provideRouter([]),
      {provide:ActivatedRoute,useValue:{queryParamMap:of(convertToParamMap({}))}},
      {provide:JapaneseGlyphService,useValue:{load}},
      {provide:KanjiSettingsService,useValue:{selection}},
    ]});
  });
  afterEach(() => vi.unstubAllGlobals());
  async function page() {const f=TestBed.createComponent(KanjiWritingPage); await f.whenStable();f.detectChanges();return f;}
  it('opens the catalogue entry with meaning, stroke count and the shared canvas', async () => {
    const entry=KANJI_N5.find(k=>k.character==='水')!;
    TestBed.overrideProvider(ActivatedRoute,{useValue:{queryParamMap:of(convertToParamMap({entry:entry.id}))}});
    const f=await page();
    expect(f.componentInstance.individual()).toBe(entry);expect(load).toHaveBeenCalledWith('水');
    expect(f.nativeElement.querySelector('.character').textContent).toBe('水');
    expect(f.nativeElement.querySelector('.practice>p').textContent).toContain('4');
    expect(f.nativeElement.querySelectorAll('app-japanese-writing-canvas')).toHaveLength(1);
    const c=f.componentInstance.canvas()!;c.strokes.set([[{x:.1,y:.2,pressure:1,timestamp:0}]]);
    f.componentInstance.restart();expect(c.strokes()).toEqual([]);
  });
  it('respects current N5 selection and the existing thematic groups without depending on quiz direction', async () => {
    const f=await page(),c=f.componentInstance;
    expect(f.nativeElement.textContent).not.toContain('kanji.level.N5');
    expect(c.pool()).toHaveLength(80);
    c.selected.set([KANJI_N5_CATEGORIES[0].theme]);expect(c.pool()).toHaveLength(14);
    selection.set({levels:{N5:true},questionTypes:[]});expect(c.pool()).toHaveLength(14);
    selection.set({levels:{N5:false},questionTypes:[]});expect(c.pool()).toEqual([]);
    c.start();expect(c.session()).toBeNull();
  });
  it('shows guides and real stroke animation through the shared canvas', async () => {
    const f=await page(),c=f.componentInstance;c.start();await f.whenStable();f.detectChanges();
    expect(f.nativeElement.querySelector('.model.centerline')).not.toBeNull();
    c.canvas()!.guideVisible.set(false);f.detectChanges();expect(f.nativeElement.querySelector('.model')).toBeNull();
    c.canvas()!.guideVisible.set(true);c.canvas()!.play();await new Promise(r=>setTimeout(r,10));f.detectChanges();
    expect(f.nativeElement.querySelector('.animated.centerline')).not.toBeNull();f.destroy();
  });
  it('hides the answer and help in no-guide mode, then reveals without erasing user strokes', async () => {
    const f=await page(),c=f.componentInstance;c.withGuide.set(false);c.start();await f.whenStable();f.detectChanges();
    expect(f.nativeElement.querySelector('.model')).toBeNull();expect(f.nativeElement.querySelector('.answer')).toBeNull();
    expect(c.canvas()!.helpAvailable()).toBe(false);
    const drawing=[[{x:.1,y:.2,pressure:.7,timestamp:1}]];c.canvas()!.strokes.set(drawing);
    c.revealed.set(true);await f.whenStable();f.detectChanges();
    expect(c.canvas()!.strokes()).toEqual(drawing);expect(f.nativeElement.querySelector('.answer strong').textContent).toBe(c.current()!.character);
    expect(c.canvas()!.helpAvailable()).toBe(true);
  });
  it('gates rating until reveal and completes correctly with one selected Kanji', async () => {
    const f=await page(),c=f.componentInstance;c.start();await f.whenStable();
    const first=c.current();c.answer(true);expect(c.current()).toBe(first);
    c.revealed.set(true);c.answer(false);await f.whenStable();expect(c.current()).not.toBe(first);expect(c.resolved()).toBe(0);
    c.revealed.set(true);c.answer(true);expect(c.resolved()).toBe(1);
    const session=new KanjiWritingSession([KANJI_N5[0]]);session.answer(false);expect(session.current).toBe(KANJI_N5[0]);
    session.answer(true);expect(session.current).toBeNull();expect(session.resolved).toBe(1);
  });
  it('requeues repeated Kanji after all remaining entries and never duplicates the initial queue', () => {
    const entries=KANJI_N5.slice(0,5),session=new KanjiWritingSession([...entries,entries[0]],()=>0);
    expect(session.total).toBe(5);const first=session.current!;session.answer(false);
    const seen:string[]=[];while(session.current){seen.push(session.current.id);session.answer(true);}
    expect(new Set(seen).size).toBe(5);expect(seen.at(-1)).toBe(first.id);expect(session.resolved).toBe(5);
  });
  it('covers every N5 Kanji with the existing local glyph provider and matching stroke counts', async () => {
    TestBed.overrideProvider(JapaneseGlyphService,{useFactory:()=>new JapaneseGlyphService()});
    const fs=(globalThis as unknown as {process:{getBuiltinModule:(id:string)=>{readFileSync:(p:string,e:string)=>string}}}).process.getBuiltinModule('fs');
    vi.stubGlobal('fetch',vi.fn(async (url:URL)=>({ok:true,json:async()=>JSON.parse(fs.readFileSync('public/'+url.pathname.split('/').slice(-2).join('/'),'utf8'))})));
    const service=TestBed.inject(JapaneseGlyphService);
    for(const entry of KANJI_N5){const [glyph]=await service.load(entry.character);expect(glyph.character).toBe(entry.character);expect(glyph.strokes.length,entry.character).toBe(entry.strokeCount);}
  });
  it('keeps a usable canvas and warning when glyph loading fails', async () => {
    load.mockRejectedValueOnce(new Error('offline'));
    const f=await page();f.componentInstance.start();await f.whenStable();f.detectChanges();
    expect(f.nativeElement.querySelector('[role=alert]')).not.toBeNull();expect(f.componentInstance.canvas()).toBeDefined();
  });
});

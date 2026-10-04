import { TestBed } from '@angular/core/testing';
import { KanaWritingCanvas } from './kana-writing-canvas';
import { KanaStrokesService } from '../../../core/services/kana-strokes.service';

describe('KanaWritingCanvas',()=>{
  const glyph=(character:string)=>({character,strokes:[{id:'1',value:'M0 0L20 20Z'},{id:'2a',value:'M20 20L30 30Z'},{id:'2b',value:'M30 30L40 40Z'}],clipPaths:[{id:'1',value:'M0 0L20 20'},{id:'2a',value:'M20 20L30 30'},{id:'2b',value:'M30 30L40 40'}]});
  beforeEach(()=>{
    vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
    TestBed.configureTestingModule({providers:[{provide:KanaStrokesService,useValue:{load:async(c:string)=>[...c].map(glyph)}}]});
  });
  afterEach(()=>vi.unstubAllGlobals());
  async function fixture(character='あ'){
    const f=TestBed.createComponent(KanaWritingCanvas);f.componentRef.setInput('character',character);await f.whenStable();f.detectChanges();return f;
  }
  function pointer(svg:SVGSVGElement,x:number,y:number,id=1,type='pointermove'):PointerEvent{
    vi.spyOn(svg,'getBoundingClientRect').mockReturnValue({left:10,top:20,width:200,height:200} as DOMRect);
    return {currentTarget:svg,clientX:x,clientY:y,pointerId:id,button:0,pressure:.7,timeStamp:1,type,preventDefault:vi.fn()} as unknown as PointerEvent;
  }
  it('stores independent normalized strokes with pressure; Undo removes only the last',async()=>{
    const f=await fixture(),c=f.componentInstance,svg=f.nativeElement.querySelector('svg');
    c.pointerDown(pointer(svg,110,120));c.pointerMove(pointer(svg,300,400));c.pointerUp(pointer(svg,300,400,1,'pointerup'));
    expect(c.strokes()[0][0]).toMatchObject({x:.5,y:.5,pressure:.7});expect(c.strokes()[0][1]).toMatchObject({x:1,y:1});
    c.pointerDown(pointer(svg,30,40));c.pointerUp(pointer(svg,30,40,1,'pointerup'));expect(c.strokes()).toHaveLength(2);
    c.undo();expect(c.strokes()).toHaveLength(1);c.clear();expect(c.strokes()).toEqual([]);
  });
  it('ignores other pointers and finishes cancelled strokes safely',async()=>{
    const f=await fixture(),c=f.componentInstance,svg=f.nativeElement.querySelector('svg');
    c.pointerDown(pointer(svg,110,120));c.pointerMove(pointer(svg,30,40,2));expect(c.strokes()[0]).toHaveLength(1);
    c.pointerUp(pointer(svg,110,120,1,'pointercancel'));c.undo();expect(c.strokes()).toEqual([]);
  });
  it('hides the model and help before revealing an unguided answer',async()=>{
    const f=await fixture();f.componentRef.setInput('guide',false);f.componentRef.setInput('helpAvailable',false);await f.whenStable();f.detectChanges();
    expect(f.nativeElement.querySelector('.model')).toBeNull();expect(f.nativeElement.textContent).not.toContain('Ver trazos');
    f.componentRef.setInput('guide',true);f.componentRef.setInput('helpAvailable',true);await f.whenStable();f.detectChanges();expect(f.nativeElement.querySelector('.model')).not.toBeNull();
  });
  it('composes independent glyphs without distorting their proportions and groups split strokes',async()=>{
    const f=await fixture('きゃ'),c=f.componentInstance;
    expect(c.modelStrokes()).toHaveLength(4);expect(c.modelStrokes().map(s=>s.order)).toEqual([0,1,2,3]);
    expect(c.modelStrokes()[2].transform).toBe('translate(512 256) scale(0.5)');
  });
  it('restarts playback and clears timers when destroyed',async()=>{
    const f=await fixture(),c=f.componentInstance;vi.useFakeTimers();
    c.play();vi.advanceTimersByTime(1);expect(c.animation()).toBe(true);
    c.play();expect(c.animation()).toBe(false);vi.advanceTimersByTime(1);expect(c.animation()).toBe(true);
    f.destroy();expect(vi.getTimerCount()).toBe(0);vi.useRealTimers();
  });
  it('keeps strokes drawn while the original Kana guide is still loading',async()=>{
    let resolve!:(value:ReturnType<typeof glyph>[])=>void;
    TestBed.overrideProvider(KanaStrokesService,{useValue:{load:()=>new Promise(r=>resolve=r)}});
    const f=TestBed.createComponent(KanaWritingCanvas);f.componentRef.setInput('character','あ');f.detectChanges();
    const svg=f.nativeElement.querySelector('svg');f.componentInstance.pointerDown(pointer(svg,110,120));
    f.componentInstance.pointerUp(pointer(svg,110,120,1,'pointerup'));resolve([glyph('あ')]);await f.whenStable();
    expect(f.componentInstance.strokes()).toHaveLength(1);
  });
});

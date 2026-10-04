import {TestBed} from '@angular/core/testing';
import {JapaneseGlyphService} from '../../../core/services/japanese-glyph.service';
import {WordWritingPractice} from './word-writing-practice';
describe('Sequential word writing',()=>{
  beforeEach(()=>{
    vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
    TestBed.configureTestingModule({providers:[{provide:JapaneseGlyphService,useValue:{load:async(character:string)=>[{character,strokes:character==='?'?[]:[{id:'1',value:'M10 10L30 30'}],clipPaths:[],viewBox:109,pathMode:'centerline'}]}}]});
  });
  afterEach(()=>vi.unstubAllGlobals());
  async function fixture(word='食べる'){const f=TestBed.createComponent(WordWritingPractice);f.componentRef.setInput('word',word);await f.whenStable();f.detectChanges();return f;}
  it('uses a single shared canvas with ordered characters and restores drawings on Previous',async()=>{
    const f=await fixture(),c=f.componentInstance;
    expect(f.nativeElement.querySelectorAll('app-japanese-writing-canvas')).toHaveLength(1);
    const drawing=[[{x:.1,y:.2,pressure:.7,timestamp:1}]];c.canvas()!.strokes.set(drawing);
    c.move(1);await f.whenStable();f.detectChanges();expect(c.index()).toBe(1);expect(c.canvas()!.character()).toBe('べ');
    c.move(0);await f.whenStable();f.detectChanges();expect(c.canvas()!.strokes()).toEqual(drawing);
    c.move(1);c.move(2);c.move(3);await f.whenStable();f.detectChanges();expect(f.nativeElement.querySelector('.whole-word').textContent).toBe('食べる');
    c.restart();await f.whenStable();expect(c.index()).toBe(0);expect(c.drawings()).toEqual([]);
  });
  it('does not disclose characters or guides in memory practice',async()=>{
    const f=await fixture();f.componentRef.setInput('guide',false);f.componentRef.setInput('revealWord',false);await f.whenStable();f.detectChanges();
    expect(f.nativeElement.querySelector('.model')).toBeNull();expect(f.nativeElement.querySelector('.character-strip').textContent).not.toContain('食');
  });
  it('shows a safe missing-glyph warning and allows continuing',async()=>{
    const f=await fixture('?');expect(f.nativeElement.querySelector('[role=alert]')).not.toBeNull();f.componentInstance.move(1);await f.whenStable();expect(f.componentInstance.index()).toBe(1);
  });
});

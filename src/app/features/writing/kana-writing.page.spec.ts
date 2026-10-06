import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { KanaWritingPage } from './kana-writing.page';
import { KanaStrokesService } from '../../core/services/kana-strokes.service';
import { KanaCard } from '../../shared/components/kana-card/kana-card';
import { ALL_KANA } from '../../data/kana';

describe('Writing entry points and manual practice',()=>{
  beforeEach(()=>{
    vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
    TestBed.configureTestingModule({providers:[provideRouter([]),{provide:KanaStrokesService,useValue:{load:async()=>[]}}]});
  });
  afterEach(()=>vi.unstubAllGlobals());
  it.each(['basic','dakuten','handakuten','combination'] as const)('labels both alphabets for %s',async variant=>{
    const f=TestBed.createComponent(KanaWritingPage),c=f.componentInstance;c.type.set('both');c.variants.set([variant]);c.start();
    for(const script of ['hiragana','katakana'] as const){
      c.current.set(ALL_KANA.find(k=>k.type===script && k.variant===variant)!);await f.whenStable();f.detectChanges();
      expect(f.nativeElement.querySelector('.practice h2').textContent).toContain(c.current()!.romaji);
      expect(f.nativeElement.querySelector('.script-label').textContent).toContain(c.i18n.t('content.'+script));
    }
  });
  it.each(['hiragana','katakana'] as const)('keeps single-script practice concise: %s',async script=>{
    const f=TestBed.createComponent(KanaWritingPage),c=f.componentInstance;c.type.set(script);c.start();await f.whenStable();f.detectChanges();expect(f.nativeElement.querySelector('.script-label')).toBeNull();
  });
  it('offers script, existing categories and guide configuration',async()=>{
    const f=TestBed.createComponent(KanaWritingPage);await f.whenStable();f.detectChanges();
    expect(f.nativeElement.querySelectorAll('fieldset')).toHaveLength(3);
    f.componentInstance.type.set('katakana');f.componentInstance.toggle('basic');f.componentInstance.toggle('combination');
    expect(f.componentInstance.pool().every(k=>k.type==='katakana'&&k.variant==='combination')).toBe(true);
  });
  it('requires answer reveal before rating and hides kana in unguided practice',async()=>{
    const f=TestBed.createComponent(KanaWritingPage),c=f.componentInstance;c.withGuide.set(false);c.start();await f.whenStable();f.detectChanges();
    const first=c.current()!.id;c.answer(true);expect(c.current()!.id).toBe(first);
    expect(f.nativeElement.querySelector('.model')).toBeNull();expect(f.nativeElement.querySelector('.answer')).toBeNull();
    c.revealed.set(true);await f.whenStable();f.detectChanges();expect(f.nativeElement.querySelector('.answer strong').textContent).toBe(c.current()!.character);
    c.answer(false);expect(c.resolved()).toBe(0);expect(c.current()!.id).not.toBe(first);
  });
  it('shows completion only after all kana have been marked Correct',async()=>{
    const f=TestBed.createComponent(KanaWritingPage),c=f.componentInstance;c.start();
    const total=c.session()!.total;while(c.current()){c.revealed.set(true);c.answer(true);}
    await f.whenStable();f.detectChanges();expect(c.resolved()).toBe(total);expect(f.nativeElement.querySelector('.finished')).not.toBeNull();
    c.configure();expect(c.session()).toBeNull();
  });
  it('makes each catalogue card a semantic button emitting its selected kana',async()=>{
    const f=TestBed.createComponent(KanaCard);f.componentRef.setInput('kana',ALL_KANA[0]);await f.whenStable();f.detectChanges();
    const onPressed=vi.fn();f.componentInstance.pressed.subscribe(onPressed);f.nativeElement.querySelector('button').click();expect(onPressed).toHaveBeenCalledWith(ALL_KANA[0]);
  });
});

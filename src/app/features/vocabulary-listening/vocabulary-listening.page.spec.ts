import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {ActivatedRoute, convertToParamMap, provideRouter} from '@angular/router';
import {JapaneseAudioService} from '../../core/services/japanese-audio.service';
import {StorageService} from '../../core/services/storage.service';
import {WeaknessService} from '../../core/services/weakness.service';
import {VOCABULARY_AUDIO_MANIFEST} from '../../data/vocabulary-audio-manifest.generated';
import {VocabularyListeningPage} from './vocabulary-listening.page';

describe('Vocabulary Listening page',()=>{
  const state=signal('ready'),play=vi.fn();
  beforeEach(()=>{
    state.set('ready');play.mockReset();play.mockResolvedValue('played');
    const values=new Map<string,unknown>();
    vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
    TestBed.configureTestingModule({providers:[provideRouter([]),
      {provide:ActivatedRoute,useValue:{snapshot:{queryParamMap:convertToParamMap({})}}},
      {provide:JapaneseAudioService,useValue:{state,hasAudio:(id:string)=>Object.hasOwn(VOCABULARY_AUDIO_MANIFEST,id),play,stop:vi.fn()}},
      {provide:StorageService,useValue:{get:(key:string,fallback:unknown)=>values.get(key)??fallback,set:(key:string,value:unknown)=>values.set(key,value),rawKey:(key:string)=>key,cloudRevision:signal(0)}},
    ]});
  });
  afterEach(()=>vi.unstubAllGlobals());
  it('only counts audio-enabled selected categories before starting',async()=>{
    const f=TestBed.createComponent(VocabularyListeningPage),c=f.componentInstance;await f.whenStable();
    expect(c.pool()).toHaveLength(606);const category=c.categories[0];c.selected.set([category]);
    expect(c.pool().every(e=>e.studyCategory===category&&Object.hasOwn(VOCABULARY_AUDIO_MANIFEST,e.id))).toBe(true);
  });
  it('Japanese prompt hides reading/meaning until feedback and keeps replay visible',async()=>{
    const f=TestBed.createComponent(VocabularyListeningPage),c=f.componentInstance;c.mode.set('japanese');c.start();await f.whenStable();f.detectChanges();
    const q=c.question()!;expect(f.nativeElement.querySelector('.feedback')).toBeNull();expect(f.nativeElement.querySelector('.replay')).not.toBeNull();
    c.answer(q.options.find(o=>o.correct)!.id);f.detectChanges();
    expect(f.nativeElement.querySelector('.feedback').textContent).toContain(q.entry.primaryReading);
    expect(c.question()).toBe(q);expect(TestBed.inject(WeaknessService).records()).toEqual([]);
    c.next();expect(TestBed.inject(WeaknessService).records()[0]).toEqual(expect.objectContaining({module:'vocabulary',activity:'listening',itemId:q.entry.id,score:0}));
  });
  it('wrong answer shows feedback, records unchanged failure score once, and does not auto-advance',async()=>{
    const f=TestBed.createComponent(VocabularyListeningPage),c=f.componentInstance;c.start();await f.whenStable();
    const q=c.question()!,wrong=q.options.find(o=>!o.correct)!;c.answer(wrong.id);c.answer(wrong.id);f.detectChanges();
    expect(f.nativeElement.querySelectorAll('.incorrect')).toHaveLength(1);expect(f.nativeElement.querySelectorAll('.correct')).toHaveLength(1);
    expect(c.question()).toBe(q);c.next();
    expect(TestBed.inject(WeaknessService).records()[0]).toEqual(expect.objectContaining({failures:1,attempts:1,score:2,activity:'listening'}));
  });
  it('autoplay block waits for the replay button without skipping or scoring',async()=>{
    play.mockResolvedValueOnce('blocked');const f=TestBed.createComponent(VocabularyListeningPage),c=f.componentInstance;c.start();await f.whenStable();
    const q=c.question()!;expect(c.canAnswer()).toBe(false);expect(c.skipped()).toBe(0);await c.replay();expect(c.canAnswer()).toBe(true);expect(c.question()).toBe(q);
  });
  it('audio failure skips the word, preserves attempts and never penalizes',async()=>{
    play.mockResolvedValueOnce('error');const f=TestBed.createComponent(VocabularyListeningPage),c=f.componentInstance;c.start();const failed=c.question()!.entry.id;await f.whenStable();
    expect(c.skipped()).toBe(1);expect(c.question()!.entry.id).not.toBe(failed);expect(c.answered()).toBe(0);expect(TestBed.inject(WeaknessService).records()).toEqual([]);
  });
  it('a late playback error during feedback does not penalize on Continue',async()=>{
    const f=TestBed.createComponent(VocabularyListeningPage),c=f.componentInstance;c.start();await f.whenStable();
    c.answer(c.question()!.options.find(o=>!o.correct)!.id);state.set('error');c.next();expect(TestBed.inject(WeaknessService).records()).toEqual([]);
  });
  it('weak practice contains only listening records and approved audio, not writing weaknesses',async()=>{
    TestBed.overrideProvider(ActivatedRoute,{useValue:{snapshot:{queryParamMap:convertToParamMap({weak:'1'})}}});
    const service=TestBed.inject(WeaknessService),ids=Object.keys(VOCABULARY_AUDIO_MANIFEST).slice(0,2);
    for(let i=0;i<2;i++){service.record('vocabulary',ids[0],false);service.record('vocabulary',ids[1],false,'listening');service.record('vocabulary','obsolete',false,'listening');}
    const f=TestBed.createComponent(VocabularyListeningPage),c=f.componentInstance;await f.whenStable();
    expect(c.total()).toBe(1);expect(c.question()!.entry.id).toBe(ids[1]);
    c.answer(c.question()!.options.find(o=>o.correct)!.id);c.next();expect(c.question()).toBeNull();
  });
});

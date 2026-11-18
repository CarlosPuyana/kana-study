import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { PHRASE_ISLANDS_CATALOG } from '../../data/phrase-islands/phrase-islands-catalog';
import { PHRASE_AUDIO_FACTORY, PhraseAudioService } from './phrase-audio.service';

describe('Islands audio isolation and cancellation', () => {
  function setup() {
    const audios: any[] = [];
    TestBed.configureTestingModule({providers: [PhraseAudioService,
      {provide: DOCUMENT, useValue: {baseURI:'https://example.test/kana-study/'}},
      {provide: PHRASE_AUDIO_FACTORY, useValue: () => {
        const audio = {src:'',preload:'',onended:null,onerror:null,play:vi.fn().mockResolvedValue(undefined),pause:vi.fn(),load:vi.fn(),removeAttribute:vi.fn()};
        audios.push(audio); return audio;
      }},
    ]});
    return {service:TestBed.inject(PhraseAudioService),audios};
  }
  afterEach(() => { TestBed.resetTestingModule(); vi.restoreAllMocks(); });
  it('resolves versioned assets under the GitHub Pages base without creating audio', () => {
    const {service,audios}=setup(); const phrase=PHRASE_ISLANDS_CATALOG[0];
    expect(service.resolve(phrase)).toBe('https://example.test/kana-study/'+phrase.audio.path); expect(audios).toHaveLength(0);
  });
  it('replays on demand, stops the previous element and never opens study storage', async () => {
    const {service,audios}=setup();const write=vi.spyOn(Storage.prototype,'setItem');
    await service.play(PHRASE_ISLANDS_CATALOG[0]);const oldEnded=audios[0].onended;
    await service.play(PHRASE_ISLANDS_CATALOG[1]);expect(audios[0].pause).toHaveBeenCalledOnce();
    oldEnded();expect(service.currentId()).toBe(PHRASE_ISLANDS_CATALOG[1].id);expect(service.state()).toBe('playing');
    service.stop();expect(audios[1].pause).toHaveBeenCalledOnce();expect(service.currentId()).toBeNull();expect(write).not.toHaveBeenCalled();
  });
  it.each(['NotAllowedError','NotSupportedError'])('exposes %s and permits an explicit retry',async name=>{
    const {service,audios}=setup();const phrase=PHRASE_ISLANDS_CATALOG[0];
    const start=service.play(phrase);audios[0].onerror();await start;expect(service.state()).toBe('error');
    const make=TestBed.inject(PHRASE_AUDIO_FACTORY);vi.spyOn(service as any,'factory').mockReturnValue({...make(),play:()=>Promise.reject(new DOMException('test',name))});
    await service.play(phrase);expect(service.state()).toBe(name==='NotAllowedError'?'blocked':'error');
  });
  it('keeps an intentional pause when pending play rejects with AbortError',async()=>{
    const {service,audios}=setup();let reject!:(e:DOMException)=>void;
    vi.spyOn(service as any,'factory').mockImplementation(()=>{const a={play:()=>new Promise<void>((_,r)=>reject=r),pause:vi.fn(),removeAttribute:vi.fn(),load:vi.fn()};audios.push(a);return a;});
    const pending=service.play(PHRASE_ISLANDS_CATALOG[0]);service.pause();reject(new DOMException('paused','AbortError'));await pending;expect(service.state()).toBe('paused');
  });
  it('ignores a late play promise after stop',async()=>{
    const {service,audios}=setup();let resolve!:()=>void;
    vi.spyOn(service as any,'factory').mockImplementation(()=>{const a={play:()=>new Promise<void>(r=>resolve=r),pause:vi.fn(),removeAttribute:vi.fn(),load:vi.fn(),onerror:null,onended:null};audios.push(a);return a;});
    const pending=service.play(PHRASE_ISLANDS_CATALOG[0]);service.stop();resolve();await pending;expect(service.state()).toBe('idle');
  });
});

import {DOCUMENT} from '@angular/common';
import {TestBed} from '@angular/core/testing';
import {JAPANESE_AUDIO_FACTORY, JapaneseAudioService} from './japanese-audio.service';
import {VOCABULARY_AUDIO_MANIFEST} from '../../data/vocabulary-audio-manifest.generated';

describe('shared Japanese audio',()=>{
  const id=Object.keys(VOCABULARY_AUDIO_MANIFEST)[0];
  function setup(base='https://example.test/kana-study/'){
    const audio={src:'',preload:'',onerror:null as ((event:Event)=>void)|null,onended:null as ((event:Event)=>void)|null,
      play:vi.fn().mockResolvedValue(undefined),pause:vi.fn(),load:vi.fn(),removeAttribute:vi.fn()};
    const factory=vi.fn(()=>audio as unknown as HTMLAudioElement);
    TestBed.configureTestingModule({providers:[{provide:DOCUMENT,useValue:{baseURI:base}},{provide:JAPANESE_AUDIO_FACTORY,useValue:factory}]});
    return {service:TestBed.inject(JapaneseAudioService),audio,factory};
  }
  it('resolves an approved ID using document.baseURI on GitHub Pages',()=>{
    const {service}=setup();expect(service.resolve(id)).toBe('https://example.test/kana-study/'+VOCABULARY_AUDIO_MANIFEST[id]);
    expect(service.hasAudio('unknown')).toBe(false);expect(service.resolve('unknown')).toBeNull();
  });
  it('resolves assets on localhost too',()=>{expect(setup('http://localhost:4200/').service.resolve(id)).toBe('http://localhost:4200/'+VOCABULARY_AUDIO_MANIFEST[id]);});
  it('does not create or preload audio while resolving availability',()=>{const {service,factory}=setup();for(const entryId of Object.keys(VOCABULARY_AUDIO_MANIFEST)){service.hasAudio(entryId);service.resolve(entryId);}expect(factory).not.toHaveBeenCalled();});
  it('plays and repeats centrally, stopping the prior playback',async()=>{
    const {service,audio}=setup();expect(await service.play(id)).toBe('played');expect(service.state()).toBe('playing');
    expect(await service.repeat()).toBe('played');expect(audio.pause).toHaveBeenCalledOnce();expect(audio.play).toHaveBeenCalledTimes(2);
    service.stop();expect(service.state()).toBe('idle');expect(audio.removeAttribute).toHaveBeenCalledWith('src');
  });
  it('autoplay denial is blocked rather than a failed MP3',async()=>{
    const {service,audio}=setup();audio.play.mockRejectedValue(new DOMException('blocked','NotAllowedError'));
    expect(await service.play(id)).toBe('blocked');expect(service.state()).toBe('blocked');
  });
  it('reports media errors and missing IDs',async()=>{
    const {service,audio,factory}=setup();expect(await service.play('missing')).toBe('error');expect(factory).not.toHaveBeenCalled();
    await service.play(id);audio.onerror!(new Event('error'));expect(service.state()).toBe('error');
  });
  it('ignores stale failures/results after stopping a pending playback',async()=>{
    const {service,audio}=setup();let finish!:()=>void;audio.play.mockImplementation(()=>new Promise<void>(resolve=>finish=resolve));
    const pending=service.play(id),oldError=audio.onerror!;service.stop();oldError(new Event('error'));finish();
    expect(await pending).toBe('stopped');expect(service.state()).toBe('idle');
  });
});

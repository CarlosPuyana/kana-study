import {KaishiStaticMediaService} from '../../../core/services/kaishi-static-media.service';
import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {KaishiCardMedia} from './kaishi-card-media';
import {KaishiMediaService} from '../../../core/services/kaishi-media.service';
import {TranslationService} from '../../../core/services/translation.service';
import {WorkspaceService} from '../../../core/services/workspace.service';
import {JAPANESE_1500_ENTRIES} from '../../../data/japanese-1500.generated';
describe('Kaishi back media lifecycle',()=>{
 let media:{autoAudio:ReturnType<typeof signal<boolean>>;pitch:ReturnType<typeof signal<boolean>>;revision:ReturnType<typeof signal<number>>;store:{resource:ReturnType<typeof vi.fn>}};
 const audios:{src?:string;onended?:null|(()=>void);onerror?:null|(()=>void);pause:ReturnType<typeof vi.fn>;load:ReturnType<typeof vi.fn>;removeAttribute:ReturnType<typeof vi.fn>;play:ReturnType<typeof vi.fn>}[]=[];
 const remote={card:vi.fn(),resource:vi.fn()};
 const create=vi.fn(),revoke=vi.fn();
 beforeEach(()=>{TestBed.resetTestingModule();audios.length=0;let next=0;create.mockReset().mockImplementation(()=>`blob:fixture-${next++}`);revoke.mockReset();
  vi.stubGlobal('URL',{createObjectURL:create,revokeObjectURL:revoke});
  vi.stubGlobal('Audio',class{pause=vi.fn();load=vi.fn();removeAttribute=vi.fn();play=vi.fn(async()=>{});constructor(){audios.push(this);}});
  remote.card.mockReset().mockResolvedValue({catalog:{publication:'blocked'},card:null});remote.resource.mockReset().mockResolvedValue(new Blob(['fixture']));
  media={autoAudio:signal(false),pitch:signal(false),revision:signal(0),store:{resource:vi.fn(async(_id:string,kind:string)=>kind==='picture'?null:new Blob(['ID3'],{type:'audio/mpeg'}))}};
  TestBed.configureTestingModule({imports:[KaishiCardMedia],providers:[{provide:KaishiStaticMediaService,useValue:remote},{provide:KaishiMediaService,useValue:media},{provide:TranslationService,useValue:{t:(key:string)=>key}}]});
 });
 afterEach(()=>{TestBed.resetTestingModule();vi.unstubAllGlobals();});
 async function render(){const f=TestBed.createComponent(KaishiCardMedia);f.componentRef.setInput('entry',JAPANESE_1500_ENTRIES[0]);f.detectChanges();await f.whenStable();f.detectChanges();return f;}
 it('plays only on request, stops previous audio and revokes every URL on card/workspace/destroy',async()=>{
  const f=await render();await vi.waitFor(()=>expect(f.componentInstance.sources().wordAudio).toBeTruthy());expect(audios).toHaveLength(0);expect(f.nativeElement.querySelector('img')).toBeNull();
  await f.componentInstance.play('wordAudio');expect(audios).toHaveLength(1);
  await f.componentInstance.play('sentenceAudio');expect(audios[0].pause).toHaveBeenCalled();
  f.componentRef.setInput('entry',JAPANESE_1500_ENTRIES[1]);f.detectChanges();await f.whenStable();await vi.waitFor(()=>expect(f.componentInstance.loading()).toBe(false));expect(audios[0].pause).toHaveBeenCalled();expect(revoke).toHaveBeenCalledTimes(2);
  await f.componentInstance.play('wordAudio');TestBed.inject(WorkspaceService).activateUser('isolated');f.detectChanges();await f.whenStable();expect(audios[0].pause).toHaveBeenCalled();
  f.destroy();expect(revoke.mock.calls.length).toBe(create.mock.calls.length);
 });
 it('ignores late resource promises after closing and hides missing resources without broken controls',async()=>{
  let resolve!:(blob:Blob|null)=>void;media.store.resource.mockImplementation(()=>new Promise(r=>resolve=r));
  const f=await render();f.destroy();resolve(new Blob(['ID3']));await Promise.resolve();expect(create).not.toHaveBeenCalled();
 });
 it('respects explicit disabled pitch, emits structured text only and rejects unknown executable markup',async()=>{
  const f=await render();expect(f.nativeElement.querySelector('.pitch')).toBeNull();media.pitch.set(true);f.detectChanges();expect(f.nativeElement.querySelector('.pitch')).not.toBeNull();
  f.componentRef.setInput('entry',{...JAPANESE_1500_ENTRIES[0],pitchAccentHtml:'<img onerror="alert(1)" src="https://invalid.example">'});f.detectChanges();expect(f.nativeElement.querySelector('.pitch')).toBeNull();expect(f.nativeElement.querySelector('script')).toBeNull();
 });
 it('prefers a complete local copy and does not fetch static metadata or audio automatically',async()=>{
  media.store.resource.mockResolvedValue(new Blob(['local']));const f=await render();await vi.waitFor(()=>expect(f.componentInstance.loading()).toBe(false));
  expect(remote.card).not.toHaveBeenCalled();expect(remote.resource).not.toHaveBeenCalled();expect(audios).toHaveLength(0);
  await f.componentInstance.play('wordAudio');expect(audios).toHaveLength(1);expect(remote.resource).not.toHaveBeenCalled();
 });
 it('loads the static picture on reveal and each audio only after a manual request',async()=>{
  media.store.resource.mockResolvedValue(null);const refs={wordAudio:{path:'word'},sentenceAudio:{path:'sentence'},picture:{path:'picture'}};
  remote.card.mockResolvedValue({catalog:{publication:'ready',dataset:'test'},card:{resources:refs}});
  const f=await render();await vi.waitFor(()=>expect(f.componentInstance.loading()).toBe(false));
  expect(remote.resource).toHaveBeenCalledTimes(1);expect(remote.resource.mock.calls[0][0]).toEqual(refs.picture);expect(audios).toHaveLength(0);
  await f.componentInstance.play('wordAudio');expect(remote.resource).toHaveBeenCalledTimes(2);await f.componentInstance.play('sentenceAudio');expect(remote.resource).toHaveBeenCalledTimes(3);expect(audios[0].pause).toHaveBeenCalled();
 });
 it('recovers from network error without autoplay or losing the textual back',async()=>{
  media.store.resource.mockResolvedValue(null);remote.card.mockRejectedValueOnce(new Error('network'));
  const f=await render();await vi.waitFor(()=>expect(f.componentInstance.failed()).toBe(true));
  remote.card.mockResolvedValue({catalog:{publication:'ready',dataset:'test'},card:{resources:{wordAudio:{path:'word'}}}});f.componentInstance.retry();f.detectChanges();
  await vi.waitFor(()=>expect(f.componentInstance.failed()).toBe(false));await vi.waitFor(()=>expect(f.componentInstance.sources().wordAudio).toBeTruthy());expect(audios).toHaveLength(0);expect(remote.card.mock.calls.at(-1)?.[2]).toBe(true);
 });
 it('ignores a stale descriptor after a rapid card change',async()=>{
  media.store.resource.mockResolvedValue(null);let resolve!:(value:any)=>void;remote.card.mockImplementationOnce(()=>new Promise(r=>resolve=r));
  const f=await render();await vi.waitFor(()=>expect(remote.card).toHaveBeenCalledTimes(1));
  f.componentRef.setInput('entry',JAPANESE_1500_ENTRIES[1]);f.detectChanges();await f.whenStable();
  resolve({catalog:{publication:'ready',dataset:'test'},card:{resources:{picture:{path:'old'}}}});await Promise.resolve();await Promise.resolve();
  expect(remote.resource).not.toHaveBeenCalled();expect(f.componentInstance.sources().picture).toBeUndefined();
 });

 it('defaults to one sequential appearance, waits for real ended and reuses its audio element',async()=>{
  media.autoAudio.set(true);const f=await render();await vi.waitFor(()=>expect(f.componentInstance.playing()).toBe('wordAudio'));
  expect(audios).toHaveLength(1);expect(audios[0].play).toHaveBeenCalledTimes(1);
  audios[0].onended?.();await vi.waitFor(()=>expect(f.componentInstance.playing()).toBe('sentenceAudio'));
  expect(audios).toHaveLength(1);expect(audios[0].play).toHaveBeenCalledTimes(2);audios[0].onended?.();
  media.pitch.set(true);f.detectChanges();media.revision.update(n=>n+1);f.detectChanges();await f.whenStable();
  expect(audios[0].play).toHaveBeenCalledTimes(2);
 });
 it('cancels a pending second clip on opt-out or a manual request',async()=>{
  media.autoAudio.set(true);const f=await render();await vi.waitFor(()=>expect(f.componentInstance.playing()).toBe('wordAudio'));
  const ended=audios[0].onended;media.autoAudio.set(false);f.detectChanges();await f.whenStable();ended?.();await Promise.resolve();
  expect(audios[0].play).toHaveBeenCalledTimes(1);expect(f.componentInstance.playing()).toBeNull();
  await f.componentInstance.play('sentenceAudio');expect(audios[0].play).toHaveBeenCalledTimes(2);
 });
 it('starts audio independently of a slow/failed image and distinguishes preparing from playing',async()=>{
  media.autoAudio.set(true);media.store.resource.mockResolvedValue(null);
  const refs={wordAudio:{path:'word'},picture:{path:'picture'}};remote.card.mockResolvedValue({catalog:{publication:'ready'},card:{resources:refs}});
  let release!:(v:Blob)=>void;remote.resource.mockImplementation((ref:any)=>ref.path==='picture'?Promise.reject(new Error('image')):new Promise(r=>release=r));
  const f=await render();await vi.waitFor(()=>expect(f.componentInstance.preparing()).toBe('wordAudio'));expect(f.componentInstance.playing()).toBeNull();
  release(new Blob(['word']));await vi.waitFor(()=>expect(f.componentInstance.playing()).toBe('wordAudio'));expect(f.componentInstance.failed()).toBe(true);
 });
 it('recovers manually from NotAllowedError without retry loops or automatic sentence playback',async()=>{
  media.autoAudio.set(true);const f=await render();await vi.waitFor(()=>expect(audios).toHaveLength(1));
  f.componentInstance.stop();audios[0].play.mockRejectedValueOnce(new DOMException('blocked','NotAllowedError'));
  await f.componentInstance.play('wordAudio');expect(f.componentInstance.audioError()).toBe('blocked');expect(f.componentInstance.playing()).toBeNull();
  const calls=audios[0].play.mock.calls.length;f.componentInstance.retry();f.detectChanges();await vi.waitFor(()=>expect(f.componentInstance.loading()).toBe(false));expect(audios[0].play).toHaveBeenCalledTimes(calls);
  await f.componentInstance.play('wordAudio');expect(f.componentInstance.playing()).toBe('wordAudio');
 });
 it('cancels on hidden tab and disabling the active card without replay on return',async()=>{
  media.autoAudio.set(true);const f=await render();await vi.waitFor(()=>expect(f.componentInstance.playing()).toBe('wordAudio'));
  Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));expect(f.componentInstance.playing()).toBeNull();
  Reflect.deleteProperty(document,'hidden');document.dispatchEvent(new Event('visibilitychange'));expect(audios[0].play).toHaveBeenCalledTimes(1);
  await f.componentInstance.play('wordAudio');f.componentRef.setInput('active',false);f.detectChanges();expect(f.componentInstance.playing()).toBeNull();
 });

 it('still plays the available local word when static metadata fails',async()=>{
  media.autoAudio.set(true);media.store.resource.mockImplementation(async(_id:string,kind:string)=>kind==='wordAudio'?new Blob(['local']):null);remote.card.mockRejectedValue(new Error('offline'));
  const f=await render();await vi.waitFor(()=>expect(f.componentInstance.playing()).toBe('wordAudio'));expect(f.componentInstance.failed()).toBe(true);expect(remote.resource).not.toHaveBeenCalled();
 });

 it('opts into the practice layout without changing the default study layout or playback policy',async()=>{
  const f=await render();expect(f.nativeElement.classList.contains('practice-media')).toBe(false);
  media.pitch.set(true);f.componentRef.setInput('layout','practice');f.detectChanges();expect(f.nativeElement.classList.contains('practice-media')).toBe(true);
  expect(f.nativeElement.querySelector('.pitch h2').textContent).toBe('kaishi.pitchTitle');expect(audios).toHaveLength(0);
 });

});

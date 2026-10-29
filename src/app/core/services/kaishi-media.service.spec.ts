import {TestBed} from '@angular/core/testing';
import {KaishiMediaService,KAISHI_MEDIA_STORE,KAISHI_MEDIA_WORKER} from './kaishi-media.service';
import {WorkspaceService} from './workspace.service';
import {KAISHI_PACKAGE} from '../models/kaishi-media.model';
describe('Kaishi import orchestration and local preferences',()=>{
 let worker:{terminate:ReturnType<typeof vi.fn>;postMessage:ReturnType<typeof vi.fn>;onmessage:((e:MessageEvent)=>void)|null;onerror:(()=>void)|null};
 let store:{active:ReturnType<typeof vi.fn>;discard:ReturnType<typeof vi.fn>;close:ReturnType<typeof vi.fn>};let service:KaishiMediaService;
 const file=()=>{const f=new File([],'compatible.apkg');Object.defineProperty(f,'size',{value:KAISHI_PACKAGE.bytes});return f;};
 beforeEach(()=>{TestBed.resetTestingModule();localStorage.clear();sessionStorage.clear();worker={terminate:vi.fn(),postMessage:vi.fn(),onmessage:null,onerror:null};store={active:vi.fn(async()=>null),discard:vi.fn(async()=>{}),close:vi.fn()};
  TestBed.configureTestingModule({providers:[{provide:KAISHI_MEDIA_STORE,useValue:store},{provide:KAISHI_MEDIA_WORKER,useValue:()=>worker}]});service=TestBed.inject(KaishiMediaService);TestBed.tick();});
 afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();});
 it('rejects wrong files before starting a worker',async()=>{await service.start(new File(['wrong'],'wrong.apkg'));expect(service.error()).toBe('package');expect(worker.postMessage).not.toHaveBeenCalled();});
 it('reports cancellation before a staging UUID exists without claiming an installed copy',async()=>{
  await service.cancel();expect(service.phase()).toBe('cancelled');expect(service.installation()).toBeNull();expect(store.discard).not.toHaveBeenCalled();
 });
 it('cancels only its own staging and preserves the previous installation',async()=>{
  await service.start(file());const id=worker.postMessage.mock.calls[0][0].id;
  store.active.mockResolvedValue({id:'previous',phase:'ready'});await service.cancel();
  expect(worker.terminate).toHaveBeenCalled();expect(store.discard).toHaveBeenCalledWith(id);expect(service.installation()?.id).toBe('previous');expect(service.phase()).toBe('cancelled');
  worker.onmessage?.({data:{phase:'installed'}} as MessageEvent);worker.onerror?.();await Promise.resolve();expect(service.phase()).toBe('cancelled');
 });
 it('reports quota before extraction without replacing existing data',async()=>{
  const estimate=vi.fn(async()=>({quota:10,usage:9}));Object.defineProperty(navigator,'storage',{configurable:true,value:{estimate}});
  try{await service.start(file());expect(service.error()).toBe('quota');expect(worker.postMessage).not.toHaveBeenCalled();}finally{Reflect.deleteProperty(navigator,'storage');}
 });
 it('stops an import when workspace activation changes, and keeps pitch preferences local per workspace',async()=>{
  const workspace=TestBed.inject(WorkspaceService);expect(service.pitch()).toBe(true);service.setPitch(false);
  await service.start(file());workspace.activateUser('isolated-test');TestBed.tick();await Promise.resolve();
  expect(worker.terminate).toHaveBeenCalled();expect(service.pitch()).toBe(true);service.setPitch(false);
  workspace.activateUser('other-test');TestBed.tick();expect(service.pitch()).toBe(true);workspace.activateGuest();TestBed.tick();expect(service.pitch()).toBe(false);
  expect(localStorage.getItem('kana-study.kaishi-pitch.v1')).toBe('false');
 });
 it('handles a worker quota error without changing the active generation',async()=>{
  await service.start(file());store.active.mockResolvedValue({id:'previous',phase:'ready'});
  worker.onmessage?.({data:{phase:'error',code:'quota'}} as MessageEvent);await vi.waitFor(()=>expect(service.phase()).toBe('error'));
  expect(service.error()).toBe('quota');expect(worker.terminate).toHaveBeenCalled();expect(service.installation()?.id).toBe('previous');
 });
 it('autoaudio defaults on independently of pitch and persists explicit false per workspace',()=>{
  const workspace=TestBed.inject(WorkspaceService);expect(service.autoAudio()).toBe(true);service.setAutoAudio(false);expect(service.pitch()).toBe(true);
  workspace.activateUser('audio-b');TestBed.tick();expect(service.autoAudio()).toBe(true);service.setPitch(false);expect(service.autoAudio()).toBe(true);
  workspace.activateGuest();TestBed.tick();expect(service.autoAudio()).toBe(false);
  expect(localStorage.getItem('kana-study.kaishi-auto-audio.v1')).toBe('false');
 });

});

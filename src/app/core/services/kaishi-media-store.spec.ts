import {IDBFactory,IDBKeyRange,IDBObjectStore as FakeStore} from 'fake-indexeddb';
import {KaishiMediaStore,KAISHI_MEDIA_DATABASE} from './kaishi-media-store';
import {KAISHI_MEDIA_MANIFEST} from '../../data/kaishi-media.manifest';
import {KAISHI_PACKAGE} from '../models/kaishi-media.model';
const ID='11111111-1111-4111-8111-111111111111',OLD='22222222-2222-4222-8222-222222222222';
describe('Kaishi dedicated staged device store',()=>{
 let factory:IDBFactory,store:KaishiMediaStore;
 beforeEach(()=>{factory=new IDBFactory();vi.stubGlobal('IDBKeyRange',IDBKeyRange);vi.stubGlobal('indexedDB',factory);store=new KaishiMediaStore(factory);});
 afterEach(()=>{store.close();vi.restoreAllMocks();vi.unstubAllGlobals();});
 // Minimal explicit IDB fixtures exercise transaction/recovery, not fingerprint acceptance.
 async function seedStage(id:string){await store.active();const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=factory.open(KAISHI_MEDIA_DATABASE);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 await new Promise<void>((resolve,reject)=>{const tx=db.transaction(['meta','links'],'readwrite');tx.objectStore('meta').add({id,phase:'installing',count:0,bytes:0,installedAt:1});tx.objectStore('links').add({...KAISHI_MEDIA_MANIFEST[0],generation:id});tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);});db.close();}
 async function seedPrevious(){await seedStage(OLD);const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=factory.open(KAISHI_MEDIA_DATABASE);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  await new Promise<void>((resolve,reject)=>{const tx=db.transaction('meta','readwrite');tx.objectStore('meta').put({id:OLD,phase:'ready',count:KAISHI_PACKAGE.resources,bytes:KAISHI_PACKAGE.unpackedBytes,installedAt:1});tx.objectStore('meta').put({id:'active',generation:OLD});tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);});db.close();}
 it('keeps staging invisible, rejects incomplete activation and discards only that installation',async()=>{
  await seedPrevious();await seedStage(ID);await store.put(ID,[{id:'997',blob:new Blob(['ID3sample'],{type:'audio/mpeg'})}]);
  await expect(store.activate(ID)).rejects.toThrow();expect((await store.active())?.id).toBe(OLD);
  await store.discard(ID);expect((await store.active())?.id).toBe(OLD);await expect(store.put(ID,[{id:'1',blob:new Blob(['x'],{type:'audio/mpeg'})}])).rejects.toThrow();
 });
 it('a reload leaves a previous valid installation active and permits removal/reinstall without progress access',async()=>{
  await seedPrevious();await seedStage(ID);store.close();store=new KaishiMediaStore(factory);
  expect((await store.active())?.id).toBe(OLD);await store.discard(ID);await store.discard(OLD);expect((await store.active())?.id).toBe(OLD);
  await store.discard(OLD,true);expect(await store.active()).toBeNull();await seedStage(ID);expect(await store.resource(KAISHI_MEDIA_MANIFEST[0].id,'wordAudio')).toBeNull();
 });
 it('rolls back duplicate resources, rejects unsafe names/types and leaves no active partial install',async()=>{
  await seedStage(ID);const resource={id:'1',blob:new Blob(['ID3'],{type:'audio/mpeg'})};
  await expect(store.put(ID,[resource,resource])).rejects.toThrow();await store.put(ID,[resource]);
  await expect(store.put(ID,[{...resource,id:'../1'}])).rejects.toThrow();await expect(store.put(ID,[{id:'2',blob:new Blob(['<script>'],{type:'text/html'})}])).rejects.toThrow();expect(await store.active()).toBeNull();
 });
 it('aborts a quota failure without replacing previous media and permits retrying the same staging',async()=>{
  await seedPrevious();await seedStage(ID);const add=FakeStore.prototype.add;
  const failure=vi.spyOn(FakeStore.prototype,'add').mockImplementation(function(this:IDBObjectStore,...args:[any,IDBValidKey?]){if(this.name==='resources')throw new DOMException('quota','QuotaExceededError');return add.apply(this,args);});
  const resource={id:'1',blob:new Blob(['ID3'],{type:'audio/mpeg'})};
  await expect(store.put(ID,[resource])).rejects.toMatchObject({name:'QuotaExceededError'});expect((await store.active())?.id).toBe(OLD);
  failure.mockRestore();await store.put(ID,[resource]);expect((await store.active())?.id).toBe(OLD);
 });

});

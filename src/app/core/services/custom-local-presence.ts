/** Readonly presence probe. Never upgrades a database, repairs a registry or starts transport. */
export async function hasLocalCustomData(owner:string,factory:IDBFactory=globalThis.indexedDB):Promise<boolean>{
 if(!factory)return false;
 if(owner!=='guest'&&!owner.startsWith('user:'))throw new Error('Invalid local workspace');
 const db=await openExisting('kana-study-custom-decks-v1',factory);
 if(!db)return false;
 try{
  const stores=['decks','cards','progress','events','daily','journal','identities','confirmations','volume-links'].filter(s=>db.objectStoreNames.contains(s));
  if(!stores.length)return false;
  return await new Promise<boolean>((resolve,reject)=>{
   const tx=db.transaction(stores,'readonly');let found=false;
   tx.oncomplete=()=>resolve(found);tx.onabort=()=>reject(tx.error??new Error('Local inspection aborted'));tx.onerror=()=>{};
   for(const s of stores){const r=tx.objectStore(s).index('workspace').count(owner);r.onsuccess=()=>{found ||= r.result>0;};}
  });
 }finally{db.close();}
}
function openExisting(name:string,factory:IDBFactory):Promise<IDBDatabase|null>{
 return new Promise((resolve,reject)=>{
  const r=factory.open(name);let missing=false,failed=false;
  r.onupgradeneeded=()=>{missing=true;r.transaction?.abort();r.result.close();};
  r.onerror=()=>missing?resolve(null):reject(r.error);
  r.onblocked=()=>{failed=true;reject(new Error('Local deck database blocked'));};
  r.onsuccess=()=>{if(failed)r.result.close();else resolve(r.result);};
 });
}
/** Legacy presence only: never instantiates repositories with recovery/upgrade effects. */
export async function hasLegacyLocalData(factory:IDBFactory=globalThis.indexedDB):Promise<boolean>{
 if(!factory)return false;
 for(const [name,stores] of [
  ['kana-study-decks',['card-progress','review-events','daily-state']],
  ['kana-study-rush',['sessions','coverage']],
  ['kana-study-manga-study',['saved-items']],
  ['kana-study-attempts-v1',['events']],
 ] as const){
  const db=await openExisting(name,factory);if(!db)continue;
  try{for(const s of stores){
   if(!db.objectStoreNames.contains(s))continue;
   const count=await new Promise<number>((resolve,reject)=>{
    const store=db.transaction(s,'readonly').objectStore(s);
    const r=name==='kana-study-attempts-v1'?store.count(IDBKeyRange.bound(['guest'],['guest',[]])):store.count();
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
   });if(count>0)return true;
  }}finally{db.close();}
 }
 return false;
}

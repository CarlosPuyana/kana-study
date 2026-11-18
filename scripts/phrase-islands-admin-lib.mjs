import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { canonicalJson, parseDraftJson, validateDraft, normalizeJapanese, synthesisInput, DEFAULT_PHRASE_SYNTHESIS } from '../src/app/core/models/phrase-admin-contract.ts';

export { synthesisInput };
export const REPO=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const DATA='src/app/data/phrase-islands/';
const CONTENT=DATA+'phrases.v1.json', EDITORIAL=DATA+'editorial.v1.json', AUDIO=DATA+'audio.v1.json';
const LANGS=['es','en','ca'];
export const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
export const fingerprint=value=>sha(canonicalJson(value));
export function readJson(file){return JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));}
function within(base,target){const relative=path.relative(path.resolve(base),path.resolve(target));return !relative||relative!=='..'&&!relative.startsWith('..'+path.sep)&&!path.isAbsolute(relative);}
export function safePath(root,relative){
 if(typeof relative!=='string'||!relative||relative.includes('\\')||relative.includes(':')||relative.split('/').some(p=>!p||p==='.'||p==='..'))throw Error('Unsafe relative path');
 const target=path.resolve(root,...relative.split('/'));if(!target.startsWith(path.resolve(root)+path.sep))throw Error('Path escapes root');
 let current=target;while(current!==path.dirname(current)){try{if(fs.lstatSync(current).isSymbolicLink())throw Error('Symbolic links/junctions are not accepted: '+current);}catch(error){if(error.code!=='ENOENT')throw error;}current=path.dirname(current);}
 return target;
}
export function privateDestination(root,dest){
 for(const base of new Set([path.resolve(root),REPO]))if(!path.relative(base,path.resolve(dest))||['public','src','dist','node_modules','.git'].some(p=>within(path.join(base,p),dest)))throw Error('Destination must be private, outside production source/assets');
 safePath(dest,'private-check');
}
function bytesJson(value,old){let result=JSON.stringify(value,null,2)+'\n';if(old?.includes(Buffer.from('\r\n')))result=result.replaceAll('\n','\r\n');return Buffer.from(result);}
function put(root,relative,bytes,immutable=false){const file=safePath(root,relative);fs.mkdirSync(path.dirname(file),{recursive:true});if(immutable&&fs.existsSync(file)){if(!fs.readFileSync(file).equals(Buffer.from(bytes)))throw Error('Immutable file conflict: '+relative);return;}if(immutable){fs.writeFileSync(file,bytes,{flag:'wx'});return;}const temp=file+'.tmp-'+crypto.randomUUID();fs.writeFileSync(temp,bytes,{flag:'wx'});fs.renameSync(temp,file);}
function putJson(root,relative,value,immutable=false){put(root,relative,bytesJson(value),immutable);}
export function loadCatalog(root){const content=readJson(safePath(root,CONTENT)),editorial=readJson(safePath(root,EDITORIAL)),audio=readJson(safePath(root,AUDIO));return {content,editorial,audio};}
export function catalogFingerprint(catalog){return fingerprint(catalog);}
function allowedFile(p){return [CONTENT,EDITORIAL,AUDIO,'src/assets/i18n/phrase-islands.generated.ts',...LANGS.map(l=>'src/assets/i18n/'+l+'.json'),'public/audio/phrase-islands/v1/manifest.json','public/audio/phrase-islands/v1/PROVENANCE.md','public/audio/phrase-islands/v1/ACML-1.0.md'].includes(p)||/^public\/audio\/phrase-islands\/v1\/pi-[a-z0-9-]+\.mp3$/.test(p);}
function bump(value){return String(Number(value)+1);}
function reviewedEntry(next,base,state){
 const p=state.draft.phrase,index=next.content.phrases.findIndex(old=>old.id===p.id);
 if(index<0)next.content.phrases.push(p);else next.content.phrases[index]=p;
 const old=base.editorial.records[p.id];next.editorial.records[p.id]={status:'approved',contentRevision:old?bump(old.contentRevision):'1',text:p.japanese,analyzedReading:state.audio.analyzedReading??old?.analyzedReading??p.reading,reviewedAt:state.review.reviewedAt,reviewType:state.review.scope==='technical-demo'?'technical-demo':'administrator-editorial-and-audio',nativeListening:state.review.audioListened?'administrator-listened-not-native-certified':'not-certified',contentFingerprint:state.contentFingerprint,audioSha256:state.audio.reference.sha256};
 next.audio[p.id]={...state.audio.reference,synthesisFingerprint:state.synthesisFingerprint};
}
function nextVersion(base,value){if(!/^\d+\.\d+\.\d+$/.test(value))throw Error('Invalid catalog version');const a=base.split('.').map(Number),b=value.split('.').map(Number);if(!b.some((n,i)=>n>a[i]&&b.slice(0,i).every((m,j)=>m===a[j])))throw Error('Catalog version must increase');}
function rejectIssues(issues){if(issues.length)throw Error(issues.map(i=>i.code+': '+i.field).join('\n'));}
export function draftFromPhrase(catalog,phrase){
 const existing=!!phrase;const id=existing?phrase.id:'pi-'+crypto.randomUUID();
 return {schemaVersion:1,draftId:crypto.randomUUID(),operation:existing?'edit':'create',base:{catalogVersion:catalog.content.version,catalogFingerprint:catalogFingerprint(catalog),phraseFingerprint:existing?fingerprint(phrase):null,contentRevision:existing?catalog.editorial.records[id].contentRevision:null,audioSha256:existing?catalog.audio[id].sha256:null},phrase:existing?structuredClone(phrase):{id,topicId:'everyday',japanese:'',reading:'',segments:[],level:'N5',register:'polite',localizations:Object.fromEntries(LANGS.map(l=>[l,{natural:'',structural:'',explanation:''}]))},synthesis:{...DEFAULT_PHRASE_SYNTHESIS}};
}
function checkBase(draft,catalog){
 if(draft.base.catalogFingerprint!==catalogFingerprint(catalog)||draft.base.catalogVersion!==catalog.content.version)throw Error('Catalog conflict: reopen against current snapshot');
 const old=catalog.content.phrases.find(p=>p.id===draft.phrase.id);
 if(draft.operation==='create'){if(old)throw Error('ID already exists');}
 else if(!old||draft.base.phraseFingerprint!==fingerprint(old)||draft.base.contentRevision!==catalog.editorial.records[old.id]?.contentRevision||draft.base.audioSha256!==catalog.audio[old.id]?.sha256)throw Error('Phrase revision conflict');
}
export function validatePublicCatalog(root,{allowDemo=false}={}){
 const catalog=loadCatalog(root),ids=new Set(),japanese=new Set();
 if(catalog.content.schemaVersion!==1||!/^\d+\.\d+\.\d+$/.test(catalog.content.version))throw Error('Invalid catalog schema/version');
 for(const phrase of catalog.content.phrases){
  if(ids.has(phrase.id))throw Error('Duplicate public ID');ids.add(phrase.id);
  const key=normalizeJapanese(phrase.japanese);if(japanese.has(key))throw Error('Duplicate Japanese');japanese.add(key);
  const draft=draftFromPhrase(catalog,phrase);rejectIssues(validateDraft(draft,true));
  const review=catalog.editorial.records[phrase.id],audio=catalog.audio[phrase.id];
  if(!review||review.status!=='approved'||review.text!==phrase.japanese)throw Error('Unapproved/stale public content');
  if(review.reviewType==='technical-demo'&&!allowDemo)throw Error('Technical demonstration is not publishable');
  if(review.contentFingerprint&&review.contentFingerprint!==fingerprint(phrase))throw Error('Stale content fingerprint');
  if(!audio||!/^audio\/phrase-islands\/v1\/pi-[a-z0-9-]+\.mp3$/.test(audio.path))throw Error('Invalid audio reference');
  const file=safePath(root,'public/'+audio.path),bytes=fs.readFileSync(file);
  if(sha(bytes)!==audio.sha256||bytes.length!==audio.bytes||!(audio.durationSeconds>0)||audio.sampleRate!==44100||audio.mime!=='audio/mpeg'||audio.voice!=='aida-shigeru-normal'||audio.engineVersion!=='1.2.0'||audio.modelSha256!==DEFAULT_PHRASE_SYNTHESIS.modelSha256)throw Error('Invalid audio integrity/provenance: '+phrase.id);
  if(review.audioSha256&&review.audioSha256!==audio.sha256)throw Error('Review/audio mismatch');
 }
 if(Object.keys(catalog.editorial.records).some(id=>!ids.has(id))||Object.keys(catalog.audio).some(id=>!ids.has(id)))throw Error('Orphan active record');
 for(const lang of LANGS){const dict=readJson(safePath(root,'src/assets/i18n/'+lang+'.json'));for(const p of catalog.content.phrases)for(const field of ['natural','structural','explanation'])if(dict[`phraseIslands.content.${p.id}.${field}`]!==p.localizations[lang][field])throw Error('Unsynchronized translation');}
 const manifest=readJson(safePath(root,'public/audio/phrase-islands/v1/manifest.json'));
 if(manifest.version!==catalog.content.version||fingerprint(manifest.resources)!==fingerprint(catalog.audio))throw Error('Public manifest/catalog version mismatch');
 if(sha(fs.readFileSync(safePath(root,'public/audio/phrase-islands/v1/ACML-1.0.md')))!=='72ac22ef56c20f9d9ca8467ca9bdcc5e06e5fba5270812a9ff1494b00ae6d02a')throw Error('Voice license archive mismatch');
 return catalog;
}
export class PhraseAuthoring {
 constructor({root=REPO,workspace=path.join(REPO,'.phrase-islands-authoring')}={}){
  this.root=fs.realpathSync(root);this.workspace=path.resolve(workspace);
  if(!path.relative(this.root,this.workspace)||['public','src','dist','node_modules','.git'].some(p=>within(path.join(this.root,p),this.workspace)))throw Error('Workspace must be private, outside production source/assets');
  privateDestination(this.root,this.workspace);safePath(this.workspace,'state.json');fs.mkdirSync(this.workspace,{recursive:true});
 }
 catalog(){return loadCatalog(this.root);}
 makeDraft(id){const c=this.catalog();const p=id?c.content.phrases.find(p=>p.id===id):undefined;if(id&&!p)throw Error('Unknown phrase ID');return draftFromPhrase(c,p);}
 importDraft(file){
  privateDestination(this.root,path.dirname(path.resolve(file)));safePath(path.dirname(path.resolve(file)),path.basename(file));if(fs.lstatSync(file).size>131072)throw Error('Draft too large');const draft=parseDraftJson(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
  checkBase(draft,this.catalog());const hash=fingerprint(draft),handle=draft.phrase.id+'@'+hash;
  putJson(this.workspace,this.folder(handle)+'/draft.json',draft,true);
  const index=fs.existsSync(safePath(this.workspace,'draft-index.json'))?readJson(safePath(this.workspace,'draft-index.json')):{};
  index[draft.phrase.id]=handle;putJson(this.workspace,'draft-index.json',index);putJson(this.workspace,'latest.json',{handle});
  const archive=this.archiveBaseline();return {handle,issues:validateDraft(draft,true),mastersArchived:archive.archived.length,mastersMissing:archive.missing.length};
 }
 folder(handle){if(!/^pi-[a-z0-9-]{3,100}@[0-9a-f]{64}$/.test(handle))throw Error('Invalid draft handle');return 'drafts/'+handle.replace('@','/');}
 resolve(handle){return handle??readJson(safePath(this.workspace,'latest.json')).handle;}
 readDraft(handle){handle=this.resolve(handle);const d=parseDraftJson(fs.readFileSync(safePath(this.workspace,this.folder(handle)+'/draft.json'),'utf8'));if(fingerprint(d)!==handle.split('@')[1])throw Error('Draft fingerprint mismatch');return {draft:d,handle,folder:this.folder(handle)};}
 validate(handle){const state=this.readDraft(handle),c=this.catalog();rejectIssues(validateDraft(state.draft,true));checkBase(state.draft,c);
  const key=normalizeJapanese(state.draft.phrase.japanese);if(c.content.phrases.some(p=>p.id!==state.draft.phrase.id&&normalizeJapanese(p.japanese)===key))throw Error('Duplicate Japanese in published catalog');
  const index=readJson(safePath(this.workspace,'draft-index.json'));for(const [id,h] of Object.entries(index))if(id!==state.draft.phrase.id&&normalizeJapanese(this.readDraft(h).draft.phrase.japanese)===key)throw Error('Duplicate Japanese in drafts');
  return {...state,catalog:c,contentFingerprint:fingerprint(state.draft.phrase),synthesisFingerprint:fingerprint(synthesisInput(state.draft))};
 }
 validateAudio(state,audio,{mediaRoot=this.root}={}){
  if(audio.synthesisFingerprint!==state.synthesisFingerprint)throw Error('Stale synthesis fingerprint');
  if(!['generated','reused'].includes(audio.kind)||audio.reference.engineVersion!=='1.2.0'||audio.reference.voice!=='aida-shigeru-normal'||audio.reference.modelSha256!==DEFAULT_PHRASE_SYNTHESIS.modelSha256||!/^\d+$/.test(audio.reference.revision))throw Error('Unpinned audio provenance');
  if(audio.kind==='reused'&&fingerprint(audio.reference)!==fingerprint(state.catalog.audio[state.draft.phrase.id]))throw Error('Reused audio must match the base reference');
  const mp3=audio.kind==='reused'?safePath(mediaRoot,'public/'+audio.reference.path):safePath(this.workspace,audio.mp3);
  if(sha(fs.readFileSync(mp3))!==audio.reference.sha256||fs.statSync(mp3).size!==audio.reference.bytes)throw Error('Audio hash/size mismatch');
  if(audio.kind==='generated'){
   if(audio.reference.path!==`audio/phrase-islands/v1/${state.draft.phrase.id}-r${audio.reference.revision}-${audio.reference.sha256.slice(0,16)}.mp3`)throw Error('Invalid immutable audio path');
   if(sha(fs.readFileSync(safePath(this.workspace,audio.wav)))!==audio.wavSha256||sha(fs.readFileSync(safePath(this.workspace,audio.query)))!==audio.querySha256)throw Error('Master/query integrity mismatch');
   const q=readJson(safePath(this.workspace,audio.query));for(const key of ['speedScale','intonationScale','tempoDynamicsScale','pitchScale'])if(q[key]!==state.draft.synthesis[key])throw Error('Query settings mismatch');
   if(audio.reference.modelSha256!==DEFAULT_PHRASE_SYNTHESIS.modelSha256||audio.reference.engineVersion!=='1.2.0')throw Error('Wrong engine/model');
  }
  return mp3;
 }
 async generate(handle,{python='python',ffmpeg='ffmpeg',force=false}={}){
  const state=this.validate(handle),ref=this.catalog().audio[state.draft.phrase.id];
  const audioFile=state.folder+'/audio.json';
  if(!force&&fs.existsSync(safePath(this.workspace,audioFile))){const a=readJson(safePath(this.workspace,audioFile));this.validateAudio(state,a);return a;}
  if(!force&&ref&&this.reusable(state,ref)){
   const a={kind:'reused',synthesisFingerprint:state.synthesisFingerprint,reference:ref};this.validateAudio(state,a);putJson(this.workspace,audioFile,a);return a;
  }
  const revision=ref?bump(ref.revision):'1';
  const reusableDir='audio/'+state.draft.phrase.id+'/r'+revision+'/'+state.synthesisFingerprint;
  if(!force&&fs.existsSync(safePath(this.workspace,reusableDir))){for(const attempt of fs.readdirSync(safePath(this.workspace,reusableDir))){const dir=reusableDir+'/'+attempt;const resultFile=safePath(this.workspace,dir+'/result.json');if(!fs.existsSync(resultFile))continue;const a={...readJson(resultFile),kind:'generated',wav:dir+'/original.wav',query:dir+'/query.json',mp3:dir+'/audio.mp3'};this.validateAudio(state,a);putJson(this.workspace,audioFile,a);return a;}}
  const dir='audio/'+state.draft.phrase.id+'/r'+revision+'/'+state.synthesisFingerprint+'/'+crypto.randomUUID();
  putJson(this.workspace,dir+'/job.json',{phrase:state.draft.phrase,synthesis:state.draft.synthesis,synthesisFingerprint:state.synthesisFingerprint,revision,outputDir:safePath(this.workspace,dir),ffmpeg});
  await run(python,['-X','utf8',path.join(REPO,'scripts/phrase-islands-authoring-audio.py'),'--job',safePath(this.workspace,dir+'/job.json')]);
  const result=readJson(safePath(this.workspace,dir+'/result.json'));
  const a={...result,kind:'generated',wav:dir+'/original.wav',query:dir+'/query.json',mp3:dir+'/audio.mp3'};this.validateAudio(state,a);putJson(this.workspace,audioFile,a);return a;
 }
 archiveBaseline(){
  const c=this.catalog(),root='baselines/'+catalogFingerprint(c),archived=[],missing=[];
  for(const relative of ['public/audio/phrase-islands/v1/ACML-1.0.md','public/audio/phrase-islands/v1/PROVENANCE.md','.cache/phrase-islands-i2/licenses/aivis-LICENSE','.cache/phrase-islands-i2/licenses/index.json','.cache/phrase-islands-i2/aivis-installed.json','.cache/phrase-islands-i2/aida-hub.json','.cache/phrase-islands-i2/aivis-speakers.json','.cache/phrase-islands-i2/profile/AivisSpeech-Engine/aivm_infos_cache.json']){
   const source=safePath(this.root,relative);if(fs.existsSync(source)){const bytes=fs.readFileSync(source);put(this.workspace,root+'/provenance/'+sha(bytes).slice(0,16)+'-'+path.basename(source),bytes,true);}
  }
  let audit=[];try{audit=readJson(path.join(this.root,'.cache/phrase-islands-i3/publication-audit.json'));}catch{}
  for(const p of c.content.phrases){const m=audit.find(a=>a.id===p.id),dir=root+'/masters/'+p.id;
   if(!m||m.mp3.sha256!==c.audio[p.id].sha256||m.text!==p.japanese||m.expectedReading!==p.reading){missing.push(p.id);continue;}
   const source=path.join(this.root,'.cache/phrase-islands-i3/masters');const wav=fs.readFileSync(path.join(source,p.id+'.wav')),query=fs.readFileSync(path.join(source,p.id+'.query.json'));
   if(sha(wav)!==m.wavSha256||sha(query)!==m.querySha256)throw Error('Legacy master/query hash mismatch');
   put(this.workspace,dir+'/original.wav',wav,true);put(this.workspace,dir+'/query.json',query,true);putJson(this.workspace,dir+'/metrics.json',m,true);archived.push(p.id);
  }
  putJson(this.workspace,root+'/archive.json',{catalogFingerprint:catalogFingerprint(c),archived,missing});return {archived,missing};
 }
 reusable(state,reference){
  const original=state.catalog.content.phrases.find(p=>p.id===state.draft.phrase.id);
  if(!original||original.japanese!==state.draft.phrase.japanese||original.reading!==state.draft.phrase.reading)return false;
  if(reference.synthesisFingerprint)return reference.synthesisFingerprint===state.synthesisFingerprint;
  const proofs=[];
  try{const audit=readJson(path.join(this.root,'.cache/phrase-islands-i3/publication-audit.json')).find(r=>r.id===original.id);proofs.push({audit,file:path.join(this.root,'.cache/phrase-islands-i3/masters',original.id+'.query.json')});}catch{}
  const archiveRoot=safePath(this.workspace,'baselines');if(fs.existsSync(archiveRoot))for(const name of fs.readdirSync(archiveRoot).filter(n=>/^[a-f0-9]{64}$/.test(n))){const dir='baselines/'+name+'/masters/'+original.id;try{proofs.push({audit:readJson(safePath(this.workspace,dir+'/metrics.json')),file:safePath(this.workspace,dir+'/query.json')});}catch{}}
  return proofs.some(({audit,file})=>{try{const q=readJson(file);return !!audit&&audit.mp3.sha256===reference.sha256&&audit.text===original.japanese&&audit.expectedReading===original.reading&&audit.querySha256===sha(fs.readFileSync(file))&&q.volumeScale===1&&q.prePhonemeLength===.1&&q.postPhonemeLength===.1&&q.outputSamplingRate===44100&&q.outputStereo===false&&['speedScale','intonationScale','tempoDynamicsScale','pitchScale'].every(k=>q[k]===state.draft.synthesis[k])&&reference.engineVersion==='1.2.0'&&reference.modelSha256===DEFAULT_PHRASE_SYNTHESIS.modelSha256;}catch{return false;}});
 }
 review(handle,{reviewer,scope='editorial',contentReviewed=false,audioListened=false,technicalAudioChecked=false}={}){
  const state=this.validate(handle);if(typeof reviewer!=='string'||!reviewer.trim()||reviewer.length>100||/[\u0000-\u001f\u007f]/.test(reviewer))throw Error('Reviewer required');
  if(!['editorial','technical-demo'].includes(scope)||!contentReviewed||(scope==='editorial'?!audioListened:!technicalAudioChecked))throw Error('Explicit content review and audio listening (or technical-demo check) required');
  const audio=readJson(safePath(this.workspace,state.folder+'/audio.json'));this.validateAudio(state,audio);
  const audioRecordFingerprint=fingerprint(audio);putJson(this.workspace,state.folder+'/audio-references/'+audioRecordFingerprint+'.json',audio,true);
  const review={schemaVersion:1,audioRecordFingerprint,draftFingerprint:fingerprint(state.draft),contentFingerprint:state.contentFingerprint,synthesisFingerprint:state.synthesisFingerprint,audioSha256:audio.reference.sha256,reviewer,scope,contentReviewed,audioListened:scope==='editorial'&&audioListened,technicalAudioChecked:true,reviewedAt:new Date().toISOString()};putJson(this.workspace,state.folder+'/reviews/'+fingerprint(review)+'.json',review,true);putJson(this.workspace,state.folder+'/review.json',review);return review;
 }
 approved(handle,{allowDemo=false}={}){
  const state=this.validate(handle),audio=readJson(safePath(this.workspace,state.folder+'/audio.json')),review=readJson(safePath(this.workspace,state.folder+'/review.json'));this.validateAudio(state,audio);
  if(review.draftFingerprint!==fingerprint(state.draft)||review.contentFingerprint!==state.contentFingerprint||review.synthesisFingerprint!==state.synthesisFingerprint||review.audioSha256!==audio.reference.sha256||review.audioRecordFingerprint&&review.audioRecordFingerprint!==fingerprint(audio)||!review.contentReviewed||!(review.scope==='editorial'&&review.audioListened||allowDemo&&review.scope==='technical-demo'&&review.technicalAudioChecked))throw Error('Missing/stale approval or demo not allowed');
  return {...state,audio,review};
 }
 prepare(handles,{version,name='release-'+version,allowDemo=false}={}){
  if(!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(name))throw Error('Invalid release name');
  const base=this.catalog();nextVersion(base.content.version,version);const states=handles.map(h=>this.approved(h,{allowDemo}));if(!states.length||new Set(states.map(s=>s.draft.phrase.id)).size!==states.length)throw Error('Choose unique drafts');
  const next=structuredClone(base);next.content.version=version;const media=new Map();
  for(const s of states){reviewedEntry(next,base,s);media.set('public/'+s.audio.reference.path,fs.readFileSync(this.validateAudio(s,s.audio)));
  }
  const duplicates=new Set();for(const p of next.content.phrases){const k=normalizeJapanese(p.japanese);if(duplicates.has(k))throw Error('Duplicate Japanese in release');duplicates.add(k);}
  return this.writeRelease(next,{name,allowDemo,media,handles:states.map(s=>s.handle)});
 }
 snapshotFiles(catalog,media=new Map()){
  const files=new Map();for(const [rel,value] of [[CONTENT,catalog.content],[EDITORIAL,catalog.editorial],[AUDIO,catalog.audio]])files.set(rel,bytesJson(value,fs.readFileSync(safePath(this.root,rel))));
  const dictionaries={};for(const lang of LANGS){const relative='src/assets/i18n/'+lang+'.json',raw=fs.readFileSync(safePath(this.root,relative)),dictionary=readJson(safePath(this.root,relative));for(const key of Object.keys(dictionary))if(key.startsWith('phraseIslands.content.'))delete dictionary[key];for(const p of catalog.content.phrases)for(const [field,value] of Object.entries(p.localizations[lang]))dictionary[`phraseIslands.content.${p.id}.${field}`]=value;dictionaries[lang]=dictionary;files.set(relative,bytesJson(dictionary,raw));}
  files.set('src/assets/i18n/phrase-islands.generated.ts',Buffer.from('// Compact generated phrase-islands copy. Edit the JSON dictionaries.\n'+LANGS.map(l=>`export const ${l}: Record<string, string> = ${JSON.stringify(Object.fromEntries(Object.entries(dictionaries[l]).filter(([k])=>k.startsWith('phraseIslands.'))))};\n`).join('')));
  const publicDir='public/audio/phrase-islands/v1/';for(const filename of fs.readdirSync(safePath(this.root,publicDir.slice(0,-1))))if(filename.endsWith('.mp3')&&allowedFile(publicDir+filename))files.set(publicDir+filename,fs.readFileSync(safePath(this.root,publicDir+filename)));
  for(const filename of ['ACML-1.0.md','PROVENANCE.md'])files.set(publicDir+filename,fs.readFileSync(safePath(this.root,publicDir+filename)));
  if(catalog.content.version!==this.catalog().content.version){const original=files.get(publicDir+'PROVENANCE.md').toString('utf8');files.set(publicDir+'PROVENANCE.md',Buffer.from(original+'\n## Snapshot '+catalog.content.version+'\nRevisión de contenido y audio por entrada en editorial.v1.json. No implica certificación nativa.\nVoz/motor/modelo y licencia se mantienen; los originales quedan en el archivo privado de autoría.\n'));}
  const manifest=readJson(safePath(this.root,publicDir+'manifest.json'));files.set(publicDir+'manifest.json',bytesJson({...manifest,version:catalog.content.version,resources:catalog.audio}));
  for(const [relative,bytes] of media){if(files.has(relative)&&!files.get(relative).equals(bytes))throw Error('Cannot overwrite a published URL');files.set(relative,bytes);}
  return files;
 }
 writeRelease(next,{name,allowDemo=false,media=new Map(),handles=[],rollbackOf=null}={}){
  const folder='releases/'+name;if(fs.existsSync(safePath(this.workspace,folder)))throw Error('Release name already exists; use another immutable name');
  const baseline=this.catalog(),originalFiles=this.snapshotFiles(baseline),files=this.snapshotFiles(next,media);const changes=[];
  for(const [relative,bytes] of originalFiles)put(this.workspace,folder+'/base/'+relative,bytes,true);
  for(const [relative,bytes] of files){if(!allowedFile(relative))throw Error('Unauthorized release file');put(this.workspace,folder+'/candidate/'+relative,bytes,true);const original=fs.existsSync(safePath(this.root,relative))?fs.readFileSync(safePath(this.root,relative)):null;changes.push({path:relative,sha256:sha(bytes),bytes:bytes.length,baseSha256:original?sha(original):null,change:original?.equals(bytes)?'unchanged':original?'changed':'added'});}
  const manifest={schemaVersion:1,name,status:'prepared-not-published',previewOnly:allowDemo,version:next.content.version,baseCatalogFingerprint:catalogFingerprint(baseline),candidateCatalogFingerprint:catalogFingerprint(next),handles,approvals:handles.map(handle=>({handle,fingerprint:fingerprint(readJson(safePath(this.workspace,this.folder(handle)+'/review.json')))})),rollbackOf,files:changes};putJson(this.workspace,folder+'/release.json',manifest,true);
  const report=['PREPARED ONLY — NOT PUBLISHED',`Catalog ${baseline.content.version} -> ${next.content.version}`,`Phrases ${baseline.content.phrases.length} -> ${next.content.phrases.length}`,...changes.filter(f=>f.change!=='unchanged').map(f=>`${f.change==='added'?'+':'~'} ${f.path} (${f.bytes} bytes, SHA-256 ${f.sha256})`),...next.content.phrases.filter(p=>fingerprint(p)!==fingerprint(baseline.content.phrases.find(o=>o.id===p.id)??null)).map(p=>`PHRASE ${p.id}: ${p.japanese}\n${JSON.stringify(p.localizations,null,2)}`)].join('\n');put(this.workspace,folder+'/diff.txt',Buffer.from(report+'\n'),true);
  this.verify(name,{allowDemo});return {name,folder:safePath(this.workspace,folder),changes:changes.filter(f=>f.change!=='unchanged'),status:manifest.status};
 }
 verify(name,{allowDemo=false,ancestors=new Set()}={}){
  if(ancestors.has(name))throw Error('Cyclic rollback history');ancestors=new Set([...ancestors,name]);
  if(!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(name))throw Error('Invalid release name');const folder='releases/'+name,manifest=readJson(safePath(this.workspace,folder+'/release.json'));
  if(manifest.schemaVersion!==1||manifest.status!=='prepared-not-published'||manifest.name!==name||typeof manifest.previewOnly!=='boolean'||manifest.previewOnly&&!allowDemo||!Array.isArray(manifest.files)||new Set(manifest.files.map(f=>f.path)).size!==manifest.files.length)throw Error('Invalid release manifest/demo requires --demo');
  for(const file of manifest.files){if(!allowedFile(file.path))throw Error('Unauthorized release file');const bytes=fs.readFileSync(safePath(this.workspace,folder+'/candidate/'+file.path));if(sha(bytes)!==file.sha256||bytes.length!==file.bytes)throw Error('Release file integrity failure: '+file.path);}
  const candidate=safePath(this.workspace,folder+'/candidate');
  const walk=(dir,prefix='')=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{if(entry.isSymbolicLink())throw Error('Release symlink rejected');const rel=prefix+entry.name;return entry.isDirectory()?walk(path.join(dir,entry.name),rel+'/'):[rel];});
  const listed=new Set(manifest.files.map(f=>f.path));if(walk(candidate).some(p=>!listed.has(p)))throw Error('Unlisted file in release');
  const base=validatePublicCatalog(safePath(this.workspace,folder+'/base'),{allowDemo});if(catalogFingerprint(base)!==manifest.baseCatalogFingerprint)throw Error('Base snapshot integrity failure');
  const c=validatePublicCatalog(candidate,{allowDemo});if(catalogFingerprint(c)!==manifest.candidateCatalogFingerprint||c.content.version!==manifest.version)throw Error('Release catalog fingerprint mismatch');
  if(!Array.isArray(manifest.handles)||new Set(manifest.handles).size!==manifest.handles.length)throw Error('Missing/duplicate approval handles');
  let expected=structuredClone(base);expected.content.version=c.content.version;
  for(const handle of manifest.handles){
   const state=this.readDraft(handle);state.catalog=base;rejectIssues(validateDraft(state.draft,true));checkBase(state.draft,base);state.contentFingerprint=fingerprint(state.draft.phrase);state.synthesisFingerprint=fingerprint(synthesisInput(state.draft));
   const approval=manifest.approvals?.find(a=>a.handle===handle);if(!approval||!/^([a-f0-9]{64})$/.test(approval.fingerprint))throw Error('Missing frozen approval');const review=readJson(safePath(this.workspace,state.folder+'/reviews/'+approval.fingerprint+'.json'));if(review.audioRecordFingerprint&&!/^[a-f0-9]{64}$/.test(review.audioRecordFingerprint))throw Error('Invalid audio record fingerprint');const audio=readJson(safePath(this.workspace,state.folder+(review.audioRecordFingerprint?'/audio-references/'+review.audioRecordFingerprint+'.json':'/audio.json')));if(fingerprint(review)!==approval.fingerprint)throw Error('Approval history hash mismatch');this.validateAudio(state,audio,{mediaRoot:candidate});
   if(review.draftFingerprint!==fingerprint(state.draft)||review.contentFingerprint!==state.contentFingerprint||review.synthesisFingerprint!==state.synthesisFingerprint||review.audioSha256!==audio.reference.sha256||review.audioRecordFingerprint&&review.audioRecordFingerprint!==fingerprint(audio)||!review.contentReviewed||!(review.scope==='editorial'&&review.audioListened||allowDemo&&review.scope==='technical-demo'&&review.technicalAudioChecked))throw Error('Release approval mismatch');
   const record=c.editorial.records[state.draft.phrase.id],entry=c.content.phrases.find(p=>p.id===state.draft.phrase.id);
   if(!entry||fingerprint(entry)!==state.contentFingerprint||record.contentFingerprint!==state.contentFingerprint||record.reviewedAt!==review.reviewedAt||c.audio[entry.id].sha256!==review.audioSha256)throw Error('Approval does not cover candidate');
   reviewedEntry(expected,base,{...state,audio,review});
  }
  if(manifest.rollbackOf){
   if(manifest.handles.length)throw Error('Rollback cannot add new drafts');this.verify(manifest.rollbackOf,{allowDemo,ancestors});
   expected=loadCatalog(safePath(this.workspace,'releases/'+manifest.rollbackOf+'/base'));expected.content.version=c.content.version;
   for(const p of expected.content.phrases){const existing=base.content.phrases.find(old=>old.id===p.id);if(existing&&fingerprint(existing)!==fingerprint(p))expected.editorial.records[p.id]={...expected.editorial.records[p.id],contentRevision:bump(base.editorial.records[p.id].contentRevision),reviewType:'rollback-restored',contentFingerprint:fingerprint(p),audioSha256:expected.audio[p.id].sha256};}
  }
  if(catalogFingerprint(expected)!==catalogFingerprint(c))throw Error('Candidate contains changes outside its frozen approvals/rollback');
  return {manifest,candidate};
 }
 rollback(name,{version,newName='rollback-'+version,allowDemo=false}={}){
  this.verify(name,{allowDemo});const target=loadCatalog(safePath(this.workspace,'releases/'+name+'/base')),current=this.catalog();nextVersion(current.content.version,version);target.content.version=version;
  for(const p of target.content.phrases){const existing=current.content.phrases.find(c=>c.id===p.id);if(existing&&fingerprint(existing)!==fingerprint(p))target.editorial.records[p.id]={...target.editorial.records[p.id],contentRevision:bump(current.editorial.records[p.id].contentRevision),reviewType:'rollback-restored',contentFingerprint:fingerprint(p),audioSha256:target.audio[p.id].sha256};}
  return this.writeRelease(target,{name:newName,allowDemo,rollbackOf:name});
 }
 backup(name,{output,allowDemo=false}={}){
  const {manifest}=this.verify(name,{allowDemo});const dest=path.resolve(output);if(within(dest,this.workspace)||fs.existsSync(dest))throw Error('Backup destination must be a new directory');
  privateDestination(this.root,dest);if(['releases','drafts','audio','previews'].some(p=>within(path.join(this.workspace,p),dest)))throw Error('Backup must not be nested in a source tree');safePath(dest,'backup.json');fs.mkdirSync(dest,{recursive:true});
  const copyTree=(source,relative)=>{for(const entry of fs.readdirSync(source,{withFileTypes:true})){if(entry.isSymbolicLink())throw Error('Backup symlink rejected');const rel=relative+'/'+entry.name,file=path.join(source,entry.name);if(entry.isDirectory())copyTree(file,rel);else put(dest,rel,fs.readFileSync(file),true);}};
  const history=new Map();const collect=release=>{if(history.has(release))return;const verified=this.verify(release,{allowDemo});history.set(release,verified.manifest);if(verified.manifest.rollbackOf)collect(verified.manifest.rollbackOf);};collect(name);
  for(const release of history.keys())copyTree(safePath(this.workspace,'releases/'+release),'releases/'+release);
  const handles=[...new Set([...history.values()].flatMap(m=>m.handles))];
  const index={};for(const handle of handles){const state=this.readDraft(handle);copyTree(safePath(this.workspace,state.folder),state.folder);index[state.draft.phrase.id]=handle;const audioRoot='audio/'+state.draft.phrase.id;if(fs.existsSync(safePath(this.workspace,audioRoot)))copyTree(safePath(this.workspace,audioRoot),audioRoot);}
  if(fs.existsSync(safePath(this.workspace,'baselines')))copyTree(safePath(this.workspace,'baselines'),'baselines');
  putJson(dest,'draft-index.json',index,true);if(handles.length)putJson(dest,'latest.json',{handle:handles.at(-1)},true);
  putJson(dest,'backup.json',{schemaVersion:1,release:name,files:manifest.files.map(f=>({path:f.path,sha256:f.sha256})),note:'Private authoring backup. Restore this directory as a workspace; never copy it to public.'},true);
  return dest;
 }
}
export function run(command,args,{cwd=REPO,env=process.env}={}){return new Promise((resolve,reject)=>{const p=spawn(command,args,{cwd,env,stdio:'inherit',windowsHide:true});p.on('error',reject);p.on('close',code=>code===0?resolve():reject(Error(`${command} failed (${code})`)));});}

import fs from 'node:fs';
import path from 'node:path';
import { PhraseAuthoring, REPO, run, safePath, privateDestination } from './phrase-islands-admin-lib.mjs';
import { previewRelease } from './phrase-islands-admin-preview.mjs';

const [command,...args]=process.argv.slice(2),options={};
for(let i=0;i<args.length;i++){
 const key=args[i];if(!key.startsWith('--'))throw Error('Expected named option');
 const value=args[i+1]&&!args[i+1].startsWith('--')?args[++i]:true;
 if(key==='--draft'){(options[key]??=[]).push(value);}else if(options[key]!==undefined)throw Error('Duplicate option '+key);else options[key]=value;
}
const allowed=new Set(['--workspace','--catalog-root','--file','--id','--output','--draft','--python','--ffmpeg','--force','--reviewer','--scope','--content-reviewed','--audio-listened','--technical-audio-checked','--version','--name','--demo','--release','--port']);
for(const k of Object.keys(options))if(!allowed.has(k))throw Error('Unknown option '+k);
try{
 if(!command||command==='help'){console.log(`Local authoring only. No command commits, pushes or deploys.
Node 24+, Windows Python 3.12 + verified I2 Aivis and FFmpeg for generation.
  export-draft --output FILE [--id EXISTING_ID]
  import --file FILE
  archive-baseline
  validate [--draft HANDLE]
  generate [--draft HANDLE] [--force] [--python EXE] [--ffmpeg EXE]
  review [--draft HANDLE] --reviewer NAME --content-reviewed --audio-listened
  review [--draft HANDLE] --reviewer NAME --scope technical-demo --content-reviewed --technical-audio-checked
  prepare-release --version X.Y.Z --name NAME [--draft HANDLE (repeatable)] [--demo]
  verify-release --release NAME [--demo]
  preview --release NAME [--demo] [--port 4412]
  prepare-rollback --release NAME --version X.Y.Z --name NAME [--demo]
  backup --release NAME --output NEW_DIRECTORY [--demo]
Shared options: --workspace PRIVATE_DIRECTORY, --catalog-root READ_ONLY_SNAPSHOT_ROOT
Default workspace: .phrase-islands-authoring (durable/private; back it up).`);}
 else{
  const author=new PhraseAuthoring({root:options['--catalog-root']??REPO,workspace:options['--workspace']??path.join(REPO,'.phrase-islands-authoring')});const handle=options['--draft']?.at(-1),allowDemo=options['--demo']===true;let result;
  switch(command){
   case 'export-draft': {const file=path.resolve(options['--output']??'');if(!options['--output']||fs.existsSync(file))throw Error('Choose a new output file outside public/src');if(['public','src','dist','.git'].some(p=>file.startsWith(path.join(REPO,p)+path.sep)))throw Error('Draft output must be private');privateDestination(REPO,path.dirname(file));safePath(path.dirname(file),path.basename(file));fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(author.makeDraft(options['--id']),null,2)+'\n',{flag:'wx'});result={file};break;}
   case 'import': if(!options['--file'])throw Error('--file required');result=author.importDraft(path.resolve(options['--file']));break;
   case 'archive-baseline': result=author.archiveBaseline();break;
   case 'validate': {const s=author.validate(handle);result={handle:s.handle,phrase:s.draft.phrase,synthesis:s.draft.synthesis,contentFingerprint:s.contentFingerprint,synthesisFingerprint:s.synthesisFingerprint};break;}
   case 'generate': result=await author.generate(handle,{force:options['--force']===true,python:options['--python']??'python',ffmpeg:options['--ffmpeg']??'ffmpeg'});break;
   case 'review': result=author.review(handle,{reviewer:options['--reviewer'],scope:options['--scope']??'editorial',contentReviewed:options['--content-reviewed']===true,audioListened:options['--audio-listened']===true,technicalAudioChecked:options['--technical-audio-checked']===true});break;
   case 'prepare-release': result=author.prepare(options['--draft']??[author.resolve()],{version:options['--version'],name:options['--name'],allowDemo});break;
   case 'verify-release': {const s=author.verify(options['--release'],{allowDemo});result={status:'verified-in-staging-not-published',version:s.manifest.version,candidate:s.candidate};break;}
   case 'prepare-rollback': result=author.rollback(options['--release'],{version:options['--version'],newName:options['--name'],allowDemo});break;
   case 'backup': if(!options['--output'])throw Error('--output required');result={backup:author.backup(options['--release'],{output:options['--output'],allowDemo})};break;
   case 'preview': result=await previewRelease(author,options['--release'],{allowDemo,port:Number(options['--port']??4412)});break;
   default: throw Error('Unknown command; run help');
  }
  console.log(JSON.stringify(result,null,2));
 }
}catch(error){console.error('Authoring stopped; production unchanged:',error.message);process.exitCode=1;}

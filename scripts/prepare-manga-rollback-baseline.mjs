// Rebuild the verified public commit in a fresh ignored directory. Never changes HEAD/index/source.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const commit='09793158fbdfa52b7ecf20d135f1e7c3cc42a789',root=process.cwd();
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:32*1024*1024});
if(git('cat-file','-t',commit).trim()!=='commit')throw Error('Verified public commit is unavailable');
const locked=execFileSync('git',['show',commit+':package-lock.json'],{maxBuffer:32*1024*1024});
if(!locked.equals(fs.readFileSync('package-lock.json')))throw Error('Install the public lockfile in a separate environment; do not reuse different dependencies');
fs.mkdirSync('.cache',{recursive:true});
const snapshot=fs.mkdtempSync(path.join(root,'.cache','release3-public-0979315-')),archive=snapshot+'.tar';
git('-c','core.autocrlf=false','archive','--format=tar','--output='+archive,commit);
execFileSync('tar',['-xf',archive,'-C',snapshot],{stdio:'inherit'});
// Run exactly the historical prebuild checks and Angular build, resolving the same locked parent dependencies.
for(const script of ['scripts/audit-grammar-n5.mjs','scripts/validate-grammar-i18n.mjs'])execFileSync(process.execPath,[path.join(snapshot,script)],{cwd:snapshot,stdio:'inherit'});
execFileSync(process.execPath,[path.join(root,'node_modules/@angular/cli/bin/ng.js'),'build','--base-href','/kana-study/','--stats-json'],{cwd:snapshot,stdio:'inherit'});
const result={commit,tree:git('rev-parse',commit+'^{tree}').trim(),source:snapshot,artifact:path.join(snapshot,'dist/kana-study/browser'),
 lockSha256:createHash('sha256').update(locked).digest('hex'),node:process.version,originalActionsArtifact:false,lineEndings:'LF (equivalent to Linux checkout)',build:'historical prebuild + Angular production'};
fs.writeFileSync('.cache/release3-stable-rebuild.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));

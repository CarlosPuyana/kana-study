// Validate the proposed two-line promotion and its inverse ONLY in an ignored disposable copy.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const workflow='.github/workflows/deploy-pages.yml',promote='release/manga-guest-promote.patch',disable='release/manga-guest-disable.patch';
const original=fs.readFileSync(workflow,'utf8').replaceAll('\r\n','\n'),sha=()=>createHash('sha256').update(fs.readFileSync(workflow)).digest('hex'),before=sha();
const oldBuild='        run: npm run build -- --base-href /kana-study/',newBuild='        run: npm run build:manga-candidate',oldPath='          path: ./dist/kana-study/browser',newPath='          path: ./dist/kana-study-candidate/browser';
if(original.split(oldBuild).length!==2||original.split(oldPath).length!==2)throw Error('Workflow differs from the reviewed promotion baseline');
const expected=original.replace(oldBuild,newBuild).replace(oldPath,newPath);
fs.mkdirSync('.cache',{recursive:true});const dir=fs.mkdtempSync(path.resolve('.cache/release3-proposal-')),relative=path.relative(process.cwd(),dir).split(path.sep).join('/');
fs.mkdirSync(path.join(dir,'.github/workflows'),{recursive:true});const copy=path.join(dir,workflow);fs.writeFileSync(copy,original);
const git=(...args)=>execFileSync('git',['-c','core.autocrlf=false',...args],{encoding:'utf8'});
git('apply','--check',promote);git('apply','--check','--directory='+relative,promote);git('apply','--directory='+relative,promote);
if(fs.readFileSync(copy,'utf8')!==expected)throw Error('Promotion changes more than the two approved fields');
git('apply','--check','--directory='+relative,disable);git('apply','--directory='+relative,disable);
if(fs.readFileSync(copy,'utf8')!==original||sha()!==before)throw Error('Workflow was not preserved exactly');
const result={workflow,promote,disable,changedFields:['jobs.build.steps[Build for GitHub Pages].run','jobs.build.steps[Upload artifact].with.path'],preservesTestsTypeScriptConfigPermissions:true,activeWorkflowUnchanged:true,roundTripExact:true,activeWorkflowSha256:before};
fs.writeFileSync('.cache/release3-proposal-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));

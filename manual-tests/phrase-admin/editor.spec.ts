import {expect,test} from '@playwright/test';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';

test.beforeEach(async({page},info)=>{
 await page.addInitScript(()=>{(window as any).editorWrites=[];(window as any).editorOpens=0;const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){(window as any).editorWrites.push(k);return set.call(this,k,v);};const open=indexedDB.open.bind(indexedDB);indexedDB.open=(...args)=>{(window as any).editorOpens++;return open(...args);};});
 await page.goto('/');await expect(page.locator('.phrase-id')).toBeVisible();
 if(info.project.name.includes('light'))await page.getByRole('button',{name:'Tema claro',exact:true}).click();
});
test('create an incomplete real file, reopen, continue editing and preserve a stable ID',async({page},info)=>{
 const id=await page.locator('.phrase-id').inputValue();await page.getByLabel('Japonés',{exact:true}).fill('少し休みましょう。');await page.getByLabel('Lectura',{exact:true}).fill('すこしやすみましょう。');
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Preparar descarga JSON',exact:true}).click();const download=await pending;
 const folder=path.resolve('.phrase-islands-authoring/browser-tests',crypto.randomUUID());fs.mkdirSync(folder,{recursive:true});const file=path.join(folder,'draft.json');await download.saveAs(file);const saved=JSON.parse(fs.readFileSync(file,'utf8'));expect(saved.phrase.id).toBe(id);expect(saved.phrase.localizations.es.natural).toBe('');
 await page.getByRole('button',{name:'Nueva frase',exact:true}).click();await expect(page.locator('.phrase-id')).not.toHaveValue(id);await page.locator('.file-input').setInputFiles(file);await expect(page.locator('.phrase-id')).toHaveValue(id);await expect(page.getByLabel('Japonés',{exact:true})).toHaveValue('少し休みましょう。');
 for(const [n,[text,reading]] of [['少し','すこし'],['休','やす'],['みましょう。','']].entries()){
  await page.getByRole('button',{name:'Añadir segmento',exact:true}).click();await expect(page.locator('.segment-row')).toHaveCount(n+1);await page.locator('.segment-row').nth(n).locator('input').nth(0).fill(text);if(reading)await page.locator('.segment-row').nth(n).locator('input').nth(1).fill(reading);
 }
 for(const lang of ['ES','EN','CA']){await page.locator('.language-tabs').getByRole('button',{name:lang,exact:true}).click();await page.getByLabel('Traducción natural ('+lang+')',{exact:true}).fill(lang==='ES'?'Descansemos un poco.':lang==='EN'?"Let’s take a short break.":'Descansem una mica.');await page.getByLabel('Traducción estructural ('+lang+')',{exact:true}).fill('Un poco / descansar.');await page.getByLabel('Explicación gramatical ('+lang+')',{exact:true}).fill('Propuesta cortés de descanso.');}
 await expect(page.getByRole('heading',{name:'Campos completos',exact:true})).toBeVisible();await expect(page.locator('.preview-card ruby').first()).toBeVisible();
 await page.locator('.language-tabs').getByRole('button',{name:'ES',exact:true}).click();await page.screenshot({path:`.cache/phrase-islands-i62/editor-${info.project.name}.png`,fullPage:true});await page.locator('.preview-card').screenshot({path:`.cache/phrase-islands-i62/preview-${info.project.name}.png`});
 expect(await page.evaluate(()=>({writes:(window as any).editorWrites,opens:(window as any).editorOpens}))).toEqual({writes:[],opens:0});
});
test('edit published content without changing ID; cancel discarding unsaved edits',async({page})=>{
 await page.getByRole('combobox',{name:'Editar frase publicada',exact:true}).selectOption('pi-everyday-001');await expect(page.locator('.phrase-id')).toHaveValue('pi-everyday-001');await page.getByLabel('Traducción natural (ES)',{exact:true}).fill('Hoy descansaré en casa.');
 page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'Nueva frase',exact:true}).click();await expect(page.locator('.phrase-id')).toHaveValue('pi-everyday-001');await expect(page.getByLabel('Traducción natural (ES)',{exact:true})).toHaveValue('Hoy descansaré en casa.');
 const p=page.waitForEvent('download');await page.getByRole('button',{name:'Preparar descarga JSON',exact:true}).click();const download=await p;const folder=path.resolve('.phrase-islands-authoring/browser-tests',crypto.randomUUID());fs.mkdirSync(folder,{recursive:true});const file=path.join(folder,'edit.json');await download.saveAs(file);const draft=JSON.parse(fs.readFileSync(file,'utf8'));expect(draft.operation).toBe('edit');expect(draft.base.contentRevision).toBeTruthy();expect(draft.phrase.id).toBe('pi-everyday-001');
});
test('reject unsupported imports and preserve the current draft',async({page})=>{
 const id=await page.locator('.phrase-id').inputValue();for(const value of [{approved:true},{schemaVersion:99},JSON.parse('{"__proto__":{},"media":{"path":"https://evil/audio.mp3"}}')]){
  await page.locator('.file-input').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(value))});await expect(page.getByRole('alert')).toContainText('inválido');await expect(page.locator('.phrase-id')).toHaveValue(id);
 }
});
test('ES EN CA, keyboard and preview are local and responsive',async({page})=>{
 for(const [lang,title] of [['es','Editor de Islas de frases'],['en','Phrase islands editor'],['ca','Editor d’Illes de frases']]){await page.locator('.preferences select').selectOption(lang);await expect(page.getByRole('heading',{level:1})).toHaveText(title);await expect(page.locator('main')).not.toContainText('phraseAdmin.');}
 await page.locator('.preferences select').focus();await page.keyboard.press('Tab');await page.keyboard.press('Tab');await expect(page.locator('.toolbar button').first()).toBeFocused();expect(await page.locator('.toolbar button').first().evaluate(e=>getComputedStyle(e).outlineStyle)).toBe('solid');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);expect(await page.locator('a[href*="supabase"]').count()).toBe(0);
});

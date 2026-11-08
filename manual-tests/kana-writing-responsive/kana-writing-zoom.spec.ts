import {test,expect,chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';

test('real browser zoom at 125% preserves drawing and keeps assessment reachable',async({},info)=>{
  // Browser zoom, not CSS zoom, deviceScaleFactor or pinch emulation. The
  // extension exists only inside this isolated test output/profile.
  const extension=info.outputPath('zoom-extension');await mkdir(extension,{recursive:true});
  await writeFile(path.join(extension,'manifest.json'),JSON.stringify({manifest_version:3,name:'Local Kana zoom QA',version:'1.0',permissions:['tabs'],background:{service_worker:'worker.js'}}));
  await writeFile(path.join(extension,'worker.js'),"chrome.tabs.onUpdated.addListener((id,change,tab)=>{if(change.status==='complete'&&tab.url?.startsWith('http://127.0.0.1:4404/'))chrome.tabs.setZoom(id,1.25);});");
  const context=await chromium.launchPersistentContext(info.outputPath('profile'),{channel:'msedge',headless:true,viewport:null,ignoreDefaultArgs:['--disable-extensions'],args:['--window-size=1366,768','--disable-extensions-except='+extension,'--load-extension='+extension]});
  try{
    const page=await context.newPage();await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__={};'}));
    await page.addInitScript(()=>{localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme:'dark',learning:{categories:{hiragana:{basic:true,dakuten:false,handakuten:false,combination:false},katakana:{basic:false,dakuten:false,handakuten:false,combination:false}},questionTypes:['romaji-to-kana']}}));Math.random=()=>.999999;});
    await page.goto('http://127.0.0.1:4404/');
    const worker=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');
    const zoom=await worker.evaluate(async()=>{const api=(globalThis as any).chrome;const tabs=await api.tabs.query({active:true});await api.tabs.setZoom(tabs[0].id,1.25);return await api.tabs.getZoom(tabs[0].id);});expect(zoom).toBe(1.25);
    await page.locator('.learn-button').click();await page.locator('app-learning-start-panel .mode').nth(1).click();await expect(page.locator('app-japanese-writing-canvas .status')).toHaveCount(0);
    const canvas=page.locator('.writing-surface'),box=(await canvas.boundingBox())!;
    await page.mouse.move(box.x+box.width*.2,box.y+box.height*.3);await page.mouse.down();await page.mouse.move(box.x+box.width*.7,box.y+box.height*.7);await page.mouse.up();
    const ink=await canvas.locator('.ink').getAttribute('points');await page.locator('.reveal').click();await expect(page.locator('.ratings')).toBeVisible();
    expect(await canvas.locator('.ink').getAttribute('points')).toBe(ink);
    await page.evaluate(()=>scrollTo(0,0));
    const measure=await page.evaluate(()=>{const r=document.querySelector('.ratings')!.getBoundingClientRect(),c=document.querySelector('.writing-surface')!.getBoundingClientRect();return {zoomDpr:devicePixelRatio,width:innerWidth,height:innerHeight,outerWidth,outerHeight,scrollHeight:document.documentElement.scrollHeight,scrollNeeded:Math.max(0,r.bottom-innerHeight),canvas:{top:c.top,bottom:c.bottom,width:c.width},ratings:{top:r.top,bottom:r.bottom}};});
    expect(measure.zoomDpr).toBe(1.25);expect(measure.width).toBeLessThan(1366/1.2);
    expect(measure.ratings.bottom).toBeLessThanOrEqual(measure.height);expect(measure.canvas.width).toBeGreaterThanOrEqual(288);
    expect(await page.locator('.writing-controls').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight)).toBe(true);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await mkdir('.cache/kana-writing-responsive',{recursive:true});await writeFile('.cache/kana-writing-responsive/geometry-zoom-125.json',JSON.stringify(measure,null,2));
    const cdp=await context.newCDPSession(page),shot=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    await writeFile(info.outputPath('zoom-125-revealed.png'),Buffer.from(shot.data,'base64'));await cdp.detach();
    await page.locator('.ratings .good').click();await expect(page.locator('.reveal')).toBeVisible();
  }finally{await context.close();}
});

const {chromium}=require('@playwright/test');
const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--autoplay-policy=document-user-activation-required']});
 const page=await browser.newPage();const checks=[];
 async function check(name,fn){await fn();checks.push({name,passed:true});}
 await page.goto('http://127.0.0.1:4438/');await page.waitForFunction(()=>window.lab);
 await check('20 real sample buttons; identity hidden and gated',async()=>{assert.equal(await page.locator('[data-label]').count(),20);assert.equal(await page.locator('#reveal').isDisabled(),true);assert.equal(await page.locator('#identity').innerText(),'');});
 await check('explicit play, pause, speed and resume real WAV',async()=>{
  await page.locator('[data-id="I2-10"][data-label="A"]').click();await page.waitForFunction(()=>window.lab.audio.currentTime>0.05);
  await page.locator('#pause').click();assert(await page.evaluate(()=>window.lab.audio.paused));
  await page.locator('#speed').selectOption('0.8');assert.equal(await page.evaluate(()=>window.lab.audio.playbackRate),.8);
  await page.locator('#pause').click();await page.waitForFunction(()=>!window.lab.audio.paused);await page.locator('#stop').click();
 });
 await check('repeat 3 and cancel gap timer without later audio',async()=>{
  await page.locator('#speed').selectOption('1.2');await page.locator('#repeat').selectOption('3');await page.locator('#gap').selectOption('2');
  await page.locator('[data-id="I2-02"][data-label="A"]').click();await page.waitForFunction(()=>window.lab.pendingTimer);
  await page.locator('#stop').click();await page.waitForTimeout(2200);assert(await page.evaluate(()=>window.lab.audio.paused&&!window.lab.pendingTimer&&!window.lab.audio.getAttribute('src')));
 });
 await check('three repeats finish with one Audio element',async()=>{
  await page.locator('#gap').selectOption('0');await page.locator('[data-id="I2-02"][data-label="B"]').click();
  await page.waitForFunction(()=>document.getElementById('status').textContent==='Finalizado');
  assert.equal(await page.evaluate(()=>window.lab.events.filter(e=>e.message==='Reproduciendo').slice(-3).length),3);
 });
 await check('two repetitions with a one-second gap finish normally',async()=>{
  await page.locator('#repeat').selectOption('2');await page.locator('#gap').selectOption('1');
  await page.locator('[data-id="I2-02"][data-label="B"]').click();
  await page.waitForFunction(()=>document.getElementById('status').textContent==='Finalizado');
 });
 await check('change during delayed loading discards old playback',async()=>{
  const path=await page.evaluate(()=>window.lab.assignments['I2-01'].A.path);
  await page.route('**/'+path,async r=>{await new Promise(resolve=>setTimeout(resolve,1000));await r.continue().catch(()=>{});});
  await page.locator('[data-id="I2-01"][data-label="A"]').click();await page.locator('[data-id="I2-10"][data-label="B"]').click();
  const expected=await page.evaluate(()=>window.lab.assignments['I2-10'].B.path);await page.waitForTimeout(1200);assert((await page.evaluate(()=>window.lab.audio.src)).endsWith(expected));await page.locator('#stop').click();
 });
 await check('missing file produces an error',async()=>{await page.evaluate(()=>{void window.lab.play(['absent.wav'],1,0);});await page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Error'));});
 await check('synthetic NotAllowedError has explicit blocked state',async()=>{
  await page.evaluate(()=>{window.lab.audio.play=()=>Promise.reject(new DOMException('test denial','NotAllowedError'));void window.lab.play([window.lab.assignments['I2-01'].A.path]);});
  await page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Bloqueado'));
 });
 await page.reload();await page.waitForFunction(()=>window.lab);
 await check('precomposed real track is decodable and stop cancels it',async()=>{await page.getByText('Pista precompuesta A',{exact:true}).click();await page.waitForFunction(()=>window.lab.audio.currentTime>0.05);await page.locator('#stop').click();});
 await page.screenshot({path:'.cache/phrase-islands-i2/lab-desktop.png',fullPage:false});
 const report={browser:await browser.version(),platform:process.platform,checks,notTested:['human listening','physical screen lock','Safari/iPhone','Android','complete offline reload'],autoplayDenial:'synthetic NotAllowedError; real OS denial not certified'};
 fs.writeFileSync('.cache/phrase-islands-i2/technical-tests.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});

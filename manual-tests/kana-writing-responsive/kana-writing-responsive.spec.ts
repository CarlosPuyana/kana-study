import {test,expect,Page} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

async function start(page:Page,theme:string,script:'hiragana'|'katakana'='hiragana'){
  await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__={};'}));
  await page.route('**/*.supabase.co/**',r=>r.abort());
  await page.addInitScript(({theme,script})=>{localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme,learning:{categories:{hiragana:{basic:script==='hiragana',dakuten:false,handakuten:false,combination:false},katakana:{basic:script==='katakana',dakuten:false,handakuten:false,combination:false}},questionTypes:['romaji-to-kana']}}));Math.random=()=>.999999;},{theme,script});
  await page.goto('./');await page.locator('.learn-button').click();await page.locator('app-learning-start-panel .mode').nth(1).click();
  await expect(page.locator('.writing-surface')).toBeVisible();await expect(page.locator('app-japanese-writing-canvas .status')).toHaveCount(0);
}
async function draw(page:Page,touch:boolean,count=1){
  const svg=page.locator('.writing-surface');await svg.scrollIntoViewIfNeeded();const b=(await svg.boundingBox())!;
  if(touch){
    const session=await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width*.2,y:b.y+b.height*.3}]});
    await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:b.x+b.width*.7,y:b.y+b.height*.7}]});
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await session.detach();
  }else{await page.mouse.move(b.x+b.width*.2,b.y+b.height*.3);await page.mouse.down();await page.mouse.move(b.x+b.width*.7,b.y+b.height*.7,{steps:5});await page.mouse.up();}
  await expect(svg.locator('.ink')).toHaveCount(count);
  const points=(await svg.locator('.ink').last().getAttribute('points'))!.split(' ').map(p=>p.split(',').map(Number));
  expect(points[0][0]/1024).toBeCloseTo(.2,1);expect(points.at(-1)![1]/1024).toBeCloseTo(.7,1);
}
async function geometry(page:Page){return page.evaluate(()=>{
  const rect=(selector:string)=>{const r=document.querySelector(selector)!.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height}};
  return {width:innerWidth,height:innerHeight,scrollHeight:document.documentElement.scrollHeight,scrollY,scrollWidth:document.documentElement.scrollWidth,
    canvas:rect('.writing-surface'),prompt:rect('.prompt'),ratings:rect('.ratings'),answer:rect('.revealed-answer'),controls:rect('.writing-controls'),
    scrollNeeded:Math.max(0,document.querySelector('.ratings')!.getBoundingClientRect().bottom-innerHeight)};
});}
test('writing stays comparable, accessible and stable through reveal, resize and assessment',async({page},info)=>{
  await start(page,info.project.use.colorScheme==='light'?'light':'dark',info.project.name==='desktop-1536'?'katakana':'hiragana');
  await expect(page.locator('.revealed-answer,.example-block,svg .model,svg clipPath')).toHaveCount(0);
  await page.evaluate(()=>scrollTo(0,0));const before=await page.locator('.writing-surface').boundingBox();
  await page.screenshot({path:info.outputPath('front.png')});await draw(page,!!info.project.use.hasTouch);
  const ink=await page.locator('svg .ink').getAttribute('points');
  await page.locator('.reveal').click();await expect(page.locator('.ratings button')).toHaveCount(3);await expect(page.locator('.example-block')).toBeVisible();
  expect(await page.locator('svg .ink').getAttribute('points')).toBe(ink);
  await expect(page.locator('svg .model').first()).toBeAttached();
  const size=page.viewportSize()!;if(size.width>=900){expect(await page.evaluate(()=>scrollY)).toBe(0);expect((await page.locator('.writing-surface').boundingBox())!.y).toBeCloseTo(before!.y,0);}
  await page.evaluate(()=>scrollTo(0,0));const measured=await geometry(page);await info.attach('geometry',{body:JSON.stringify(measured,null,2),contentType:'application/json'});
  await mkdir('.cache/kana-writing-responsive',{recursive:true});await writeFile(`.cache/kana-writing-responsive/geometry-${info.project.name}.json`,JSON.stringify(measured,null,2));
  expect(measured.scrollWidth).toBeLessThanOrEqual(measured.width+1);
  expect(measured.canvas.width).toBeCloseTo(measured.canvas.height,0);
  if(size.width>=900){expect(measured.canvas.top).toBeGreaterThanOrEqual(0);expect(measured.canvas.bottom).toBeLessThanOrEqual(size.height);expect(measured.prompt.top).toBeGreaterThanOrEqual(0);expect(measured.ratings.bottom).toBeLessThanOrEqual(size.height);expect(measured.answer.left).toBeGreaterThan(measured.canvas.right);expect(measured.canvas.width).toBeGreaterThanOrEqual(288);}
  else if(size.height>size.width){expect(measured.canvas.width).toBeGreaterThanOrEqual(size.width-32);}
  await page.screenshot({path:info.outputPath('revealed.png'),fullPage:true});
  await page.getByRole('button',{name:'Ocultar guía',exact:true}).click();await expect(page.locator('svg .model')).toHaveCount(0);
  await page.getByRole('button',{name:'Mostrar guía',exact:true}).click();await page.getByRole('button',{name:'Ver trazos',exact:true}).click();await expect(page.locator('svg .animated').first()).toBeAttached();
  await page.setViewportSize({width:size.width>=900?1000:Math.max(size.width,568),height:size.width>=900?700:400});
  expect(await page.locator('svg .ink').getAttribute('points')).toBe(ink);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.setViewportSize(size);expect(await page.locator('svg .ink').getAttribute('points')).toBe(ink);
  await draw(page,!!info.project.use.hasTouch,2);
  await page.getByRole('button',{name:'Deshacer',exact:true}).click();await expect(page.locator('svg .ink')).toHaveCount(1);
  await page.getByRole('button',{name:'Deshacer',exact:true}).click();await expect(page.locator('svg .ink')).toHaveCount(0);
  await draw(page,!!info.project.use.hasTouch);await page.getByRole('button',{name:'Limpiar',exact:true}).click();await expect(page.locator('svg .ink')).toHaveCount(0);
  // Synthetic long copy stresses wrapping only; the application data stays intact.
  await page.locator('.example-translation').evaluate(e=>e.textContent='Esta traducción española excepcionalmente larga comprueba que el contenido se ajusta al panel y permanece legible sin cortar los controles ni ocultar la evaluación. '.repeat(4));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:info.outputPath('long-example.png'),fullPage:true});
  const original=await page.evaluate(()=>JSON.parse(localStorage.getItem('kana-study.review-events.v1')??'[]').length);
  for(const [i,rating]of ['again','hard','good'].entries()){
    if(i)await page.locator('.reveal').click();await page.locator('.ratings .'+rating).click();
    await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('kana-study.review-events.v1')??'[]').length)).toBe(original+i+1);
    await expect(page.locator('svg .ink,.revealed-answer')).toHaveCount(0);
    while(await page.locator('.medal-unlock-dialog button').isVisible())await page.locator('.medal-unlock-dialog button').click();
  }
  await page.evaluate(theme=>document.documentElement.setAttribute('data-theme',theme),info.project.use.colorScheme==='light'?'dark':'light');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('writing session finishes with repeats and keeps one FSRS review per first presentation',async({page},info)=>{
  await start(page,info.project.use.colorScheme==='light'?'light':'dark');let attempts=0;
  while(await page.locator('.exercise').count() && attempts<30){
    await page.locator('.reveal').click();await page.locator('.ratings .'+(attempts===0?'again':attempts===1?'hard':'good')).click();attempts++;
    while(await page.locator('.medal-unlock-dialog button').isVisible())await page.locator('.medal-unlock-dialog button').click();
  }
  await expect(page.locator('.results')).toBeVisible();expect(attempts).toBe(12);
  const saved=await page.evaluate(()=>({events:JSON.parse(localStorage.getItem('kana-study.review-events.v1')??'[]'),progress:JSON.parse(localStorage.getItem('kana-study.study-progress.v2')??'{}')}));
  expect(saved.events).toHaveLength(10);expect(Object.keys(saved.progress)).toHaveLength(10);
  expect(new Set(saved.events.map((e:any)=>e.id)).size).toBe(10);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('Vocabulary word writing retains the shared surface default and manual controls',async({page})=>{
  await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__={};'}));
  await page.addInitScript(()=>localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme:'dark'})));
  await page.goto('./#/vocabulary/writing?entry=n5-rhke1n');await expect(page.locator('app-word-writing-practice .writing-surface')).toBeVisible();await expect(page.locator('app-japanese-writing-canvas .status')).toHaveCount(0);
  const dimensions=await page.locator('.writing-surface').evaluate(e=>({actual:e.getBoundingClientRect().width,expected:Math.min(e.parentElement!.getBoundingClientRect().width,innerHeight*.65),override:getComputedStyle(e).getPropertyValue('--writing-surface-max').trim()}));
  expect(dimensions.override).toBe('');expect(dimensions.actual).toBeCloseTo(dimensions.expected,0);
  await draw(page,false);await page.getByRole('button',{name:'Deshacer',exact:true}).click();await expect(page.locator('svg .ink')).toHaveCount(0);
  await draw(page,false);await page.getByRole('button',{name:'Limpiar',exact:true}).click();await expect(page.locator('svg .ink')).toHaveCount(0);
});

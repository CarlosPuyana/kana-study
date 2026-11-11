import {test,expect,Page} from '@playwright/test';
test.beforeEach(async({page},info)=>{
 await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__={};'}));
 await page.route('**/manga/index.json',r=>r.fulfill({json:{schemaVersion:1,mangas:[]}}));await page.route('**/manga/default/**',r=>r.abort());
 await page.addInitScript(({language,theme})=>{localStorage.setItem('kana-study.settings.v1',JSON.stringify({language,theme}));},{language:info.project.name.includes('-en-')?'en':info.project.name.includes('-ca-')?'ca':'es',theme:info.project.use.colorScheme});
 await page.goto('./#/manga');await expect(page.locator('.library-intro')).toBeVisible();
});
async function seed(page:Page){await page.locator('app-manga-page').evaluate(async node=>{
 const c=(window as any).ng.getComponent(node),repo=c.repository,now='2026-11-11T12:00:00Z';
 for(let i=0;i<4;i++){const id='m3-fixture-'+i,title=i===1?'日本語の長いタイトル · Una aventura entre las estrellas '.repeat(3):['夜の図書館','','雨の日の散歩','星を探して'][i];
  await repo.put('volumes',{id,title,seriesTitle:title,pageCount:12,storageBytes:12288,complete:true,createdAt:now,updatedAt:now,mokuro:{version:'0.2.0',title,volume:String(i+1)}});
  const canvas=document.createElement('canvas');canvas.width=300;canvas.height=420;const ctx=canvas.getContext('2d')!;ctx.fillStyle=['#293b55','#735765','#38625d','#5b5074'][i];ctx.fillRect(0,0,300,420);ctx.fillStyle='#faf4e8';ctx.font='25px sans-serif';ctx.fillText('物語 '+(i+1),36,72);ctx.font='100px serif';ctx.fillText(['夜','旅','雨','星'][i],95,250);
  const blob=await new Promise<Blob>(resolve=>canvas.toBlob(b=>resolve(b!),'image/png'));
  for(let n=0;n<12;n++)await repo.put('pages',{volumeId:id,pageIndex:n,image:blob,ocr:{img_path:n+'.png',img_width:300,img_height:420,blocks:[]}});
  if(i<2)await repo.put('reading-progress',{volumeId:id,pageIndex:i?2:6,activeSeconds:100,completed:false,lastOpenedAt:i?'2026-11-10T12:00:00Z':now,updatedAt:now});
 }
 await c.load();
});await expect(page.locator('.personal-library article')).toHaveCount(4);}
test('empty library keeps import and help available',async({page},info)=>{await expect(page.locator('.empty-library')).toBeVisible();await expect(page.locator('.library-intro button')).toBeEnabled();await expect(page.locator('.manga-hero,.manga-steps')).toHaveCount(0);await page.screenshot({path:info.outputPath('empty.png'),fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.locator('.library-help > summary').click();await expect(page.locator('.library-help a[href="#/manga/guide"]')).toBeVisible();});
test('real progress, long titles and independent library actions',async({page},info)=>{
 await seed(page);await expect(page.locator('.continue-reading h2')).toHaveText('夜の図書館');await expect(page.locator('.continue-reading')).toContainText('7 / 12');
 await expect(page.locator('.personal-library article').first().locator('progress')).toHaveAttribute('value','7');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.screenshot({path:info.outputPath('library.png'),fullPage:true});
 const card=page.locator('.personal-library article').first();await card.locator('a[href*="/analysis/"]').click();await expect(page).toHaveURL(/manga\/analysis\/m3-fixture-0/);
 await page.goto('./#/manga');await expect(page.locator('.personal-library article')).toHaveCount(4);await page.locator('.personal-library article').first().locator('a[href*="/practice/"]').click();await expect(page).toHaveURL(/manga\/practice\/m3-fixture-0/);await expect(page.locator('.rush-shell .ratings')).toHaveCount(0);
 await page.goto('./#/manga');await page.locator('.continue-reading a').click();await expect(page).toHaveURL(/manga\/read\/m3-fixture-0/);await expect(page.locator('.page-image img')).toBeVisible();
});

import {test,expect} from '@playwright/test';
import {configure} from './fixture';
import {CONJUGATION_VERBS} from '../../src/app/data/conjugation-verbs';
import {VerbTransformation} from '../../src/app/core/models/conjugation-practice.model';
test.beforeEach(async({page},info)=>configure(page,info.project.name));
test('more keeps the module order, origin and lower progress tools',async({page},info)=>{
  await page.goto('./#/more?from=kana');
  await expect(page.locator('app-module-card a')).toHaveCount(7);
  const routes=await page.locator('app-module-card a').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
  expect(routes).toEqual(['#/','#/vocabulary','#/anki','#/conjugations','#/kanji','#/manga','#/flags']);
  const grid=await page.locator('.module-grid').boundingBox(),tools=await page.locator('.learning-tools').first().boundingBox();expect(tools!.y).toBeGreaterThanOrEqual(grid!.y+grid!.height);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.screenshot({path:info.outputPath('more.png'),fullPage:true});
});
test('all four verb categories accept literal answers and mixed adjective/verb rounds work',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  for(const category of ['verb-negative','verb-past','verb-negative-past','verb-te']){
    await page.goto('./#/conjugations');await expect(page.locator(`[data-category-id="${category}"] dd`).first()).toHaveText('50');await page.locator(`[data-category-id="${category}"] .card-open`).click();
    const q=page.locator('.question');await expect(q).toHaveAttribute('data-verb-id',/.+/);const id=await q.getAttribute('data-verb-id'),form=await q.getAttribute('data-transformation') as VerbTransformation,word=CONJUGATION_VERBS.find(v=>v.id===id)!;
    await page.locator('input').fill(word.conjugations[form].romaji[0].toUpperCase());await page.locator('input').press('Enter');await expect(page.locator('.feedback')).toHaveClass(/correct/);await expect(page.locator('.correct-count')).toHaveText('1');await page.locator('input').press('Space');await expect(page.locator('.feedback')).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    expect(await page.locator('main').innerText()).not.toMatch(/conjugations\./);
    await page.screenshot({path:info.outputPath(category+'.png')});
    await page.goto('./#/conjugations');await expect(page.locator(`[data-category-id="${category}"] dd`).last()).toHaveText('1');
  }
  await page.locator('[data-category-id="verb-te"] input').check();await page.locator('[data-category-id="adjective-na"] input').check();await page.locator('.mix .primary').click();
  const seen=new Set<string>();for(let i=0;i<4;i++){seen.add(await page.locator('.question').getAttribute('data-family')??'');await page.locator('.actions button').last().click();await page.locator('.next').click();}expect(seen.has('na')).toBe(true);expect(seen.size).toBeGreaterThan(1);
  const stats=await page.evaluate(()=>JSON.parse(localStorage.getItem('kana-study.conjugation-stats.v1')!));expect(stats.buckets.mixed.wrong).toBe(4);expect(stats.buckets['verb-te'].correct).toBe(1);expect(errors).toEqual([]);
});

import {test,expect,Page} from '@playwright/test';
import {configure} from './fixture';
import {CONJUGATION_ADJECTIVES} from '../../src/app/data/conjugation-adjectives';
import {AdjectiveTransformation} from '../../src/app/core/models/conjugation-practice.model';
test.beforeEach(async({page},info)=>configure(page,info.project.name));
export async function accepted(page:Page){const q=page.locator('.question'),id=await q.getAttribute('data-adjective-id'),form=await q.getAttribute('data-transformation');return CONJUGATION_ADJECTIVES.find(w=>w.id===id)!.conjugations[form as AdjectiveTransformation];}
test('individual i/na forms support keyboard answers, feedback, no duplicate counting and real saved records',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const family of ['i','na']){
  await page.goto('./#/conjugations');const card=page.locator(`[data-category-id="adjective-${family}"]`);await card.click({position:{x:24,y:(await card.boundingBox())!.height-18}});await expect(page.locator('.question')).toHaveAttribute('data-family',family);
  await expect(page.locator('details')).not.toHaveAttribute('open','');const field=page.locator('#conjugation-answer'),check=page.locator('button.check');await expect(check).toBeDisabled();
  const bounds=await check.boundingBox();if(info.project.use.viewport!.width>=1280)expect(bounds!.y+bounds!.height).toBeLessThanOrEqual(info.project.use.viewport!.height);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  expect(await page.locator('.practice-shell').evaluate(shell=>[...shell.querySelectorAll('a,button,input,summary')].every(el=>{const box=el.getBoundingClientRect();return box.width>=44&&box.height>=44;}))).toBe(true);
  await page.screenshot({path:info.outputPath('question-'+family+'.png')});
  const answer=await accepted(page);await field.fill(' '+answer.romaji[0].toUpperCase()+' ');await field.press('Enter');await expect(page.locator('.feedback')).toHaveClass(/correct/);await expect(check).toBeDisabled();await field.press('Enter');
  const stats=await page.evaluate(()=>JSON.parse(localStorage.getItem('kana-study.conjugation-stats.v1')!));expect(stats.buckets['adjective-'+family]).toEqual({attempts:1,correct:1,wrong:0,bestStreak:1});
  await expect(page.locator('.correct-count')).toHaveText('1');await expect(page.locator('.wrong-count')).toHaveText('0');
  await expect(page.locator('.next')).toHaveAttribute('aria-keyshortcuts','Space');await page.screenshot({path:info.outputPath('correct-'+family+'.png')});await field.press('Space');await expect(field).toHaveValue('');await expect(page.locator('.feedback')).toHaveCount(0);
  await page.locator('.actions button').last().click();await expect(page.locator('.feedback')).toBeVisible();await expect(field).toHaveJSProperty('readOnly',true);await page.keyboard.press('Space');await field.fill('not-an-answer');await field.press('Enter');await expect(page.locator('.feedback')).not.toHaveClass(/correct/);
  await expect(page.locator('.correct-count')).toHaveText('1');await expect(page.locator('.wrong-count')).toHaveText('2');
  await page.goto('./#/conjugations');await expect(page.locator(`[data-category-id="adjective-${family}"] dd`).last()).toHaveText('1');
 }
 expect(errors).toEqual([]);
});
test('mixed selection alternates only available families and pending categories require explicit subset consent',async({page})=>{
 await page.goto('./#/conjugations');await page.locator('[data-category-id="adjective-i"] input').check();await page.locator('[data-category-id="verb-negative"] input').check();await page.locator('.mix .primary').click();await expect(page).toHaveURL(/#\/conjugations$/);await expect(page.locator('.practice-status')).not.toBeEmpty();await expect(page.locator('.available-only')).toBeVisible();
 await page.locator('.available-only').click();await expect(page.locator('.question')).toHaveAttribute('data-family','i');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('kana-study.conjugation-selection.v1')!).categoryIds)).toEqual(['verb-negative','adjective-i']);
 await page.goto('./#/conjugations');await page.locator('[data-category-id="verb-negative"] input').uncheck();await page.locator('[data-category-id="adjective-na"] input').check();await page.locator('.mix .primary').click();
 let previous='';for(let i=0;i<8;i++){const family=await page.locator('.question').getAttribute('data-family');expect(['i','na']).toContain(family);if(previous)expect(family).not.toBe(previous);previous=family!;await page.locator('.actions button').last().click();await page.locator('.next').click();}
 const stats=await page.evaluate(()=>JSON.parse(localStorage.getItem('kana-study.conjugation-stats.v1')!));expect(stats.buckets.mixed.attempts).toBe(8);expect(stats.buckets['adjective-i'].attempts).toBe(0);expect(stats.buckets['adjective-na'].attempts).toBe(0);
});
test('workspace A→B→A closes rounds and restores only its own records; manipulated URLs do not broaden selection',async({page})=>{
 await page.goto('./#/conjugations');await page.waitForFunction(()=>{const n=document.querySelector('app-root');return n&&(window as any).ng.getComponent(n).auth.ready();});
 const activate=async(id:string)=>page.locator('app-conjugations-page').evaluate((n,id)=>(window as any).ng.getComponent(n).selection.workspace.activateUser(id),id);
 await activate('qa-adjectives-a');await page.locator('[data-category-id="adjective-i"] .card-open').click();const a=await accepted(page);await page.locator('input').fill(a.kana[0]);await page.locator('input').press('Enter');
 await page.locator('app-conjugation-practice-page').evaluate(n=>(window as any).ng.getComponent(n).practice.workspace.activateUser('qa-adjectives-b'));await expect(page.locator('.empty')).toBeVisible();await expect(page.locator('input')).toHaveCount(0);
 await page.goto('./#/conjugations');await expect(page.locator('[data-category-id="adjective-i"] dd').last()).toHaveText('0');await activate('qa-adjectives-a');await expect(page.locator('[data-category-id="adjective-i"] dd').last()).toHaveText('1');
 for(const query of ['mode=single&categories=adjective-i,adjective-na','mode=mixed&categories=adjective-i,verb-past','mode=mixed&categories=bogus']){await page.goto('./#/conjugations/practice?'+query);await expect(page.locator('.empty')).toBeVisible();await expect(page.locator('input')).toHaveCount(0);}
});

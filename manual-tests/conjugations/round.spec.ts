import {test,expect} from '@playwright/test';import {configure} from './fixture';
test('finite 50-question na round completes and restarts without expanding family or resetting saved counters',async({page})=>{
 await configure(page,'desktop-es-dark');await page.goto('./#/conjugations/practice?mode=single&categories=adjective-na');
 const questions=new Set<string>();for(let i=0;i<50;i++){const q=page.locator('.question');await expect(q).toHaveAttribute('data-family','na');const id=(await q.getAttribute('data-adjective-id'))+':'+await q.getAttribute('data-transformation');expect(questions.has(id)).toBe(false);questions.add(id);await page.locator('.actions button').last().click();await page.locator('.next').click();}
 await expect(page.locator('.summary')).toBeVisible();await expect(page.locator('.summary dd').first()).toHaveText('50');await expect(page.locator('.summary dd').last()).toHaveText('50');await page.locator('.summary button').click();await expect(page.locator('.question')).toHaveAttribute('data-family','na');await expect(page.locator('.feedback')).toHaveCount(0);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('kana-study.conjugation-stats.v1')!).buckets['adjective-na'].attempts)).toBe(50);
});

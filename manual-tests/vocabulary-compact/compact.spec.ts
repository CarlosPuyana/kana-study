import {test,expect,Page} from '@playwright/test';import {setup,directions,measure,target} from './fixture';import {mkdir,writeFile} from 'node:fs/promises';
async function medals(page:Page){const d=page.locator('.medal-dialog');while(await d.count()){const text=await d.textContent();await d.locator('.primary').click();await expect.poll(()=>d.evaluateAll(n=>n[0]?.textContent??null)).not.toBe(text);}}
for(const direction of directions){
 test(`self ${direction}: compact reveal, variants and unchanged consolidation`,async({page},info)=>{
  await setup(page,direction,info.project.use.colorScheme==='light'?'light':'dark');await expect(page.locator('app-vocabulary-study-answer')).toHaveCount(0);
  if(direction.includes('reading'))await expect(page.locator('.exercise rt')).toHaveCount(0);
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:info.outputPath('front.png')});await page.locator('.reveal').click();
  const answer=page.locator('.answer');
  if(direction==='japanese-to-meaning'){await expect(answer.locator('h2')).toHaveText(target.quizMeaning.es);await expect(answer.locator('app-furigana-text')).toHaveCount(0);await expect(page.locator('.prompt-readings')).toContainText('まいつき');}
  if(direction==='japanese-to-reading'){await expect(answer.locator('h2')).toHaveText(target.primaryReading);await expect(answer.locator('.reading-variants')).toContainText('まいつき');await expect(answer.locator('app-furigana-text')).toHaveCount(0);}
  if(direction==='reading-to-japanese'){await expect(answer.locator('h2')).toHaveText(target.primaryWrittenForm);await expect(answer.locator('rt')).toHaveCount(0);}
  if(direction==='meaning-to-japanese'){await expect(answer.locator('app-furigana-text')).toBeVisible();await expect(answer.locator('.reading-variants')).toContainText('まいつき');}
  await expect(answer.locator('details')).not.toHaveAttribute('open');
  const size=page.viewportSize()!;if(size.width>=900)expect(await page.evaluate(()=>scrollY)).toBe(0);
  await page.evaluate(()=>scrollTo(0,0));const data=await measure(page);expect(data.scrollWidth).toBeLessThanOrEqual(data.width+1);expect(data.ratings.bottom).toBeLessThanOrEqual(data.height);
  await mkdir('.cache/vocabulary-compact/measurements',{recursive:true});await writeFile(`.cache/vocabulary-compact/measurements/${info.project.name}-${direction}.json`,JSON.stringify(data,null,2));await page.screenshot({path:info.outputPath('revealed.png'),fullPage:true});
  await answer.locator('summary').click();await expect(answer.locator('.romaji')).toBeVisible();await answer.locator('summary').click();
  if(direction==='japanese-to-meaning'){
   await answer.locator('h2').evaluate(e=>e.textContent='Una traducción española excepcionalmente larga conserva su texto completo, puede ocupar varias líneas y permite desplazarse de forma natural. '.repeat(6));
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
   await page.screenshot({path:info.outputPath('long-translation.png'),fullPage:true});
  }
  for(const [i,rating] of ['no','hard','yes','yes'].entries()){
   if(i)await page.locator('.reveal').click();await page.locator('.ratings .'+rating).click();
   if(i<3)await expect(page.locator('.reveal')).toBeVisible();
  }
  await medals(page);await expect(page.locator('.results')).toBeVisible();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('kana-study.vocabulary-review-events.v1')??'[]').length)).toBe(1);
 });
 test(`options ${direction}: no answer leakage and real completion`,async({page},info)=>{
  await setup(page,direction,info.project.use.colorScheme==='light'?'light':'dark',true);await expect(page.locator('app-vocabulary-study-answer')).toHaveCount(0);
  if(direction.includes('reading'))await expect(page.locator('.exercise rt')).toHaveCount(0);
  const expected=direction==='japanese-to-meaning'?target.quizMeaning.es:direction==='japanese-to-reading'?target.primaryReading:target.primaryWrittenForm;
  for(let i=0;i<2;i++){await page.locator('.options button').filter({hasText:expected}).first().click();await expect(page.locator('.feedback.success')).toBeVisible();await expect(page.locator('.feedback-answer')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.locator('.exercise > button.primary').click();}
  await medals(page);await expect(page.locator('.results')).toBeVisible();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('kana-study.vocabulary-review-events.v1')??'[]').length)).toBe(1);
 });
}

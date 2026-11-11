import {test,expect} from '@playwright/test';
test.beforeEach(async({page},info)=>{
 await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__={};'}));
 await page.addInitScript(({language,theme})=>{localStorage.setItem('kana-study.settings.v1',JSON.stringify({language,theme}));},{language:info.project.name.includes('-en-')?'en':info.project.name.includes('-ca-')?'ca':'es',theme:info.project.use.colorScheme});
 await page.goto('./#/conjugations');
});
for(const [category,form]of [['verb-conditional-tara','conditionalTara'],['verb-conditional-ba','conditionalBa'],['verb-volitional','volitional']])test(category+': unlock → select → practice → lock preserves statistics',async({page},info)=>{
 const card=page.locator(`[data-category-id="${category}"]`);await expect(card.locator('input[type=checkbox]')).toBeDisabled();await card.locator('.lock-category').click();await card.locator('input[type=checkbox]').check();await page.reload();await expect(card.locator('input[type=checkbox]')).toBeChecked();
 await card.locator('.card-open').click();await expect(page.locator('.question')).toHaveAttribute('data-transformation',form);
 const answer=await page.locator('app-conjugation-practice-page').evaluate(node=>(window as any).ng.getComponent(node).practice.question().answers.kana[0]);await page.locator('#conjugation-answer').fill(answer);await page.locator('.question form').evaluate((form:HTMLFormElement)=>form.requestSubmit());await expect(page.locator('.correct-count')).toHaveText('1');
 const before=await page.evaluate(()=>localStorage.getItem('kana-study.conjugation-stats.v1'));expect(JSON.parse(before!).buckets[category].correct).toBe(1);expect(JSON.parse(before!).buckets[category].bestStreak).toBe(1);await page.locator('.exit-link').click();await card.locator('.lock-category').click();await expect(card.locator('input[type=checkbox]')).toBeDisabled();await expect(card.locator('.card-open')).toHaveCount(0);await expect(card.locator('.indicators dd').last()).toHaveText('1');expect(await page.evaluate(()=>localStorage.getItem('kana-study.conjugation-stats.v1'))).toBe(before);
 await card.screenshot({path:info.outputPath(category+'.png')});await page.goto(`./#/conjugations/practice?mode=single&categories=${category}`);await expect(page.locator('.question')).toHaveCount(0);
});
test('mixed practice uses only unlocked implementations and never locked forms',async({page})=>{
 await page.locator('[data-category-id="verb-volitional"] .lock-category').click();await page.locator('[data-category-id="verb-volitional"] input').check();await page.locator('[data-category-id="verb-te"] input').check();await expect(page.locator('[data-category-id="verb-imperative"] input')).toBeDisabled();await expect(page.locator('[data-category-id="verb-imperative"] .lock-category')).toHaveCount(1);
 await page.locator('.mix button.primary').click();await expect(page.locator('.question')).toBeVisible();const forms=await page.locator('app-conjugation-practice-page').evaluate(node=>[...new Set((window as any).ng.getComponent(node).practice.session().questions.map((q:any)=>q.transformation))]);expect(forms.sort()).toEqual(['te','volitional']);
});

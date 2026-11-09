import {test,expect} from '@playwright/test';import {mkdir,writeFile} from 'node:fs/promises';
import {configure,geometry,protectedState,language} from './fixture';
test.beforeEach(async({page},info)=>configure(page,info.project.name));
test('native module navigation, catalog, geometry and coming-soon actions never start study',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('./#/more');
 await page.locator('app-module-card a[href="#/conjugations"]').click();await expect(page.locator('app-conjugations-page h1')).toBeVisible();
 await expect(page.locator('.category-card')).toHaveCount(20);await expect(page.locator('.indicators dd')).toHaveCount(40);
 expect(await page.locator('.category-card').evaluateAll(cards=>cards.slice(0,2).map(card=>card.getAttribute('data-category-id')))).toEqual(['adjective-i','adjective-na']);
 const pending=language(info.project.name)==='en'?'Pending':language(info.project.name)==='ca'?'Pendent':'Pendiente';expect((await page.locator('.indicators dd').allTextContents()).filter(s=>s===pending)).toHaveLength(28);await expect(page.locator('[data-category-id="adjective-i"] dd').first()).toHaveText('15');await expect(page.locator('[data-category-id="adjective-na"] dd').first()).toHaveText('10');
 await expect(page.locator('.mix button.primary')).toBeDisabled();const before=await protectedState(page);
 await expect(page.locator('.unavailable .availability')).toHaveCount(14);await expect(page.locator('.card-open')).toHaveCount(6);await page.locator('.category-card.unavailable').last().click();await expect(page.locator('.practice-status')).toBeEmpty();await expect(page.locator('.category-card input:checked')).toHaveCount(0);
 await expect(page).toHaveURL(/#\/conjugations$/);expect(await protectedState(page)).toEqual(before);
 await page.evaluate(()=>scrollTo(0,0));const measured=await geometry(page);expect(measured.scrollWidth).toBeLessThanOrEqual(measured.width+1);
 if(measured.width>=900){expect(measured.cards[1].top).toBeCloseTo(measured.cards[0].top,0);expect(measured.cards[1].left).toBeGreaterThan(measured.cards[0].right);}
 else{expect(measured.cards[1].top).toBeGreaterThan(measured.cards[0].bottom);}
 expect(await page.locator('main').innerText()).not.toMatch(/conjugations\.|more\.conjugations\./);
 await mkdir('.cache/conjugations-phase1/geometry',{recursive:true});await writeFile(`.cache/conjugations-phase1/geometry/${info.project.name}.json`,JSON.stringify(measured,null,2));
 await page.screenshot({path:info.outputPath('overview.png')});await page.locator('.category-card').first().screenshot({path:info.outputPath('card.png')});
 await page.reload();await expect(page.locator('.category-card')).toHaveCount(20);expect(errors).toEqual([]);
});
test('keyboard selection, filters, global select-all and persistence keep real preferences only',async({page},info)=>{
 await page.goto('./#/conjugations');const before=await protectedState(page),first=page.locator('[data-category-id="verb-negative"] input');
 await first.focus();await expect(first).toBeFocused();await page.keyboard.press('Space');await expect(first).toBeChecked();
 const second=page.locator('[data-category-id="verb-past"] input');await second.check();await expect(page.locator('.category-card input:checked')).toHaveCount(2);
 await page.locator('.filters input[value="adjective"]').check();await expect(page.locator('.category-card')).toHaveCount(2);await expect(page.locator('.hidden-selection')).toContainText('2');
 await page.locator('.mix-actions button').first().click();await expect(page.locator('.category-card input:checked')).toHaveCount(2);await expect(page.locator('.selection-count')).toContainText('20');
 await page.locator('.filters input[value="all"]').check();await expect(page.locator('.category-card input:checked')).toHaveCount(20);
 await first.uncheck();await expect(page.locator('.category-card input:checked')).toHaveCount(19);await page.locator('.mix button.primary').click();await expect(page.locator('.practice-status')).toContainText('19');
 expect(await protectedState(page)).toEqual(before);await page.reload();await expect(page.locator('.category-card input:checked')).toHaveCount(19);
 await page.locator('app-page-header .back-button').click();await expect(page).toHaveURL(/#\/more\?from=conjugations$/);await page.goBack();await expect(page.locator('.category-card input:checked')).toHaveCount(19);
 await page.locator('.mix-actions button').nth(1).click();await expect(page.locator('.category-card input:checked')).toHaveCount(0);await expect(page.locator('.mix button.primary')).toBeDisabled();expect(await protectedState(page)).toEqual(before);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('synthetic A→B→A activation keeps checkbox state isolated without Supabase accounts',async({page})=>{
 await page.goto('./#/conjugations');await page.waitForFunction(()=>{const node=document.querySelector('app-account-control');return node&&(window as any).ng.getComponent(node).auth.ready();});
 const activate=async(id:string)=>{await page.locator('app-conjugations-page').evaluate((node,id)=>(window as any).ng.getComponent(node).selection.workspace.activateUser(id),id);};
 await activate('qa-conjugations-a');await page.locator('[data-category-id="verb-negative"] input').check();await activate('qa-conjugations-b');await expect(page.locator('.category-card input:checked')).toHaveCount(0);
 await page.locator('[data-category-id="adjective-i"] input').check();await activate('qa-conjugations-a');await expect(page.locator('[data-category-id="verb-negative"] input')).toBeChecked();await expect(page.locator('[data-category-id="adjective-i"] input')).not.toBeChecked();
 await page.locator('app-conjugations-page').evaluate(node=>{const w=(window as any).ng.getComponent(node).selection.workspace;w.activateUser('qa-conjugations-b');w.activateUser('qa-conjugations-a');});await expect(page.locator('[data-category-id="verb-negative"] input')).toBeChecked();
 expect(await page.evaluate(()=>Object.keys(localStorage).some(k=>/study-progress|review-events|completed-sessions|vocabulary-progress/.test(k)))).toBe(false);
});

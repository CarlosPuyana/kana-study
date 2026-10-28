import {test,expect,Page} from '@playwright/test';
import {KANJI_N5} from '../src/app/data/kanji-n5.generated';
import {VOCABULARY_N5} from '../src/app/data/vocabulary-n5.generated';

type Module='kanji'|'vocabulary';type Language='es'|'en'|'ca';
async function configure(page:Page,module:Module,language:Language,practice=false){
  await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__={};'}));
  const ids=module==='kanji'?KANJI_N5.filter(k=>k.enabled).slice(0,2).map(k=>k.id):VOCABULARY_N5.filter(w=>w.enabled&&w.primaryWrittenForm!==w.primaryReading&&w.furigana.some(s=>s.reading)).slice(0,2).map(w=>w.id);
  await page.addInitScript(({module,language,practice,ids})=>{
    if(!localStorage.getItem('kana-study.settings.v1'))localStorage.setItem('kana-study.settings.v1',JSON.stringify({language,theme:matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}));
    Math.random=()=>.999999;
    if(practice&&!localStorage.getItem('session-list-fixture')){
      localStorage.setItem('session-list-fixture','seeded');
      const types=module==='kanji'?['kanji-to-meaning']:['japanese-to-meaning','japanese-to-reading'];
      localStorage.setItem('kana-study.weaknesses.v1',JSON.stringify(ids.flatMap(itemId=>types.map(questionType=>({module,activity:'learn',itemId,questionType,attempts:3,failures:3,consecutiveCorrect:0,score:6,lastAttemptAt:'2026-10-28T10:00:00Z'})))));
    }
  },{module,language,practice,ids});
  return ids;
}
async function start(page:Page,module:Module,quick:boolean,practice:boolean){
  if(practice){
    await page.goto('/#/weaknesses');
    const title=module==='kanji'?'Kanji':'Vocabulario';
    await page.locator('.sections>section').filter({has:page.getByRole('heading',{name:title,exact:true})}).locator('button.practice').click();
  }else{
    await page.goto('/#/'+module);await page.locator('.play-button').click();
    await page.locator(`app-${module}-start-panel .${quick?'start':'secondary-start'}`).click();
  }
  await expect(page.locator(`app-${module}-play-page .exercise`)).toBeVisible();
}
// Observe the real transient session through Angular's dev inspector. Every start,
// reveal, answer, repetition, continuation and exit is performed through existing UI.
async function session(page:Page,module:Module){
  return page.evaluate(module=>{
    const component=(window as any).ng.getComponent(document.querySelector(`app-${module}-play-page`));
    const unit=component.learning.currentUnit();
    return {unit,completed:component.learning.completed(),snapshot:component.learning.session()};
  },module);
}
async function dismissMedals(page:Page,module:Module){
  const remaining=()=>page.evaluate(module=>(window as any).ng.getComponent(document.querySelector(`app-${module}-play-page`)).learning.newlyUnlockedMedals().length,module);
  for(let i=0;i<30&&await remaining()>0;i++){
    const count=await remaining();await expect(page.locator('.medal-dialog button')).toBeFocused();
    await page.keyboard.press('Escape');await expect.poll(remaining).toBe(count-1);
  }
  await expect(page.locator('.medal-dialog')).toHaveCount(0);
}
async function finish(page:Page,module:Module,language:Language,quick:boolean){
  const seen:string[]=[],presentations:string[]=[];
  const activeWidth=(await page.locator('.play-shell').boundingBox())!.width;
  let state=await session(page,module),turns=0;
  while(!state.completed&&turns<45){
    await expect(page.locator('app-learning-session-list')).toHaveCount(0);
    const id=module==='kanji'?state.unit.kanjiId:state.unit.entryId;presentations.push(id);if(!seen.includes(id))seen.push(id);
    if(quick){
      const label=module==='kanji'?KANJI_N5.find(k=>k.id===id)!.meanings[language].join(' · '):
        state.unit.questionType==='japanese-to-reading'?VOCABULARY_N5.find(w=>w.id===id)!.primaryReading:VOCABULARY_N5.find(w=>w.id===id)!.quizMeaning[language];
      const buttons=page.locator('.options button');await expect(buttons.first()).toBeVisible();
      if(turns===0){const labels=await buttons.allTextContents(),wrong=labels.findIndex(text=>text.trim()!==label);expect(wrong).toBeGreaterThanOrEqual(0);await buttons.nth(wrong).click();}
      else await page.locator('.options').getByRole('button',{name:label,exact:true}).click();
      await expect(page.locator('.feedback')).toBeVisible();await page.locator('.exercise>.primary').click();
    }else{await page.locator('.reveal').click();await expect(page.locator('.answer')).toBeVisible();await page.locator(turns===0?'.ratings .no':'.ratings .yes').click();}
    turns++;state=await session(page,module);
  }
  expect(state.completed).toBe(true);expect(turns).toBe(state.snapshot.sessionSize+1);
  expect(presentations.filter(id=>id===presentations[0]).length).toBeGreaterThan(1);
  await dismissMedals(page,module);
  const list=page.locator('app-learning-session-list'),summary=page.locator('.results');await expect(list).toBeVisible();
  expect(await list.locator('li').evaluateAll(rows=>rows.map(row=>row.getAttribute('data-entry-id')))).toEqual(seen);
  await expect(list.locator('.unique-count')).toContainText(String(seen.length));
  await expect(summary.locator('.round-stats div strong').first()).toHaveText(String(turns));
  await expect(summary.locator(':scope>p').first()).toContainText(String(state.snapshot.sessionSize));
  await expect(list.locator('a,button,input,[tabindex]')).toHaveCount(0);
  expect(await list.evaluate(el=>el.contains(document.activeElement))).toBe(false);
  const summaryBox=(await summary.boundingBox())!,listBox=(await list.boundingBox())!,mainBox=(await page.locator('.play-shell').boundingBox())!;
  if(page.viewportSize()!.width>=1000){expect(listBox.x).toBeGreaterThan(summaryBox.x+summaryBox.width);expect(mainBox.width).toBeGreaterThan(activeWidth);}
  else {expect(listBox.y).toBeGreaterThanOrEqual(summaryBox.y+summaryBox.height);expect(mainBox.width).toBe(activeWidth);}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  expect(await list.evaluate(el=>el.scrollHeight<=el.clientHeight+1)).toBe(true);
  for(const id of seen){const row=list.locator(`li[data-entry-id="${id}"]`);
    if(module==='kanji'){const entry=KANJI_N5.find(k=>k.id===id)!;await expect(row).toContainText(entry.character);await expect(row).toContainText(entry.meanings[language].join(' · '));}
    else {const entry=VOCABULARY_N5.find(w=>w.id===id)!;await expect(row.locator('.reading')).toHaveText(entry.primaryReading);await expect(row).toContainText(entry.quizMeaning[language]);}
  }
  return {seen,summary:state.snapshot};
}

for(const module of ['kanji','vocabulary'] as const)for(const language of ['es','en','ca'] as const){
  test(`${module} self assessment results ${language}: real completion, repeat, reference and layout`,async({page},info)=>{
    await configure(page,module,language);await start(page,module,false,false);await finish(page,module,language,false);
    await expect(page.locator('app-learning-session-list h2')).not.toContainText('sessionList.');
    await page.screenshot({path:info.outputPath(`results-${module}-${language}.png`),fullPage:true});
    await page.locator('.results .secondary').click();await expect(page).toHaveURL(new RegExp('#/'+module+'$'));
    await page.goto('/#/'+module+'/play');await expect(page.locator('.missing')).toBeVisible();await expect(page.locator('app-learning-session-list')).toHaveCount(0);
  });
}
for(const module of ['kanji','vocabulary'] as const)for(const extra of [false,true]){
  test(`${module} multiple choice ${extra?'additional practice':'daily Learn'}: targets only and independent totals`,async({page},info)=>{
    const ids=await configure(page,module,'es',extra);await start(page,module,true,extra);const result=await finish(page,module,'es',true);
    if(extra){expect(new Set(result.seen)).toEqual(new Set(ids));expect(result.summary.sessionSize).toBe(module==='kanji'?2:4);await expect(page.locator('.results .next-round')).toHaveCount(0);}
    else await expect(page.locator('.results .next-round')).toBeVisible();
    await page.screenshot({path:info.outputPath(`results-${module}-${extra?'practice':'quick'}.png`),fullPage:true});
  });
}

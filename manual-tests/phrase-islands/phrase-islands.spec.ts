import {topicCount,topicIds} from './catalog-fixture';
import { expect, Page, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/supabase-config.js', r => r.fulfill({ contentType: 'text/javascript', body: 'window.__KANA_STUDY_CONFIG__={};' }));
  await page.route('**/*.supabase.co/**', r => r.abort());
  await page.clock.setFixedTime(new Date('2026-11-17T12:00:00Z'));
  await page.addInitScript(() => {
    if (!localStorage.getItem('kana-study.settings.v1')) localStorage.setItem('kana-study.settings.v1', JSON.stringify({ language: 'es', theme: matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark' }));
  });
});
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}
async function existingDecks(page: Page) {
  await expect(page.locator('.deck-list .deck-card').first()).toBeVisible();
  return page.locator('.deck-list .deck-card').evaluateAll(cards => cards.map(c => ({
    title: c.querySelector('h3')?.textContent, stats: c.querySelector('.stats')?.textContent,
    links: [...c.querySelectorAll('a')].map(a => a.getAttribute('href')),
  })));
}

test('Mazos → Islas → Mazos preserves decks; keyboard selection is accessible and ephemeral', async ({ page }, info) => {
  await page.goto('./#/anki');
  const decks = await existingDecks(page); expect(decks.length).toBeGreaterThanOrEqual(1);
  const explore = page.getByRole('link', { name: 'Explorar islas' });
  await expect(explore).toHaveAttribute('href', '#/anki/islands');
  await explore.scrollIntoViewIfNeeded(); await noOverflow(page);
  await page.screenshot({ path: `.cache/phrase-islands/decks-${info.project.name}.png`, fullPage: true });
  await explore.click(); await expect(page).toHaveURL(/#\/anki\/islands$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Islas de frases');
  await expect(page).toHaveTitle('Islas de frases · Kana Study');
  const topics = page.locator('.topic-card'); await expect(topics).toHaveCount(6);
  await expect(topics.locator('.phrase-count')).toHaveText(topicIds.map(t=>topicCount(t)+' frases'));
  await topics.first().focus(); await page.keyboard.press('Space'); await expect(topics.first()).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Tab'); await expect(topics.nth(1)).toBeFocused();
  await page.keyboard.press('Enter'); await expect(topics.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.selection-summary')).toHaveText('Temáticas seleccionadas: 2');
  const focus = await topics.nth(1).evaluate(b => ({ outline: getComputedStyle(b).outlineStyle, width: getComputedStyle(b).outlineWidth }));
  expect(focus.outline).toBe('solid'); expect(parseFloat(focus.width)).toBeGreaterThanOrEqual(2);
  await page.keyboard.press('Enter'); await expect(topics.nth(1)).toHaveAttribute('aria-pressed', 'false');
  await topics.nth(4).click(); await expect(page.locator('.selection-summary')).toHaveText('Temáticas seleccionadas: 2');
  for (const mode of await page.locator('.mode-card').all()) await expect(mode).toBeEnabled();
  await noOverflow(page); await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: `.cache/phrase-islands/islands-${info.project.name}.png`, fullPage: true });
  await page.locator('app-page-header .back-button, .session-back').click(); await expect(page).toHaveURL(/#\/anki$/);
  expect(await existingDecks(page)).toEqual(decks);
  await explore.click(); await expect(page.locator('.topic-card[aria-pressed=true]')).toHaveCount(0);
  await page.locator('.topic-card').first().click(); await page.reload();
  await expect(page.locator('.topic-card[aria-pressed=true]')).toHaveCount(1);
  await page.goto('./#/anki/japanese-1500/study'); await expect(page.locator('.reveal')).toBeVisible();
  await expect(page.locator('.header-counts > span')).toHaveCount(3);
});

test('all languages, native disabled modes, contrast and no persistence/media on selection', async ({ page }) => {
  await page.goto('./#/anki/islands'); await expect(page.locator('.topic-card')).toHaveCount(6);
  for (const [language, title, first, comingSoon] of [
    ['es', 'Islas de frases', 'Vida cotidiana', 'Próximamente'],
    ['en', 'Phrase islands', 'Everyday life', 'Coming soon'],
    ['ca', 'Illes de frases', 'Vida quotidiana', 'Properament'],
  ]) {
    await page.evaluate(language => {
      const key = 'kana-study.settings.v1'; localStorage.setItem(key, JSON.stringify({ ...JSON.parse(localStorage.getItem(key)!), language }));
    }, language);
    await page.reload(); await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(page).toHaveTitle(title + ' · Kana Study');
    await expect(page.locator('.topic-card').first()).toHaveAccessibleName(first);
    await expect(page.locator('.mode-card')).toHaveCount(3);
    if (await page.locator('.topic-card').first().getAttribute('aria-pressed') === 'false') await page.locator('.topic-card').first().click();
    await expect(page.locator('.phrase-entry')).toHaveCount(0);
    await page.locator('.explore-link').click();
    await expect(page.locator('.phrase-entry')).toHaveCount(topicCount('everyday'));
    await expect(page.locator('.phrase-natural').first()).toHaveText(({es:'Hoy voy a descansar en casa.',en:"I'm resting at home today.",ca:'Avui descansaré a casa.'} as Record<string,string>)[language]);
    await expect(page.locator('main')).not.toContainText('phraseIslands.'); await noOverflow(page);
    await page.locator('app-page-header .back-button, .session-back').click();
  }
  await page.evaluate(() => {
    const state = window as typeof window & { islandWrites: string[]; islandOpens: number };
    state.islandWrites = []; state.islandOpens = 0;
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) { state.islandWrites.push(key); return set.call(this, key, value); };
    const open = indexedDB.open.bind(indexedDB);
    indexedDB.open = (...args: Parameters<IDBFactory['open']>) => { state.islandOpens++; return open(...args); };
  });
  await page.locator('.topic-card').first().click(); await page.locator('.topic-card').nth(3).click();
  for (const mode of await page.locator('.mode-card').all()) {
    await expect(mode).toBeEnabled();
  }
  await expect(page.locator('audio, video, .session')).toHaveCount(0);
  expect(await page.evaluate(() => {
    const state = window as typeof window & { islandWrites: string[]; islandOpens: number };
    return { writes: state.islandWrites, opens: state.islandOpens };
  })).toEqual({ writes: [], opens: 0 });
  const contrasts = await page.evaluate(() => {
    function channels(css: string) { return css.match(/[\d.]+/g)!.slice(0, 3).map(Number); }
    function luminance(color: number[]) { const c = color.map(v => { const n = v / 255; return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4; }); return c[0] * .2126 + c[1] * .7152 + c[2] * .0722; }
    const ratio = (a: number[], b: number[]) => { const values = [luminance(a), luminance(b)].sort((a, b) => b - a); return (values[0] + .05) / (values[1] + .05); };
    return [...document.querySelectorAll('.mode-title, .mode-description, .coming-soon')].map(element => {
      let parent: Element | null = element, background = 'rgba(0, 0, 0, 0)';
      while (parent && background === 'rgba(0, 0, 0, 0)') { background = getComputedStyle(parent).backgroundColor; parent = parent.parentElement; }
      return ratio(channels(getComputedStyle(element).color), channels(background));
    });
  });
  expect(Math.min(...contrasts)).toBeGreaterThanOrEqual(4.5);
});

test('real phrase audio replays, stops, cancels old playback and handles missing/blocked media without writes',async({page},info)=>{
  await page.addInitScript(()=>{
    const Native=window.Audio;(window as any).phraseAudios=[];
    window.Audio=function(){const audio=new Native();(window as any).phraseAudios.push(audio);return audio;} as typeof Audio;
  });
  await page.goto('./#/anki/islands');await expect(page.locator('.topic-card')).toHaveCount(6);
  await page.evaluate(()=>{(window as any).islandWrites=[];const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){(window as any).islandWrites.push(k);set.call(this,k,v);};const open=indexedDB.open.bind(indexedDB);(window as any).islandOpens=0;indexedDB.open=(...a)=>{(window as any).islandOpens++;return open(...a);};});
  await page.locator('.topic-card').first().click();await page.locator('.topic-card').nth(1).click();
  await expect(page.locator('.phrase-entry')).toHaveCount(0);
  await page.screenshot({path:`.cache/phrase-islands-i3/home-${info.project.name}.png`,fullPage:true});
  await page.locator('.explore-link').click();
  await expect(page.locator('.phrase-entry')).toHaveCount(topicCount('everyday','conversation'));
  const cards=page.locator('.phrase-entry'),first=cards.first(),second=cards.nth(1);
  await first.getByRole('button',{name:/^Escuchar:/}).click();await expect(first.getByRole('status')).toHaveText('Reproduciendo');
  expect(await page.evaluate(()=>{const a=(window as any).phraseAudios[0];return a.src.includes('/kana-study/audio/phrase-islands/v1/')&&a.readyState>=2;})).toBe(true);
  await second.getByRole('button',{name:/^Escuchar:/}).click();await expect(second.getByRole('status')).toHaveText('Reproduciendo');
  expect(await page.evaluate(()=>(window as any).phraseAudios[0].paused)).toBe(true);
  await second.getByRole('button',{name:'Detener',exact:true}).click();expect(await page.evaluate(()=>(window as any).phraseAudios.every((a:HTMLAudioElement)=>a.paused))).toBe(true);
  await first.getByRole('button',{name:/^Escuchar:/}).click();await expect(first.getByRole('status')).toHaveText('Reproduciendo');
  await page.locator('app-page-header .back-button, .session-back').click();await expect(page.locator('.topic-card[aria-pressed=true]')).toHaveCount(2);
  await page.locator('.topic-card').first().click();await page.locator('.explore-link').click();await expect(cards).toHaveCount(topicCount('conversation'));expect(await page.evaluate(()=>(window as any).phraseAudios.every((a:HTMLAudioElement)=>a.paused))).toBe(true);
  await page.route('**/audio/phrase-islands/v1/*.mp3',r=>r.fulfill({status:404,body:''}));
  await cards.first().getByRole('button',{name:/^Escuchar:/}).click();await expect(cards.first().getByRole('status')).toContainText('Audio no disponible');
  await page.unroute('**/audio/phrase-islands/v1/*.mp3');
  await page.evaluate(()=>{(window as any).nativePlay=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=()=>Promise.reject(new DOMException('test','NotAllowedError'));});
  await cards.first().getByRole('button',{name:/^Escuchar:/}).click();await expect(cards.first().getByRole('status')).toContainText('El navegador ha bloqueado');
  await page.evaluate(()=>{HTMLMediaElement.prototype.play=(window as any).nativePlay;});
  await cards.first().getByRole('button',{name:/^Escuchar:/}).click();await expect(cards.first().getByRole('status')).toHaveText('Reproduciendo');
  await noOverflow(page);await cards.first().scrollIntoViewIfNeeded();await page.screenshot({path:`.cache/phrase-islands-i3/library-${info.project.name}.png`});
  await cards.first().getByRole('button',{name:'Detener',exact:true}).click();
  expect(await page.evaluate(()=>({writes:(window as any).islandWrites,opens:(window as any).islandOpens}))).toEqual({writes:[],opens:0});
});

test('direct explore links validate topics and survive back, forward and reload', async ({page}) => {
  await page.goto('./#/anki/islands/explore?topics=everyday,invalid,everyday');
  await expect(page.locator('.phrase-entry')).toHaveCount(topicCount('everyday'));
  await page.locator('app-page-header .back-button, .session-back').click();
  await expect(page.locator('.topic-card[aria-pressed=true]')).toHaveCount(1);
  await expect(page.locator('.phrase-entry')).toHaveCount(0);
  await page.goBack(); await expect(page.locator('.phrase-entry')).toHaveCount(topicCount('everyday'));
  await page.goForward(); await expect(page.locator('.mode-card:enabled')).toHaveCount(3);
  await page.locator('.explore-link').focus(); await expect(page.locator('.explore-link')).toBeFocused();
  await page.keyboard.press('Enter'); await page.reload(); await expect(page.locator('.phrase-entry')).toHaveCount(topicCount('everyday'));
  await page.goto('./#/anki/islands/explore?topics=invalid');
  await expect(page.locator('.library-empty')).toBeVisible();
  await expect(page.locator('.phrase-entry')).toHaveCount(0);
});

test('listen uses real ended events, repetition, speed, pause, stop and session navigation',async({page},info)=>{
 await page.addInitScript(()=>{const Native=window.Audio;(window as any).clips=[];window.Audio=function(){const a=new Native();(window as any).clips.push(a);return a;} as typeof Audio;});
 await page.goto('./#/anki/islands/listen?topics=conversation');
 await expect(page.locator('.progress')).toContainText('1 / '+topicCount('conversation'));
 await page.locator('.session-settings > summary').click();await page.getByLabel('Repeticiones').selectOption('2');await page.getByLabel('Pausa entre clips').selectOption('0');await page.getByLabel('Velocidad').selectOption('1.2');
 await page.getByRole('button',{name:'Reproducir / repetir',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>(window as any).clips[0].readyState)).toBeGreaterThanOrEqual(2);
 expect(await page.evaluate(()=>(window as any).clips[0].playbackRate)).toBe(1.2);
 await page.getByRole('button',{name:'Pausar',exact:true}).click();await expect(page.getByRole('button',{name:'Continuar',exact:true})).toBeEnabled();
 await page.getByRole('button',{name:'Continuar',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>(window as any).clips.length)).toBeGreaterThanOrEqual(2);
 await expect(page.locator('.progress')).toContainText('1 / '+topicCount('conversation'));
 await expect.poll(()=>page.evaluate(()=>(window as any).clips.length)).toBeGreaterThanOrEqual(3);
 await expect(page.locator('.progress')).toContainText('2 / '+topicCount('conversation'));
 await page.getByRole('button',{name:'Detener',exact:true}).click();
 expect(await page.evaluate(()=>(window as any).clips.every((a:HTMLAudioElement)=>a.paused))).toBe(true);
 await page.getByRole('button',{name:'Anterior',exact:true}).click();await expect(page.locator('.progress')).toContainText('1 / '+topicCount('conversation'));
 await page.getByRole('button',{name:'Siguiente',exact:true}).click();
 for(let i=0;i<topicCount('conversation')-2;i++)await page.getByRole('button',{name:'Siguiente',exact:true}).click();
 await page.getByRole('button',{name:'Reproducir / repetir',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'Sesión finalizada.'})).toBeVisible();
 expect(await page.evaluate(()=>(window as any).clips.every((a:HTMLAudioElement)=>a.paused))).toBe(true);
 await page.locator('app-page-header .back-button, .session-back').click();await expect(page.locator('.topic-card[aria-pressed=true]')).toHaveCount(1);
 await noOverflow(page);
});

test('shadowing and recall keep manual advance and conceal the answer until reveal',async({page},info)=>{
 await page.addInitScript(()=>{const Native=window.Audio;(window as any).clips=[];window.Audio=function(){const a=new Native();(window as any).clips.push(a);return a;} as typeof Audio;});
 await page.goto('./#/anki/islands/shadowing?topics=everyday,conversation');
 await page.locator('.session-settings > summary').click();await page.getByLabel('Tiempo para imitar').selectOption('2');await page.getByRole('button',{name:'Reproducir / repetir',exact:true}).click();await expect(page.locator('.audio-status')).toContainText('Tu turno');
 await expect(page.locator('.progress')).toContainText('1 / '+topicCount('everyday','conversation'));
 await page.getByRole('button',{name:'Reproducir / repetir',exact:true}).click();await page.getByRole('button',{name:'Siguiente',exact:true}).click();
 expect(await page.evaluate(()=>(window as any).clips.every((a:HTMLAudioElement)=>a.paused))).toBe(true);
 await page.goto('./#/anki/islands/recall?topics=everyday');
 await page.evaluate(()=>{(window as any).clips=[];});
 await expect(page.locator('.prompt')).toHaveText('Hoy voy a descansar en casa.');await expect(page.locator('[lang=ja], ruby')).toHaveCount(0);
 expect(await page.evaluate(()=>(window as any).clips.length)).toBe(0);
 await page.getByRole('button',{name:'Mostrar respuesta',exact:true}).click();await expect(page.locator('ruby').first()).toBeVisible();
 await page.getByRole('button',{name:'Reproducir / repetir',exact:true}).click();await expect(page.locator('.audio-status')).toHaveText('Reproduciendo');
 await page.screenshot({path:`.cache/phrase-islands-i4/recall-${info.project.name}.png`,fullPage:true});
 await page.getByRole('button',{name:'Siguiente',exact:true}).click();await expect(page.locator('ruby')).toHaveCount(0);
 await page.locator('app-page-header .back-button, .session-back').click();expect(await page.evaluate(()=>(window as any).clips.every((a:HTMLAudioElement)=>a.paused))).toBe(true);
});

test('session error retry and quick clicks have one active clip and no learning writes',async({page})=>{
 await page.addInitScript(()=>{const Native=window.Audio;(window as any).clips=[];window.Audio=function(){const a=new Native();(window as any).clips.push(a);return a;} as typeof Audio;});
 await page.goto('./#/anki/islands/listen?topics=everyday');
 await page.evaluate(()=>{(window as any).writes=[];const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){(window as any).writes.push(k);set.call(this,k,v);};(window as any).opens=0;const open=indexedDB.open.bind(indexedDB);indexedDB.open=(...a)=>{(window as any).opens++;return open(...a);};});
 await page.route('**/audio/phrase-islands/v1/*.mp3',r=>r.fulfill({status:404,body:''}));
 await page.getByRole('button',{name:'Reproducir / repetir',exact:true}).click();await expect(page.locator('.audio-status')).toContainText('Audio no disponible');await page.unroute('**/audio/phrase-islands/v1/*.mp3');
 await page.evaluate(()=>{(window as any).nativePlay=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=()=>Promise.reject(new DOMException('test','NotAllowedError'));});
 await page.getByRole('button',{name:'Reproducir / repetir',exact:true}).click();await expect(page.locator('.audio-status')).toContainText('El navegador ha bloqueado');
 await page.evaluate(()=>{HTMLMediaElement.prototype.play=(window as any).nativePlay;});
 await page.getByRole('button',{name:'Reproducir / repetir',exact:true}).click({clickCount:3});await expect(page.locator('.audio-status')).toHaveText('Reproduciendo');
 expect(await page.evaluate(()=>(window as any).clips.filter((a:HTMLAudioElement)=>!a.paused).length)).toBe(1);
 await page.getByRole('button',{name:'Finalizar',exact:true}).click();
 expect(await page.evaluate(()=>({writes:(window as any).writes,opens:(window as any).opens}))).toEqual({writes:[],opens:0});
});

test('sessions localize prompts and reveal controls in ES EN CA',async({page})=>{
 for(const [lang,prompt,reveal] of [['es','Hoy voy a descansar en casa.','Mostrar respuesta'],['en',"I'm resting at home today.",'Show answer'],['ca','Avui descansaré a casa.','Mostrar resposta']]){
  await page.goto('./#/anki/islands');await page.evaluate(language=>{const key='kana-study.settings.v1';localStorage.setItem(key,JSON.stringify({...JSON.parse(localStorage.getItem(key)!),language}));},lang);
  await page.goto('./#/anki/islands/recall?topics=everyday');await page.reload();
  await expect(page.locator('.prompt')).toHaveText(prompt);await page.getByRole('button',{name:reveal,exact:true}).focus();await page.keyboard.press('Enter');
  await expect(page.locator('ruby').first()).toBeVisible();await expect(page.locator('main')).not.toContainText('phraseIslands.');await noOverflow(page);
 }
});

test('I4.1 focused layouts keep core actions visible with compact optional panels',async({page},info)=>{
 for(const mode of ['listen','shadowing','recall']){
  await page.goto(`./#/anki/islands/${mode}?topics=everyday,conversation`);
  await expect(page.locator('.session-settings')).not.toHaveAttribute('open','');
  await expect(page.locator('.session-header h1')).toBeVisible();
  await expect(page.locator('.progress')).toContainText('1 / '+topicCount('everyday','conversation'));
  await page.locator('.session-back').focus();await expect(page.locator('.session-back')).toBeFocused();
  const focus=await page.locator('.session-back').evaluate(e=>getComputedStyle(e).outlineStyle);expect(focus).toBe('solid');
  if(mode==='recall'){
   await expect(page.locator('[lang=ja],ruby')).toHaveCount(0);
   await expect(page.locator('.reveal')).toBeInViewport();
   await page.screenshot({path:`.cache/phrase-islands-i41/${mode}-before-${info.project.name}.png`,fullPage:true});
   await page.locator('.reveal').focus();await page.keyboard.press('Enter');
   await expect(page.locator('.japanese')).toBeVisible();
   await expect(page.locator('.phrase-details')).not.toHaveAttribute('open','');
  }else{
   await expect(page.locator('.play')).toBeInViewport();
   await page.locator('.meaning-toggle').click();
   await expect(page.locator('.natural')).toBeVisible();
  }
  const contrast=await page.locator('button.primary').first().evaluate(e=>{
   const c=getComputedStyle(e);const lum=(v:string)=>{const x=v.match(/[\d.]+/g)!.slice(0,3).map(Number).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;});return x[0]*.2126+x[1]*.7152+x[2]*.0722;};const a=lum(c.color),b=lum(c.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  });expect(contrast).toBeGreaterThanOrEqual(4.5);
  if(mode==='recall')await expect(page.locator('.grade-actions')).toBeInViewport();
  else await expect(page.locator('.session-navigation .next')).toBeInViewport();
  await noOverflow(page);
  await page.screenshot({path:`.cache/phrase-islands-i41/${mode}-${info.project.name}.png`,fullPage:true});
  await page.locator('.phrase-details summary').focus();await page.keyboard.press('Enter');
  await expect(page.locator('.phrase-details')).toHaveAttribute('open','');
  await expect(page.locator('.phrase-details dd').last()).toBeVisible();await noOverflow(page);
  await page.locator('.session-settings summary').focus();await page.keyboard.press('Enter');await expect(page.getByLabel('Velocidad')).toBeVisible();
  await page.getByLabel('Velocidad').selectOption('0.8');
  await expect(page.locator('.settings-summary')).toContainText('0.8');
 }
});

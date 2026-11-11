import {TestBed} from '@angular/core/testing';
import {CONJUGATION_VERBS} from '../../data/conjugation-verbs';
import {CONJUGATION_CATEGORIES} from '../../data/conjugations';
import {ConjugationSelectionService,CONJUGATION_SELECTION_KEY} from './conjugation-selection.service';
import {ConjugationPracticeService} from './conjugation-practice.service';
import {ConjugationStatsService,CONJUGATION_STATS_KEY,normalizeConjugationStats} from './conjugation-stats.service';
import {WorkspaceService} from './workspace.service';
import {validateConjugationAnswer} from './conjugation-answer-validator';
import {StorageService} from './storage.service';
const newIds=['verb-conditional-tara','verb-conditional-ba','verb-volitional'] as const;
describe('Conjugations C2 explicit answers and manual eligibility',()=>{
 beforeEach(()=>{localStorage.clear();TestBed.configureTestingModule({providers:[ConjugationPracticeService]});});
 afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();});
 const ba='いけば かえれば あれば いえば おもえば かえば つかえば あえば まてば もてば とれば わかれば なれば はいれば すわれば のめば よめば やすめば すめば しねば あそべば よべば かけば きけば はたらけば あるけば およげば はなせば だせば さがせば たべれば みれば いれば おきれば ねれば でれば あければ しめれば つければ かんがえれば わすれれば おぼえれば おしえれば かりれば できれば すれば くれば べんきょうすれば りょうりすれば うんてんすれば'.split(' ');
 const vol='いこう かえろう - いおう おもおう かおう つかおう あおう まとう もとう とろう わかろう なろう はいろう すわろう のもう よもう やすもう すもう しのう あそぼう よぼう かこう きこう はたらこう あるこう およごう はなそう だそう さがそう たべよう みよう いよう おきよう ねよう でよう あけよう しめよう つけよう かんがえよう わすれよう おぼえよう おしえよう かりよう - しよう こよう べんきょうしよう りょうりしよう うんてんしよう'.split(' ');
 for(const [i,v]of CONJUGATION_VERBS.entries())it(v.id+': correct conditional/volitional answers and readings',()=>{
  expect(v.conjugations.conditionalTara!.kana).toEqual(v.conjugations.past.kana.map(x=>x+'ら'));
  expect(v.conjugations.conditionalBa!.kana).toEqual([ba[i]]);
  if(vol[i]==='-')expect(v.conjugations.volitional).toBeUndefined();else expect(v.conjugations.volitional!.kana).toEqual([vol[i]]);
  for(const form of ['conditionalTara','conditionalBa','volitional'] as const){const answers=v.conjugations[form];if(!answers)continue;
   for(const value of [...answers.kana,...answers.kanji,...answers.romaji])expect(validateConjugationAnswer(value,answers)).toBe(true);
   for(const bad of [v.kana,v.kana+(form==='conditionalTara'?'たら':form==='conditionalBa'?'ば':'よう'),answers.kana[0]+'です',v.conjugations.polite!.kana[0]])expect(validateConjugationAnswer(bad,answers)).toBe(false);
  }
 });
 it.each([
  ['suru','したら','すれば','しよう'],['kuru','来たら','来れば','来よう'],['kaku','書いたら','書けば','書こう'],['taberu','食べたら','食べれば','食べよう'],['iku','行ったら','行けば','行こう'],
 ])('%s: accepts required written irregularities', (id,tara,ba,vol)=>{const v=CONJUGATION_VERBS.find(v=>v.id===id)!;for(const [form,value]of [['conditionalTara',tara],['conditionalBa',ba],['volitional',vol]] as const)expect(validateConjugationAnswer(value,v.conjugations[form]!)).toBe(true);});
 it('migrates C1 without granting C2 and preserves selected forms and historical statistics',()=>{
  localStorage.setItem(CONJUGATION_SELECTION_KEY,JSON.stringify({version:2,categoryIds:['verb-te','verb-desire',...newIds],unlockedIds:['verb-te','verb-desire',...newIds]}));
  const counter={attempts:4,correct:3,wrong:1,bestStreak:2};localStorage.setItem(CONJUGATION_STATS_KEY,JSON.stringify({version:1,buckets:{'verb-desire':counter,'verb-te':counter,mixed:counter}}));const raw=localStorage.getItem(CONJUGATION_STATS_KEY);
  const s=TestBed.inject(ConjugationSelectionService);expect(s.ids()).toEqual(['verb-te','verb-desire']);for(const id of newIds)expect(s.isUnlocked(id)).toBe(false);s.setUnlocked('verb-conditional-ba',true);s.setCategory('verb-conditional-ba',true);s.setUnlocked('verb-conditional-ba',false);expect(s.ids()).toEqual(['verb-te','verb-desire']);expect(localStorage.getItem(CONJUGATION_STATS_KEY)).toBe(raw);expect(TestBed.inject(ConjugationStatsService).get('verb-desire')).toEqual(counter);
 });
 for(const id of newIds)it(id+': requires manual unlock, survives reload and A→B→A, and relocks without history loss',()=>{
  let s=TestBed.inject(ConjugationSelectionService),p=TestBed.inject(ConjugationPracticeService);expect(p.start({mode:'single',categoryIds:[id]})).toBe(false);s.setUnlocked(id,true);s.setCategory(id,true);
  const w=TestBed.inject(WorkspaceService);w.activateUser('c2-b');expect(s.isUnlocked(id)).toBe(false);w.activateGuest();expect(s.isUnlocked(id)).toBe(true);expect(p.start({mode:'single',categoryIds:[id]})).toBe(true);p.answer(p.question()!.answers.kana[0]);const raw=localStorage.getItem(CONJUGATION_STATS_KEY);
  TestBed.resetTestingModule();TestBed.configureTestingModule({providers:[ConjugationPracticeService]});s=TestBed.inject(ConjugationSelectionService);p=TestBed.inject(ConjugationPracticeService);expect(s.ids()).toContain(id);s.setUnlocked(id,false);expect(s.ids()).not.toContain(id);expect(p.start({mode:'single',categoryIds:[id]})).toBe(false);expect(localStorage.getItem(CONJUGATION_STATS_KEY)).toBe(raw);
 });
 it('mixes only permitted categories and keeps the four remaining planned categories inaccessible',()=>{
  const s=TestBed.inject(ConjugationSelectionService),p=TestBed.inject(ConjugationPracticeService);for(const id of newIds)s.setUnlocked(id,true);
  expect(p.start({mode:'mixed',categoryIds:['verb-te',...newIds]})).toBe(true);expect(p.session()!.questions).toHaveLength(198);
  const planned=CONJUGATION_CATEGORIES.filter(c=>c.availability==='planned');expect(planned).toHaveLength(0);for(const c of planned){s.setUnlocked(c.id,true);expect(s.intent(c.id)).toBeNull();expect(p.start({mode:'single',categoryIds:[c.id]})).toBe(false);}
 });
 it('does not publish a failed new unlock',()=>{const s=TestBed.inject(ConjugationSelectionService);vi.spyOn(TestBed.inject(StorageService),'set').mockImplementation(()=>{throw Error('quota');});s.setUnlocked('verb-volitional',true);expect(s.isUnlocked('verb-volitional')).toBe(false);expect(s.saveError()).toBe(true);});
});

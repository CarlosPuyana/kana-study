import {TestBed} from '@angular/core/testing';
import {CONJUGATION_VERBS as verbs} from '../../data/conjugation-verbs';
import {CONJUGATION_CATEGORIES} from '../../data/conjugations';
import {ConjugationSelectionService,CONJUGATION_SELECTION_KEY} from './conjugation-selection.service';
import {ConjugationPracticeService} from './conjugation-practice.service';
import {ConjugationStatsService,CONJUGATION_STATS_KEY} from './conjugation-stats.service';
import {WorkspaceService} from './workspace.service';
import {StorageService} from './storage.service';
import {validateConjugationAnswer as accepts} from './conjugation-answer-validator';
const ids=['verb-potential','verb-passive','verb-causative','verb-causative-passive'] as const;
const forms=['potential','passive','causative','causativePassive'] as const;
// Reviewed fixtures include exclusions and the permitted short variant, not runtime rules.
const fixture=`iku いける いかれる いかせる いかせられる いかされる
kaeru かえれる かえられる かえらせる かえらせられる かえらされる
aru - - - - -
iu いえる いわれる いわせる いわせられる いわされる
omou おもえる おもわれる おもわせる おもわせられる おもわされる
kau かえる かわれる かわせる かわせられる かわされる
tsukau つかえる つかわれる つかわせる つかわせられる つかわされる
au あえる あわれる あわせる あわせられる あわされる
matsu まてる またれる またせる またせられる またされる
motsu もてる もたれる もたせる もたせられる もたされる
toru とれる とられる とらせる とらせられる とらされる
wakaru - - わからせる わからせられる わからされる
naru なれる - ならせる ならせられる ならされる
hairu はいれる はいられる はいらせる はいらせられる はいらされる
suwaru すわれる すわられる すわらせる すわらせられる すわらされる
nomu のめる のまれる のませる のませられる のまされる
yomu よめる よまれる よませる よませられる よまされる
yasumu やすめる やすまれる やすませる やすませられる やすまされる
sumu すめる すまれる すませる すませられる すまされる
shinu しねる しなれる しなせる しなせられる しなされる
asobu あそべる あそばれる あそばせる あそばせられる あそばされる
yobu よべる よばれる よばせる よばせられる よばされる
kaku かける かかれる かかせる かかせられる かかされる
kiku きける きかれる きかせる きかせられる きかされる
hataraku はたらける はたらかれる はたらかせる はたらかせられる はたらかされる
aruku あるける あるかれる あるかせる あるかせられる あるかされる
oyogu およげる およがれる およがせる およがせられる およがされる
hanasu はなせる はなされる はなさせる はなさせられる -
dasu だせる だされる ださせる ださせられる -
sagasu さがせる さがされる さがさせる さがさせられる -
taberu たべられる たべられる たべさせる たべさせられる -
miru みられる みられる みさせる みさせられる -
iru いられる - いさせる いさせられる -
okiru おきられる おきられる おきさせる おきさせられる -
neru ねられる ねられる ねさせる ねさせられる -
deru でられる でられる でさせる でさせられる -
akeru あけられる あけられる あけさせる あけさせられる -
shimeru しめられる しめられる しめさせる しめさせられる -
tsukeru つけられる つけられる つけさせる つけさせられる -
kangaeru かんがえられる かんがえられる かんがえさせる かんがえさせられる -
wasureru わすれられる わすれられる わすれさせる わすれさせられる -
oboeru おぼえられる おぼえられる おぼえさせる おぼえさせられる -
oshieru おしえられる おしえられる おしえさせる おしえさせられる -
kariru かりられる かりられる かりさせる かりさせられる -
dekiru - - - - -
suru できる される させる させられる -
kuru こられる こられる こさせる こさせられる -
benkyou-suru べんきょうできる べんきょうされる べんきょうさせる べんきょうさせられる -
ryouri-suru りょうりできる りょうりされる りょうりさせる りょうりさせられる -
unten-suru うんてんできる うんてんされる うんてんさせる うんてんさせられる -`.split('\n').map(row=>row.split(' '));
describe('Conjugations C3: explicit voice forms and permission migration',()=>{
 beforeEach(()=>{localStorage.clear();TestBed.configureTestingModule({providers:[ConjugationPracticeService]});});
 afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();localStorage.clear();});
 for(const [id,...expected]of fixture)it(id+': exact eligible kana, alternatives, all representations and rejected dictionary forms',()=>{
  const verb=verbs.find(v=>v.id===id)!;
  for(const [i,form]of forms.entries()){
   const a=verb.conjugations[form];if(expected[i]==='-'){expect(a).toBeUndefined();continue;}
   expect(a!.kana).toEqual([expected[i],...(i===3&&expected[4]!=='-'?[expected[4]]:[])]);
   for(const group of Object.values(a!))for(const value of group){expect(accepts(value,a!)).toBe(true);expect(accepts(value+'x',a!)).toBe(false);}
   expect(accepts(verb.kana,a!)).toBe(false);expect(accepts(verb.conjugations.polite!.kana[0],a!)).toBe(false);
  }
 });
 it.each([
  ['kaku','書ける','書かれる','書かせる','書かせられる','書かされる'],
  ['nomu','飲める','飲まれる','飲ませる','飲ませられる','飲まされる'],
  ['kau','買える','買われる','買わせる','買わせられる','買わされる'],
  ['taberu','食べられる','食べられる','食べさせる','食べさせられる',''],
  ['hanasu','話せる','話される','話させる','話させられる',''],
  ['suru','できる','される','させる','させられる',''],
  ['kuru','来られる','来られる','来させる','来させられる',''],
  ['benkyou-suru','勉強できる','勉強される','勉強させる','勉強させられる',''],
 ])('%s: verified written reference forms', (id,...expected)=>{const v=verbs.find(v=>v.id===id)!;for(const [i,f]of forms.entries())expect(accepts(expected[i],v.conjugations[f]!)).toBe(true);if(expected[4])expect(accepts(expected[4],v.conjugations.causativePassive!)).toBe(true);});
 it('accepts both long and short godan forms but never short forms for su, ichidan or irregulars',()=>{
  for(const [id,bad]of [['hanasu','はなさされる'],['dasu','ださされる'],['sagasu','さがさされる'],['taberu','たべされる'],['suru','さされる'],['kuru','こされる'],['benkyou-suru','べんきょうさされる']])expect(accepts(bad,verbs.find(v=>v.id===id)!.conjugations.causativePassive!)).toBe(false);
  for(const v of verbs.filter(v=>v.conjugations.causativePassive)){const a=v.conjugations.causativePassive!;expect(a.kana).toHaveLength(v.type==='godan'&&!v.kana.endsWith('す')?2:1);}
 });
 it('distinguishes potential from passive while accepting their real ichidan/kuru homographs',()=>{
  const k=verbs.find(v=>v.id==='kaku')!;expect(accepts('かかれる',k.conjugations.potential!)).toBe(false);expect(accepts('かける',k.conjugations.passive!)).toBe(false);
  for(const id of ['taberu','miru','kuru']){const v=verbs.find(v=>v.id===id)!;expect(v.conjugations.potential).toEqual(v.conjugations.passive);}
  for(const [id,bad]of [['taberu','たべれる'],['miru','みれる'],['kuru','これる']])expect(accepts(bad,verbs.find(v=>v.id===id)!.conjugations.potential!)).toBe(false);
 });
 it('preserves standard readings, romaji and explicit spaced suru aliases',()=>{
  const k=verbs.find(v=>v.id==='kuru')!;expect(k.conjugations.potential!.romaji).toEqual(['korareru']);expect(k.conjugations.passive!.romaji).toEqual(['korareru']);expect(k.conjugations.causative!.romaji).toEqual(['kosaseru']);expect(k.conjugations.causativePassive!.romaji).toEqual(['kosaserareru']);
  expect(verbs.find(v=>v.id==='kaku')!.conjugations.causativePassive!.romaji).toEqual(['kakaserareru','kakasareru']);
  for(const id of ['benkyou-suru','ryouri-suru','unten-suru'])for(const f of forms){const a=verbs.find(v=>v.id===id)!.conjugations[f]!;expect(a.romaji).toHaveLength(2);expect(a.romaji[1].replace(' ','')).toBe(a.romaji[0]);}
 });
 it('uses justified cohorts and keeps only the four remaining categories planned',()=>{
  for(const [i,id]of ids.entries())expect(CONJUGATION_CATEGORIES.find(c=>c.id===id)?.wordCount).toBe([47,45,48,48][i]);
  expect(CONJUGATION_CATEGORIES.filter(c=>c.availability==='planned').map(c=>c.id).sort()).toEqual([]);
 });
 it.each([1,2,3])('migrates v%s without granting C3 or losing earlier permissions, selections or statistics',version=>{
  const earlier=version===1?['verb-te','adjective-i']:version===2?['verb-te','verb-desire']:['verb-te','verb-desire','verb-conditional-ba'];
  localStorage.setItem(CONJUGATION_SELECTION_KEY,JSON.stringify({version,categoryIds:[...earlier,...ids],unlockedIds:[...earlier,...ids]}));
  const counter={attempts:7,correct:5,wrong:2,bestStreak:3,durationSeconds:50,timedAttempts:7};const buckets=Object.fromEntries(CONJUGATION_CATEGORIES.filter(c=>c.availability==='available'&&!ids.includes(c.id as typeof ids[number])).map(c=>[c.id,counter]));localStorage.setItem(CONJUGATION_STATS_KEY,JSON.stringify({version:1,buckets}));const raw=localStorage.getItem(CONJUGATION_STATS_KEY);
  const s=TestBed.inject(ConjugationSelectionService);expect(new Set(s.ids())).toEqual(new Set(earlier.filter(id=>!id.startsWith('adjective-'))));for(const id of ids)expect(s.isUnlocked(id)).toBe(false);
  s.setUnlocked('verb-potential',true);s.setCategory('verb-potential',true);s.setUnlocked('verb-potential',false);expect(new Set(s.ids())).toEqual(new Set(earlier.filter(id=>!id.startsWith('adjective-'))));expect(localStorage.getItem(CONJUGATION_STATS_KEY)).toBe(raw);for(const id of Object.keys(buckets))expect(TestBed.inject(ConjugationStatsService).get(id as 'verb-te')).toEqual(counter);
  expect(JSON.parse(localStorage.getItem(CONJUGATION_SELECTION_KEY)!).version).toBe(6);
 });
 for(const id of ids)it(id+': default lock, reload, workspace isolation, practice, relock and direct intent guard',()=>{
  let s=TestBed.inject(ConjugationSelectionService),p=TestBed.inject(ConjugationPracticeService);expect(s.intent(id)).toBeNull();expect(p.start({mode:'single',categoryIds:[id]})).toBe(false);s.setUnlocked(id,true);s.setCategory(id,true);
  const w=TestBed.inject(WorkspaceService);w.activateUser('c3-b');expect(s.isUnlocked(id)).toBe(false);w.activateGuest();expect(s.isUnlocked(id)).toBe(true);
  TestBed.resetTestingModule();TestBed.configureTestingModule({providers:[ConjugationPracticeService]});s=TestBed.inject(ConjugationSelectionService);p=TestBed.inject(ConjugationPracticeService);expect(s.ids()).toContain(id);expect(p.start({mode:'single',categoryIds:[id]})).toBe(true);p.answer(p.question()!.answers.kana[0]);p.next();const raw=localStorage.getItem(CONJUGATION_STATS_KEY);s.setUnlocked(id,false);expect(s.ids()).not.toContain(id);expect(p.session()).toBeNull();expect(p.answer('obsolete')).toBe(false);expect(p.start({mode:'single',categoryIds:[id]})).toBe(false);expect(localStorage.getItem(CONJUGATION_STATS_KEY)).toBe(raw);
 });
 it('mixes earlier and all new allowed forms, refusing every planned form',()=>{
  const s=TestBed.inject(ConjugationSelectionService),p=TestBed.inject(ConjugationPracticeService);for(const id of ids)s.setUnlocked(id,true);
  expect(p.start({mode:'mixed',categoryIds:['verb-te',...ids]})).toBe(true);expect(p.session()!.questions).toHaveLength(238);expect(new Set(p.session()!.questions.map(q=>q.transformation))).toEqual(new Set(['te',...forms]));
  for(const c of CONJUGATION_CATEGORIES.filter(c=>c.availability==='planned')){s.setUnlocked(c.id,true);expect(s.intent(c.id)).toBeNull();expect(p.start({mode:'mixed',categoryIds:['verb-te',c.id]})).toBe(false);}
 });
 it('does not falsely unlock or lock if persistence fails',()=>{
  const s=TestBed.inject(ConjugationSelectionService);s.setUnlocked('verb-passive',true);s.setCategory('verb-passive',true);const raw=localStorage.getItem(CONJUGATION_SELECTION_KEY);vi.spyOn(TestBed.inject(StorageService),'set').mockImplementation(()=>{throw Error('quota');});s.setUnlocked('verb-passive',false);s.setUnlocked('verb-potential',true);expect(s.isUnlocked('verb-passive')).toBe(true);expect(s.ids()).toContain('verb-passive');expect(s.isUnlocked('verb-potential')).toBe(false);expect(s.saveError()).toBe(true);expect(localStorage.getItem(CONJUGATION_SELECTION_KEY)).toBe(raw);
 });
});

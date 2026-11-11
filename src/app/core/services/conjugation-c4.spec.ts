import {TestBed} from '@angular/core/testing';
import {CONJUGATION_VERBS as verbs} from '../../data/conjugation-verbs';
import {CONJUGATION_COPULAS as copulas} from '../../data/conjugation-copulas';
import {CONJUGATION_CATEGORIES} from '../../data/conjugations';
import {COPULA_TRANSFORMATIONS} from '../models/conjugation-practice.model';
import {ConjugationSelectionService,CONJUGATION_SELECTION_KEY} from './conjugation-selection.service';
import {ConjugationPracticeService} from './conjugation-practice.service';
import {ConjugationStatsService,CONJUGATION_STATS_KEY} from './conjugation-stats.service';
import {WorkspaceService} from './workspace.service';
import {StorageService} from './storage.service';
import {practiceQuestions} from './conjugation-questions';
import {validateConjugationAnswer as accepts} from './conjugation-answer-validator';
import {conjugationKanaInput,conjugationAnswerInput} from '../../features/conjugations/conjugation-kana-input';
import * as copy from '../../../assets/i18n/conjugations.generated';
const ids=['verb-imperative','verb-prohibitive','copula-plain','copula-polite'] as const;
const sheet=`iku いけ いくな
kaeru かえれ かえるな
aru - -
iu いえ いうな
omou おもえ おもうな
kau かえ かうな
tsukau つかえ つかうな
au あえ あうな
matsu まて まつな
motsu もて もつな
toru とれ とるな
wakaru - -
naru なれ なるな
hairu はいれ はいるな
suwaru すわれ すわるな
nomu のめ のむな
yomu よめ よむな
yasumu やすめ やすむな
sumu すめ すむな
shinu しね しぬな
asobu あそべ あそぶな
yobu よべ よぶな
kaku かけ かくな
kiku きけ きくな
hataraku はたらけ はたらくな
aruku あるけ あるくな
oyogu およげ およぐな
hanasu はなせ はなすな
dasu だせ だすな
sagasu さがせ さがすな
taberu たべろ,たべよ たべるな
miru みろ,みよ みるな
iru いろ,いよ いるな
okiru おきろ,おきよ おきるな
neru ねろ,ねよ ねるな
deru でろ,でよ でるな
akeru あけろ,あけよ あけるな
shimeru しめろ,しめよ しめるな
tsukeru つけろ,つけよ つけるな
kangaeru かんがえろ,かんがえよ かんがえるな
wasureru わすれろ,わすれよ わすれるな
oboeru おぼえろ,おぼえよ おぼえるな
oshieru おしえろ,おしえよ おしえるな
kariru かりろ,かりよ かりるな
dekiru - -
suru しろ,せよ するな
kuru こい くるな
benkyou-suru べんきょうしろ,べんきょうせよ べんきょうするな
ryouri-suru りょうりしろ,りょうりせよ りょうりするな
unten-suru うんてんしろ,うんてんせよ うんてんするな`.split('\n').map(row=>row.split(' '));
describe('C4 direct commands, prohibitions and complete copula predicates',()=>{
 beforeEach(()=>{localStorage.clear();TestBed.configureTestingModule({providers:[ConjugationPracticeService]});});
 afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();localStorage.clear();});
 for(const [id,imperative,prohibitive]of sheet)it(id+': eligibility, explicit variants and distinction from negative',()=>{
  const v=verbs.find(v=>v.id===id)!;
  for(const [form,expected]of [['imperative',imperative],['prohibitive',prohibitive]] as const){const a=v.conjugations[form];if(expected==='-'){expect(a).toBeUndefined();continue;}expect(a!.kana).toEqual(expected.split(','));
   for(const group of Object.values(a!))for(const answer of group){expect(accepts(answer,a!)).toBe(true);expect(accepts(answer+'です',a!)).toBe(false);}
   for(const wrong of [v.kana,...v.conjugations.negative.kana,...v.conjugations.polite!.kana,...(v.conjugations.volitional?.kana??[])])expect(accepts(wrong,a!)).toBe(false);
   for(const romaji of a!.romaji){let text='';for(const letter of romaji)text=conjugationAnswerInput(text+letter,a).value;expect(accepts(conjugationAnswerInput(text,a,true).value,a!)).toBe(true);}
  }
 });
 it.each([['kaku',['書け'],['書くな']],['taberu',['食べろ','食べよ'],['食べるな']],['suru',['しろ','せよ'],['するな']],['kuru',['来い'],['来るな']],['iku',['行け'],['行くな']],['benkyou-suru',['勉強しろ','勉強せよ'],['勉強するな']]])('%s: reference orthographies and alternatives',(id,commands,prohibitions)=>{const v=verbs.find(v=>v.id===id)!;for(const s of commands)expect(accepts(s,v.conjugations.imperative!)).toBe(true);for(const s of prohibitions)expect(accepts(s,v.conjugations.prohibitive!)).toBe(true);});
 it('keeps kuru readings and rejects false imperative forms and the wrong na construction',()=>{
  const v=verbs.find(v=>v.id==='kuru')!;expect(v.conjugations.imperative!.kana).toEqual(['こい']);expect(v.conjugations.prohibitive!.kana).toEqual(['くるな']);expect(v.conjugations.imperative!.romaji).toEqual(['koi']);expect(v.conjugations.prohibitive!.romaji).toEqual(['kuruna']);
  for(const [id,wrong]of [['kuru','きろ'],['suru','すれ'],['taberu','たべるろ'],['kaku','かくなさい']])expect(accepts(wrong,verbs.find(v=>v.id===id)!.conjugations.imperative!)).toBe(false);
 });
 for(const c of copulas)for(const register of ['plain','polite'] as const)it(c.id+' / '+register+': four complete expressions, readings, romaji, register and wrong forms',()=>{
  const forms=c.registers[register].conjugations;
  expect(Object.keys(forms)).toEqual([...COPULA_TRANSFORMATIONS]);
  for(const form of COPULA_TRANSFORMATIONS){const a=forms[form];for(const group of Object.values(a))for(const value of group){expect(accepts(value,a)).toBe(true);expect(accepts(value+'な',a)).toBe(false);}
   a.romaji.forEach((roman,i)=>{expect(conjugationKanaInput(roman,true).value.replace('でわ','では')).toBe(a.kana[i]);let text='';for(const letter of roman)text=conjugationAnswerInput(text+letter,a).value;expect(accepts(conjugationAnswerInput(text,a,true).value,a),roman).toBe(true);});
   const opposite=c.registers[register==='plain'?'polite':'plain'].conjugations[form];for(const value of opposite.kana)expect(accepts(value,a)).toBe(false);
   for(const wrong of ['だ','です','だった','でした','学生なだ','学生ます','静かなでした'])expect(accepts(wrong,a)).toBe(false);
  }
  const questions=practiceQuestions({mode:'single',categoryIds:[register==='plain'?'copula-plain':'copula-polite']},()=>.4).filter(q=>q.word.id===c.id);
  expect(questions).toHaveLength(4);for(const q of questions){expect(q.register).toBe(register);expect(q.word.type).toBe(c.type);expect(q.word.japanese).toBe(c.registers[q.transformation==='affirmative'?(register==='plain'?'polite':'plain'):register].japanese);expect(q.answers).toBe(forms[q.transformation as typeof COPULA_TRANSFORMATIONS[number]]);}
 });
 it('verifies the requested nominal and na-adjective examples, preserving register alternatives',()=>{
  const s=copulas.find(c=>c.id==='gakusei')!,sh=copulas.find(c=>c.id==='shizuka')!;
  expect(s.registers.plain.japanese).toBe('学生だ');expect(s.registers.polite.japanese).toBe('学生です');
  for(const value of ['学生じゃない','学生ではない'])expect(accepts(value,s.registers.plain.conjugations.negative)).toBe(true);
  expect(accepts('学生だった',s.registers.plain.conjugations.past)).toBe(true);expect(accepts('学生でした',s.registers.polite.conjugations.past)).toBe(true);expect(accepts('学生ではありません',s.registers.polite.conjugations.negative)).toBe(true);expect(accepts('学生ではありませんでした',s.registers.polite.conjugations.negativePast)).toBe(true);
  expect(accepts('静かだった',sh.registers.plain.conjugations.past)).toBe(true);expect(accepts('静かでした',sh.registers.polite.conjugations.past)).toBe(true);
  expect(copulas.filter(c=>c.type==='noun')).toHaveLength(3);expect(copulas.filter(c=>c.type==='na-predicate')).toHaveLength(10);expect(copulas.some(c=>['ii','yasui','takai'].includes(c.id))).toBe(false);
 });
 it.each([1,2,3,4,5])('v%s cannot grant C4; old selections, locks, adjective types and statistics survive',version=>{
  const earlier=version===1?['verb-te']:version===2?['verb-te','verb-desire']:version===3?['verb-conditional-ba']:version===4?['verb-potential']:['verb-potential','adjective-past'];
  localStorage.setItem(CONJUGATION_SELECTION_KEY,JSON.stringify({version,categoryIds:[...earlier,...ids],unlockedIds:[...earlier,...ids],adjectiveTypes:{'adjective-past':'na'},autoKana:false}));const old={attempts:9,correct:6,wrong:3,bestStreak:2,durationSeconds:20,timedAttempts:2};const raw=JSON.stringify({version:1,buckets:{'adjective-i':old,'adjective-past':old,'verb-potential':old,mixed:old}});localStorage.setItem(CONJUGATION_STATS_KEY,raw);
  const s=TestBed.inject(ConjugationSelectionService),p=TestBed.inject(ConjugationPracticeService);expect(new Set(s.ids())).toEqual(new Set(earlier));for(const id of ids){expect(s.isUnlocked(id)).toBe(false);expect(s.intent(id)).toBeNull();expect(p.start({mode:'single',categoryIds:[id]})).toBe(false);}if(version===5){expect(s.autoKana()).toBe(false);expect(s.adjectiveTypes()['adjective-past']).toBe('na');}
  s.setUnlocked('copula-plain',true);s.setCategory('copula-plain',true);s.setUnlocked('copula-plain',false);expect(new Set(s.ids())).toEqual(new Set(earlier));expect(localStorage.getItem(CONJUGATION_STATS_KEY)).toBe(raw);expect(TestBed.inject(ConjugationStatsService).get('adjective-i')).toEqual(old);expect(JSON.parse(localStorage.getItem(CONJUGATION_SELECTION_KEY)!).version).toBe(6);
 });
 for(const id of ids)it(id+': manual unlock, workspace isolation, reload, correction, statistics and relock',()=>{
  let s=TestBed.inject(ConjugationSelectionService),p=TestBed.inject(ConjugationPracticeService);expect(p.start({mode:'single',categoryIds:[id]})).toBe(false);s.setUnlocked(id,true);s.setCategory(id,true);const w=TestBed.inject(WorkspaceService);w.activateUser('synthetic-c4-b');expect(s.isUnlocked(id)).toBe(false);w.activateGuest();expect(s.isUnlocked(id)).toBe(true);
  TestBed.resetTestingModule();TestBed.configureTestingModule({providers:[ConjugationPracticeService]});s=TestBed.inject(ConjugationSelectionService);p=TestBed.inject(ConjugationPracticeService);expect(s.ids()).toContain(id);expect(p.start(s.intent(id)!)).toBe(true);expect(p.session()!.questions).toHaveLength(id.startsWith('verb-')?47:52);expect(p.answer(p.question()!.answers.kana[0])).toBe(true);expect(p.answer(p.question()!.answers.kana[0])).toBe(false);expect(p.stats.get(id).attempts).toBe(1);p.next();p.answer('incorrect');expect(p.stats.get(id).wrong).toBe(1);const raw=localStorage.getItem(CONJUGATION_STATS_KEY);s.setUnlocked(id,false);expect(s.ids()).not.toContain(id);expect(p.session()).toBeNull();expect(p.answer('obsolete')).toBe(false);expect(p.start({mode:'single',categoryIds:[id]})).toBe(false);expect(localStorage.getItem(CONJUGATION_STATS_KEY)).toBe(raw);
 });
 it('mixes all families without duplicating cards or enabling locked forms',()=>{
  const s=TestBed.inject(ConjugationSelectionService),p=TestBed.inject(ConjugationPracticeService);expect(p.start({mode:'mixed',categoryIds:['verb-te',...ids]})).toBe(false);for(const id of ids)s.setUnlocked(id,true);expect(p.start({mode:'mixed',categoryIds:['adjective-past',...ids],adjectiveTypes:{'adjective-past':'na'}})).toBe(true);expect(p.session()!.questions).toHaveLength(208);expect(new Set(p.session()!.questions.map(q=>q.id)).size).toBe(208);
  expect(CONJUGATION_CATEGORIES).toHaveLength(23);expect(CONJUGATION_CATEGORIES.every(c=>c.availability==='available')).toBe(true);expect(practiceQuestions({mode:'single',categoryIds:['adjective-i']})).toEqual([]);
 });
 it('does not publish failed unlocks/relocks or lose earlier selections',()=>{
  const s=TestBed.inject(ConjugationSelectionService);s.setCategory('adjective-past',true);s.setUnlocked('copula-plain',true);s.setCategory('copula-plain',true);const raw=localStorage.getItem(CONJUGATION_SELECTION_KEY);vi.spyOn(TestBed.inject(StorageService),'set').mockImplementation(()=>{throw Error('quota');});s.setUnlocked('copula-plain',false);s.setUnlocked('verb-imperative',true);expect(s.isUnlocked('copula-plain')).toBe(true);expect(s.isUnlocked('verb-imperative')).toBe(false);expect(s.saveError()).toBe(true);expect(localStorage.getItem(CONJUGATION_SELECTION_KEY)).toBe(raw);
 });
 for(const lang of ['es','en','ca'] as const)it(lang+': complete feedback, register and meaning keys for all new questions',()=>{
  for(const id of ids)for(const q of practiceQuestions({mode:'single',categoryIds:[id]})){const family=q.register?'copula-'+q.register:'verb',result=q.register?'copula':'verb';for(const key of [q.word.meaningKey,'conjugations.transform.'+q.transformation,'conjugations.rule.'+family+'.'+q.transformation,'conjugations.result.'+result+'.'+q.transformation])expect(copy[lang][key],key).toBeTruthy();}
  expect(copy[lang]['conjugations.rule.verb.imperativeNote']).toBeTruthy();expect(copy[lang]['conjugations.rule.copula-polite.note']).toBeTruthy();
 });
});

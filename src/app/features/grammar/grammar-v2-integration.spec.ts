import {By} from '@angular/platform-browser';
import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {RouterTestingHarness} from '@angular/router/testing';
import {GRAMMAR_V2_CONCEPTS,GRAMMAR_V2_REVIEW,GRAMMAR_V2_INTEGRATION} from '../../data/grammar/grammar-n5-v2.generated';
import {GRAMMAR_PROGRESS_V2_KEY} from '../../core/models/grammar-v2.model';
import {GrammarV2ProgressService} from '../../core/services/grammar-v2-progress.service';
import {GrammarProgressService} from '../../core/services/grammar-progress.service';
import {StorageService} from '../../core/services/storage.service';
import {WorkspaceService} from '../../core/services/workspace.service';
import {SyncOutboxService} from '../../core/services/sync-outbox.service';
import {TranslationService} from '../../core/services/translation.service';
import {WeaknessService} from '../../core/services/weakness.service';
import {GrammarIntegrationComponent} from './components/grammar-integration';
import {GrammarPage} from './pages/grammar.page';
import {GRAMMAR_ROUTES} from './grammar.routes';
import {GRAMMAR_LESSONS,GRAMMAR_SESSIONS,GRAMMAR_TOPICS} from './data/grammar-catalog';
import {grammarTopicExercises} from './services/grammar-interactive-catalog';
import {grammarWeaknessIdentity} from './services/grammar-weakness';
import {isChoiceExercise,isGrammarAnswerCorrect} from './services/grammar-exercise-answer';
import es from '../../../assets/i18n/es.json';
import en from '../../../assets/i18n/en.json';
import ca from '../../../assets/i18n/ca.json';
const sections=GRAMMAR_V2_INTEGRATION,all=sections.flatMap(s=>s.exercises),core=sections.filter(s=>s.track==='core');
const t=(key:string,params?:Record<string,string|number>)=>Object.entries(params??{}).reduce((text,[k,v])=>text.replaceAll('{{'+k+'}}',String(v)),(es as Record<string,string>)[key]??key);

describe('N5 integration canonical activities and pedagogy',()=>{
  it('adds zero concepts or semantic sessions and has six Core blocks, a final challenge and an optional extension',()=>{
    expect(GRAMMAR_V2_CONCEPTS).toHaveLength(97);expect(GRAMMAR_V2_CONCEPTS.filter(c=>c.track==='core')).toHaveLength(94);
    expect(GRAMMAR_V2_CONCEPTS.some(c=>Number(c.topicId)>=11)).toBe(false);
    expect(GRAMMAR_LESSONS).toHaveLength(97);expect(GRAMMAR_SESSIONS).toHaveLength(97);expect(GRAMMAR_TOPICS.find(t=>t.id==='11')!.lessons).toEqual([]);
    expect(sections.map(s=>s.id)).toEqual(['01','02','03','04','05','06','07','bridge']);expect(sections.map(s=>s.exercises.length)).toEqual([10,8,8,8,8,8,24,9]);
    expect(new Set(all.map(e=>e.id)).size).toBe(83);
  });
  it('attributes each question to exactly one existing primary concept, keeping the three Bridge exclusively optional',()=>{
    for(const section of sections)for(const e of section.exercises){
      const concept=GRAMMAR_V2_CONCEPTS.find(c=>c.id===e.conceptId);expect(concept,e.id).toBeDefined();expect(concept!.track,e.id).toBe(section.track);
      expect(e.conceptId).not.toMatch(/^(integration|mixed-|review-|reading|final-)/);
      expect(grammarWeaknessIdentity(e)).toEqual({itemId:concept!.id,questionType:e.kind});
    }
    expect(sections.at(-1)!.exercises.map(e=>e.conceptId)).toEqual(['obligation-colloquial','obligation-colloquial','obligation-colloquial','tsumori','tsumori','tsumori','sugiru','sugiru','sugiru']);
    expect(core[0].exercises.map(e=>e.conceptId)).toEqual(['particle-ni-destination','particle-de-action-location','location-ni-vs-de','particle-wa-vs-ga','particle-wo-object','particle-he-direction','particle-to-companion','particle-kara-made','particle-no-noun-link','ya-open-list']);
    expect(core[1].exercises.map(e=>e.conceptId)).toEqual(['plain-vs-polite','te-form-formation','mae-ni','experience-ta-koto-ga-aru','ato-de','tai','obligation-standard','te-form-formation']);
    expect(core[2].exercises.map(e=>e.conceptId)).toEqual(['relative-clause-noun','nominalizer-no','node-reason','ga-kedo-contrast','te-action-sequence','te-kara','ato-de','tari-tari']);
  });
  it('keeps the original lesson/review exercises and topic-specific rounds separate from integration',()=>{
    expect(GRAMMAR_V2_CONCEPTS.flatMap(c=>c.exercises)).toHaveLength(483);expect(GRAMMAR_V2_REVIEW).toHaveLength(168);
    for(const c of GRAMMAR_V2_CONCEPTS)expect(grammarTopicExercises(c.topicId,c.id).some(e=>e.id.startsWith('n5-integration-'))).toBe(false);
  });
  it('mixes all seven formats in the final and attributes the two mini-texts to each question, without disclosing the tested topic',()=>{
    const final=sections.find(s=>s.id==='07')!.exercises;
    expect(new Set(final.map(e=>e.kind))).toEqual(new Set(['multiple-choice','fill-gap','sentence-order','sentence-builder','matching','select-segment','detect-error']));
    const contexts=[...new Set(final.map(e=>e.contextKey).filter(Boolean))];expect(contexts).toHaveLength(2);
    expect(final.filter(e=>e.contextKey===contexts[0]).map(e=>e.conceptId)).toEqual(['node-reason','tari-tari','mada-te-inai']);
    expect(final.filter(e=>e.contextKey===contexts[1]).map(e=>e.conceptId)).toEqual(['particle-kara-made','te-wa-ikenai']);
    expect(final.every(e=>e.topicKey==='grammar.v2.integration.title')).toBe(true);
  });
  it('uses strict malformed-Japanese detection and preserves functional alternatives as valid',()=>{
    const detected=all.filter(isChoiceExercise).filter(e=>e.kind==='detect-error');
    expect(detected.map(e=>t(e.optionKeys[e.answer]))).toEqual(['飲みてから寝る。','高いでした。','静かだので、勉強する。','学生だでしょう。','食べるすぎる。']);
    for(const e of detected){expect(e.options!.filter(o=>o.grammarStatus==='invalid')).toHaveLength(1);expect(e.options![e.answer].grammarStatus).toBe('invalid');}
    for(const e of all.filter(isChoiceExercise).filter(e=>e.kind!=='detect-error'))expect(e.options!.every(o=>o.grammarStatus==='valid')).toBe(true);
  });
  it('preserves all required contextual contrasts without adding grammar or favours',()=>{
    const text=all.map(e=>t(e.promptKey)+' '+(e.kind==='matching'?e.pairs.map(p=>t(p.leftKey)+' '+t(p.rightKey)).join(' '):isChoiceExercise(e)?e.optionKeys.map(key=>t(key)).join(' '):e.kind==='sentence-order'||e.kind==='sentence-builder'?e.tokenKeys.map(key=>t(key)).join(' '):'')).join(' ');
    for(const form of ['机の上に本がある','机の上で本を読む','誰が学生ですか','食べませんでした','食べて、勉強する','食べてから、勉強する','食べた後で、勉強する','食べたり、勉強したりする','写真を撮ってください','写真を撮らないでください','写真を撮ってもいいです','写真を撮ってはいけません','薬を飲んだほうがいい','薬を飲まなくてはいけない','今、本を読んでいる','大阪に住んでいる','もう食べた','まだ本を読んでいる','まだ本を読んでいない','去年、日本に行った','日本に行ったことがある','バスより電車のほうが速い','果物の中で','先生になる','コーヒーにする','私は友達に本をあげた','友達が私に本をくれた','私は友達から本をもらった'])expect(text,form).toContain(form);
    expect(text).not.toMatch(/てあげる|てくれる|てもらう|かもしれない|てしまう|ておく|てみる/);
  });
  it('has correct answers, specific option feedback, full ES/EN/CA and safe deterministic kana banks',()=>{
    const keys=new Set<string>();const visit=(v:unknown):void=>{if(typeof v==='string'&&v.startsWith('grammar.'))keys.add(v);else if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')Object.values(v).forEach(visit);};visit(sections);
    for(const key of keys)for(const dict of [es,en,ca])expect((dict as Record<string,string>)[key],key).toBeTruthy();
    for(const e of all){
      expect(isGrammarAnswerCorrect(e,{selected:isChoiceExercise(e)?e.answer:null,text:e.kind==='fill-gap'?e.acceptedAnswers[0]:'',sequence:e.kind==='sentence-order'||e.kind==='sentence-builder'?e.solution:[],matches:e.kind==='matching'?Object.fromEntries(e.pairs.map((_,i)=>[i,i])):{}}),e.id).toBe(true);
      if(isChoiceExercise(e))expect(e.options!.every(o=>t(o.feedbackKey).length>12)).toBe(true);
      if(e.kind==='fill-gap'){const chars=new Set(e.acceptedAnswers.join(''));expect(e.kanaBank!.length).toBeGreaterThanOrEqual(6);expect(e.kanaBank!.filter(c=>!chars.has(c)).length).toBeGreaterThanOrEqual(2);expect(new Set(e.kanaBank).size).toBe(e.kanaBank!.length);}
    }
  });
});

describe('N5 integration progress, routing and sync',()=>{
  let progress:GrammarV2ProgressService;
  const setup=()=>TestBed.configureTestingModule({providers:[provideRouter([{path:'grammar',children:GRAMMAR_ROUTES}]),{provide:TranslationService,useValue:{t,language:()=> 'es'}},{provide:SyncOutboxService,useValue:{enqueue:vi.fn().mockResolvedValue(undefined)}}]});
  beforeEach(()=>{localStorage.clear();vi.spyOn(window,'scrollTo').mockImplementation(()=>{});setup();progress=TestBed.inject(GrammarV2ProgressService);TestBed.tick();});
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();});
  const solveCore=()=>{for(const section of core){progress.openIntegration(section.id);for(const e of section.exercises)progress.recordIntegration(section.id,e.id,true);}};
  it('requires introduction plus all 74 correct answers; fail→correct completes and never creates semantic progress',()=>{
    solveCore();expect(progress.integrationCompleted()).toBe(false);progress.openIntegration('00');expect(progress.integrationCompleted()).toBe(true);
    expect(progress.state().concepts).toEqual({});expect(progress.state().integration!.activities['bridge']).toBeUndefined();
    const e=core[0].exercises[0];progress.recordIntegration('01',e.id,false);expect(progress.integrationCompleted()).toBe(true);expect(progress.state().review[e.conceptId!].active).toBe(true);
    localStorage.clear();TestBed.resetTestingModule();setup();progress=TestBed.inject(GrammarV2ProgressService);TestBed.tick();progress.openIntegration('00');solveCore();
    const raw=structuredClone(progress.state());delete raw.integration!.activities['01'].answers[e.id];TestBed.inject(StorageService).setFromCloud(GRAMMAR_PROGRESS_V2_KEY,raw);TestBed.tick();
    progress.recordIntegration('01',e.id,false);expect(progress.integrationCompleted()).toBe(false);progress.recordIntegration('01',e.id,true);expect(progress.integrationCompleted()).toBe(true);
  });
  it('retains completion across reload, remote updates and guest/account switching without trusting forged solved flags',()=>{
    progress.openIntegration('00');solveCore();const raw=structuredClone(progress.state());
    TestBed.resetTestingModule();setup();progress=TestBed.inject(GrammarV2ProgressService);TestBed.tick();expect(progress.integrationCompleted()).toBe(true);
    const workspace=TestBed.inject(WorkspaceService);workspace.activateUser('integration-user');TestBed.tick();expect(progress.integrationCompleted()).toBe(false);
    TestBed.inject(StorageService).setFromCloud(GRAMMAR_PROGRESS_V2_KEY,raw);TestBed.tick();expect(progress.integrationCompleted()).toBe(true);
    const answer=Object.values(raw.integration!.activities['01'].answers)[0];answer.correctCount=0;answer.solved=true;
    TestBed.inject(StorageService).setFromCloud(GRAMMAR_PROGRESS_V2_KEY,raw);TestBed.tick();expect(progress.integrationCompleted()).toBe(false);
    workspace.activateGuest();TestBed.tick();expect(progress.integrationCompleted()).toBe(true);
  });
  it('allows N5 Core completion without any of the three Bridge or optional integration exercises',()=>{
    for(const c of GRAMMAR_V2_CONCEPTS.filter(c=>c.track==='core')){progress.open(c.id);c.exercises.forEach((e,i)=>progress.record(c.id,e.id,i,true));}
    const shared=TestBed.inject(GrammarProgressService);expect(shared.completedSessions()).toBe(94);expect(progress.coreCompleted()).toBe(false);expect(shared.continuePath()).toBe('/grammar/n5/11/00');
    progress.openIntegration('00');solveCore();expect(progress.coreCompleted()).toBe(true);expect(shared.continuePath()).toBe('/grammar/review');
    for(const id of ['obligation-colloquial','tsumori','sugiru'])expect(progress.state().concepts[id]).toBeUndefined();
    expect(progress.integrationStatus('bridge')).toBe('not-started');expect(shared.topicProgress('11')).toEqual({completed:8,total:8});
  });
  it('renders introduction and all activities, sends failures to the real Weakness and retries only pending answers',async()=>{
    const harness=await RouterTestingHarness.create();await harness.navigateByUrl('/grammar/n5/11',GrammarPage);
    expect(harness.routeNativeElement!.querySelectorAll('app-grammar-integration nav a')).toHaveLength(9);
    await harness.navigateByUrl('/grammar/n5/11/00',GrammarPage);expect(progress.integrationStatus('00')).toBe('completed');expect(harness.routeNativeElement!.textContent).toContain(t('grammar.v2.integration.method'));
    await harness.navigateByUrl('/grammar/n5/11/01',GrammarPage);
    const component=harness.fixture.debugElement.query(By.directive(GrammarIntegrationComponent)).componentInstance as GrammarIntegrationComponent;
    component.start();const first=component.session.current()!;component.answer(false);component.answer(false);component.session.next();
    while(component.session.stage()==='question'){component.answer(true);component.session.next();}
    const weak=TestBed.inject(WeaknessService).records().find(r=>r.itemId===first.conceptId&&r.questionType===first.kind)!;expect(weak.failures).toBe(1);
    expect(progress.integrationStatus('01')).toBe('in-progress');component.start(true);expect(component.session.total()).toBe(1);expect(component.session.current()!.id).toBe(first.id);component.answer(true);component.session.next();expect(progress.integrationStatus('01')).toBe('completed');
  });
  it('renders the challenge without topic hints and routes the old practice link to it',async()=>{
    const harness=await RouterTestingHarness.create();await harness.navigateByUrl('/grammar/n5/11/practice',GrammarPage);
    expect(harness.routeNativeElement!.textContent).toContain(t('grammar.v2.integration.final'));
    const component=harness.fixture.debugElement.query(By.directive(GrammarIntegrationComponent)).componentInstance as GrammarIntegrationComponent;
    component.start();harness.detectChanges();expect(harness.routeNativeElement!.querySelector('.practice-topic')!.textContent).toBe(t('grammar.v2.integration.title'));
  });
});

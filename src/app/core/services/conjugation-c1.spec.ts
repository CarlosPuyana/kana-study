import {TestBed} from '@angular/core/testing';
import {ConjugationSelectionService,CONJUGATION_SELECTION_KEY} from './conjugation-selection.service';
import {ConjugationPracticeService} from './conjugation-practice.service';
import {ConjugationStatsService,CONJUGATION_STATS_KEY} from './conjugation-stats.service';
import {WorkspaceService} from './workspace.service';
import {StorageService} from './storage.service';
import {CONJUGATION_CATEGORIES} from '../../data/conjugations';
import {CONJUGATION_VERBS} from '../../data/conjugation-verbs';
import {validateConjugationAnswer} from './conjugation-answer-validator';

describe('Conjugations C1 permissions and explicit forms',()=>{
  beforeEach(()=>{localStorage.clear();TestBed.configureTestingModule({providers:[ConjugationPracticeService]});});
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();});
  it('migrates old selection without granting any new or planned category',()=>{
    localStorage.setItem(CONJUGATION_SELECTION_KEY,JSON.stringify({version:1,categoryIds:['verb-te','verb-continuous','verb-potential']}));
    const s=TestBed.inject(ConjugationSelectionService);expect(s.ids()).toEqual(['verb-te']);expect(s.availableCount()).toBe(9);expect(s.intent('verb-continuous')).toBeNull();
    s.setUnlocked('verb-continuous',true);expect(s.isUnlocked('verb-continuous')).toBe(true);expect(s.ids()).toEqual(['verb-te']);
    s.setCategory('verb-continuous',true);expect(s.ids()).toEqual(['verb-te','verb-continuous']);
    TestBed.resetTestingModule();expect(TestBed.inject(ConjugationSelectionService).ids()).toEqual(['verb-te','verb-continuous']);
  });
  it('isolates manual locks across A→B→A without intermediate reads',()=>{
    const s=TestBed.inject(ConjugationSelectionService),w=TestBed.inject(WorkspaceService);w.activateUser('c1-a');s.setUnlocked('verb-desire',true);s.setCategory('verb-desire',true);
    w.activateUser('c1-b');expect(s.isUnlocked('verb-desire')).toBe(false);s.setUnlocked('verb-polite',true);w.activateUser('c1-a');expect(s.ids()).toEqual(['verb-desire']);w.activateUser('c1-b');w.activateUser('c1-a');expect(s.isUnlocked('verb-polite')).toBe(false);expect(s.isUnlocked('verb-desire')).toBe(true);
  });
  it('never enables a planned category even with crafted stored preferences',()=>{
    const ids=CONJUGATION_CATEGORIES.filter(c=>c.availability==='planned').map(c=>c.id);localStorage.setItem(CONJUGATION_SELECTION_KEY,JSON.stringify({version:2,categoryIds:ids,unlockedIds:ids}));
    const s=TestBed.inject(ConjugationSelectionService),p=TestBed.inject(ConjugationPracticeService);for(const id of ids){s.setUnlocked(id,true);expect(s.isUnlocked(id)).toBe(false);expect(s.intent(id)).toBeNull();expect(p.start({mode:'single',categoryIds:[id]})).toBe(false);}expect(s.ids()).toEqual([]);
  });
  it('checks direct and mixed requests independently of the visual lock',()=>{
    const s=TestBed.inject(ConjugationSelectionService),p=TestBed.inject(ConjugationPracticeService);
    expect(p.start({mode:'single',categoryIds:['verb-polite']})).toBe(false);expect(p.start({mode:'mixed',categoryIds:['verb-te','verb-polite']})).toBe(false);
    s.setUnlocked('verb-polite',true);expect(p.start({mode:'mixed',categoryIds:['verb-te','verb-polite']})).toBe(true);expect(p.session()!.questions).toHaveLength(100);s.setUnlocked('verb-polite',false);expect(p.question()).toBeNull();expect(p.answer('anything')).toBe(false);expect(p.session()).toBeNull();
  });
  it('locking drops selection but preserves every historical counter',()=>{
    const s=TestBed.inject(ConjugationSelectionService),stats=TestBed.inject(ConjugationStatsService);s.setUnlocked('verb-desire',true);s.setCategory('verb-desire',true);stats.record('verb-desire',true,1,3);
    const before=localStorage.getItem(CONJUGATION_STATS_KEY);s.setUnlocked('verb-desire',false);expect(s.ids()).toEqual([]);expect(localStorage.getItem(CONJUGATION_STATS_KEY)).toBe(before);s.setUnlocked('verb-desire',true);expect(stats.get('verb-desire').attempts).toBe(1);
  });
  it('does not publish a failed unlock or failed relock',()=>{
    const s=TestBed.inject(ConjugationSelectionService),storage=TestBed.inject(StorageService);const fail=vi.spyOn(storage,'set').mockImplementation(()=>{throw Error('quota');});s.setUnlocked('verb-polite',true);expect(s.isUnlocked('verb-polite')).toBe(false);expect(s.saveError()).toBe(true);fail.mockRestore();s.setUnlocked('verb-polite',true);
    vi.spyOn(storage,'set').mockImplementation(()=>{throw Error('quota');});s.setUnlocked('verb-polite',false);expect(s.isUnlocked('verb-polite')).toBe(true);expect(s.saveError()).toBe(true);
  });
  it('fails closed on denied or malformed preferences without replacing them',()=>{
    localStorage.setItem(CONJUGATION_SELECTION_KEY,'{broken');const s=TestBed.inject(ConjugationSelectionService);expect(s.availableCount()).toBe(0);s.setUnlocked('verb-polite',true);expect(s.saveError()).toBe(true);expect(localStorage.getItem(CONJUGATION_SELECTION_KEY)).toBe('{broken');
  });
  const stems='いき かえり あり いい おもい かい つかい あい まち もち とり わかり なり はいり すわり のみ よみ やすみ すみ しに あそび よび かき きき はたらき あるき およぎ はなし だし さがし たべ み い おき ね で あけ しめ つけ かんがえ わすれ おぼえ おしえ かり でき し き べんきょうし りょうりし うんてんし'.split(' ');
  for(const [i,v]of CONJUGATION_VERBS.entries())it(v.id+': correct ます stem, desire and continuous; rejects dictionary concatenation',()=>{
    const polite=v.conjugations.polite!,desire=v.conjugations.desire;expect(polite.kana).toEqual([stems[i]+'ます']);if(['aru','dekiru'].includes(v.id))expect(desire).toBeUndefined();else expect(desire!.kana).toEqual([stems[i]+'たい']);
    for(const [answers,suffix]of [[polite,'ます'],[desire,'たい']] as const){if(!answers)continue;for(const value of [...answers.kana,...answers.kanji,...answers.romaji])expect(validateConjugationAnswer(value,answers)).toBe(true);expect(validateConjugationAnswer(v.kana+suffix,answers)).toBe(false);}
    const continuous=v.conjugations.continuous;if(['aru','iru'].includes(v.id)){expect(continuous).toBeUndefined();}else{expect(continuous!.kana).toEqual(v.conjugations.te.kana.map(k=>k+'いる'));expect(validateConjugationAnswer(v.kana+'ている',continuous!)).toBe(false);}
  });
});

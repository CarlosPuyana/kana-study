import {TestBed} from '@angular/core/testing';
import {CONJUGATION_VERBS as verbs} from './conjugation-verbs';
import {CONJUGATION_CATEGORIES} from './conjugations';
import {practiceQuestions} from '../core/services/conjugation-questions';
import {validateConjugationAnswer} from '../core/services/conjugation-answer-validator';
import {VERB_CATEGORIES} from '../core/models/conjugation-practice.model';
import {ConjugationPracticeService} from '../core/services/conjugation-practice.service';
import {ConjugationStatsService,normalizeConjugationStats} from '../core/services/conjugation-stats.service';
import {WorkspaceService} from '../core/services/workspace.service';
import {SyncOutboxService} from '../core/services/sync-outbox.service';
import * as copy from '../../assets/i18n/conjugations.generated';

const mora:Record<string,string>={あ:'a',い:'i',う:'u',え:'e',お:'o',か:'ka',き:'ki',く:'ku',け:'ke',こ:'ko',さ:'sa',し:'shi',す:'su',せ:'se',そ:'so',た:'ta',ち:'chi',つ:'tsu',て:'te',と:'to',な:'na',に:'ni',ぬ:'nu',ね:'ne',の:'no',は:'ha',ひ:'hi',ふ:'fu',へ:'he',ほ:'ho',ま:'ma',み:'mi',む:'mu',め:'me',も:'mo',や:'ya',ゆ:'yu',よ:'yo',ら:'ra',り:'ri',る:'ru',れ:'re',ろ:'ro',わ:'wa',ん:'n',が:'ga',ぎ:'gi',ぐ:'gu',げ:'ge',ご:'go',ざ:'za',じ:'ji',ず:'zu',ぜ:'ze',ぞ:'zo',だ:'da',で:'de',ど:'do',ば:'ba',び:'bi',ぶ:'bu',べ:'be',ぼ:'bo',じゃ:'ja',きょ:'kyo',りょ:'ryo'};
function romanize(kana:string):string {let result='';for(let i=0;i<kana.length;i++){if(kana.slice(i,i+2)==='では'){result+='dewa';i++;continue;}if(kana[i]==='っ'){result+=mora[kana[i+1]][0];continue;}const pair=mora[kana.slice(i,i+2)];if(pair){result+=pair;i++;}else{expect(mora[kana[i]],kana).toBeTruthy();result+=mora[kana[i]];}}return result;}
const readings:Record<string,string>={iku:'行|い',kaeru:'帰|かえ',iu:'言|い',omou:'思|おも',kau:'買|か',tsukau:'使|つか',au:'会|あ',matsu:'待|ま',motsu:'持|も',toru:'取|と',wakaru:'分|わ',hairu:'入|はい',suwaru:'座|すわ',nomu:'飲|の',yomu:'読|よ',yasumu:'休|やす',sumu:'住|す',shinu:'死|し',asobu:'遊|あそ',yobu:'呼|よ',kaku:'書|か',kiku:'聞|き',hataraku:'働|はたら',aruku:'歩|ある',oyogu:'泳|およ',hanasu:'話|はな',dasu:'出|だ',sagasu:'探|さが',taberu:'食|た',miru:'見|み',okiru:'起|お',neru:'寝|ね',deru:'出|で',akeru:'開|あ',shimeru:'閉|し',kangaeru:'考|かんが',wasureru:'忘|わす',oboeru:'覚|おぼ',oshieru:'教|おし',kariru:'借|か','benkyou-suru':'勉強|べんきょう','ryouri-suru':'料理|りょうり','unten-suru':'運転|うんてん'};

describe('Common everyday verb catalog and explicit answer rounds',()=>{
  afterEach(()=>{TestBed.resetTestingModule();localStorage.clear();});
  it('uses 50 unique entries for all four forms, covers all nine godan endings and keeps other forms locked',()=>{
    expect(verbs).toHaveLength(50);expect(new Set(verbs.map(v=>v.id)).size).toBe(50);
    expect(verbs.filter(v=>v.type==='godan')).toHaveLength(30);expect(verbs.filter(v=>v.type==='ichidan')).toHaveLength(15);expect(verbs.filter(v=>v.type==='irregular')).toHaveLength(5);
    expect([...new Set(verbs.filter(v=>v.type==='godan').map(v=>v.kana.slice(-1)))].sort()).toEqual(['う','く','ぐ','す','つ','ぬ','ぶ','む','る'].sort());
    for(const category of VERB_CATEGORIES){const q=practiceQuestions({mode:'single',categoryIds:[category]});expect(q).toHaveLength(50);expect(new Set(q.map(x=>x.word.id))).toEqual(new Set(verbs.map(v=>v.id)));}
    expect(CONJUGATION_CATEGORIES.filter(c=>c.availability==='available').map(c=>c.id)).toEqual([...VERB_CATEGORIES,'adjective-i','adjective-na']);
  });
  for(const verb of verbs)it(`accepts only explicit spellings, with localized meanings: ${verb.id}`,()=>{
    expect(Object.keys(verb.conjugations)).toEqual(['negative','past','negativePast','te']);
    for(const [form,answers] of Object.entries(verb.conjugations)){
      expect(answers.romaji[0]).toBe(romanize(answers.kana[0]));
      for(const answer of answers.kanji){
        const [written,reading]=verb.id==='kuru'?['来',form==='negative'||form==='negativePast'?'こ':'き']:readings[verb.id].split('|');
        expect(answer.startsWith(written)).toBe(true);expect(reading+answer.slice(written.length)).toBe(answers.kana[0]);
      }
      expect(answers.romaji.length).toBeGreaterThan(0);expect(answers.kana.length).toBeGreaterThan(0);
      for(const list of Object.values(answers)){expect(new Set(list).size).toBe(list.length);for(const answer of list){expect(validateConjugationAnswer(' '+answer+' ',answers)).toBe(true);expect(validateConjugationAnswer(answer+'x',answers)).toBe(false);}}
      expect(validateConjugationAnswer(answers.romaji[0].toUpperCase(),answers)).toBe(true);
    }
    for(const language of ['es','en','ca'] as const){expect(copy[language][verb.meaningKey]).toBeTruthy();for(const form of Object.keys(verb.conjugations))expect(copy[language]['conjugations.rule.verb.'+form]).toBeTruthy();}
  });
  it('handles exceptions, misleading ru endings and voiced te/past without regularizing them',()=>{
    const expected:Record<string,string[]>={iku:['いかない','いった','いかなかった','いって'],aru:['ない','あった','なかった','あって'],suru:['しない','した','しなかった','して'],kuru:['こない','きた','こなかった','きて'],kaeru:['かえらない','かえった','かえらなかった','かえって'],hairu:['はいらない','はいった','はいらなかった','はいって'],kariru:['かりない','かりた','かりなかった','かりて'],oyogu:['およがない','およいだ','およがなかった','およいで'],shinu:['しなない','しんだ','しななかった','しんで']};
    for(const [id,forms]of Object.entries(expected))expect(Object.values(verbs.find(v=>v.id===id)!.conjugations).map(a=>a.kana[0])).toEqual(forms);
    const iku=verbs.find(v=>v.id==='iku')!;expect(validateConjugationAnswer('いいて',iku.conjugations.te)).toBe(false);expect(validateConjugationAnswer('いきました',iku.conjugations.past)).toBe(false);
    expect(verbs.find(v=>v.id==='kuru')!.conjugations.negative.romaji).toEqual(['konai']);
  });
  it('creates 325 unique questions from verbs and adjectives, and refuses any locked selection',()=>{
    const ids=[...VERB_CATEGORIES,'adjective-i','adjective-na'] as const;
    const q=practiceQuestions({mode:'mixed',categoryIds:ids},()=>.4);expect(q).toHaveLength(325);expect(new Set(q.map(x=>x.id)).size).toBe(325);
    const previous=q[0].id;expect(practiceQuestions({mode:'mixed',categoryIds:ids},()=>.4,previous)[0].id).not.toBe(previous);
    expect(practiceQuestions({mode:'mixed',categoryIds:['verb-te','verb-potential']})).toEqual([]);
    expect(practiceQuestions({mode:'single',categoryIds:['verb-te','verb-past']})).toEqual([]);
    expect(practiceQuestions({mode:'mixed',categoryIds:['verb-te','verb-te']})).toEqual([]);
  });
  it('retains version-one adjective records and initializes new verb counters',()=>{
    const old={attempts:3,correct:2,wrong:1,bestStreak:2};const stats=normalizeConjugationStats({version:1,buckets:{'adjective-i':old,mixed:old}});
    expect(stats.buckets['adjective-i']).toEqual(old);expect(stats.buckets.mixed).toEqual(old);for(const id of VERB_CATEGORIES)expect(stats.buckets[id].attempts).toBe(0);
  });
  it('finishes all 200 verb questions, isolates each record and fences workspace changes',()=>{
    localStorage.clear();const enqueue=vi.fn();TestBed.configureTestingModule({providers:[ConjugationPracticeService,{provide:SyncOutboxService,useValue:{enqueue}}]});
    const p=TestBed.inject(ConjugationPracticeService),w=TestBed.inject(WorkspaceService);w.activateUser('verb-a');
    for(const category of VERB_CATEGORIES){expect(p.start({mode:'single',categoryIds:[category]})).toBe(true);for(let i=0;i<50;i++){const answers=p.question()!.answers;expect(p.answer(answers.kana[0])).toBe(true);expect(p.answer(answers.kana[0])).toBe(false);p.next();}expect(p.session()?.complete).toBe(true);expect(p.stats.get(category)).toEqual({attempts:50,correct:50,wrong:0,bestStreak:50});}
    expect(p.stats.get('adjective-i').attempts).toBe(0);expect(p.stats.get('mixed').attempts).toBe(0);
    p.start({mode:'mixed',categoryIds:['verb-te','adjective-na']});p.answer('',true);expect(p.stats.get('mixed').wrong).toBe(1);
    w.activateUser('verb-b');expect(p.session()).toBeNull();expect(p.answer('anything',true)).toBe(false);expect(p.stats.get('verb-te').attempts).toBe(0);
    p.start({mode:'single',categoryIds:['verb-te']});p.answer('',true);w.activateUser('verb-a');expect(p.session()).toBeNull();expect(p.stats.get('verb-te').attempts).toBe(50);expect(p.stats.get('mixed').attempts).toBe(1);expect(enqueue).not.toHaveBeenCalled();
    TestBed.resetTestingModule();expect(TestBed.inject(ConjugationStatsService).get('verb-past').bestStreak).toBe(50);
  });
});

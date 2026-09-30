import { COUNTRIES } from '../../data/countries.generated';
import { FLAG_MEDAL_DEFINITIONS } from '../../data/flag-medals';
import { MEDAL_DEFINITIONS } from '../../data/medals';
import { FLAG_QUESTION_TYPES, FlagQuestionType, FlagRegion } from '../models/country.model';
import { FlagStudyProgress } from '../models/flag-study.model';
import { CompletedSessionSummary } from '../models/learning-session.model';
import { MedalUnlock } from '../models/medal.model';
import { evaluateFlagMedals } from './flag-medal-rules';
import { isMedalComplete, presentMedal } from './medal-rules';

function progress(countryId:string,type:FlagQuestionType):FlagStudyProgress{return{key:`flags:${countryId}:${type}`,countryId,questionType:type,fsrs:{due:'2026-01-01T00:00:00.000Z',stability:1,difficulty:5,elapsedDays:1,scheduledDays:1,learningSteps:0,reps:2,lapses:0,state:'review',lastReview:'2025-12-31T00:00:00.000Z'},firstSeenAt:'2025-12-30T00:00:00.000Z',lastSeenAt:'2025-12-31T00:00:00.000Z',totalAttempts:2,totalFirstTrySuccesses:1,totalFailures:0,lastRating:'good'};}
function record(items:readonly FlagStudyProgress[]){return Object.fromEntries(items.map(item=>[item.key,item]));}
function session(id:string,overrides:Partial<CompletedSessionSummary>={}):CompletedSessionSummary{return{module:'flags',sessionId:id,completedAt:'2026-01-01T12:00:00.000Z',mode:'quick-practice',exercisesCompleted:10,firstTrySuccesses:8,attempts:10,needsPracticeCount:0,durationSeconds:60,questionTypes:['flag-to-country'],countryIds:['jp'],studyRegions:['asia'],...overrides};}
function states(items:readonly FlagStudyProgress[]=[],sessions:readonly CompletedSessionSummary[]=[],unlocks:readonly MedalUnlock[]=[]){return evaluateFlagMedals({definitions:FLAG_MEDAL_DEFINITIONS,countries:COUNTRIES,progress:record(items),sessions,unlocks});}
function complete(id:string,items:readonly FlagStudyProgress[]=[],sessions:readonly CompletedSessionSummary[]=[]){return isMedalComplete(states(items,sessions).find(item=>item.definition.id===id)!.progress);}
function forType(type:FlagQuestionType,limit?:number){const countries=(type==='country-to-capital'||type==='capital-to-country')?COUNTRIES.filter(item=>item.capitalQuizEnabled):COUNTRIES;return countries.slice(0,limit).map(country=>progress(country.id,type));}

describe('Flag medal rules',()=>{
  it('completes First trip after one Flags round',()=>expect(complete('flags-first-trip',[],[session('1')])).toBe(true));
  it('completes Globetrotter after ten Flags rounds',()=>expect(complete('flags-globetrotter',[],Array.from({length:10},(_,i)=>session(String(i))))).toBe(true));
  const directional:[string,FlagQuestionType,number|undefined][]=[
    ['flags-flag-eye','flag-to-country',25],['flags-visual-atlas','flag-to-country',undefined],['flags-reverse-eye','country-to-flag',25],['flags-flag-collector','country-to-flag',undefined],['flags-capital-hunter','country-to-capital',25],['flags-capitals-mastered','country-to-capital',undefined],['flags-capital-reverse-25','capital-to-country',25],['flags-capital-reverse-mastered','capital-to-country',undefined],
  ];
  for(const [id,type,limit] of directional){it(`completes ${id}`,()=>expect(complete(id,forType(type,limit))).toBe(true));}
  it('completes Four ways when one eligible country is memorized in every direction',()=>{const country=COUNTRIES.find(item=>item.capitalQuizEnabled)!;expect(complete('flags-four-ways',FLAG_QUESTION_TYPES.map(type=>progress(country.id,type)))).toBe(true);});
  it('completes World mastery only with every valid unit memorized',()=>{const items=COUNTRIES.flatMap(country=>FLAG_QUESTION_TYPES.filter(type=>country.capitalQuizEnabled||!(type==='country-to-capital'||type==='capital-to-country')).map(type=>progress(country.id,type)));expect(complete('flags-world-mastery',items)).toBe(true);});
  const regions:[FlagRegion,string][]=[['europe','flags-europe-mastered'],['asia','flags-asia-mastered'],['africa','flags-africa-mastered'],['north-america','flags-north-america-mastered'],['south-america','flags-south-america-mastered'],['oceania','flags-oceania-mastered']];
  for(const [region,id] of regions){it(`completes ${id}`,()=>{const items=COUNTRIES.filter(country=>country.studyRegion===region).map(country=>progress(country.id,'flag-to-country'));expect(complete(id,items)).toBe(true);});}
  it('completes Capital lightning for a perfect ten-question capital round',()=>expect(complete('flags-secret-capital-lightning',[],[session('capital',{firstTrySuccesses:10,questionTypes:['country-to-capital','capital-to-country']})])).toBe(true));
  it('completes Borderless for a perfect round spanning five regions',()=>expect(complete('flags-secret-borderless',[],[session('world',{firstTrySuccesses:10,studyRegions:['europe','asia','africa','north-america','south-america']})])).toBe(true));
  it('keeps an existing unlock permanently',()=>{const unlock={medalId:'flags-first-trip',unlockedAt:'2026-01-01T00:00:00.000Z'};expect(states([],[],[unlock]).find(item=>item.definition.id===unlock.medalId)?.unlocked).toBe(true);});
  it('redacts locked secret medal details and progress',()=>{const medal=states().find(item=>item.definition.id==='flags-secret-borderless')!;const shown=presentMedal(medal);expect(shown.titleKey).toBe('medals.secretTitle');expect(shown.progress).toBeNull();});
  it('keeps Kana and Flags definitions in separate modules with historical ids intact',()=>{expect(MEDAL_DEFINITIONS).toHaveLength(18);expect(MEDAL_DEFINITIONS.every(item=>item.module==='kana')).toBe(true);expect(FLAG_MEDAL_DEFINITIONS).toHaveLength(20);expect(FLAG_MEDAL_DEFINITIONS.every(item=>item.module==='flags'&&item.id.startsWith('flags-'))).toBe(true);});
});

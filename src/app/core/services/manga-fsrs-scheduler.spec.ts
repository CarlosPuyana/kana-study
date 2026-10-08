import { createEmptyCard, fsrs, Rating, State } from 'ts-fsrs';
import { MangaReviewEvent } from '../models/manga-review.model';
import { isMangaFsrsEvent, MangaFsrsEvent, mangaFsrsGrade } from '../models/manga-fsrs.model';
import { MangaStudySavedItem } from '../models/manga-study-saved.model';
import { serializeDeckCard } from './deck-study-serialization';
import { generateMangaReview } from './manga-review-generator';
import { MANGA_FSRS_PARAMETERS, mangaFsrsQueue, replayMangaFsrs } from './manga-fsrs-scheduler';

const item=(id='word'):MangaStudySavedItem=>({schemaVersion:1,id,expression:'龍',reading:'りゅう',meaning:'dragon',kanji:[],source:{volumeId:'fixture',pageNumber:1},createdAt:1});
const event=(id='a', grade:1|3=3, reviewedAt='2026-10-08T12:00:00Z'):MangaFsrsEvent=>({id,key:'word',savedItemId:'word',sessionId:'session',reviewedAt,
  exerciseType:'meaning',correct:grade===3,repetition:false,answerMode:'self-assessment',rating:grade===3?'good':'again',reviewKind:'fsrs',fsrsVersion:1,fsrsGrade:grade});
describe('Manga FSRS pure replay and two-rating contract',()=>{
  it.each([null,undefined,{},'fsrs'])('safely excludes malformed events %s',value=>expect(isMangaFsrsEvent(value)).toBe(false));
  it.each([['again',Rating.Again],['good',Rating.Good]] as const)('maps %s to the real ts-fsrs grade %s', (rating,grade)=>{
    expect(mangaFsrsGrade(rating)).toBe(grade);
    const expected = fsrs(MANGA_FSRS_PARAMETERS).next(createEmptyCard(new Date(0)),new Date('2026-10-08T12:00:00Z'),grade).card;
    expect(replayMangaFsrs([item()],[event('a',grade)],'es')[0].card).toEqual(serializeDeckCard(expected));
  });
  it.each([2,4,'hard','easy',0,null])('rejects unsupported FSRS grade/rating %s without rewriting history',(grade)=>{
    expect(isMangaFsrsEvent({...event(),fsrsGrade:grade} as unknown as MangaReviewEvent)).toBe(false);
    expect(()=>mangaFsrsGrade(grade as never)).toThrow();
  });
  it('creates exactly one New card per eligible saved ID; V3 never graduates it',()=>{
    const {reviewKind,fsrsVersion,fsrsGrade,...v3}=event();
    const cards=replayMangaFsrs([item(),item(),{...item('missing'),reading:undefined,meaning:undefined,expression:'未登録語'}],[v3],'es');
    expect(cards).toHaveLength(1);expect(cards[0].card.state).toBe(State.New);expect(cards[0].card.reps).toBe(0);
  });
  it('preserves V3 question selection when FSRS history is present',()=>{
    const input={items:[item(),item('other')],language:'es',mode:'mixed',count:'all',seed:7} as const;
    expect(generateMangaReview({...input,history:[event()]})).toEqual(generateMangaReview({...input,history:[]}));
  });
  it('has deterministic ordering for offline concurrent/equal-date events, without mutation',()=>{
    const events=[event('b',1),event('a',3),event('c',3,'2026-10-08T12:20:00Z')];
    const snapshot=structuredClone(events);
    const a=replayMangaFsrs([item()],events,'es'),b=replayMangaFsrs([item()],[events[2],events[1],events[0],events[1]],'es');
    expect(a).toEqual(b);expect(a[0].card.reps).toBe(3);expect(events).toEqual(snapshot);
    for(let i=0;i<10;i++)expect(replayMangaFsrs([item()],events,'es')).toEqual(a);
  });
  it('lets ts-fsrs represent Learning, Review and Relearning, with no custom graduation',()=>{
    const history=[event()];let card=replayMangaFsrs([item()],history,'es')[0].card;
    expect(card.state).toBe(State.Learning);
    history.push(event('b',3,new Date(card.due).toISOString()));card=replayMangaFsrs([item()],history,'es')[0].card;
    expect(card.state).toBe(State.Review);
    history.push(event('c',1,new Date(card.due).toISOString()));
    expect(replayMangaFsrs([item()],history,'es')[0].card.state).toBe(State.Relearning);
  });
  it('prioritizes at most 10 overdue and 5 New, never early or duplicate',()=>{
    const items=Array.from({length:30},(_,i)=>item(String(i).padStart(2,'0')));
    const history=items.slice(0,15).map(row=>({...event(row.id),savedItemId:row.id,key:row.id}));
    const cards=replayMangaFsrs(items,history,'es'),due=cards[0].card.due;
    expect(mangaFsrsQueue(cards,due-1)).toHaveLength(5);
    const queue=mangaFsrsQueue(cards,due);expect(queue).toHaveLength(15);
    expect(queue.slice(0,10).every(row=>row.card.state!==State.New)).toBe(true);
    expect(new Set(queue.map(row=>row.item.id)).size).toBe(15);
  });
  it('excludes deleted words, preserves reviews and restores the same schedule',()=>{
    const history=[event()],before=replayMangaFsrs([item()],history,'es');
    expect(replayMangaFsrs([],history,'es')).toEqual([]);
    expect(replayMangaFsrs([item()],history,'es')).toEqual(before);
    expect(mangaFsrsQueue(before,Date.parse(history[0].reviewedAt))).toEqual([]);
  });
});

import { CardStudyTimer, formatStudyTime } from './card-study-time';
describe('shared credited card study time',()=>{
  let now:number,timer:CardStudyTimer;
  beforeEach(()=>{now=0;timer=new CardStudyTimer(()=>now);timer.resume();timer.startAppearance();});
  it.each([[4,4],[15,10],[60,10]])('%s real seconds credit %s', (real,credited)=>{now=real*1000;expect(timer.tick()).toBe(credited);expect(timer.commitAppearance()).toBe(credited*1000);});
  it('4,15,7 seconds total 21 and repeated appearance gets a fresh allowance',()=>{
    for(const seconds of [4,15,7]){now+=seconds*1000;timer.commitAppearance();timer.startAppearance();}
    expect(timer.committedSeconds).toBe(21);now+=60_000;timer.commitAppearance();expect(timer.committedSeconds).toBe(31);
  });
  it('hidden time is excluded and returning resumes only the remaining allowance',()=>{
    now=4000;timer.setVisible(false);now=64_000;expect(timer.tick()).toBe(4);timer.setVisible(true);now=67_000;expect(timer.tick()).toBe(7);now=80_000;expect(timer.tick()).toBe(10);
  });
  it('async pauses, double completion, discarded cards and undo do not add duplicate time',()=>{
    now=4000;timer.pause();now=64_000;expect(timer.commitAppearance()).toBe(4000);expect(timer.commitAppearance()).toBe(0);
    timer.startAppearance();timer.resume();now+=7000;timer.discardAppearance();expect(timer.committedSeconds).toBe(4);timer.undo(4000);expect(timer.seconds).toBe(0);
  });
  it('reset and an unmounted appearance do not count configuration/loading',()=>{
    timer.reset();now=60_000;expect(timer.tick()).toBe(0);timer.pause();timer.startAppearance();now+=60_000;expect(timer.tick()).toBe(0);
    expect(formatStudyTime(65)).toBe('01:05');
  });
});

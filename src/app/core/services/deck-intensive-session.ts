/** Voluntary, memory-only practice. No scheduler, persistence or normal events. */
export class DeckIntensiveSession {
  private queue: string[];
  readonly correct = new Map<string,number>();
  readonly failures = new Map<string,number>();
  answers=0;
  stopped=false;
  constructor(readonly ids: readonly string[]) {
    this.queue=[...new Set(ids)];
  }
  get current():string|null{return this.stopped||this.answers>=20?null:this.queue[0]??null;}
  get remaining():number{return this.queue.length;}
  answer(good:boolean):void {
    const id=this.current;if(!id)return;
    this.queue.shift();this.answers++;
    const map=good?this.correct:this.failures;map.set(id,(map.get(id)??0)+1);
    if((this.correct.get(id)??0)<2)this.queue.push(id);
  }
  finish():void{this.stopped=true;}
  continueBlock():void{if(!this.queue.length)return;this.answers=0;this.stopped=false;}
}

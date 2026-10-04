import {VocabularyEntry,VocabularyStudyCategory} from '../models/vocabulary.model';
export class VocabularyWritingSession {
  private readonly queue:VocabularyEntry[];
  readonly total:number;resolved=0;
  constructor(entries:readonly VocabularyEntry[],categories:readonly VocabularyStudyCategory[],random:()=>number=Math.random){
    this.queue=[...new Map(entries.filter(e=>e.enabled&&categories.includes(e.studyCategory)).map(e=>[e.id,e])).values()];
    for(let i=this.queue.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[this.queue[i],this.queue[j]]=[this.queue[j],this.queue[i]];}
    this.total=this.queue.length;
  }
  get current():VocabularyEntry|null{return this.queue[0]??null;}
  answer(correct:boolean):void{const entry=this.queue.shift();if(!entry)return;if(correct)this.resolved++;else this.queue.push(entry);}
}

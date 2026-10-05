import {AppLanguage} from '../models/settings.model';
import {VocabularyEntry} from '../models/vocabulary.model';

export type ListeningMode = 'meaning'|'japanese'|'mixed';
export interface ListeningOption {readonly id:string; readonly label:string; readonly correct:boolean}
export interface ListeningQuestion {readonly entry:VocabularyEntry; readonly kind:Exclude<ListeningMode,'mixed'>; readonly options:readonly ListeningOption[]}
export const LISTENING_SESSION_SIZE = 15;
const normalize = (text:string) => text.normalize('NFKC').trim().toLocaleLowerCase();
function shuffle<T>(items:readonly T[], random:()=>number):T[] {
  const result=[...items]; for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];} return result;
}
export function listeningOptions(entry:VocabularyEntry, kind:'meaning'|'japanese', entries:readonly VocabularyEntry[], language:AppLanguage, random:()=>number=Math.random):readonly ListeningOption[] {
  const label=(item:VocabularyEntry)=>kind==='meaning'?item.quizMeaning[language]:item.primaryWrittenForm;
  const answer=label(entry), unique=new Set([normalize(answer)]), selected=[entry];
  const candidates=shuffle(entries.filter(e=>e.enabled&&e.id!==entry.id),random).sort((a,b)=>
    Number(b.studyCategory===entry.studyCategory)-Number(a.studyCategory===entry.studyCategory)
    || Math.abs(label(a).length-answer.length)-Math.abs(label(b).length-answer.length));
  for(const item of candidates){const key=normalize(label(item));if(!key||unique.has(key))continue;unique.add(key);selected.push(item);if(selected.length===4)break;}
  return shuffle(selected,random).map(item=>({id:item.id,label:label(item),correct:item.id===entry.id}));
}
export class VocabularyListeningSession {
  private readonly queue:VocabularyEntry[];
  private readonly target:number;
  private answeredCurrent=false;
  answered=0;
  question:ListeningQuestion|null=null;
  readonly failedIds=new Set<string>();
  constructor(pool:readonly VocabularyEntry[], private readonly all:readonly VocabularyEntry[], private readonly mode:ListeningMode,
              private readonly language:AppLanguage, private readonly random:()=>number=Math.random, preservePriority=false){
    const unique=[...new Map(pool.filter(e=>e.enabled).map(e=>[e.id,e])).values()];
    this.queue=preservePriority?unique:shuffle(unique,random);this.target=Math.min(LISTENING_SESSION_SIZE,unique.length);this.advance();
  }
  get total():number{return Math.min(this.target,this.answered+this.queue.length+(this.question&&!this.answeredCurrent?1:0));}
  answer(optionId:string):boolean|null {
    if(!this.question||this.answeredCurrent)return null;
    const option=this.question.options.find(o=>o.id===optionId);if(!option)return null;
    this.answeredCurrent=true;this.answered++;return option.correct;
  }
  next():void {if(this.answeredCurrent)this.advance();}
  skip():void {
    if(!this.question||this.answeredCurrent)return;
    this.failedIds.add(this.question.entry.id);this.advance();
  }
  private advance():void {
    this.question=null;this.answeredCurrent=false;
    while(this.queue.length&&this.answered<this.target){
      const entry=this.queue.shift()!;
      const kind=this.mode==='mixed'?(this.answered%2?'japanese':'meaning'):this.mode;
      const options=listeningOptions(entry,kind,this.all,this.language,this.random);
      if(options.length===4){this.question={entry,kind,options};break;}
    }
  }
}

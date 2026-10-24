import {Injectable,inject} from '@angular/core';
import {AttemptActivity,AttemptEvent,AttemptModule,AttemptResult} from '../models/attempt-event.model';
import {LocalWorkspaceId} from '../models/account.model';
import {AttemptEventRepository} from './attempt-event.repository';
import {WorkspaceService} from './workspace.service';
export interface AttemptRecordingSession {record(itemId:string,result:AttemptResult,questionType?:string,firstAttempt?:boolean):void;}
@Injectable({providedIn:'root'})
export class AttemptRecordingService {
  private readonly repository=inject(AttemptEventRepository);private readonly workspace=inject(WorkspaceService);
  private readonly pending=new Set<Promise<void>>();
  private readonly failed=new Map<string,{event:AttemptEvent;workspace:LocalWorkspaceId}>();
  begin(module:AttemptModule,activity:AttemptActivity,sessionId:string=crypto.randomUUID()):AttemptRecordingSession{
    const workspace=this.workspace.active(),seen=new Set<string>();let ordinal=0;
    return {record:(itemId,result,questionType,firstAttempt)=>{
      const key=JSON.stringify([itemId,questionType??null]);
      const event:AttemptEvent={version:1,id:`${sessionId}:${module}:${activity}:${++ordinal}`,occurredAt:new Date().toISOString(),module,activity,itemId,sessionId,
        ...(questionType?{questionType}:{}),firstAttempt:firstAttempt??!seen.has(key),result};seen.add(key);this.write(event,workspace);
    }};
  }
  private write(event:AttemptEvent,workspace:LocalWorkspaceId):void{
    const key=JSON.stringify([workspace,event.id]);
    const p=this.repository.insert(event,workspace).then(ok=>{
      if(ok)this.failed.delete(key);else if(this.failed.size<100)this.failed.set(key,{event,workspace});
    }).catch(()=>{if(this.failed.size<100)this.failed.set(key,{event,workspace});}).finally(()=>this.pending.delete(p));this.pending.add(p);
  }
  async settle():Promise<void>{await Promise.all([...this.pending]);}
  async retry():Promise<void>{for(const {event,workspace} of this.failed.values())this.write(event,workspace);await this.settle();if(!this.failed.size)this.repository.writeError.set(false);}
}

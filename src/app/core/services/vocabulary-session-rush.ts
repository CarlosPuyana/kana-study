import { inject, Injectable } from '@angular/core';
import { VocabularyStudyUnit } from '../models/vocabulary.model';
import { WorkspaceService } from './workspace.service';

/** One ephemeral, owner-fenced handoff. URLs contain only an opaque token, never a pool. */
@Injectable({providedIn:'root'})
export class VocabularySessionRush {
  private readonly workspace=inject(WorkspaceService);
  private value:{token:string;owner:string;epoch:number;units:readonly VocabularyStudyUnit[]}|null=null;
  prepare(ids:readonly string[],units:readonly VocabularyStudyUnit[]):string|null{
    const selected=[...new Set(ids)].slice(0,10000).flatMap(id=>{const unit=units.find(u=>u.entryId===id);return unit?[{...unit}]:[];});
    if(!selected.length)return null;
    const token=crypto.randomUUID();this.value={token,owner:this.workspace.active(),epoch:this.workspace.activationRevision(),units:selected};return token;
  }
  take(token:string):readonly VocabularyStudyUnit[]|null{
    const value=this.value;this.value=null;
    return value&&value.token===token&&value.owner===this.workspace.active()&&value.epoch===this.workspace.activationRevision()?value.units:null;
  }
}

import {inject,Injectable} from '@angular/core';
import {MangaContextService} from './manga-context.service';
import {WorkspaceService} from './workspace.service';
import {MangaRushMeaningProvider,MangaRushMeaningRequest} from '../models/manga-rush.model';

@Injectable()
export class MangaRushMeaningService implements MangaRushMeaningProvider {
  private readonly context=inject(MangaContextService);
  private readonly workspace=inject(WorkspaceService);
  readonly available=this.context.available;
  async resolve(input:MangaRushMeaningRequest,signal:AbortSignal){
    const owner=this.workspace.active(),epoch=this.workspace.activationRevision();
    const current=()=>owner===this.workspace.active()&&epoch===this.workspace.activationRevision()&&(input.isCurrent?.()??true);
    const result=await this.context.request('translate',input.request,input.location,signal,{workspace:owner,identity:input.lexicalKey,current});
    if(signal.aborted||!current())throw Error('stale');
    return {kind:'contextual' as const,meaning:result.natural,notes:result.notes,literal:'literal' in result?result.literal:undefined,provenance:this.context.endpoint!};
  }
}

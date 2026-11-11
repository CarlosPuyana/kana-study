import {inject,Injectable} from '@angular/core';
import {AttemptEventRepository} from './attempt-event.repository';
import {KanjiProgressService} from './kanji-progress.service';
import {SessionHistoryService} from './session-history.service';
import {WorkspaceService} from './workspace.service';
import {kanjiHistoryAccumulator} from './kanji-statistics';

/** Read-only reader; no recovery, migration, new storage or study writes. */
@Injectable({providedIn:'root'})
export class KanjiStatisticsReader {
  readonly progress=inject(KanjiProgressService);
  readonly sessions=inject(SessionHistoryService);
  readonly workspace=inject(WorkspaceService);
  readonly repository=inject(AttemptEventRepository);

  async load(count:7|30|90,now:Date){
    const owner=this.workspace.active(),epoch=this.workspace.activationRevision();
    const current=()=>owner===this.workspace.active()&&epoch===this.workspace.activationRevision()&&localStorage.getItem(this.workspace.storageKey('kana-study.kanji-undo-pending.v1',owner))===null;
    const accumulator=kanjiHistoryAccumulator(this.progress.reviewEvents(),count,now);
    await this.repository.scan({from:accumulator.from,to:accumulator.to,module:'kanji',activity:'learn'},e=>{
      if(!current())return false;
      accumulator.accept(e);return true;
    },owner);
    if(!current())throw Error('Stale Kanji statistics');
    return {owner,epoch,value:accumulator.finish()};
  }
}

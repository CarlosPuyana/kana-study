import {SyncDiagnosticsService} from './sync-diagnostics.service';
import {makeOutboxItem} from './sync-outbox.service';
describe('private sync diagnostics',()=>{
  it('redacts unknown codes/messages and does not serialize IDs, tokens or payloads',async()=>{
    const service=new SyncDiagnosticsService(),item=makeOutboxItem('user:private-user','manga-saved-item','private-word',{jwt:'secret-context'})!;
    try{await service.run('push','apply_manga_saved_change_v1',async()=>{throw {code:'HELLO',message:'secret-context token JWT private-user private-word'};},item);}catch(error){service.capture(error,'push','sync');}
    const report=service.report('error',[item],[]);expect(report.failure?.code).toBe('UNKNOWN');
    expect(JSON.stringify(report)).not.toMatch(/HELLO|secret-context|token|JWT|private-user|private-word/);
    service.confirmed(item);expect(service.report('error',[item],[]).pending[0].confirmedAwaitingCleanup).toBe(true);
    service.reset();expect(service.report('pending',[item],[]).pending[0].remote).toBe('unverified');expect(service.report('pending',[],[]).failure).toBeNull();
  });
});
